# -*- coding:utf-8 -*-
import db_migrate.build_tables.table_3 as table
from utils.log_info import Logger
from utils.my_pymysql_pool import connect_execute_commit_close_db


@connect_execute_commit_close_db
def updateDatabase(connection, cursor):
    sql = 'alter table data_source_table add vhost varchar(50) null,add queue varchar(50) null,add  json_schema text null'
    sql1 = 'alter table graph_config_table add rabbitmq_ds int default 0 not null;'
    Logger.log_info(sql)
    cursor.execute(sql)
    Logger.log_info(sql1)
    cursor.execute(sql1)



class Builder_3:
    def update(self):
        Logger.log_info('builder-1.1.3 start updating.')
        updateDatabase()
        Logger.log_info('builder-1.1.3 update success.')
    
    def initiate(self):
        Logger.log_info('builder-1.1.3 start initiating.')
        table.init_datatable()
        Logger.log_info('builder-1.1.3 initiate success')


builder_3 = Builder_3()
