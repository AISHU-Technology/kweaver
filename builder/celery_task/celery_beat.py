# coding=utf-8

import logging
import datetime as dt
from multiprocessing.util import Finalize

import sqlalchemy
from celery import current_app
from celery import schedules
from celery.beat import Scheduler, ScheduleEntry
from celery.utils.log import get_logger
from celery.utils.time import maybe_make_aware
from kombu.utils.encoding import safe_repr, safe_str
from kombu.utils.json import dumps, loads

from utils.session import session_cleanup
from utils.session import SessionManager
from db_migrate.build_tables.table_2 import (
    PeriodicTask, PeriodicTaskChanged,
    CrontabSchedule,
)

# This scheduler must wake up more frequently than the
# regular of 5 minutes because it needs to take external
# changes to the schedule into account.
DEFAULT_MAX_INTERVAL = 5  # seconds

DEFAULT_BEAT_DBURI = 'sqlite:///schedule.db'

ADD_ENTRY_ERROR = """\
Cannot add entry %r to database schedule: %r. Contents: %r
"""

session_manager = SessionManager()
# session = session_manager()


logger = get_logger('celery_scheduler.schedulers')


class ModelEntry(ScheduleEntry):
    """Scheduler entry taken from database row."""

    model_schedules = (
        # (schedule_type, model_type, model_field)
        (schedules.crontab, CrontabSchedule, 'crontab'),
    )
    save_fields = ['last_run_at', 'total_run_count', 'no_changes']

    def __init__(self, model, Session, app=None, **kw):
        """Initialize the model entry."""
        self.app = app or current_app._get_current_object()
        self.kw_session = kw.get('session')
        self.Session = Session

        self.model = model
        self.task_id = model.task_id
        self.task = model.task

        try:
            self.schedule = model.schedule
            logger.debug('schedule: {}'.format(self.schedule))
        except Exception as e:
            logger.error(e)
            logger.error(
                'Disabling schedule %s that was removed from database',
                self.task_id,
            )
            self._disable(model)

        try:
            self.args = loads(model.args or '[]')
            self.kwargs = loads(model.kwargs or '{}')
        except ValueError as exc:
            logger.exception(
                'Removing schedule %s for argument deseralization error: %r',
                self.task_id, exc,
            )
            self._disable(model)

        self.options = {}
        for option in ['queue', 'exchange', 'routing_key', 'expires',
                       'priority']:
            value = getattr(model, option)
            if value is None:
                continue
            self.options[option] = value

        self.total_run_count = model.total_run_count
        self.enabled = model.enabled

        if not model.last_run_at:
            model.last_run_at = self._default_now()
        self.last_run_at = model.last_run_at

        # 因为从数据库读取的 last_run_at 可能没有时区信息，所以这里必须加上时区信息
        self.last_run_at = self.last_run_at.replace(tzinfo=self.app.timezone)

        # self.options['expires'] 同理
        # if 'expires' in self.options:
        #     expires = self.options['expires']
        #     self.options['expires'] = expires.replace(tzinfo=self.app.timezone)

    def _disable(self, model):
        model.no_changes = True
        self.model.enabled = self.enabled = model.enabled = False
        if self.kw_session:
            self.kw_session.add(model)
            self.kw_session.commit()
        else:
            session = self.Session()
            with session_cleanup(session):
                session.add(model)
                session.commit()

            #     obj = session.query(PeriodicTask).get(model.id)
            #     obj.enable = model.enabled
            #     session.add(obj)
            #     session.commit()

    def is_due(self):
        if not self.model.enabled:
            # 5 second delay for re-enable.
            return schedules.schedstate(False, 5.0)

        # START DATE: only run after the `start_time`, if one exists.
        if self.model.start_time is not None:
            now = maybe_make_aware(self._default_now())
            start_time = self.model.start_time.replace(
                tzinfo=self.app.timezone)
            if now < start_time:
                # The datetime is before the start date - don't run.
                _, delay = self.schedule.is_due(self.last_run_at)
                # use original delay for re-check
                return schedules.schedstate(False, delay)

        # ONE OFF TASK: Disable one off tasks after they've ran once
        if self.model.one_off and self.model.enabled \
                and self.model.total_run_count > 0:
            self.model.enabled = False  # disable
            self.model.total_run_count = 0  # Reset
            self.model.no_changes = False  # Mark the model entry as changed
            save_fields = ('enabled',)  # the additional fields to save
            self.save(save_fields)

            return schedules.schedstate(False, None)  # Don't recheck

        return self.schedule.is_due(self.last_run_at)

    def _default_now(self):
        now = self.app.now()
        # The PyTZ datetime must be localised for the Django-Celery-Beat
        # scheduler to work. Keep in mind that timezone arithmatic
        # with a localized timezone may be inaccurate.
        # return now.tzinfo.localize(now.replace(tzinfo=None))
        return now.replace(tzinfo=self.app.timezone)

    def __next__(self):
        # should be use `self._default_now()` or `self.app.now()` ?
        self.model.last_run_at = self.app.now()
        self.model.total_run_count += 1
        self.model.no_changes = True
        return self.__class__(self.model, Session=self.Session)

    next = __next__  # for 2to3

    def save(self, fields=tuple()):
        """
        :params fields: tuple, the additional fields to save
        """
        # TODO:
        session = self.Session()
        with session_cleanup(session):
            # Object may not be synchronized, so only
            # change the fields we care about.
            obj = session.query(PeriodicTask).get(self.model.id)

            for field in self.save_fields:
                setattr(obj, field, getattr(self.model, field))
            for field in fields:
                setattr(obj, field, getattr(self.model, field))
            session.add(obj)
            session.commit()

    @classmethod
    def to_model_schedule(cls, session, schedule):
        for schedule_type, model_type, model_field in cls.model_schedules:
            # change to schedule
            schedule = schedules.maybe_schedule(schedule)
            if isinstance(schedule, schedule_type):
                # TODO:
                model_schedule = model_type.from_schedule(session, schedule)
                return model_schedule, model_field
        raise ValueError(
            'Cannot convert schedule type {0!r} to model'.format(schedule))

    @classmethod
    def from_entry(cls, task_id, Session, app=None, **entry):
        """

        **entry sample:

            {'task': 'celery.backend_cleanup',
             'schedule': schedules.crontab('0', '4', '*'),
             'options': {'expires': 43200}}

        """
        session = Session()
        with session_cleanup(session):
            periodic_task = session.query(
                PeriodicTask).filter_by(task_id=task_id).first()
            if not periodic_task:
                periodic_task = PeriodicTask(task_id=task_id)
            temp = cls._unpack_fields(session, **entry)
            periodic_task.update(**temp)
            session.add(periodic_task)
            try:
                session.commit()
            except sqlalchemy.exc.IntegrityError as exc:
                logger.error(exc)
                session.rollback()
            except Exception as exc:
                logger.error(exc)
                session.rollback()
            res = cls(periodic_task, app=app, Session=Session, session=session)
            return res

    @classmethod
    def _unpack_fields(cls, session, schedule,
                       args=None, kwargs=None, relative=None, options=None,
                       **entry):
        """

        **entry sample:

            {'task': 'celery.backend_cleanup',
             'schedule': <crontab: 0 4 * * * (m/h/d/dM/MY)>,
             'options': {'expires': 43200}}

        """
        model_schedule, model_field = cls.to_model_schedule(session, schedule)
        entry.update(
            # the model_id which to relationship
            {model_field + '_id': model_schedule.id},
            args=dumps(args or []),
            kwargs=dumps(kwargs or {}),
            **cls._unpack_options(**options or {})
        )
        return entry

    @classmethod
    def _unpack_options(cls, queue=None, exchange=None, routing_key=None,
                        priority=None, one_off=None, expires=None, **kwargs):
        data = {
            'queue': queue,
            'exchange': exchange,
            'routing_key': routing_key,
            'priority': priority,
            'one_off': one_off,
        }
        if expires:
            if isinstance(expires, int):
                expires = dt.datetime.utcnow() + dt.timedelta(seconds=expires)
            # elif isinstance(expires, dt.datetime):
            #     pass
            else:
                raise ValueError('expires value error')
            data['expires'] = expires
        return data

    def __repr__(self):
        return '<ModelEntry: {0} {1}(*{2}, **{3}) {4}>'.format(
            safe_str(self.task_id), self.task, safe_repr(self.args),
            safe_repr(self.kwargs), self.schedule,
        )


