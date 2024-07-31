# -*-coding:utf-8-*-
# @Time    : 2020/9/7 18:35
# @Author  : Lowe.li
# @Email   : Lowe.li@aishu.cn
import json
import sys
import traceback
from datetime import datetime, timedelta

import arrow
import rdsdriver

import common.stand_log as log_oper
from utils.ConnectUtil import redisConnect, three_redis_read
from utils.log_info import Logger
from utils.my_pymysql_pool import connect_execute_commit_close_db, connect_execute_close_db


class GraphDao():
    # byid
    @connect_execute_close_db
    def getdsgraphuse(self, graphid, connection, cursor):
        sql = """
                SELECT graph_ds FROM graph_config_table  where id = %s""" % (graphid)
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    @connect_execute_close_db
    def getdsgraphuseall(self, connection, cursor):
        sql = """
                SELECT graph_ds FROM graph_config_table """
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    @connect_execute_close_db
    def getdatabyotlid(self, otlid, connection, cursor):
        sql = """
                SELECT graph_name FROM graph_config_table  WHERE graph_otl= %s""" % ("'" + otlid + "'")

        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        names = []
        if len(res) != 0:
            names.append(res[0]["graph_name"])
        return names

    @connect_execute_close_db
    def getdsgraphuse_otl(self, connection, cursor):
        sql = """
                SELECT graph_otl FROM graph_config_table ;
                 """
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    @connect_execute_close_db
    def getallgraph(self, connection, cursor):
        sql = """
                SELECT * FROM graph_config_table  ;
                 """
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    @connect_execute_commit_close_db
    def updategraphstatus(self, KG_config_id, connection, cursor):
        values_list = []
        values_list.append(arrow.now().format('YYYY-MM-DD HH:mm:ss'))
        values_list.append(str(KG_config_id))
        sql = """UPDATE graph_config_table SET graph_update_time=%s where id =%s;"""
        Logger.log_info(sql % tuple(values_list))
        cursor.execute(sql, values_list)
        new_id = cursor.rowcount
        return new_id

    @connect_execute_commit_close_db
    def insertData(self, params_json, connection, cursor):
        values_list = []
        # userId = request.headers.get("userId")
        userId = ""
        # email = request.headers.get("email")
        Logger.log_info("userId :%s " % userId)
        values_list.append(userId)  # 用户
        values_list.append(userId)  # 用户
        values_list.append(arrow.now().format('YYYY-MM-DD HH:mm:ss'))
        values_list.append(arrow.now().format('YYYY-MM-DD HH:mm:ss'))
        graph_process_dict = params_json["graph_process"]
        values_list.append(graph_process_dict["graph_Name"])
        values_list.append(graph_process_dict["graph_DBName"])
        # 创建编辑过程都是edit
        values_list.append("edit")
        values_list.append(str(graph_process_dict))
        Logger.log_info(str(params_json["graph_process"]))
        # 创建时 其他流程为空 []
        null_process = []
        values_list.append(str(null_process))
        values_list.append("")
        values_list.append('{}')
        values_list.append(params_json["knw_id"])
        sql = "INSERT INTO graph_config_table " \
              "(create_by, update_by, create_time, update_time, graph_name, KDB_name, status, " \
              "graph_baseInfo, graph_ds, graph_otl, graph_KMap, knw_id) " \
              "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"
        Logger.log_info(sql % tuple(values_list))
        cursor.execute(sql, values_list)
        new_id = rdsdriver.process_last_row_id(cursor.lastrowid)
        return new_id

    @connect_execute_commit_close_db
    def input_data(self, graph_config, ontology, subgraph_config, knw_id, connection, cursor):
        new_ids = {}
        sql_ontology = """
        INSERT INTO ontology_table (
            create_by,
            create_time,
            update_by, 
            update_time,
            ontology_name, 
            ontology_des, 
            otl_status,
            entity,
            edge,
            used_task,
            all_task,
            otl_temp,
            canvas
        ) VALUES(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        # 拼接ontology需要的数据结构
        ontology_value_list = []
        ontology_value_list.append(ontology["create_by"])
        ontology_value_list.append(ontology["create_time"])
        ontology_value_list.append(ontology["update_by"])
        ontology_value_list.append(ontology["update_time"])
        ontology_value_list.append(ontology["ontology_name"])
        ontology_value_list.append(ontology["ontology_des"])
        ontology_value_list.append(ontology["otl_status"])
        ontology_value_list.append(ontology["entity"])
        ontology_value_list.append(ontology["edge"])
        ontology_value_list.append(ontology["used_task"])
        ontology_value_list.append(ontology["all_task"])
        ontology_value_list.append("[]")
        ontology_value_list.append(str(ontology["canvas"]))
        # 开始执行sql插入操作。
        Logger.log_info(sql_ontology % tuple(ontology_value_list))
        cursor.execute(sql_ontology, ontology_value_list)
        ontology_new_id = rdsdriver.process_last_row_id(cursor.lastrowid)
        graph_config["graph_otl"] = str(ontology_new_id)
        new_ids["ontology_id"] = ontology_new_id

        sql_graph_config = """
        INSERT INTO graph_config_table (
                create_by,
                create_time, 
                update_by,
                update_time, 
                graph_name,
                status, 
                graph_baseInfo,
                graph_ds,
                graph_otl,
                graph_KMap,
                rabbitmq_ds,
                step_num,
                is_upload,
                knw_id,
                KDB_name
        ) 
        VALUES(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        # 拼接graph_config所需要的结构
        graph_config_value_list = []
        graph_config_value_list.append(graph_config["create_by"])
        graph_config_value_list.append(graph_config["create_time"])
        graph_config_value_list.append(graph_config["update_by"])
        graph_config_value_list.append(graph_config["update_time"])
        graph_config_value_list.append(graph_config["graph_name"])
        graph_config_value_list.append("edit")
        graph_config_value_list.append(graph_config["graph_baseInfo"])
        graph_config_value_list.append(graph_config["graph_ds"])
        graph_config_value_list.append(graph_config["graph_otl"])
        graph_config_value_list.append(graph_config["graph_KMap"])
        graph_config_value_list.append(graph_config["rabbitmq_ds"])
        graph_config_value_list.append(graph_config["step_num"])
        graph_config_value_list.append(graph_config["is_upload"])
        graph_config_value_list.append(knw_id)
        graph_config_value_list.append(graph_config["KDB_name"])
        # 执行sql
        Logger.log_info(sql_graph_config % tuple(graph_config_value_list))
        cursor.execute(sql_graph_config, graph_config_value_list)
        graph_config_new_id = rdsdriver.process_last_row_id(cursor.lastrowid)
        new_ids["graph_config_id"] = graph_config_new_id

        for subgraph in subgraph_config:
            sql_subgraph_config = """
                                INSERT INTO subgraph_config (
                                    ontology_id,
                                    graph_id,
                                    name,
                                    entity,
                                    edge,
                                    create_time,
                                    update_time
                                ) VALUES(%s, %s, %s, %s, %s, %s, %s)
                            """
            subgraph_config_list = []
            subgraph_config_list.append(new_ids["ontology_id"])
            subgraph_config_list.append(graph_config_new_id)
            subgraph_config_list.append(subgraph["name"])
            subgraph_config_list.append(subgraph["entity"])
            subgraph_config_list.append(subgraph["edge"])
            subgraph_config_list.append(subgraph["create_time"])
            subgraph_config_list.append(subgraph["update_time"])

            cursor.execute(sql_subgraph_config, subgraph_config_list)
        return new_ids

    @connect_execute_commit_close_db
    def input_data_cover(self, graph_config, ontology, subgraph_config, connection, cursor):
        new_ids = {}
        sql_graph_config = \
        """
        update graph_config_table set
            update_by = %s,
            update_time = %s, 
            graph_ds = %s,
            graph_KMap = %s,
            rabbitmq_ds = %s,
            step_num = %s,
            is_upload = %s
        where id = %s
        """
        # 拼接graph_config所需要的结构
        graph_config_value_list = []
        graph_config_value_list.append(graph_config["update_by"])
        graph_config_value_list.append(graph_config["update_time"])
        graph_config_value_list.append(graph_config["graph_ds"])
        graph_config_value_list.append(graph_config["graph_KMap"])
        graph_config_value_list.append(graph_config["rabbitmq_ds"])
        graph_config_value_list.append(graph_config["step_num"])
        graph_config_value_list.append(graph_config["is_upload"])
        graph_config_value_list.append(graph_config["id"])
        # 执行sql
        Logger.log_info(sql_graph_config % tuple(graph_config_value_list))
        cursor.execute(sql_graph_config, graph_config_value_list)
        new_ids["graph_config_id"] = graph_config["id"]

        sql_ontology = \
        """
        update ontology_table set
            update_by = %s, 
            update_time = %s,
            otl_status = %s,
            entity = %s,
            edge = %s,
            used_task = %s,
            all_task = %s,
            otl_temp = %s,
            canvas = %s
        where id = %s
        """
        # 拼接ontology需要的数据结构
        ontology_value_list = []
        ontology_value_list.append(ontology["update_by"])
        ontology_value_list.append(ontology["update_time"])
        ontology_value_list.append(ontology["otl_status"])
        ontology_value_list.append(ontology["entity"])
        ontology_value_list.append(ontology["edge"])
        ontology_value_list.append("[]")
        ontology_value_list.append("[]")
        ontology_value_list.append("[]")
        ontology_value_list.append(str(ontology["canvas"]))
        ontology_value_list.append(str(ontology["id"]))
        # 开始执行sql插入操作。
        Logger.log_info(sql_ontology % tuple(ontology_value_list))
        cursor.execute(sql_ontology, ontology_value_list)
        new_ids["ontology_id"] = ontology["id"]

        # 删除本体相关的任务
        sql = """DELETE FROM ontology_task_table WHERE ontology_id IN ({});""" \
            .format(ontology["id"])
        Logger.log_info(sql)
        cursor.execute(sql)

        # 删除旧的子图
        sql = """DELETE FROM subgraph_config WHERE ontology_id IN ({});""" \
            .format(ontology["id"])
        Logger.log_info(sql)
        cursor.execute(sql)

        for subgraph in subgraph_config:
            sql_subgraph_config = """
                INSERT INTO subgraph_config (
                    ontology_id,
                    graph_id,
                    name,
                    entity,
                    edge,
                    create_time,
                    update_time
                ) VALUES(%s, %s, %s, %s, %s, %s, %s)
            """
            subgraph_config_list = []
            subgraph_config_list.append(ontology["id"])
            subgraph_config_list.append(graph_config["id"])
            subgraph_config_list.append(subgraph["name"])
            subgraph_config_list.append(subgraph["entity"])
            subgraph_config_list.append(subgraph["edge"])
            subgraph_config_list.append(subgraph["create_time"])
            subgraph_config_list.append(subgraph["update_time"])
            Logger.log_info(sql_subgraph_config % tuple(subgraph_config_list))
            cursor.execute(sql_subgraph_config, subgraph_config_list)
        return new_ids

    @connect_execute_close_db
    def getbyid(self, grapid, connection, cursor):
        sql = """SELECT * FROM graph_config_table where id = %s""" % (grapid)
        # sql = sql.format()
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    @connect_execute_close_db
    def check_by_name(self, graph_name, knw_id, connection, cursor):
        sql = """select * from graph_config_table where graph_name=%s and knw_id=%s;"""
        value_list = [graph_name, knw_id]
        Logger.log_info(sql % tuple(value_list))
        cursor.execute(sql, value_list)
        res = cursor.fetchall()
        if len(res) > 0:
            return True
        else:
            return False

    @connect_execute_close_db
    def getkgdbipnamebyid(self, grapid, connection, cursor):
        """根据grapid返回dbname
        grapid： graph_config_table的id"""
        sql = f""" 
                SELECT 
                    graph_baseInfo
                FROM
                    graph_config_table
                WHERE id = {grapid}"""
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        if len(res) > 0:
            baseInfo = eval(res[0]["graph_baseInfo"])
            ret = {"KDB_ip": baseInfo["graphDBAddress"], "KDB_name": baseInfo["graph_DBName"]}
        else:
            ret = {}
        return ret

    # 流程一根据状态和id判断是否可以修改dbname
    @connect_execute_close_db
    def getbyidandstatus(self, grapid, connection, cursor):
        sql = """SELECT * FROM graph_config_table where id = %s and step_num >= 3""" % (grapid)
        # sql = sql.format()
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    @connect_execute_close_db
    def get_knowledge_graph_by_id(self, graph_id, connection, cursor):
        """
        根据传入的图谱id，查询搜索表的全部信息
        :param graph_id: 图谱id
        :return:
        """
        sql = """SELECT * FROM graph_config_table where id = {}""".format(graph_id)
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    @connect_execute_close_db
    def getnormaltask(self, grapid, connection, cursor):
        sql = "SELECT * FROM graph_task_history_table where graph_id = %s and task_status = 'normal' " \
              "and parent is null" % (grapid)
        # sql = sql.format()
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    @connect_execute_close_db
    def getTaskTimestamp(self, graph_id, connection, cursor):
        sql = """SELECT `timestamp` FROM graph_task_table where graph_id = %s"""
        Logger.log_info(sql)
        cursor.execute(sql, graph_id)
        res = cursor.fetchone()
        return res

    @connect_execute_commit_close_db
    def updateTaskTimestamp(self, graph_id, timestamp, connection, cursor):
        sql = f"""update graph_task_table set `timestamp` = %s where graph_id = %s;"""
        value_list = [str(timestamp), graph_id]
        Logger.log_info(sql % tuple(value_list))
        cursor.execute(sql, value_list)

    # 修改流程一时除了配置本身其他配置是否使用该图谱名字
    @connect_execute_close_db
    def getKgByNameandId(self, graphName, grapid, knw_id, connection, cursor):
        sql = f"""SELECT * FROM graph_config_table where graph_name=%s and id!=%s and knw_id=%s;"""
        value_list = [graphName, grapid, knw_id]
        Logger.log_info(sql % tuple(value_list))
        cursor.execute(sql, value_list)
        res = cursor.fetchall()
        return res

    @connect_execute_close_db
    def getKgConfByName(self, graphName, knw_id, connection, cursor):
        sql = f"""SELECT * FROM graph_config_table where graph_name = %s and knw_id=%s;"""
        value_list = [graphName, knw_id]
        Logger.log_info(sql % tuple(value_list))
        cursor.execute(sql, value_list)
        res = cursor.fetchall()
        return res

    @connect_execute_close_db
    def getKgConfLastId(self, connection, cursor):
        sql = """  SELECT id FROM graph_config_table ORDER BY id DESC LIMIT 1;"""
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    @connect_execute_commit_close_db
    def savenocheck(self, graph_id, params_json, connection, cursor):
        Logger.log_info(params_json)
        values_list = []
        # userId = request.headers.get("userId")
        userId = ""
        values_list.append(userId)  # 用户
        values_list.append(arrow.now().format('YYYY-MM-DD HH:mm:ss'))
        sql = """UPDATE graph_config_table SET update_by=%s, update_time=%s """

        # 传入什么key 更新相关的数据 动态拼接sql
        for key in params_json:
            value_temp = params_json[key]

            if key == "graph_baseInfo":
                sql += """ , graph_baseInfo=%s,graph_name=%s """
                values_list.append(str(value_temp))
                values_list.append(value_temp["graph_Name"])
            if key == "graph_ds":
                sql += """ ,graph_ds=%s"""
                values_list.append(str(value_temp))
            if key == "graph_InfoExt":
                sql += """ ,graph_InfoExt=%s"""
                values_list.append(str(value_temp))
            if key == "graph_KMap":
                sql += """ ,graph_KMap=%s"""
                values_list.append(str(value_temp))
        sql += """ where id = %s """
        values_list.append(graph_id)
        Logger.log_info(sql % tuple(values_list))
        cursor.execute(sql, values_list)
        new_id = cursor.rowcount
        return new_id

    @connect_execute_commit_close_db
    def update_graph_status(self, graphid, connection, cursor):
        sql = """UPDATE graph_config_table SET step_num = 4 where id = %s""" % graphid
        Logger.log_info(sql)
        cursor.execute(sql)
        new_id = cursor.rowcount
        return new_id

    @connect_execute_commit_close_db
    def update(self, id, params_json, otl_id, connection, cursor):
        values_list = []
        graph_step = params_json["graph_step"]
        # userId = request.headers.get("userId")
        userId = ""
        # email = request.headers.get("email")
        values_list.append(userId)  # 用户
        values_list.append(arrow.now().format('YYYY-MM-DD HH:mm:ss'))
        sql = f"select step_num,graph_baseInfo from graph_config_table where id={id}"
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        step_raw = res[0]['step_num']
        graph_baseInfo = res[0]['graph_baseInfo']
        graph_db_name = eval(graph_baseInfo)['graph_DBName'] if graph_baseInfo else ""
        step_num = 1
        if graph_step == "graph_baseInfo":
            params_json["graph_process"]["graph_DBName"] = graph_db_name
            step_num = step_raw if step_num < step_raw else step_num
            graph_process_dict = params_json["graph_process"]
            values_list.append(graph_process_dict["graph_Name"])
            values_list.append(str(graph_process_dict))
            values_list.append(step_num)
            # values_list.append("edit")
            values_list.append(int(id))
            sql = "UPDATE graph_config_table " \
                  "SET " \
                  f"update_by=%s, update_time=%s, graph_name=%s, {graph_step}=%s, step_num=%s " \
                  "where id = %s"
        elif graph_step == "graph_otl":
            values_list.append(str(otl_id))
            values_list.append(id)
            sql = f"""UPDATE graph_config_table SET update_by=%s, update_time=%s,{graph_step}=%s where id = %s"""
        elif graph_step == "graph_KMap":
            step_num = 4
            step_num = step_raw if step_num < step_raw else step_num
            values_list.append(str(params_json["graph_process"]))
            values_list.append(step_num)
            values_list.append(int(id))
            sql = f"""UPDATE graph_config_table SET update_by=%s, update_time=%s,{graph_step}=%s,
                      step_num=%s  where id = %s"""

        elif graph_step == "graph_ds":
            step_num = 2
            step_num = step_raw if step_num < step_raw else step_num
            values_list.append(str(params_json["graph_process"]))
            values_list.append(step_num)
            values_list.append(id)
            rabbitmq_ds = str(params_json.get("rabbitmq_ds", "0"))
            condition = f" rabbitmq_ds={rabbitmq_ds}, "
            sql = f"""UPDATE graph_config_table SET update_by=%s, update_time=%s,{graph_step}=%s,""" \
                  + condition + """step_num=%s where id = %s"""
        Logger.log_info(sql % tuple(values_list))
        cursor.execute(sql, values_list)
        new_id = rdsdriver.process_last_row_id(cursor.lastrowid)
        return new_id

    # 获取所有图谱信息
    @connect_execute_close_db
    def getAllGraph(self, connection, cursor):
        sql = "SELECT id, graph_baseInfo FROM graph_config_table;"
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    @connect_execute_close_db
    def getDsById(self, graph_id, connection, cursor):
        sql = """SELECT graph_ds FROM graph_config_table where id in ({})""".format(",".join(map(str, graph_id)))
        # sql = sql.format()
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    @connect_execute_close_db
    def getOtlById(self, graph_id, connection, cursor):
        sql = """SELECT graph_otl FROM graph_config_table where id in ({})""".format(",".join(map(str, graph_id)))
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    @connect_execute_close_db
    def getinfoById(self, graph_id, connection, cursor):
        sql = """SELECT id, graph_baseInfo FROM graph_config_table where id in ({})""".format(
            ",".join(map(str, graph_id)))
        # sql = sql.format()
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    @connect_execute_close_db
    def getbaseinfoById(self, graph_id, connection, cursor):
        sql = """SELECT id, graph_baseInfo FROM graph_config_table where id = %s""" % graph_id
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    @connect_execute_commit_close_db
    def delete_record(self, graph_id, connection, cursor):
        sql1 = """DELETE FROM graph_config_table WHERE id = (%s);""" % str(graph_id)
        Logger.log_info(sql1)
        cursor.execute(sql1)
        new_id = rdsdriver.process_last_row_id(cursor.lastrowid)
        return new_id

    @connect_execute_close_db
    def getDs_authById(self, id, connection, cursor):
        sql = """SELECT ds_auth FROM data_source_table where id = %s""" % str(id)
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    # 图谱运行状态查询
    @connect_execute_close_db
    def getStatusById(self, graphids, connection, cursor):
        sql = """SELECT graph_id, task_status FROM graph_task_table where graph_id in ({})""".format(
            ",".join(map(str, graphids)))
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    # 批量删除图谱
    @connect_execute_commit_close_db
    def deleteGraphByIds(self, graph_ids, connection, cursor):
        '''
        batch delete the graphs
        Args:
            graph_ids: the graph ids to be deleted
        '''
        # delete ontology data
        sql_get_oyl_id = 'SELECT graph_otl FROM graph_config_table WHERE id IN ({});' \
            .format(",".join(map(str, graph_ids)))
        otl_id = []
        Logger.log_info(sql_get_oyl_id)
        cursor.execute(sql_get_oyl_id)
        for record in cursor.fetchall():
            graph_otl = record['graph_otl']
            if graph_otl:
                otl_id.append(graph_otl)
        if otl_id:
            sql = """DELETE FROM ontology_table WHERE id IN ({});""" \
                .format(",".join(map(str, otl_id)))
            Logger.log_info(sql)
            cursor.execute(sql)
            sql = """DELETE FROM ontology_task_table WHERE ontology_id IN ({});""" \
                .format(",".join(map(str, otl_id)))
            Logger.log_info(sql)
            cursor.execute(sql)
        # delete graph data
        sql1 = """DELETE FROM graph_config_table WHERE id in ({});""".format(",".join(map(str, graph_ids)))
        sql2 = """DELETE FROM search_config WHERE kg_id IN ({});""".format(",".join(map(str, graph_ids)))
        sql3 = """DELETE FROM graph_task_history_table WHERE graph_id in ({});""".format(
            ",".join(map(str, graph_ids)))
        sql4 = """DELETE FROM graph_task_table WHERE graph_id in ({});""".format(",".join(map(str, graph_ids)))
        sql5 = """DELETE FROM subgraph_config WHERE graph_id in ({});""".format(",".join(map(str, graph_ids)))
        # delete the timed task to which the graph belongs
        delete_crontab = """DELETE from timer_crontab where id in (select crontab_id from timer_task where
                                     graph_id in ({}));""".format(",".join(map(str, graph_ids)))
        delete_task = """DELETE from timer_task where graph_id in ({});""".format(",".join(map(str, graph_ids)))
        update_run_sql = "UPDATE timer_task SET last_run_at=NULL where id>1"
        next_minute = (datetime.now() + timedelta(seconds=1)).strftime("%Y-%m-%d %H:%M:%S")
        update_task_sql = f"UPDATE timer_update SET last_update='{next_minute}' where id>=1"
        Logger.log_info(sql1)
        cursor.execute(sql1)
        Logger.log_info(sql2)
        cursor.execute(sql2)
        Logger.log_info(sql3)
        cursor.execute(sql3)
        Logger.log_info(sql4)
        cursor.execute(sql4)
        Logger.log_info(sql5)
        cursor.execute(sql5)
        Logger.log_info(delete_crontab)
        cursor.execute(delete_crontab)
        Logger.log_info(delete_task)
        cursor.execute(delete_task)
        Logger.log_info(update_run_sql)
        cursor.execute(update_run_sql)
        Logger.log_info(update_task_sql)
        cursor.execute(update_task_sql)
        return "success"

    # 批量查找KDB_name
    @connect_execute_close_db
    def getKDBnameByIds(self, graphids, connection, cursor):
        sql = """SELECT KDB_name FROM graph_config_table WHERE id in ({})""".format(",".join(map(str, graphids)))
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        ret = []
        if len(res) > 0:
            ret = [info["KDB_name"] for info in res]
        return ret

    # 查询本体信息
    @connect_execute_close_db
    def get_graph_otl_id(self, kg_id, connection, cursor):
        sql = f"""SELECT graph_otl FROM graph_config_table where id={kg_id};"""
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    @connect_execute_close_db
    def get_graph_detail(self, graph_id_list, connection, cursor):
        """
        查询图谱的所有详细
        """
        graph_id_str = str(graph_id_list)
        if isinstance(graph_id_list, list):
            graph_id_str = ','.join([str(graph_id) for graph_id in graph_id_list])

        sql = f"""SELECT gct.knw_id, kn.knw_name, kn.knw_description, kn.color, kn.create_time,
                    kn.update_time as update_time, gct.id as graph_id, gct.graph_name as graph_name,
                    gct.graph_otl as graph_otl, gct.update_time last_update_time, gct.graph_baseInfo as graph_baseInfo, 
                    gct.graph_KMap as graph_kmap
                    from knowledge_network as kn 
                    join graph_config_table as gct on kn.id = gct.knw_id 
                    where gct.id in ({graph_id_str})
                    """
        Logger.log_info(sql)
        cursor.execute(sql)
        if isinstance(graph_id_list, list):
            return cursor.fetchall()
        return cursor.fetchone()

    # 查询本体实体信息
    @connect_execute_close_db
    def get_graph_entity_otl_info_by_id(self, otl_id, connection, cursor):
        sql = """
                    SELECT entity FROM ontology_table where id={};
                    """.format(otl_id)
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    # 獲取所有graph id
    @connect_execute_close_db
    def get_graph_id_list(self, connection, cursor):
        sql = """SELECT id FROM graph_config_table"""
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    # 更新kg_data_volume字段
    @connect_execute_commit_close_db
    def updategraphbuildstatus(self, KG_config_id, connection, cursor):
        sql = """UPDATE graph_config_table SET kg_data_volume=1  where id =%s""" % (str(KG_config_id))
        Logger.log_info(sql)
        cursor.execute(sql)
        new_id = cursor.rowcount
        return new_id

    # 插入定时任务
    @connect_execute_commit_close_db
    def insert_timed_data(self, crontab_data, task_data, connection, cursor):
        crontab_sql = """INSERT INTO timer_crontab (minute,hour,day_of_month,month_of_year,day_of_week,timezone)
                  VALUES(%s,%s,%s,%s,%s,%s)"""
        task_sql = """INSERT INTO timer_task (task_id,task,args,kwargs,create_by,update_by,graph_id,task_type,cycle,
                enabled,date_time,date_list,crontab_id,update_time,create_time) VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,
                %s,%s,%s,%s)"""
        Logger.log_info(crontab_sql % tuple(crontab_data))
        cursor.execute(crontab_sql, crontab_data)
        new_id = rdsdriver.process_last_row_id(cursor.lastrowid)
        task_data.append(new_id)
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        task_data.extend([now, now])
        Logger.log_info(task_sql % tuple(task_data))
        cursor.execute(task_sql, task_data)
        second = int(datetime.now().strftime('%S'))
        if second <= 40:
            update_run_sql = "UPDATE timer_task SET last_run_at=NULL where id>1"
            Logger.log_info(update_run_sql)
            cursor.execute(update_run_sql)
            next_minute = (datetime.now() + timedelta(seconds=1)).strftime("%Y-%m-%d %H:%M:%S")
            update_task_sql = f"UPDATE timer_update SET last_update='{next_minute}' where id>=1"
            Logger.log_info(update_task_sql)
            cursor.execute(update_task_sql)
        return new_id

    # 定时任务开关
    @connect_execute_commit_close_db
    def update_timer_switch(self, graph_id, task_id, enabled, user_id, connection, cursor):
        if not user_id:
            update_run_sql = f"""UPDATE timer_task SET enabled={enabled} where graph_id={graph_id} and cycle='one' and
                                date_time in (select date_time from timer_task where task_id='{task_id}' and graph_id={graph_id})"""
        else:
            now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            update_run_sql = f"""UPDATE timer_task SET enabled={enabled},update_by='{user_id}',
                                 update_time='{now}' where graph_id={graph_id} and task_id='{task_id}'"""
        Logger.log_info(update_run_sql)
        cursor.execute(update_run_sql)
        new_id = rdsdriver.process_last_row_id(cursor.lastrowid)
        second = int(datetime.now().strftime('%S'))
        if second <= 40:
            update_last_sql = "UPDATE timer_task SET last_run_at=NULL where id>1"
            Logger.log_info(update_last_sql)
            cursor.execute(update_last_sql)
            next_minute = (datetime.now() + timedelta(seconds=1)).strftime("%Y-%m-%d %H:%M:%S")
            update_task_sql = f"UPDATE timer_update SET last_update='{next_minute}' where id>=1"
            Logger.log_info(update_task_sql)
            cursor.execute(update_task_sql)
        return new_id

    # 修改定时任务
    @connect_execute_commit_close_db
    def update_timed_data(self, crontab_data, task_data, connection, cursor):
        args, user_id, task_type, cycle, enabled, date_time, task_id, graph_id, crontab_id, date_list = task_data
        minute, hour, day_of_month, month_of_year, day_of_week = crontab_data
        crontab_sql = f"""UPDATE timer_crontab SET minute='{minute}',hour='{hour}',day_of_month='{day_of_month}',
                          month_of_year='{month_of_year}',day_of_week='{day_of_week}' where id={crontab_id}"""
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        task_sql = f"""UPDATE timer_task SET args='{args}',update_by='{user_id}',task_type='{task_type}',
                     cycle='{cycle}', enabled={enabled},date_time='{date_time}',update_time='{now}',
                     date_list='{date_list}' where task_id='{task_id}' and graph_id={graph_id}"""
        Logger.log_info(crontab_sql)
        cursor.execute(crontab_sql)
        Logger.log_info(task_sql)
        cursor.execute(task_sql)
        new_id = rdsdriver.process_last_row_id(cursor.lastrowid)
        second = int(datetime.now().strftime('%S'))
        if second <= 40:
            update_run_sql = "UPDATE timer_task SET last_run_at=NULL where id>1"
            Logger.log_info(update_run_sql)
            cursor.execute(update_run_sql)
            next_minute = (datetime.now() + timedelta(seconds=1)).strftime("%Y-%m-%d %H:%M:%S")
            update_task_sql = f"UPDATE timer_update SET last_update='{next_minute}' where id>=1"
            Logger.log_info(update_task_sql)
            cursor.execute(update_task_sql)
        return new_id

    # 批量删除定时任务
    @connect_execute_commit_close_db
    def delete_timed_data(self, graph_id, task_ids, connection, cursor):
        format_ids = ','.join(['%s'] * len(task_ids))
        delete_crontab = f"""DELETE from timer_crontab where id in (select crontab_id from timer_task where
                            task_id in ({format_ids}) and graph_id={graph_id})"""
        delete_task = f"""DELETE from timer_task where task_id in ({format_ids}) and graph_id={graph_id}"""
        Logger.log_info(delete_crontab % tuple(task_ids))
        cursor.execute(delete_crontab, task_ids)
        Logger.log_info(delete_task % tuple(task_ids))
        cursor.execute(delete_task, task_ids)
        new_id = rdsdriver.process_last_row_id(cursor.lastrowid)
        second = int(datetime.now().strftime('%S'))
        if second <= 40:
            update_run_sql = "UPDATE timer_task SET last_run_at=NULL where id>1"
            Logger.log_info(update_run_sql)
            cursor.execute(update_run_sql)
            next_minute = (datetime.now() + timedelta(seconds=1)).strftime("%Y-%m-%d %H:%M:%S")
            update_task_sql = f"UPDATE timer_update SET last_update='{next_minute}' where id>=1"
            Logger.log_info(update_task_sql)
            cursor.execute(update_task_sql)
        return new_id

    # 获取定时任务数量
    @connect_execute_commit_close_db
    def select_timed_count(self, graph_id, connection, cursor):
        sql = f"""select count(*) as `count` from timer_task where graph_id=%s"""
        Logger.log_info(sql)
        cursor.execute(sql, graph_id)
        res = cursor.fetchall()
        return res

    # 分页获取定时任务
    @connect_execute_commit_close_db
    def select_timed_page(self, graph_id, order_type, page, size, connection, cursor):
        # sql = f"""select t.task_id,t.task_type,t.cycle,t.date_time as datetime,t.date_list,t.enabled,
        #      t.create_time as create_time,
        #      t.update_time as update_time,
        #      a.username as update_by from timer_task t left join
        #      account a on t.update_by = a.account_id where t.graph_id={graph_id} order by t.create_time {order_type}
        #      limit {(page - 1) * size},{size}"""
        sql = f"""select t.task_id,t.task_type,t.cycle,t.date_time as datetime,t.date_list,t.enabled,
             t.create_time as create_time,
             t.update_time as update_time 
             from timer_task t  where t.graph_id={graph_id} order by t.create_time {order_type}
             limit {(page - 1) * size},{size}"""
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    # 刷新定时任务
    @connect_execute_commit_close_db
    def timer_update_task(self, connection, cursor):
        update_run_sql = "UPDATE timer_task SET last_run_at=NULL where id>1"
        Logger.log_info(update_run_sql)
        cursor.execute(update_run_sql)
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        update_task_sql = f"UPDATE timer_update SET last_update='{now}' where id>=1"
        Logger.log_info(update_task_sql)
        cursor.execute(update_task_sql)
        new_id = rdsdriver.process_last_row_id(cursor.lastrowid)
        return new_id

    # 根据图谱id查找对应数据类型
    @connect_execute_close_db
    def get_data_sourcebyids(self, ids, connection, cursor, ):
        sql = """SELECT data_source FROM data_source_table where id in ({})""".format(",".join(map(str, ids)))
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    @connect_execute_close_db
    def get_upload_id(self, graphids, connection, cursor):
        res = []
        return res

    @connect_execute_close_db
    def get_graph_db_id(self, graphids, connection, cursor):
        graphids = ",".join(map(str, graphids))
        sql = f"select id from graph_config_table where id in ({graphids})"
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    # 根据KDB_name查找对应的图谱id
    @connect_execute_close_db
    def get_config_id_by_KDB_name(self, KDB_name, connection, cursor):
        sql = f"""SELECT id FROM graph_config_table WHERE KDB_name = {KDB_name};"""
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    @connect_execute_close_db
    def get_running_task(self, graph_id, connection, cursor):
        sql = f"""SELECT * FROM graph_task_table where graph_id = {graph_id} and task_status = 'running'"""
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    @connect_execute_close_db
    def get_id_by_dbname(self, dbnames, connection, cursor):
        dbnames = ["'" + i + "'" for i in dbnames]
        dbnames = ','.join(dbnames)
        sql = 'select KDB_name, id from graph_config_table where KDB_name in ({})'.format(dbnames)
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    @connect_execute_close_db
    def get_id_by_otl(self, otl_ids, connection, cursor):
        otl_ids = ["'{}'".format(str(otl_id)) for otl_id in otl_ids]
        sql = "select id from graph_config_table where graph_otl in ({});".format(','.join(otl_ids))
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    @connect_execute_close_db
    def get_id_by_task(self, task_ids, connection, cursor):
        task_ids = ["'{}'".format(str(task_id)) for task_id in task_ids]
        sql = """
                select distinct graph_id from graph_task_history_table where task_id in ({});
            """.format(','.join(task_ids))
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    @connect_execute_close_db
    def get_version_by_id(self, graph_id, connection, cursor):
        sql = f"""select KDB_name, KDB_name_temp from graph_config_table where id={graph_id}"""
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    @connect_execute_commit_close_db
    def update_version(self, KDB_name, KDB_name_temp, graph_id, connection, cursor):
        sql = f"update graph_config_table set KDB_name='{KDB_name}',KDB_name_temp='{KDB_name_temp}' where id={graph_id}"
        Logger.log_info(sql)
        cursor.execute(sql)

    @connect_execute_commit_close_db
    def update_base_info(self, graph_baseInfo, graph_id, connection, cursor):
        value_list = [graph_baseInfo, graph_id]
        sql = f"""update graph_config_table set graph_baseInfo=%s where id=%s;"""
        Logger.log_info(sql % tuple(value_list))
        cursor.execute(sql, value_list)

    @connect_execute_commit_close_db
    def switch_to_be_uploaded(self, graph_ids, to_be_uploaded, connection, cursor):
        pass

    @connect_execute_close_db
    def get_to_be_uploaded_by_id(self, graph_id, connection, cursor):
        return False

    @connect_execute_commit_close_db
    def switch_upload_ready(self, graph_id, upload_ready, connection, cursor):
        pass

    # 更新缓存内容
    def refresh_redis_cache(self, graph_id, content: dict):
        try:
            db = "3"
            r = redisConnect.connect_redis(db, model="write")
            name = "graph_" + str(graph_id)
            for key in content.keys():
                r.hset(name, key, json.dumps(content[key], ensure_ascii="utf-8"))
            r.expire(name, time=10 * 60 * 60 * 24)
            return 200
        except Exception as e:
            error_log = log_oper.get_error_log("refresh_redis_cache failed: {}".format(e), sys._getframe(),
                                               traceback.format_exc())
            Logger.log_error(error_log)
            return 500

    # 查询graph_id对应缓存是否存在，若存在则读取内容，若不存在则给出提示
    def find_redis_graph_cache(self, graph_id):
        try:
            name = "graph_" + str(graph_id)
            if three_redis_read.exists(name) == 0:
                return 200, {}
            res = {}
            res["dbname"] = three_redis_read.hget(name, "dbname").decode(encoding="utf-8")
            res["entity"] = json.loads(three_redis_read.hget(name, "entity").decode(encoding="utf-8"))
            res["edge"] = json.loads(three_redis_read.hget(name, "edge").decode(encoding="utf-8"))
            return 200, res
        except Exception:
            return 500, {}

    # 删除缓存指定键
    def delete_redis_cache(self, name):
        try:
            db = "3"
            r = redisConnect.connect_redis(db, model="read")
            if r.exists(name) == 1:
                r2 = redisConnect.connect_redis(db, model="write")
                r2.delete(name)
            return 200
        except Exception:
            return 500

    @connect_execute_close_db
    def get_graph_by_ids(self, graph_ids, connection, cursor):
        sql = "select * from graph_config_table where id in ({});".format(",".join(map(str, graph_ids)))
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    # 获取数据库版本
    @connect_execute_close_db
    def getDataBaseVersion(self, connection, cursor):
        sql = """SELECT builder_version FROM version WHERE id=1;"""
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    @connect_execute_commit_close_db
    def update_step_num_to_three(self, graph_id, connection, cursor):
        sql = f"select step_num from graph_config_table where id={graph_id}"
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        step_raw = res[0]['step_num']
        if step_raw < 3:
            sql = """UPDATE graph_config_table SET step_num = 3 where id = %s""" % ('"' + str(graph_id) + '"')
            cursor.execute(sql)


graph_dao = GraphDao()
