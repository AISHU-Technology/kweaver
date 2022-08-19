# -*- coding:utf-8 -*-
import base64
import os
from datetime import datetime

import db_migrate.build_tables.table_4 as table
from utils.log_info import Logger
from utils.my_pymysql_pool import connect_execute_commit_close_db


@connect_execute_commit_close_db
def updateDatabase(connection, cursor):
    orient_user = os.getenv("ORIENTUSER")
    orient_passwd_str = os.getenv("ORIENTPASS")
    orient_passwd = base64.b64encode(orient_passwd_str.encode("utf-8")).decode()
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    sql1 = 'alter table graph_db add name varchar(256) unique not null,add created datetime null,add updated datetime null,add fulltext_id integer DEFAULT 1;'
    sql2 = 'alter table graph_config_table add graph_db_id int null,add upload BOOLEAN  DEFAULT false,add step_num int DEFAULT 1;'
    sql3 = 'alter table graph_db modify column port varchar(256) not null;'
    sql4 = "update graph_config_table set graph_db_id = (select id from graph_db order by id limit 1) " \
           "where graph_db_id is null;"
    sql5 = f"update graph_db set user='{orient_user}',password='{orient_passwd}',type='orientdb',db_port=NULL," \
           f"name='system_init',created='{now}',updated='{now}' where id = (select id from graph_db order by id limit 1)"
    sql6 = 'alter table graph_config_table drop index graph_name;'
    sql7 = 'alter table knowledge_graph drop index KG_name;'
    sql8 = 'alter table data_source_table drop index dsname;'
    sql9 = 'alter table data_source_table add knw_id int null;'
    sql10 = 'alter table graph_task_history_table add count_status BOOLEAN  DEFAULT false;'
    for sql in (sql1, sql2, sql3, sql4, sql5, sql6, sql7, sql8, sql9, sql10):
        Logger.log_info(sql)
        cursor.execute(sql)
    sql = """
                create table knowledge_network
                (
                    id              int auto_increment primary key,
                    knw_name        varchar(50)  null,
                    knw_description varchar(200) null,
                    color           varchar(50)  null,
                    creator_id      varchar(50)  null,
                    final_operator  varchar(50)  null,
                    creation_time   varchar(50)  null,
                    update_time     varchar(50)  null
                )
                charset = utf8;
          """
    Logger.log_info(sql)
    cursor.execute(sql)
    sql = """
           create table network_graph_relation
            (
                id       int auto_increment
                    primary key,
                knw_id   int null,
                graph_id int null
            )
            charset = utf8;
          """
    Logger.log_info(sql)
    cursor.execute(sql)
    sql = '''
        create table fulltext_engine
        (
            id          int auto_increment primary key,
            ip          varchar(256)    not null,
            port        varchar(256)    not null,
            user        varchar(50)     not null,
            password    varchar(300)    not null
        )
            charset = utf8;
        '''
    Logger.log_info(sql)
    cursor.execute(sql)
    opensearch_ip = os.getenv('OPENSEARCH_HOST')
    opensearch_port = os.getenv('OPENSEARCH_PORT')
    opensearch_user = os.getenv('OPENSEARCH_USER')
    opensearch_passwd = os.getenv('OPENSEARCH_PASS')
    sql = 'insert into fulltext_engine ' \
          '(ip, port, user, password) ' \
          'values ' \
          f'("{opensearch_ip}", "{opensearch_port}", "{opensearch_user}", "{opensearch_passwd}")'
    Logger.log_info(sql)
    cursor.execute(sql)


class Builder_4:
    def update(self):
        Logger.log_info('builder-1.1.4 start updating.')
        updateDatabase()
        Logger.log_info('builder-1.1.4 update success.')

    def initiate(self):
        Logger.log_info('builder-1.1.4 start initiating.')
        table.init_datatable()
        Logger.log_info('builder-1.1.4 initiate success')


builder_4 = Builder_4()
