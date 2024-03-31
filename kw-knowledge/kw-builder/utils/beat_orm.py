import sqlalchemy as sa
from sqlalchemy.ext.declarative import declarative_base
import datetime as dt
from sqlalchemy.event import listen
from sqlalchemy.orm import relationship, foreign, remote
import pytz
from sqlalchemy import func
from sqlalchemy.sql import select, insert, update
from utils.tzcrontab import TzAwareCrontab

Base = declarative_base()


def cronexp(field):
    """Representation of cron expression."""
    return field and str(field).replace(' ', '') or '*'


class ModelMixin(object):

    @classmethod
    def create(cls, **kw):
        return cls(**kw)

    def update(self, **kw):
        for attr, value in kw.items():
            setattr(self, attr, value)
        return self


class CrontabSchedule(Base, ModelMixin):
    __tablename__ = 'timer_crontab'
    __table_args__ = {'mysql_charset': 'utf8'}

    id = sa.Column(sa.Integer, primary_key=True, autoincrement=True)
    minute = sa.Column(sa.String(60 * 4), default='*')
    hour = sa.Column(sa.String(24 * 4), default='*')
    day_of_week = sa.Column(sa.String(64), default='*')
    day_of_month = sa.Column(sa.String(31 * 4), default='*')
    month_of_year = sa.Column(sa.String(64), default='*')
    timezone = sa.Column(sa.String(64), default='UTC')

    def __repr__(self):
        return '{0} {1} {2} {3} {4} (m/h/d/dM/MY) {5}'.format(
            cronexp(self.minute), cronexp(self.hour),
            cronexp(self.day_of_week), cronexp(self.day_of_month),
            cronexp(self.month_of_year), str(self.timezone)
        )

    @property
    def schedule(self):
        return TzAwareCrontab(
            minute=self.minute,
            hour=self.hour, day_of_week=self.day_of_week,
            day_of_month=self.day_of_month,
            month_of_year=self.month_of_year,
            tz=pytz.timezone(self.timezone)
        )

    @classmethod
    def from_schedule(cls, session, schedule):
        spec = {
            'minute': schedule._orig_minute,
            'hour': schedule._orig_hour,
            'day_of_week': schedule._orig_day_of_week,
            'day_of_month': schedule._orig_day_of_month,
            'month_of_year': schedule._orig_month_of_year,
        }
        if schedule.tz:
            spec.update({
                'timezone': schedule.tz.zone
            })
        model = session.query(CrontabSchedule).filter_by(**spec).first()
        if not model:
            model = cls(**spec)
            session.add(model)
            session.commit()
        return model


class PeriodicTaskChanged(Base, ModelMixin):
    """Helper table for tracking updates to periodic tasks."""

    __tablename__ = 'timer_update'

    id = sa.Column(sa.Integer, primary_key=True)
    last_update = sa.Column(
        sa.DateTime(timezone=True), nullable=False, default=dt.datetime.now)

    @classmethod
    def changed(cls, mapper, connection, target):
        """
        :param mapper: the Mapper which is the target of this event
        :param connection: the Connection being used
        :param target: the mapped instance being persisted
        """
        if not target.no_changes:
            cls.update_changed(mapper, connection, target)

    @classmethod
    def update_changed(cls, mapper, connection, target):
        """
        :param mapper: the Mapper which is the target of this event
        :param connection: the Connection being used
        :param target: the mapped instance being persisted
        """
        s = connection.execute(select([PeriodicTaskChanged]).
                               where(PeriodicTaskChanged.id == 1).limit(1))
        if not s:
            s = connection.execute(insert(PeriodicTaskChanged),
                                   last_update=dt.datetime.now())
        else:
            s = connection.execute(update(PeriodicTaskChanged).
                                   where(PeriodicTaskChanged.id == 1).
                                   values(last_update=dt.datetime.now()))

    @classmethod
    def last_change(cls, session):
        periodic_tasks = session.query(PeriodicTaskChanged).get(1)
        if periodic_tasks:
            return periodic_tasks.last_update


class PeriodicTask(Base, ModelMixin):
    __tablename__ = 'timer_task'
    __table_args__ = {'mysql_charset': 'utf8'}
    id = sa.Column(sa.Integer, primary_key=True, autoincrement=True)
    task_id = sa.Column(sa.String(255), unique=True, nullable=True)
    modify_time = sa.Column(sa.DateTime(timezone=True), nullable=True)
    create_time = sa.Column(sa.DateTime(timezone=True), nullable=True)
    create_user = sa.Column(sa.String(100), nullable=True)
    update_user = sa.Column(sa.String(100), nullable=True)
    graph_id = sa.Column(sa.Integer, nullable=True)
    task_type = sa.Column(sa.String(20), nullable=True)
    cycle = sa.Column(sa.String(20), nullable=True)
    enabled = sa.Column(sa.Boolean(), default=True)
    # 只执行一次
    one_off = sa.Column(sa.Boolean(), default=False)
    total_run_count = sa.Column(sa.Integer, default=0, server_default='0', nullable=False)
    # task name
    task = sa.Column(sa.String(255))
    crontab_id = sa.Column(sa.Integer)
    crontab = relationship(
        CrontabSchedule,
        uselist=False,
        primaryjoin=foreign(crontab_id) == remote(CrontabSchedule.id)
    )
    args = sa.Column(sa.Text(), default='[]')
    kwargs = sa.Column(sa.Text(), default='{}')
    date_time = sa.Column(sa.String(20), nullable=True)
    date_list = sa.Column(sa.String(200), nullable=True)
    # queue for celery
    queue = sa.Column(sa.String(255))
    # exchange for celery
    f_exchange = sa.Column(sa.String(255))
    # routing_key for celery
    routing_key = sa.Column(sa.String(255))
    priority = sa.Column(sa.Integer())
    expires = sa.Column(sa.DateTime(timezone=True))
    start_time = sa.Column(sa.DateTime(timezone=True))
    last_run_at = sa.Column(sa.DateTime(timezone=True))
    # 修改时间
    date_changed = sa.Column(sa.DateTime(timezone=True),
                             default=func.now(), onupdate=func.now())
    no_changes = False

    def __repr__(self):
        fmt = '{0.task_id}: {{no schedule}}'
        if self.crontab:
            fmt = '{0.task_id}: {0.crontab}'
        return fmt.format(self)

    @property
    def task_name(self):
        return self.task

    @task_name.setter
    def task_name(self, value):
        self.task = value

    @property
    def schedule(self):
        if self.crontab:
            return self.crontab.schedule
        raise ValueError('{} schedule is None!'.format(self.task_id))


listen(PeriodicTask, 'after_insert', PeriodicTaskChanged.update_changed)
listen(PeriodicTask, 'after_delete', PeriodicTaskChanged.update_changed)
listen(PeriodicTask, 'after_update', PeriodicTaskChanged.changed)
listen(CrontabSchedule, 'after_insert', PeriodicTaskChanged.update_changed)
listen(CrontabSchedule, 'after_delete', PeriodicTaskChanged.update_changed)
listen(CrontabSchedule, 'after_update', PeriodicTaskChanged.update_changed)