class DatabaseScheduler(Scheduler):
    Entry = ModelEntry
    Model = PeriodicTask
    Changes = PeriodicTaskChanged

    _schedule = None
    _last_timestamp = None
    _initial_read = True
    _heap_invalidated = False

    def __init__(self, *args, **kwargs):
        """Initialize the database scheduler."""
        self.app = kwargs['app']
        self.dburi = kwargs.get('dburi') or self.app.conf.get(
            'beat_dburi') or DEFAULT_BEAT_DBURI
        self.engine, self.Session = session_manager.create_session(self.dburi)
        session_manager.prepare_models(self.engine)

        self._dirty = set()
        Scheduler.__init__(self, *args, **kwargs)
        self._finalize = Finalize(self, self.sync, exitpriority=5)

    def setup_schedule(self):
        """override"""
        logger.info('setup_schedule')
        self.install_default_entries(self.schedule)
        self.update_from_dict(self.app.conf.beat_schedule)

    def all_as_schedule(self):
        # TODO:
        session = self.Session()
        with session_cleanup(session):
            logger.debug('DatabaseScheduler: Fetching database schedule')
            # get all enabled PeriodicTask
            models = session.query(self.Model).filter_by(enabled=True).all()
            s = {}
            for model in models:
                try:
                    s[model.task_id] = self.Entry(model,
                                                  app=self.app,
                                                  Session=self.Session,
                                                  session=session)
                except ValueError:
                    pass
            return s

    def schedule_changed(self):
        session = self.Session()
        with session_cleanup(session):
            changes = session.query(self.Changes).get(1)
            if not changes:
                changes = self.Changes(id=1)
                session.add(changes)
                session.commit()
                return False

            last, ts = self._last_timestamp, changes.last_update
            try:
                if ts and ts > (last if last else ts):
                    return True
            finally:
                self._last_timestamp = ts
            return False

    def reserve(self, entry):
        """override

        It will be called in parent class.
        """
        new_entry = next(entry)
        # Need to store entry by task_id, because the entry may change
        # in the mean time.
        self._dirty.add(new_entry.task_id)
        return new_entry

    def sync(self):
        """override"""
        logger.info('Writing entries...')
        _tried = set()
        _failed = set()
        try:
            while self._dirty:
                task_id = self._dirty.pop()
                try:
                    self.schedule[task_id].save()  # save to database
                    logger.debug(
                        '{task_id} save to database'.format(task_id=task_id))
                    _tried.add(task_id)
                except (KeyError) as exc:
                    logger.error(exc)
                    _failed.add(task_id)
        except sqlalchemy.exc.IntegrityError as exc:
            logger.exception('Database error while sync: %r', exc)
        except Exception as exc:
            if 'last_run_at' not in str(exc):
                logger.exception(exc)
        finally:
            # retry later, only for the failed ones
            self._dirty |= _failed

    def update_from_dict(self, mapping):
        s = {}
        for task_id, entry_fields in mapping.items():
            # {'task': 'celery.backend_cleanup',
            #  'schedule': schedules.crontab('0', '4', '*'),
            #  'options': {'expires': 43200}}
            try:
                entry = self.Entry.from_entry(
                    task_id, Session=self.Session, app=self.app,
                    **entry_fields)
                if entry.model.enabled:
                    s[task_id] = entry
            except Exception as exc:
                logger.error(ADD_ENTRY_ERROR, task_id, exc, entry_fields)

        # update self.schedule
        self.schedule.update(s)

    def install_default_entries(self, data):
        entries = {}
        if self.app.conf.result_expires:
            entries.setdefault(
                'celery.backend_cleanup', {
                    'task': 'celery.backend_cleanup',
                    'schedule': schedules.crontab('0', '4', '*'),
                    'options': {'expires': 12 * 3600},
                },
            )
        self.update_from_dict(entries)

    def schedules_equal(self, *args, **kwargs):
        if self._heap_invalidated:
            self._heap_invalidated = False
            return False
        return super(DatabaseScheduler, self).schedules_equal(*args, **kwargs)

    @property
    def schedule(self):
        initial = update = False
        if self._initial_read:
            logger.debug('DatabaseScheduler: initial read')
            initial = update = True
            self._initial_read = False
        elif self.schedule_changed():
            # when you updated the `PeriodicTasks` model's `last_update` field
            logger.info('DatabaseScheduler: Schedule changed.')
            update = True

        if update:
            self.sync()
            self._schedule = self.all_as_schedule()
            # the schedule changed, invalidate the heap in Scheduler.tick
            if not initial:
                self._heap = []
                self._heap_invalidated = True
            if logger.isEnabledFor(logging.DEBUG):
                logger.debug('Current schedule:\n%s', '\n'.join(
                    repr(entry) for entry in self._schedule.values()),
                             )
        # logger.debug(self._schedule)
        return self._schedule

    @property
    def info(self):
        """override"""
        # return infomation about Schedule
        return '    . db -> {self.dburi}'.format(self=self)
