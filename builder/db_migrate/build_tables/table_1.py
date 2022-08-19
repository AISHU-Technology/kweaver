# -*- coding: utf-8 -*-
# @Time : 2021/7/21 13:50
# @Author : jack.li
# @Email : jack.li@aishu.cn
# @File : db_utils.py
# @Project : builder
import yaml
import base64
from sqlalchemy.orm import sessionmaker, relationship, foreign, remote
from sqlalchemy.pool import NullPool
from sqlalchemy import Column, String, create_engine, Integer, Text, DateTime, MetaData, VARBINARY
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.mysql import LONGTEXT
from dao.graph_dao import graph_dao
from utils.log_info import Logger

"""
    builder 数据库 表
"""
CONFIG_PATH = "./../config/mysql.yaml"
Base = declarative_base()


class GraphConfigTable(Base):
    __tablename__ = 'graph_config_table'
    __table_args__ = {
        'mysql_charset': 'utf8'
    }
    id = Column(Integer, autoincrement=True, primary_key=True)
    create_user = Column(String(100), nullable=True)
    create_time = Column(String(100), nullable=True)
    update_user = Column(String(100), nullable=True)
    update_time = Column(String(100), nullable=True)
    graph_name = Column(String(length=100,collation='utf8_bin'), nullable=True,unique=True)
    graph_status = Column(String(100), nullable=True)
    graph_baseInfo = Column(LONGTEXT)
    graph_ds = Column(LONGTEXT)
    graph_otl = Column(LONGTEXT)
    graph_otl_temp = Column(LONGTEXT)
    graph_InfoExt = Column(LONGTEXT)
    graph_KMap = Column(LONGTEXT)
    graph_KMerge = Column(LONGTEXT)


class DataSourceTable(Base):
    __tablename__ = 'data_source_table'
    __table_args__ = {
        'mysql_charset': 'utf8'
    }
    id = Column(Integer, autoincrement=True, primary_key=True)
    create_user = Column(String(50))
    create_time = Column(String(50))
    update_user = Column(String(50))
    update_time = Column(String(50))
    dsname = Column(String(length=50,collation='utf8_bin'),unique=True)
    dataType = Column(String(20))
    data_source = Column(String(20))
    ds_user = Column(String(30), nullable=True)
    ds_password = Column(String(500), nullable=True)
    ds_address = Column(String(256), nullable=True)
    ds_port = Column(Integer, nullable=True)
    ds_path = Column(LONGTEXT)
    extract_type = Column(String(20), nullable=True)
    ds_auth = Column(String(50), nullable=True)



class OntologyTable(Base):
    __tablename__ = 'ontology_table'
    __table_args__ = {
        'mysql_charset': 'utf8'
    }
    id = Column(Integer, autoincrement=True, primary_key=True)
    create_user = Column(String(50))
    create_time = Column(String(50))
    update_user = Column(String(50))
    update_time = Column(String(50))
    ontology_name = Column(String(length=50,collation='utf8_bin'),unique=True,)
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
    create_user = Column(String(100), nullable=True)
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
    port = Column(Integer, nullable=True)
    user = Column(String(50), nullable=True)
    password = Column(String(300), nullable=True)
    version = Column(Integer, nullable=True)
    type = Column(String(50), nullable=False, default='orient')
    db_user = Column(String(150))
    db_ps = Column(String(300))
    db_port = Column(Integer)


class KnowledgeGraph(Base):
    __tablename__ = "knowledge_graph"
    __table_args__ = {
        'mysql_charset': 'utf8'
    }
    id = Column(Integer, autoincrement=True, primary_key=True)
    KDB_ip = Column(String(256))
    KDB_name = Column(String(250))
    KG_config_id = Column(Integer)
    KG_name = Column(String(length=50,collation='utf8_bin'),unique=True)
    status = Column(String(100))
    hlStart = Column(String(200), nullable=True, default="@-highlight-content-start-@")
    hlEnd = Column(String(200), nullable=True, default="@-highlight-content-end-@")
    create_user = Column(String(50))
    create_time = Column(String(50), nullable=True, default="2020-08-19 15:54:05")
    update_user = Column(String(50))
    update_time = Column(String(50), nullable=True, default="2020-08-19 15:54:05")
    graph_update_time = Column(String(50), nullable=False)
    kg_data_volume = Column(Integer, server_default='0')



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
    create_user = Column(String(100), nullable=True)
    create_time = Column(String(100), nullable=True)
    task_status = Column(String(50), nullable=True)
    task_id = Column(String(200), nullable=True)
    error_report = Column(LONGTEXT)


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
    create_user = Column(String(100), nullable=True)
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


# 数据库版本表
class BuilderVersion(Base):
    __tablename__ = "version"
    __table_args__ = {
        'mysql_charset': 'utf8'
    }
    id = Column(Integer, autoincrement=True, primary_key=True)
    manager_version = Column(String(50), nullable=True)
    builder_version = Column(String(50), nullable=True)
    engine_version = Column(String(50), nullable=True)


# 初始化数据库表
def init_datatable():
    import os
    from urllib import parse
    # config = get_config()
    # user = config["tmysql"]["docker_db"]["user"]
    # passwd = config["tmysql"]["docker_db"]["password"]
    # ip = config["tmysql"]["docker_db"]["host"]
    # port = config["tmysql"]["docker_db"]["port"]
    # database = config["tmysql"]["docker_db"]["database"]
    # DATA-1866 通过系统变量获取配置信息
    ip = os.getenv("RDSHOST")
    port = eval(os.getenv("RDSPORT"))
    user = os.getenv("RDSUSER")
    passwd = str(os.getenv("RDSPASS"))
    database = os.getenv("RDSDBNAME")
    # sqlalchemy_database_uri = "mysql+pymysql://root:eisoo.com@10.4.98.72:3320/anydata4?charset=utf8"
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

    Session = sessionmaker(bind=_engine)

    session = Session()
    orient_ip = os.getenv("ORIENTHOST")
    orient_port = eval(os.getenv("ORIENTPORT"))
    orient_user = os.getenv("ORIENTUSER")
    orient_passwd = str(os.getenv("ORIENTPASS"))
    # orientdb_ip = "kg-orientdb"
    res = session.query(GraphDB).filter(GraphDB.ip == orient_ip).first()
    if not res:
        obj = GraphDB(ip=orient_ip,
                      port=orient_port,
                      user="admin",
                      password=base64.b64encode(b"admin"),  # 这里写死不合适
                      version=3,
                      type="orient",
                      db_user=orient_user,
                      ####
                      db_ps=base64.b64encode(orient_passwd.encode("utf-8")),
                      db_port=2424
                      )
        session.add(obj)
        session.commit()

    session.close()
    Logger.log_info("insert orientdb information success")


if __name__ == "__main__":
    init_datatable()
