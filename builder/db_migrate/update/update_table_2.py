# -*- coding:utf-8 -*-
import db_migrate.build_tables.table_2 as table
from utils.log_info import Logger
from utils.my_pymysql_pool import connect_execute_commit_close_db


@connect_execute_commit_close_db
def updateDatabase(connection, cursor):
    """创建异步任务表"""
    sql = """
           CREATE TABLE `async_tasks` (
                `id` int(11) NOT NULL AUTO_INCREMENT,
                `task_type` varchar(100) DEFAULT NULL,
                `task_status` varchar(50) DEFAULT NULL,
                `task_name` varchar(200) DEFAULT NULL,
                `celery_task_id` varchar(200) DEFAULT NULL,
                `relation_id` varchar(200) DEFAULT NULL,
                `task_params` text DEFAULT NULL,
                `result` text DEFAULT NULL,
                `created_time` datetime DEFAULT NULL,
                `finished_time` datetime DEFAULT NULL,
                PRIMARY KEY (`id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
           """
    Logger.log_info(sql)
    cursor.execute(sql)

    """创建领域智商表"""
    sql = """
            CREATE TABLE `intelligence_records` (
              `id` int(11) NOT NULL AUTO_INCREMENT,
              `graph_id` int(11) DEFAULT NULL,
              `entity` varchar(200) DEFAULT NULL,
              `entity_type` varchar(50) DEFAULT NULL,
              `entity_status` smallint(6) DEFAULT NULL,
              `prop_number` smallint(6) DEFAULT NULL,
              `data_length` int(11) DEFAULT NULL,
              `empty_number` int(11) DEFAULT NULL,
              `updated_time` datetime DEFAULT NULL,
              PRIMARY KEY (`id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
               """
    Logger.log_info(sql)
    cursor.execute(sql)


class Builder_2:
    def update(self):
        Logger.log_info('builder-1.1.2 start updating.')
        updateDatabase()
        Logger.log_info('builder-1.1.2 update success.')

    def initiate(self):
        Logger.log_info('builder-1.1.2 start initiating.')
        table.init_datatable()
        Logger.log_info('builder-1.1.2 initiate success')

builder_2 = Builder_2()

