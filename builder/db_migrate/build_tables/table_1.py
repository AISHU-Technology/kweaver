# -*- coding: utf-8 -*-

import base64

import yaml
from sqlalchemy.orm import sessionmaker, relationship, foreign, remote
from sqlalchemy.pool import NullPool
from sqlalchemy import Column, String, create_engine, Integer, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.mysql import LONGTEXT
from utils.log_info import Logger
import sqlalchemy as sa
from sqlalchemy.event import listen
import datetime as dt
import pytz
from sqlalchemy import func
from sqlalchemy.sql import select, insert, update
from utils.tzcrontab import TzAwareCrontab

"""
    builder 数据库 表
"""
Base = declarative_base()


class GraphConfigTable(Base):
    __tablename__ = 'graph_config_table'
    __table_args__ = {
        'mysql_charset': 'utf8'
    }
    id = Column(Integer, autoincrement=True, primary_key=True)
    create_time = Column(String(100), nullable=True)
    update_time = Column(String(100), nullable=True)
    graph_name = Column(String(length=100, collation='utf8_bin'), nullable=True)
    graph_status = Column(String(100), nullable=True)
    graph_baseInfo = Column(LONGTEXT)
    graph_ds = Column(LONGTEXT)
    graph_otl = Column(LONGTEXT)
    graph_otl_temp = Column(LONGTEXT)
    graph_InfoExt = Column(LONGTEXT)
    graph_KMap = Column(LONGTEXT)
    graph_KMerge = Column(LONGTEXT)
    rabbitmq_ds = Column(Integer, default=0, server_default='0', nullable=False)
    graph_db_id = Column(Integer, nullable=True)
    upload = Column(Boolean, default=False, server_default='0')
    step_num = Column(Integer, default=1, server_default='1', nullable=True)
    is_upload = Column(Boolean, default=False, server_default='0')


class DataSourceTable(Base):
    __tablename__ = 'data_source_table'
    __table_args__ = {
        'mysql_charset': 'utf8'
    }
    id = Column(Integer, autoincrement=True, primary_key=True)
    create_time = Column(String(50))
    update_time = Column(String(50))
    dsname = Column(String(length=50, collation='utf8_bin'))
    dataType = Column(String(20))
    data_source = Column(String(20))
    ds_user = Column(String(30), nullable=True)
    ds_password = Column(String(500), nullable=True)
    ds_address = Column(String(256), nullable=True)
    ds_port = Column(Integer, nullable=True)
    ds_path = Column(LONGTEXT)
    extract_type = Column(String(20), nullable=True)
    ds_auth = Column(String(50), nullable=True)
    vhost = Column(String(50), nullable=True)
    queue = Column(String(50), nullable=True)
    json_schema = Column(LONGTEXT)
    knw_id = Column(Integer, nullable=True)


class OntologyTable(Base):
    __tablename__ = 'ontology_table'
    __table_args__ = {
        'mysql_charset': 'utf8'
    }
    id = Column(Integer, autoincrement=True, primary_key=True)
    create_time = Column(String(50))
    update_time = Column(String(50))
    ontology_name = Column(String(length=50, collation='utf8_bin'), unique=True, )
    ontology_des = Column(String(150), nullable=True)
    otl_status = Column(String(50), nullable=True)
    entity = Column(LONGTEXT)
    edge = Column(LONGTEXT)
    used_task = Column(LONGTEXT, nullable=True)
    all_task = Column(LONGTEXT, nullable=True)


class OntologyTaskTable(Base):
    __tablename__ = 'ontology_task_table'
    __table_args__ = {
        'mysql_charset': 'utf8'
    }
    task_id = Column(Integer, autoincrement=True, primary_key=True)
    ontology_id = Column(String(50), nullable=True)
    task_name = Column(LONGTEXT, nullable=True)
    task_type = Column(String(50), nullable=True)
    create_time = Column(String(100), nullable=True)
    finished_time = Column(String(100), nullable=True)
    task_status = Column(String(500), nullable=True)
    celery_task_id = Column(String(100), nullable=True)
    result = Column(LONGTEXT, nullable=True)
    file_list = Column(LONGTEXT, nullable=True)
    ds_id = Column(String(50), nullable=True)
    postfix = Column(String(50), nullable=True)


class GraphDB(Base):
    __tablename__ = "graph_db"
    __table_args__ = {
        'mysql_charset': 'utf8'
    }
    id = Column(Integer, autoincrement=True, primary_key=True)
    ip = Column(String(256), nullable=True)
    port = Column(String(256), nullable=False)
    user = Column(String(50), nullable=True)
    password = Column(String(300), nullable=True)
    version = Column(Integer, nullable=True)
    type = Column(String(50), nullable=False)
    db_user = Column(String(150))
    db_ps = Column(String(300))
    db_port = Column(Integer, nullable=True)
    name = Column(String(256), nullable=False, unique=True)
    created = sa.Column(sa.DateTime(timezone=True), nullable=True)
    updated = sa.Column(sa.DateTime(timezone=True), nullable=True)
    fulltext_id = Column(Integer, server_default='1', nullable=True)


class FullTextEngine(Base):
    __tablename__ = "fulltext_engine"
    __table_args__ = {
        'mysql_charset': 'utf8'
    }
    id = Column(Integer, autoincrement=True, primary_key=True)
    ip = Column(String(256), nullable=True)
    port = Column(String(256), nullable=True)
    user = Column(String(50), nullable=True)
    password = Column(String(300), nullable=True)
    name = Column(String(256), nullable=False, unique=True)
    created = sa.Column(sa.DateTime(timezone=True), nullable=True)
    updated = sa.Column(sa.DateTime(timezone=True), nullable=True)


