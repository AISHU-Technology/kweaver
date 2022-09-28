# -*- coding:utf-8 -*-
import db_migrate.build_tables.table_2 as table
from utils.log_info import Logger
from utils.my_pymysql_pool import connect_execute_commit_close_db

@connect_execute_commit_close_db
def updateDatabase(connection, cursor):
    sql = 'ALTER TABLE `ontology_table` DROP INDEX ontology_name'
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

