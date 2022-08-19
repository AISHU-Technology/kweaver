# -*- coding:utf-8 -*-
import base64
import os
from datetime import datetime

import db_migrate.build_tables.table_5 as table
from utils.log_info import Logger
from utils.my_pymysql_pool import connect_execute_commit_close_db


@connect_execute_commit_close_db
def updateDatabase(connection, cursor):
    sql = 'alter table graph_config_table add is_upload BOOLEAN  DEFAULT false;'
    Logger.log_info(sql)
    cursor.execute(sql)
    sql = 'alter table knowledge_network add identify_id varchar(128) null;'
    Logger.log_info(sql)
    cursor.execute(sql)
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    opensearch_passwd = base64.b64encode(os.getenv('OPENSEARCH_PASS').encode("utf-8")).decode()
    sql1 = 'alter table fulltext_engine add name varchar(256) unique not null,add created datetime null,add updated datetime null'
    sql2 = f"update fulltext_engine set password='{opensearch_passwd}',name='内置opensearch',created='{now}',updated='{now}' where id = 1"
    sql3 = f"update graph_db set name='内置OrientDB' where id =1"
    for sql in (sql1, sql2, sql3):
        Logger.log_info(sql)
        cursor.execute(sql)


class Builder_5:
    def update(self):
        Logger.log_info('builder-1.1.5 start updating.')
        updateDatabase()
        Logger.log_info('builder-1.1.5 update success.')

    def initiate(self):
        Logger.log_info('builder-1.1.5 start initiating.')
        table.init_datatable()
        Logger.log_info('builder-1.1.5 initiate success')


builder_5 = Builder_5()