class KnowledgeGraph(Base):
    __tablename__ = "knowledge_graph"
    __table_args__ = {
        'mysql_charset': 'utf8'
    }
    id = Column(Integer, autoincrement=True, primary_key=True)
    KDB_ip = Column(String(256))
    KDB_name = Column(String(250))
    KG_config_id = Column(Integer)
    KG_name = Column(String(length=50, collation='utf8_bin'))
    status = Column(String(100))
    hlStart = Column(String(200), nullable=True, default="@-highlight-content-start-@")
    hlEnd = Column(String(200), nullable=True, default="@-highlight-content-end-@")
    create_time = Column(String(50), nullable=True, default="2020-08-19 15:54:05")
    update_time = Column(String(50), nullable=True, default="2020-08-19 15:54:05")
    graph_update_time = Column(String(50), nullable=False)
    kg_data_volume = Column(Integer, server_default='0', nullable=False)


class AuthorToken(Base):
    __tablename__ = "author_token"
    __table_args__ = {
        'mysql_charset': 'utf8'
    }
    ds_auth = Column(Integer, autoincrement=True, primary_key=True)
    redirect_uri = Column(String(50), nullable=True)
    client_id = Column(String(50), nullable=True)
    client_secret = Column(String(50), nullable=True)
    refresh_token = Column(String(500), nullable=True)
    access_token = Column(String(500), nullable=True)
    ds_address = Column(String(50), nullable=True)
    ds_port = Column(String(50), nullable=True)
    ds_code = Column(String(500), nullable=True)
    update_time = Column(String(50), nullable=True)


class GraphTaskTable(Base):
    __tablename__ = "graph_task_table"
    __table_args__ = {
        'mysql_charset': 'utf8'
    }
    id = Column(Integer, autoincrement=True, primary_key=True)
    graph_id = Column(Integer, nullable=True)
    graph_name = Column(String(50), nullable=True)
    create_time = Column(String(100), nullable=True)
    task_status = Column(String(50), nullable=True)
    task_id = Column(String(200), nullable=True)
    error_report = Column(LONGTEXT)
    trigger_type = Column(Integer, default=0, server_default='0', nullable=False)
    task_type = Column(String(50), nullable=True)


class GraphTaskHistoryTable(Base):
    __tablename__ = "graph_task_history_table"
    __table_args__ = {
        'mysql_charset': 'utf8'
    }
    id = Column(Integer, autoincrement=True, primary_key=True)
    graph_id = Column(Integer, nullable=True)
    graph_name = Column(String(50), nullable=True)
    task_id = Column(String(200), nullable=True)
    task_status = Column(String(50), nullable=True)
    start_time = Column(String(100), nullable=True)
    end_time = Column(String(100), nullable=True)
    all_num = Column(Integer, nullable=True)
    entity_num = Column(Integer, nullable=True)
    edge_num = Column(Integer, nullable=True)
    graph_entity = Column(Integer, nullable=True)
    graph_edge = Column(Integer, nullable=True)
    error_report = Column(LONGTEXT)
    entity_pro_num = Column(Integer, nullable=True)
    edge_pro_num = Column(Integer, nullable=True)
    trigger_type = Column(Integer, default=0, server_default='0', nullable=False)
    task_type = Column(String(50), nullable=True)
    count_status = Column(Boolean, default=False, server_default='0', nullable=True)


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
    exchange = sa.Column(sa.String(255))
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


class KnowledgeNetwork(Base):
    __tablename__ = "knowledge_network"
    __table_args__ = {
        'mysql_charset': 'utf8'
    }
    id = Column(Integer, autoincrement=True, primary_key=True)
    knw_name = Column(String(50), nullable=True)
    knw_description = Column(String(200), nullable=True)
    color = Column(String(50), nullable=True)
    creation_time = Column(String(50), nullable=True)
    update_time = Column(String(50), nullable=True)
    identify_id = Column(String(128), nullable=True)


class NetworkGraphRelation(Base):
    __tablename__ = "network_graph_relation"
    __table_args__ = {
        'mysql_charset': 'utf8'
    }
    id = Column(Integer, autoincrement=True, primary_key=True)
    knw_id = Column(Integer, nullable=True)
    graph_id = Column(Integer, nullable=True)


# 初始化数据库表
def init_datatable():
    from os import path
    from urllib import parse
    db_config_path = path.join(path.dirname(path.dirname(path.abspath(__file__))), 'config', 'db.yaml')
    with open(db_config_path, 'r') as f:
        yaml_config = yaml.load(f)
    mariadb_config = yaml_config['mariadb']
    ip = mariadb_config.get('host')
    port = mariadb_config.get('port')
    user = mariadb_config.get('user')
    passwd = mariadb_config.get('password')
    database = mariadb_config.get('database')
    sqlalchemy_database_uri = 'mysql+pymysql://{user}:{passwd}@{ip}:{port}/{database}?charset=utf8'.format(
        user=user,
        passwd=parse.quote_plus(passwd),  # 特殊字符@处理
        ip=ip,
        port=port,
        database=database
    )

    _engine = create_engine(sqlalchemy_database_uri,
                            connect_args={'connect_timeout': 3},
                            poolclass=NullPool,
                            echo=False)
    Base.metadata.create_all(_engine)
    Logger.log_info("initialise database success!")


if __name__ == "__main__":
    init_datatable()
