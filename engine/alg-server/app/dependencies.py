# -*- coding: utf-8 -*-


import os
import logging
from typing import Dict, Any, List
from dataclasses import dataclass, Field
from readconfig import ReadConfig

from dacite import from_dict
from dacite.dataclasses import get_fields
from inject import autoparams
from .handlers.search_engine import AnyDataSearchEngine
from .handlers.graph_search import AnyDataGraphSearch
from .utils.connector import AsyncRequestMysql
import asyncio
import aiomysql
import nest_asyncio
nest_asyncio.apply()


logger = logging.getLogger(__name__)


@dataclass
class Config:
    PORT: int = os.getenv('PORT', 8080)
    # 项目名称
    PROJECT_NAME: str = 'anydata_search'
    # 项目路径
    PROJECT_PATH: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    # mysql配置信息
    DBCONFIG = ReadConfig().c["mariadb"]
    MYSQL_HOST = DBCONFIG["ip"]
    MYSQL_DB = DBCONFIG["db"]
    MYSQL_USER = DBCONFIG["user"]
    MYSQL_PASSWORD = DBCONFIG["password"]
    MYSQL_CHARSET = 'utf8'
    MYSQL_PORT = DBCONFIG["port"]

class NebulaDb:
    pass


@autoparams()
def bind_config() -> Config:
    _fields: List[Field] = get_fields(Config)
    config_dict: Dict[str, Any] = dict()
    # load config
    _config = from_dict(Config, config_dict)
    return _config


@autoparams()
def init_mysql_db(config: Config) -> AsyncRequestMysql:
    loop = asyncio.get_event_loop()
    pool = loop.run_until_complete(aiomysql.create_pool(
        host=config.MYSQL_HOST,
        db=config.MYSQL_DB,
        user=config.MYSQL_USER,
        password=config.MYSQL_PASSWORD,
        charset=config.MYSQL_CHARSET,
        port=config.MYSQL_PORT
    ))
    return AsyncRequestMysql(pool)


@autoparams()
def init_nebula_db(config: Config) -> NebulaDb:
    return NebulaDb()


@autoparams()
def init_search_engine(config: Config) -> AnyDataSearchEngine:
    return AnyDataSearchEngine()


@autoparams()
def init_graph_search(config: Config) -> AnyDataGraphSearch:
    return AnyDataGraphSearch()


def bind(binder):
    """
    bind instance to inject container like spring
    we can get instance like below code
    >>> import inject
    >>> nebula: NebulaDb = inject.instance(NebulaDb)
    now we get nebula instance init by init_nebula_db function
    :param binder:
    :return:
    """
    # 初始化配置
    binder.bind_to_constructor(Config, bind_config)
    # 初始化主库
    binder.bind_to_constructor(AsyncRequestMysql, init_mysql_db)

