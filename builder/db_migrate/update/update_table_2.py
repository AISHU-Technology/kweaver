# -*- coding:utf-8 -*-
import db_migrate.build_tables.table_2 as table
from utils.log_info import Logger
from utils.my_pymysql_pool import connect_execute_commit_close_db


@connect_execute_commit_close_db
def updateDatabase(connection, cursor):
    sql = 'alter table graph_task_table add trigger_type int default 0 not null,add task_type varchar(50) null;'
    Logger.log_info(sql)
    cursor.execute(sql)
    sql = 'alter table graph_task_history_table add trigger_type int default 0 not null,add task_type varchar(50) null;'
    Logger.log_info(sql)
    cursor.execute(sql)
    sql = """create table timer_task
            (
                id              int auto_increment primary key,
                task_id         varchar(255)  null,
                modify_time     datetime      null,
                create_time     datetime      null,
                create_user     varchar(100)  null,
                update_user     varchar(100)  null,
                graph_id        int           null,
                task_type       varchar(20)   null,
                cycle           varchar(20)   null,
                enabled         tinyint(1)  default 1 null,
                one_off         tinyint(1)  default 0 null,
                total_run_count int default 0 not null,
                task            varchar(255)  null,
                crontab_id      int           null,
                args            text  default '[]' null,
                kwargs          text  default '{}' null,
                date_time       varchar(20)   null,
                date_list       varchar(200)  null,
                queue           varchar(255)  null,
                exchange        varchar(255)  null,
                routing_key     varchar(255)  null,
                priority        int           null,
                expires         datetime      null,
                start_time      datetime      null,
                last_run_at     datetime      null,
                date_changed    datetime      null,
                constraint task_id
                    unique (task_id)
            )
                charset = utf8;
        """
    Logger.log_info(sql)
    cursor.execute(sql)
    sql = """
        create table timer_crontab
        (
            id            int auto_increment primary key,
            minute        varchar(240) default '*' null,
            hour          varchar(96)  default '*' null,
            day_of_week   varchar(64)  default '*' null,
            day_of_month  varchar(124) default '*' null,
            month_of_year varchar(64)  default '*' null,
            timezone      varchar(64)  default 'UTC' null
        )
            charset = utf8;
        """
    Logger.log_info(sql)
    cursor.execute(sql)
    sql = """
       create table timer_update
        (
            id          int auto_increment primary key,
            last_update datetime not null
        );
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
