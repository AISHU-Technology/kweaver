# -*-coding:utf-8-*-
# @Time    : 2020/9/7 18:35
# @Author  : Lowe.li
# @Email   : Lowe.li@aishu.cn
from datetime import datetime, timedelta
from utils.my_pymysql_pool import connect_execute_commit_close_db, connect_execute_close_db
import pandas as pd
import arrow
from flask import request
from utils.log_info import Logger
from dao.knw_dao import knw_dao


class GraphDao():

    @connect_execute_close_db
    def getGraphDB(self, connection, cursor):
        sql = """
                SELECT ip FROM graph_db  ;
                 """
        Logger.log_info(sql)
        df = pd.read_sql(sql, connection)
        return df

    @connect_execute_close_db
    def getGraphDBNew(self, graph_db_id, connection, cursor):
        sql = f"""SELECT * FROM graph_db where id={graph_db_id}"""
        print(sql)
        df = pd.read_sql(sql, connection)
        return df

    # byid
    @connect_execute_close_db
    def getdsgraphuse(self, graphid, connection, cursor):
        sql = """
                SELECT graph_ds FROM graph_config_table  where id = %s""" % (graphid)
        df = pd.read_sql(sql, connection)
        return df

    @connect_execute_close_db
    def getdsgraphuseall(self, connection, cursor):
        sql = """
                SELECT graph_ds FROM graph_config_table """
        df = pd.read_sql(sql, connection)
        return df

    @connect_execute_close_db
    def getdatabyotlid(self, otlid, connection, cursor):
        sql = """
                SELECT graph_name FROM graph_config_table  WHERE graph_otl= %s""" % ("'" + otlid + "'")

        df = pd.read_sql(sql, connection)
        res = df["graph_name"].tolist()
        return res

    @connect_execute_close_db
    def getdsgraphuse_otl(self, connection, cursor):
        sql = """
                SELECT graph_otl FROM graph_config_table ;
                 """
        df = pd.read_sql(sql, connection)
        return df

    @connect_execute_close_db
    def getallgraph(self, connection, cursor):
        sql = """
                SELECT * FROM graph_config_table  ;
                 """
        df = pd.read_sql(sql, connection)
        return df

    @connect_execute_close_db
    def getGraphDBbyIp(self, graph_DBAddress, connection, cursor):
        sql = """
                SELECT * FROM graph_db where ip = %s;
                 """ % ('"' + graph_DBAddress + '"')
        df = pd.read_sql(sql, connection)
        return df

    @connect_execute_close_db
    def getGraphDBbyId(self, graph_db_id, connection, cursor):
        sql = f"SELECT * FROM graph_db where id = {graph_db_id}"
        df = pd.read_sql(sql, connection)
        return df

    @connect_execute_commit_close_db
    def updategraphstatus(self, KG_config_id, connection, cursor):
        values_list = []
        values_list.append(arrow.now().format('YYYY-MM-DD HH:mm:ss'))
        values_list.append(str(KG_config_id))
        sql = """UPDATE knowledge_graph SET graph_update_time=%s  where KG_config_id =%s"""
        sql = sql % ('"' + values_list[0] + '"', values_list[1])
        cursor.execute(sql)
        new_id = cursor.rowcount
        return new_id

    @connect_execute_commit_close_db
    def updategraph(self, id, params_json, otl_id, connection, cursor):
        graph_process_list = params_json["graph_process"]
        graph_process_dict = graph_process_list[0]
        graph_db_id = graph_process_dict['graph_db_id']
        sql = f"""SELECT * FROM graph_db where id={graph_db_id}"""
        df = pd.read_sql(sql, connection)
        rec_dict = df.to_dict('records')[0]
        graph_ips = rec_dict["ip"]
        values_list = []
        values_list.append(arrow.now().format('YYYY-MM-DD HH:mm:ss'))

        values_list.append(graph_process_dict["graph_Name"])
        values_list.append(graph_ips)
        values_list.append(id)
        sql = """UPDATE knowledge_graph SET update_time=%s, KG_name=%s,KDB_ip=%s  where KG_config_id =%s"""
        sql = sql % ('"' + values_list[0] + '"',
                     '"' + values_list[1] + '"',
                     '"' + values_list[2] + '"',
                     values_list[3])
        cursor.execute(sql)
        new_id = cursor.rowcount
        return new_id

    @connect_execute_commit_close_db
    def insertgraph(self, params_json, ret, connection, cursor):
        values_list = []
        values_list.append(arrow.now().format('YYYY-MM-DD HH:mm:ss'))
        values_list.append(arrow.now().format('YYYY-MM-DD HH:mm:ss'))
        values_list.append(arrow.now().format('YYYY-MM-DD HH:mm:ss'))
        values_list.append(ret)
        graph_process_list = params_json["graph_process"]
        graph_process_dict = graph_process_list[0]
        values_list.append(graph_process_dict["graph_Name"])
        values_list.append(graph_process_dict["graphDBAddress"])
        values_list.append(graph_process_dict["graph_DBName"])
        # 创建编辑过程都是edit
        values_list.append("edit")
        values_list.append('@-highlight-content-start-@')
        values_list.append('@-highlight-content-end-@')

        sql = """INSERT INTO knowledge_graph (create_time, update_time, graph_update_time,KG_config_id, KG_name, 
         KDB_ip,KDB_name,status,hlStart,hlEnd) VALUES(%s, %s,%s, %s, %s,%s, %s, %s, %s, %s)"""
        Logger.log_info(sql)
        cursor.execute(sql, values_list)
        new_id = cursor.lastrowid
        print(new_id)
        return new_id

    @connect_execute_commit_close_db
    def insertData(self, params_json, connection, cursor):
        values_list = []
        values_list.append(arrow.now().format('YYYY-MM-DD HH:mm:ss'))
        values_list.append(arrow.now().format('YYYY-MM-DD HH:mm:ss'))
        graph_process_list = params_json["graph_process"]
        graph_process_dict = graph_process_list[0]
        values_list.append(graph_process_dict["graph_Name"])
        graph_db_id = graph_process_dict["graph_db_id"]
        # 创建编辑过程都是edit
        values_list.append("edit")
        values_list.append(str(params_json["graph_process"]))
        print(str(params_json["graph_process"]))
        # 创建时 其他流程为空 []
        null_process = []
        values_list.append(str(null_process))
        values_list.append(str(null_process))
        values_list.append(str(null_process))
        values_list.append(str(null_process))
        values_list.append(str(null_process))
        values_list.append(str(null_process))
        values_list.append(graph_db_id)
        sql = """INSERT INTO graph_config_table (create_time, update_time, graph_name,graph_status, 
                 graph_baseInfo,graph_ds,graph_otl,graph_InfoExt,graph_KMap,graph_KMerge,graph_otl_temp,graph_db_id) 
                VALUES(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"""

        cursor.execute(sql, values_list)
        new_id = cursor.lastrowid
        return new_id

    @connect_execute_commit_close_db
    def input_data(self, knowledge_network, graph_config, knowledge_graph, ontology, search_configs, isUpdate,
                   knw_id, connection, cursor):
        # 如果是更新的时候，拼接的sql是不一样的。
        if not knw_id:
            if knowledge_network["is_update"]:
                sql_knowledge_network = """
                UPDATE knowledge_network
                SET knw_name=%s,
                knw_description=%s,
                color=%s,
                creation_time=%s,
                update_time=%s
                where id = %s
                """
                knowledge_network_value_list = []
                knowledge_network_value_list.append(knowledge_network["knw_name"])
                knowledge_network_value_list.append(knowledge_network["knw_description"])
                knowledge_network_value_list.append(knowledge_network["color"])
                knowledge_network_value_list.append(knowledge_network["creation_time"])
                knowledge_network_value_list.append(knowledge_network["update_time"])

                knowledge_network_value_list.append(knowledge_network["id"])

                cursor.execute(sql_knowledge_network, knowledge_network_value_list)

            else:
                sql_knowledge_network = """
                INSERT INTO knowledge_network (
                    knw_name,
                    knw_description,
                    color,
                    creation_time,
                    update_time,
                    identify_id
                ) VALUES(%s, %s, %s, %s, %s, %s)
                """
                knowledge_network_value_list = []
                knowledge_network_value_list.append(knowledge_network["knw_name"])
                knowledge_network_value_list.append(knowledge_network["knw_description"])
                knowledge_network_value_list.append(knowledge_network["color"])
                knowledge_network_value_list.append(knowledge_network["creation_time"])
                knowledge_network_value_list.append(knowledge_network["update_time"])
                knowledge_network_value_list.append(knowledge_network["identify_id"])
                cursor.execute(sql_knowledge_network, knowledge_network_value_list)
                knowledge_network_new_id = cursor.lastrowid
        if isUpdate:
            sql_graph_config = """
            UPDATE graph_config_table 
                set create_time=%s, 
                update_time=%s, 
                graph_name=%s,
                graph_status=%s, 
                graph_baseInfo=%s,
                graph_ds=%s,
                graph_otl=%s,
                graph_otl_temp=%s,
                graph_InfoExt=%s,
                graph_KMap=%s,
                graph_KMerge=%s,
                rabbitmq_ds=%s,
                graph_db_id=%s,
                step_num=%s
            where id=%s
            """
            # 拼接sql处理
            graph_config_value_list = []
            graph_config_value_list.append(graph_config["create_time"])
            graph_config_value_list.append(graph_config["update_time"])
            graph_config_value_list.append(graph_config["graph_name"])
            graph_config_value_list.append(graph_config["graph_status"])
            graph_config_value_list.append(graph_config["graph_baseInfo"])
            graph_config_value_list.append(graph_config["graph_ds"])
            graph_config_value_list.append(graph_config["graph_otl"])
            graph_config_value_list.append(graph_config["graph_otl_temp"])
            graph_config_value_list.append(graph_config["graph_InfoExt"])
            graph_config_value_list.append(graph_config["graph_KMap"])
            graph_config_value_list.append(graph_config["graph_KMerge"])
            graph_config_value_list.append(graph_config["rabbitmq_ds"])
            graph_config_value_list.append(graph_config["graph_db_id"])
            graph_config_value_list.append(graph_config["step_num"])

            graph_config_value_list.append(graph_config["id"])

            cursor.execute(sql_graph_config, graph_config_value_list)

            sql_knowledge_graph = """
            UPDATE knowledge_graph 
                set KDB_ip=%s,
                KDB_name=%s,
                KG_config_id=%s, 
                KG_name=%s, 
                status=%s,
                hlStart=%s,
                hlEnd=%s,
                create_time=%s, 
                update_time=%s, 
                graph_update_time=%s,
                kg_data_volume=%s
            where id = %s           
            """
            # 拼接knowledge所需要的结构
            knowledge_graph_value_list = []
            knowledge_graph_value_list.append(knowledge_graph["KDB_ip"])
            knowledge_graph_value_list.append(knowledge_graph["KDB_name"])
            knowledge_graph_value_list.append(knowledge_graph["KG_config_id"])
            knowledge_graph_value_list.append(knowledge_graph["KG_name"])
            knowledge_graph_value_list.append(knowledge_graph["status"])
            knowledge_graph_value_list.append(knowledge_graph["hlStart"])
            knowledge_graph_value_list.append(knowledge_graph["hlEnd"])
            knowledge_graph_value_list.append(knowledge_graph["create_time"])
            knowledge_graph_value_list.append(knowledge_graph["update_time"])
            knowledge_graph_value_list.append(knowledge_graph["graph_update_time"])
            knowledge_graph_value_list.append(knowledge_graph["kg_data_volume"])

            knowledge_graph_value_list.append(knowledge_graph["id"])

            cursor.execute(sql_knowledge_graph, knowledge_graph_value_list)

            sql_ontology = """
            UPDATE ontology_table
                set create_time=%s,
                update_time=%s,
                ontology_name=%s, 
                ontology_des=%s, 
                otl_status=%s,
                entity=%s,
                edge=%s,
                used_task=%s,
                all_task=%s
            where id = %s
            """
            # 拼接ontology需要的数据结构
            ontology_value_list = []
            ontology_value_list.append(ontology["create_time"])
            ontology_value_list.append(ontology["update_time"])
            ontology_value_list.append(ontology["ontology_name"])
            ontology_value_list.append(ontology["ontology_des"])
            ontology_value_list.append(ontology["otl_status"])
            ontology_value_list.append(ontology["entity"])
            ontology_value_list.append(ontology["edge"])
            ontology_value_list.append(ontology["used_task"])
            ontology_value_list.append(ontology["all_task"])

            ontology_value_list.append(ontology["id"])

            cursor.execute(sql_ontology, ontology_value_list)

            for search_config in search_configs:
                if search_config["is_update"]:
                    sql_search_config = """
                    UPDATE search_config
                        set `conf_name`=%s, 
                        `type`=%s, 
                        `conf_desc`=%s, 
                        `kg_id`=%s, 
                        `conf_content`=%s, 
                        `db_2_doc`=%s, 
                        `create_time`=%s, 
                        `update_time`=%s
                    where id = %s
                    """
                    # 处理sql
                    search_config_value_list = []
                    search_config_value_list.append(search_config["conf_name"])
                    search_config_value_list.append(search_config["type"])
                    search_config_value_list.append(search_config["conf_desc"])
                    search_config_value_list.append(search_config["kg_id"])
                    search_config_value_list.append(search_config["conf_content"])
                    search_config_value_list.append(search_config["db_2_doc"])
                    search_config_value_list.append(search_config["create_time"])
                    search_config_value_list.append(search_config["update_time"])

                    search_config_value_list.append(search_config["id"])

                    cursor.execute(sql_search_config, search_config_value_list)
                else:
                    sql_search_config = """
                    INSERT INTO search_config(
                        `conf_name`, 
                        `type`, 
                        `conf_desc`, 
                        `kg_id`, 
                        `conf_content`, 
                        `db_2_doc`, 
                        `create_time`, 
                        `update_time`
                    )
                    VALUES (%s, %s, %s, %s, %s,  %s, %s, %s);
                    """
                    # 处理sql
                    search_config_value_list = []
                    search_config_value_list.append(search_config["conf_name"])
                    search_config_value_list.append(search_config["type"])
                    search_config_value_list.append(search_config["conf_desc"])
                    search_config_value_list.append(search_config["kg_id"])
                    search_config_value_list.append(search_config["conf_content"])
                    search_config_value_list.append(search_config["db_2_doc"])
                    search_config_value_list.append(search_config["create_time"])
                    search_config_value_list.append(search_config["update_time"])
                    # 执行sql
                    cursor.execute(sql_search_config, search_config_value_list)
            return True
        else:
            new_ids = {}
            sql_ontology = """
            INSERT INTO ontology_table (
                create_time,
                update_time,
                ontology_name, 
                ontology_des, 
                otl_status,
                entity,
                edge,
                used_task,
                all_task
            ) VALUES(%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            # 拼接ontology需要的数据结构
            ontology_value_list = []
            ontology_value_list.append(ontology["create_time"])
            ontology_value_list.append(ontology["update_time"])
            ontology_value_list.append(ontology["ontology_name"])
            ontology_value_list.append(ontology["ontology_des"])
            ontology_value_list.append(ontology["otl_status"])
            ontology_value_list.append(ontology["entity"])
            ontology_value_list.append(ontology["edge"])
            ontology_value_list.append(ontology["used_task"])
            ontology_value_list.append(ontology["all_task"])
            # 开始执行sql插入操作。
            cursor.execute(sql_ontology, ontology_value_list)
            ontology_new_id = cursor.lastrowid
            temp_item = []
            temp_item.append(ontology_new_id)
            graph_config["graph_otl"] = str(temp_item)
            new_ids["ontology_id"] = ontology_new_id

            sql_graph_config = """
            INSERT INTO graph_config_table (
                    create_time, 
                    update_time, 
                    graph_name,
                    graph_status, 
                    graph_baseInfo,
                    graph_ds,
                    graph_otl,
                    graph_otl_temp,
                    graph_InfoExt,
                    graph_KMap,
                    graph_KMerge,
                    rabbitmq_ds,
                    graph_db_id,
                    step_num,
                    is_upload
            ) 
            VALUES(%s, %s, %s, %s, %s,  %s, %s, %s, %s, %s,  %s, %s,%s, %s, %s)
            """
            # 拼接graph_config所需要的结构
            graph_config_value_list = []
            graph_config_value_list.append(graph_config["create_time"])
            graph_config_value_list.append(graph_config["update_time"])
            graph_config_value_list.append(graph_config["graph_name"])
            graph_config_value_list.append(graph_config["graph_status"])
            graph_config_value_list.append(graph_config["graph_baseInfo"])
            graph_config_value_list.append(graph_config["graph_ds"])
            graph_config_value_list.append(graph_config["graph_otl"])
            graph_config_value_list.append(graph_config["graph_otl_temp"])
            graph_config_value_list.append(graph_config["graph_InfoExt"])
            graph_config_value_list.append(graph_config["graph_KMap"])
            graph_config_value_list.append(graph_config["graph_KMerge"])
            graph_config_value_list.append(graph_config["rabbitmq_ds"])
            graph_config_value_list.append(graph_config["graph_db_id"])
            graph_config_value_list.append(graph_config["step_num"])
            graph_config_value_list.append(graph_config["is_upload"])
            # 执行sql
            cursor.execute(sql_graph_config, graph_config_value_list)
            graph_config_new_id = cursor.lastrowid
            knowledge_graph["KG_config_id"] = graph_config_new_id
            new_ids["graph_config_id"] = graph_config_new_id

            sql_knowledge_graph = """
            INSERT INTO knowledge_graph (
                KDB_ip,
                KDB_name,
                KG_config_id, 
                KG_name, 
                status,
                hlStart,
                hlEnd,
                create_time, 
                update_time, 
                graph_update_time,
                kg_data_volume
            )
            VALUES(%s, %s, %s, %s, %s,  %s, %s, %s, %s, %s, %s)
            """
            # 拼接knowledge所需要的结构
            knowledge_graph_value_list = []
            knowledge_graph_value_list.append(knowledge_graph["KDB_ip"])
            knowledge_graph_value_list.append(knowledge_graph["KDB_name"])
            knowledge_graph_value_list.append(knowledge_graph["KG_config_id"])
            knowledge_graph_value_list.append(knowledge_graph["KG_name"])
            knowledge_graph_value_list.append(knowledge_graph["status"])
            knowledge_graph_value_list.append(knowledge_graph["hlStart"])
            knowledge_graph_value_list.append(knowledge_graph["hlEnd"])
            knowledge_graph_value_list.append(knowledge_graph["create_time"])
            knowledge_graph_value_list.append(knowledge_graph["update_time"])
            knowledge_graph_value_list.append(knowledge_graph["graph_update_time"])
            knowledge_graph_value_list.append(knowledge_graph["kg_data_volume"])

            # 插入sql
            cursor.execute(sql_knowledge_graph, knowledge_graph_value_list)
            knowledge_graph_new_id = cursor.lastrowid

            # 此处进行多配置处理，高级搜索配置可能不仅仅只有一个。
            for search_config in search_configs:
                search_config["kg_id"] = knowledge_graph_new_id
                sql_search_config = """
                INSERT INTO search_config(
                    `conf_name`, 
                    `type`, 
                    `conf_desc`, 
                    `kg_id`, 
                    `conf_content`, 
                    `db_2_doc`, 
                    `create_time`, 
                    `update_time`
                )
                VALUES (%s, %s, %s, %s, %s,  %s, %s, %s);
                """
                # 处理sql
                search_config_value_list = []
                search_config_value_list.append(search_config["conf_name"])
                search_config_value_list.append(search_config["type"])
                search_config_value_list.append(search_config["conf_desc"])
                search_config_value_list.append(search_config["kg_id"])
                search_config_value_list.append(search_config["conf_content"])
                search_config_value_list.append(search_config["db_2_doc"])
                search_config_value_list.append(search_config["create_time"])
                search_config_value_list.append(search_config["update_time"])
                # 执行sql
                cursor.execute(sql_search_config, search_config_value_list)
            # 更新操作不做处理，但是如果是插入操作，需要返回对应的新id，用来同步权限。

            # 分批次处理问题。
            """
            1：知识网络是更新的，图谱是更新的。不需要插入数据。
            2：知识网络是更新，图谱不是更新的，使用知识网络旧id，图谱新id。
            3：知识网络不是更新，图谱是更新的。使用知识网络新id，图谱旧id。
            4：知识网络不是更新的，图谱不是更新的，使用双者新id。
            """
            if not knw_id:
                if not knowledge_network["is_update"]:
                    new_ids["knowledge_network_id"] = knowledge_network_new_id
                    if isUpdate:
                        # 如果不是更细，增加知识网络和知识图谱间的关系。
                        knw_dao.insert_graph_relation(knowledge_network_new_id, graph_config["id"])
                    else:
                        knw_dao.insert_graph_relation(knowledge_network_new_id, graph_config_new_id)
                elif knowledge_network["is_update"] and not isUpdate:
                    knw_dao.insert_graph_relation(knowledge_network["id"], graph_config_new_id)
            else:
                knw_dao.insert_graph_relation(knw_id, graph_config_new_id)
            return new_ids

    @connect_execute_close_db
    def getbyid(self, grapid, connection, cursor):
        print(grapid)
        sql = """SELECT * FROM graph_config_table where id = %s""" % (grapid)
        # sql = sql.format()
        Logger.log_info(sql)
        df = pd.read_sql(sql, connection)
        return df

    @connect_execute_close_db
    def check_by_name(self, graph_name, connection, cursor):
        print(graph_name)
        sql = """SELECT * FROM graph_config_table where graph_name = '{}'""".format(graph_name)
        Logger.log_info(sql)
        df = pd.read_sql(sql, connection)
        df = df.to_dict("records")
        if len(df) > 0:
            return True
        else:
            return False

    # 流程一根据状态和id判断是否可以修改dbname
    @connect_execute_close_db
    def getbyidandstatus(self, grapid, connection, cursor):
        print(grapid)
        sql = """SELECT * FROM graph_config_table where id = %s and graph_status= 'finish'""" % (grapid)
        # sql = sql.format()
        Logger.log_info(sql)
        df = pd.read_sql(sql, connection)
        return df

    # 获取图谱状态
    @connect_execute_close_db
    def get_graph_status_by_id(self, grapid, connection, cursor):
        # print(grapid)
        sql = """SELECT * FROM knowledge_graph where id = {} and status='running' """.format(grapid)
        # sql = sql.format()
        Logger.log_info(sql)
        df = pd.read_sql(sql, connection)
        return df

    @connect_execute_close_db
    def get_knowledge_graph_by_id(self, graph_config_id, connection, cursor):
        """
        根据传入的config_id，查询搜索表的全部信息
        :param graph_config_id: 图配置id
        :return:
        """
        sql = """SELECT * FROM knowledge_graph where KG_config_id = {}""".format(graph_config_id)
        Logger.log_info(sql)
        df = pd.read_sql(sql, connection)
        return df

    @connect_execute_close_db
    def getnormaltask(self, grapid, connection, cursor):
        sql = """SELECT * FROM graph_task_table where graph_id = %s and task_status = 'normal'""" % (grapid)
        # sql = sql.format()
        Logger.log_info(sql)
        df = pd.read_sql(sql, connection)
        return df

    # 修改流程一时除了配置本身其他配置是否使用该图数据库名称
    @connect_execute_close_db
    def checkDBnamegetbyid(self, grapid, connection, cursor):
        sql = """SELECT * FROM graph_config_table where  id != %s""" % (grapid)
        # sql = sql.format()
        Logger.log_info(sql)
        df = pd.read_sql(sql, connection)
        return df

    # 修改流程一时除了配置本身其他配置是否使用该图谱名字
    @connect_execute_close_db
    def getKgByNameandId(self, graphName, grapid, knw_id, connection, cursor):
        sql = f"""SELECT * FROM graph_config_table where graph_name = '{graphName}' and id!={grapid} and
                  id in (select graph_id from network_graph_relation where knw_id={knw_id})"""
        Logger.log_info(sql)
        df = pd.read_sql(sql, connection)
        return df

    @connect_execute_close_db
    def getKgConfByName(self, graphName, knw_id, connection, cursor):
        sql = f"""SELECT * FROM graph_config_table where graph_name = '{graphName}' and id in (select graph_id from 
                   network_graph_relation where knw_id={knw_id})"""
        # sql = sql.format()
        Logger.log_info(sql)
        df = pd.read_sql(sql, connection)
        return df

    @connect_execute_close_db
    def getKgConfLastId(self, connection, cursor):
        sql = """  SELECT id FROM graph_config_table ORDER BY id DESC LIMIT 1;"""
        df = pd.read_sql(sql, connection)
        return df

    @connect_execute_commit_close_db
    def savenocheck(self, graph_id, params_json, connection, cursor):
        print(params_json)
        values_list = []
        values_list.append(arrow.now().format('YYYY-MM-DD HH:mm:ss'))
        sql = """UPDATE graph_config_table SET update_time=%s """

        # 传入什么key 更新相关的数据 动态拼接sql
        for key in params_json:
            value_temp = params_json[key]

            if key == "graph_baseInfo":
                sql += """ , graph_baseInfo=%s,graph_name=%s """

                values_list.append(str(value_temp))
                value_temp2 = value_temp[0]
                values_list.append(value_temp2["graph_Name"])

            if key == "graph_ds":
                sql += """ ,graph_ds=%s"""
                values_list.append(str(value_temp))
            if key == "graph_otl":
                sql += """ ,graph_otl_temp=%s"""
                values_list.append(str(value_temp))
            if key == "graph_InfoExt":
                sql += """ ,graph_InfoExt=%s"""
                values_list.append(str(value_temp))
            if key == "graph_KMap":
                sql += """ ,graph_KMap=%s"""
                values_list.append(str(value_temp))
            if key == "graph_KMerge":
                sql += """ ,graph_KMerge=%s"""
                values_list.append(str(value_temp))
                entity_classes = value_temp[0].get("entity_classes", [])
                if entity_classes:
                    graph_status = "finish"
                    sql += " ,graph_status=%s"
                    values_list.append(graph_status)
        sql += """ where id = %s """
        values_list.append(graph_id)
        Logger.log_info(sql)
        cursor.execute(sql, values_list)
        new_id = cursor.rowcount
        return new_id

    @connect_execute_commit_close_db
    def update_otl_temp(self, grapid, connection, cursor):
        values_list = []
        values_list.append(arrow.now().format('YYYY-MM-DD HH:mm:ss'))
        graph_otl_temp = []
        values_list.append(str(graph_otl_temp))
        values_list.append(grapid)
        sql = """UPDATE graph_config_table SET update_time=%s,graph_otl_temp=%s  where id = %s"""

        sql = sql % ('"' + values_list[0] + '"',
                     '"' + values_list[1] + '"',
                     '"' + values_list[2] + '"')

        cursor.execute(sql)
        # new_id = cursor.rowcount
        new_id = cursor.lastrowid
        return new_id

    @connect_execute_commit_close_db
    def delupdsta(self, graphid, connection, cursor):
        sql = """UPDATE graph_config_table SET graph_status="edit"  where id = %s""" % ('"' + str(graphid) + '"')
        Logger.log_info(sql)
        cursor.execute(sql)
        new_id = cursor.rowcount
        return new_id

    @connect_execute_commit_close_db
    def update(self, id, params_json, otl_id, connection, cursor):
        values_list = []
        graph_step = params_json["graph_step"]
        values_list.append(arrow.now().format('YYYY-MM-DD HH:mm:ss'))
        sql = f"select step_num,graph_baseInfo from graph_config_table where id={id}"
        df = pd.read_sql(sql, connection)
        step_raw = df.to_dict('records')[0]['step_num']
        graph_baseInfo = df.to_dict('records')[0]['graph_baseInfo']
        graph_db_name = eval(graph_baseInfo)[0]['graph_DBName'] if graph_baseInfo else ""
        step_num = 1
        if graph_step == "graph_baseInfo":
            params_json["graph_process"][0]["graph_DBName"] = graph_db_name
            step_num = step_raw if step_num < step_raw else step_num
            graph_process_list = params_json["graph_process"]
            graph_process_dict = graph_process_list[0]
            values_list.append(graph_process_dict["graph_Name"])
            values_list.append(str(params_json["graph_process"]))
            values_list.append(graph_process_dict["graph_db_id"])
            values_list.append(step_num)
            # values_list.append("edit")
            values_list.append(int(id))
            sql = f"""UPDATE graph_config_table SET update_time=%s, graph_name=%s, {graph_step}=%s, 
                     graph_db_id=%s,step_num=%s  where id = %s"""
        elif graph_step == "graph_otl":
            otl_json = [otl_id]
            values_list.append(str(otl_json))
            # values_list.append("edit")
            graph_otl_temp = []
            values_list.append(str(graph_otl_temp))
            values_list.append(id)
            sql = f"""UPDATE graph_config_table SET update_time=%s,{graph_step}=%s,
                    graph_otl_temp =%s where id = %s"""
        elif graph_step == "graph_KMerge":
            step_num = 6
            step_num = step_raw if step_num < step_raw else step_num
            values_list.append(str(params_json["graph_process"]))
            graph_status = "finish"
            values_list.append(graph_status)
            values_list.append(step_num)
            values_list.append(int(id))
            sql = f"""UPDATE graph_config_table SET update_time=%s,{graph_step}=%s,
                     graph_status=%s,step_num=%s  where id = %s"""
        else:
            if graph_step == "graph_ds":
                step_num = 2
            elif graph_step == "graph_InfoExt":
                step_num = 4
            elif graph_step == "graph_KMap":
                step_num = 5
            step_num = step_raw if step_num < step_raw else step_num
            values_list.append(str(params_json["graph_process"]))
            values_list.append(str(params_json.get("rabbitmq_ds", "0")))
            values_list.append(step_num)
            values_list.append(id)
            sql = f"""UPDATE graph_config_table SET update_time=%s,{graph_step}=%s,
                      rabbitmq_ds=%s,step_num=%s where id = %s"""
            Logger.log_info(sql)
        cursor.execute(sql, values_list)
        new_id = cursor.lastrowid
        return new_id

    # 获取所有图谱信息
    @connect_execute_close_db
    def getAllGraph(self, connection, cursor):
        sql = "SELECT id, graph_baseInfo FROM graph_config_table;"
        df = pd.read_sql(sql, connection)
        return df

    @connect_execute_close_db
    def getDsById(self, graph_id, connection, cursor):
        print(graph_id)

        sql = """SELECT graph_ds FROM graph_config_table where id in ({})""".format(",".join(map(str, graph_id)))
        # sql = sql.format()
        Logger.log_info(sql)
        df = pd.read_sql(sql, connection)
        return df

    @connect_execute_close_db
    def getbaseinfoById(self, graph_id, connection, cursor):
        print(graph_id)
        sql = """SELECT id, graph_baseInfo FROM graph_config_table where id = %s""" % ('"' + str(graph_id) + '"')
        # sql = sql.format()
        print(sql)
        df = pd.read_sql(sql, connection)
        return df

    @connect_execute_commit_close_db
    def delete_record(self, graph_id, connection, cursor):
        sql1 = """DELETE FROM graph_config_table WHERE id = (%s);""" % str(graph_id)
        sql2 = """DELETE FROM knowledge_graph WHERE KG_config_id = (%s);""" % str(graph_id)
        cursor.execute(sql1)
        cursor.execute(sql2)
        new_id = cursor.lastrowid
        return new_id

    @connect_execute_close_db
    def getDs_authById(self, id, connection, cursor):
        sql = """SELECT ds_auth FROM data_source_table where id = %s""" % str(id)
        Logger.log_info(sql)
        df = pd.read_sql(sql, connection)
        return df

    # 图谱运行状态查询
    @connect_execute_close_db
    def getStatusById(self, graphids, connection, cursor):
        sql = """SELECT graph_id, task_status FROM graph_task_table where graph_id in ({})""".format(
            ",".join(map(str, graphids)))
        Logger.log_info(sql)
        df = pd.read_sql(sql, connection)
        return df

    # 批量删除图谱
    @connect_execute_commit_close_db
    def deleteGraphByIds(self, graphids, connection, cursor):
        sql1 = """DELETE FROM graph_config_table WHERE id in ({});""".format(",".join(map(str, graphids)))
        sql2 = """DELETE FROM search_config WHERE kg_id IN (SELECT id FROM knowledge_graph WHERE KG_config_id IN ({}));""".format(
            ",".join(map(str, graphids)))
        sql3 = """DELETE FROM knowledge_graph WHERE KG_config_id in ({});""".format(",".join(map(str, graphids)))
        sql4 = """DELETE FROM graph_task_history_table WHERE graph_id in ({});""".format(",".join(map(str, graphids)))
        sql5 = """DELETE FROM graph_task_table WHERE graph_id in ({});""".format(",".join(map(str, graphids)))
        # 删除图谱所属的定时任务
        delete_crontab = """DELETE from timer_crontab where id in (select crontab_id from timer_task where
                             graph_id in ({}));""".format(",".join(map(str, graphids)))
        delete_task = """DELETE from timer_task where graph_id in ({});""".format(",".join(map(str, graphids)))
        update_run_sql = "UPDATE timer_task SET last_run_at=NULL where id>1"
        next_minute = (datetime.now() + timedelta(seconds=1)).strftime("%Y-%m-%d %H:%M:%S")
        update_task_sql = f"UPDATE timer_update SET last_update='{next_minute}' where id>=1"
        cursor.execute(sql1)
        cursor.execute(sql2)
        cursor.execute(sql3)
        cursor.execute(sql4)
        cursor.execute(sql5)
        cursor.execute(delete_crontab)
        cursor.execute(delete_task)
        cursor.execute(update_run_sql)
        cursor.execute(update_task_sql)
        new_id = cursor.lastrowid
        return new_id

    # 批量查找knowledge_graph中的KDB_name
    @connect_execute_close_db
    def getKDBnameByIds(self, graphids, connection, cursor):
        sql = """SELECT KDB_name FROM knowledge_graph WHERE KG_config_id in ({})""".format(",".join(map(str, graphids)))
        df = pd.read_sql(sql, connection)
        return df

    @connect_execute_close_db
    def check_knowledge_graph_by_kdb_name(self, kdb_name, connection, cursor):
        """
        根据kdb_name检查对应的knowledge是否存在
        :param kdb_name: 名称，唯一字段
        :return: True 存在，False 不存在
        """
        sql = """SELECT * FROM knowledge_graph WHERE KDB_name = '{}'""".format(kdb_name)
        df = pd.read_sql(sql, connection)
        df = df.to_dict(orient="records")
        if len(df) > 0:
            return True
        else:
            return False

    @connect_execute_close_db
    def get_knowledge_graph_by_kdb_name(self, kdb_name, connection, cursor):
        """
        根据kdb_name获取对应的knowledge_graph
        注意和check区分开来
        :param kdb_name: 名称，唯一字段
        :return: dict
        """
        sql = """SELECT * FROM knowledge_graph WHERE KDB_name = '{}'""".format(kdb_name)
        df = pd.read_sql(sql, connection)
        df = df.to_dict(orient="records")
        return df

    @connect_execute_close_db
    def check_knowledge_graph_by_kg_name(self, kg_name, connection, cursor):
        """
        根据kg_name获取对应的knowledge_graph
        :param kg_name: 名称
        :return: True 存在，False 不存在
        """
        sql = """SELECT * FROM knowledge_graph WHERE KG_name = '{}'""".format(kg_name)
        df = pd.read_sql(sql, connection)
        df = df.to_dict(orient="records")
        if len(df) > 0:
            return True
        else:
            return False


    # 查询本体信息
    @connect_execute_close_db
    def get_graph_otl_id(self, kg_id, connection, cursor):
        sql = """
                    SELECT graph_otl FROM graph_config_table as a join knowledge_graph as b on a.id = b.KG_config_id where b.id={};
                    """.format(kg_id)
        df = pd.read_sql(sql, connection)
        return df

    # 查询本体实体信息
    @connect_execute_close_db
    def get_graph_entity_otl_info_by_id(self, otl_id, connection, cursor):
        sql = """
                    SELECT entity FROM ontology_table where id={};
                    """.format(otl_id)
        df = pd.read_sql(sql, connection)
        return df

    # 獲取所有graph id
    @connect_execute_close_db
    def get_graph_id_list(self, connection, cursor):
        sql = """SELECT id FROM graph_config_table"""
        df = pd.read_sql(sql, connection)
        return df

    # 更新knowledge_graph中的kg_data_volume字段
    @connect_execute_commit_close_db
    def updategraphbuildstatus(self, KG_config_id, connection, cursor):
        sql = """UPDATE knowledge_graph SET kg_data_volume=1  where KG_config_id =%s""" % (str(KG_config_id))
        cursor.execute(sql)
        new_id = cursor.rowcount
        return new_id

    # 在knowledge_graph表中增加列kg_data_volume
    @connect_execute_commit_close_db
    def alterknowledge_graphaddkg_data_volume(self, connection, cursor):
        sql = """ALTER TABLE knowledge_graph ADD COLUMN IF NOT EXISTS kg_data_volume INT DEFAULT(0) """
        cursor.execute(sql)
        new_id = cursor.rowcount
        return new_id

    # 插入定时任务
    @connect_execute_commit_close_db
    def insert_timed_data(self, crontab_data, task_data, connection, cursor):
        crontab_sql = """
            INSERT INTO
              timer_crontab (
                minute, hour, day_of_month, month_of_year, day_of_week, timezone
              )
            VALUES (%s, %s, %s, %s, %s, %s)"""
        task_sql = """
            INSERT INTO
              timer_task (
                task_id, task, args, kwargs, graph_id, task_type, cycle, enabled, date_time, 
                date_list, crontab_id, modify_time, create_time
              )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"""
        cursor.execute(crontab_sql, crontab_data)
        new_id = cursor.lastrowid
        task_data.append(new_id)
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        task_data.extend([now, now])
        cursor.execute(task_sql, task_data)
        second = int(datetime.now().strftime('%S'))
        if second <= 40:
            update_run_sql = "UPDATE timer_task SET last_run_at=NULL where id>1"
            cursor.execute(update_run_sql)
            next_minute = (datetime.now() + timedelta(seconds=1)).strftime("%Y-%m-%d %H:%M:%S")
            update_task_sql = f"UPDATE timer_update SET last_update='{next_minute}' where id>=1"
            cursor.execute(update_task_sql)
        return new_id

    # 定时任务开关
    @connect_execute_commit_close_db
    def update_timer_switch(self, graph_id, task_id, enabled, update, connection, cursor):
        if not update:
            update_run_sql = f"""
                UPDATE timer_task
                SET enabled = {enabled}
                where
                  graph_id = {graph_id}
                  and cycle = 'one'
                  and date_time in (
                    select date_time
                    from timer_task
                    where
                      task_id = '{task_id}'
                      and graph_id = {graph_id}
                  )"""
        else:
            now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            update_run_sql = f"""
                UPDATE timer_task
                SET
                  enabled = {enabled},
                  modify_time = '{now}'
                where
                  graph_id = {graph_id}
                  and task_id = '{task_id}'"""
        cursor.execute(update_run_sql)
        new_id = cursor.lastrowid
        second = int(datetime.now().strftime('%S'))
        if second <= 40:
            update_last_sql = "UPDATE timer_task SET last_run_at=NULL where id>1"
            cursor.execute(update_last_sql)
            next_minute = (datetime.now() + timedelta(seconds=1)).strftime("%Y-%m-%d %H:%M:%S")
            update_task_sql = f"UPDATE timer_update SET last_update='{next_minute}' where id>=1"
            cursor.execute(update_task_sql)
        return new_id

    # 修改定时任务
    @connect_execute_commit_close_db
    def update_timed_data(self, crontab_data, task_data, connection, cursor):
        args, task_type, cycle, enabled, date_time, task_id, graph_id, crontab_id, date_list = task_data
        minute, hour, day_of_month, month_of_year, day_of_week = crontab_data
        crontab_sql = f"""UPDATE timer_crontab SET minute='{minute}',hour='{hour}',day_of_month='{day_of_month}',
                          month_of_year='{month_of_year}',day_of_week='{day_of_week}' where id={crontab_id}"""
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        task_sql = f"""
            UPDATE
              timer_task
            SET
              args = '{args}',
              task_type = '{task_type}',
              cycle = '{cycle}',
              enabled = {enabled},
              date_time = '{date_time}',
              modify_time = '{now}',
              date_list = '{date_list}'
            where
              task_id = '{task_id}'
              and graph_id = {graph_id}"""
        cursor.execute(crontab_sql)
        cursor.execute(task_sql)
        new_id = cursor.lastrowid
        second = int(datetime.now().strftime('%S'))
        if second <= 40:
            update_run_sql = "UPDATE timer_task SET last_run_at=NULL where id>1"
            cursor.execute(update_run_sql)
            next_minute = (datetime.now() + timedelta(seconds=1)).strftime("%Y-%m-%d %H:%M:%S")
            update_task_sql = f"UPDATE timer_update SET last_update='{next_minute}' where id>=1"
            cursor.execute(update_task_sql)
        return new_id

    # 批量删除定时任务
    @connect_execute_commit_close_db
    def delete_timed_data(self, graph_id, task_ids, connection, cursor):
        format_ids = ','.join(['%s'] * len(task_ids))
        delete_crontab = f"""DELETE from timer_crontab where id in (select crontab_id from timer_task where
                            task_id in ({format_ids}) and graph_id={graph_id})"""
        delete_task = f"""DELETE from timer_task where task_id in ({format_ids}) and graph_id={graph_id}"""
        cursor.execute(delete_crontab, task_ids)
        cursor.execute(delete_task, task_ids)
        new_id = cursor.lastrowid
        second = int(datetime.now().strftime('%S'))
        if second <= 40:
            update_run_sql = "UPDATE timer_task SET last_run_at=NULL where id>1"
            cursor.execute(update_run_sql)
            next_minute = (datetime.now() + timedelta(seconds=1)).strftime("%Y-%m-%d %H:%M:%S")
            update_task_sql = f"UPDATE timer_update SET last_update='{next_minute}' where id>=1"
            cursor.execute(update_task_sql)
        return new_id

    # 获取定时任务数量
    @connect_execute_commit_close_db
    def select_timed_count(self, graph_id, connection, cursor):
        sql = f"""select count(*) as count from timer_task where graph_id={graph_id}"""
        df = pd.read_sql(sql, connection)
        return df

    # 分页获取定时任务
    @connect_execute_commit_close_db
    def select_timed_page(self, graph_id, order_type, page, size, connection, cursor):
        sql = f"""
            select
              task_id,
              task_type,
              cycle,
              date_time as datetime,
              date_list,
              enabled,
              DATE_FORMAT(create_time, '%Y-%m-%d %H:%i:%s') as create_time,
              DATE_FORMAT(modify_time, '%Y-%m-%d %H:%i:%s') as modify_time
            from
              timer_task
            where
              graph_id = {graph_id}
            order by
              create_time {order_type}
            limit
              {(page - 1) * size},
              {size}"""
        df = pd.read_sql(sql, connection)
        return df

    # 刷新定时任务
    @connect_execute_commit_close_db
    def timer_update_task(self, connection, cursor):
        update_run_sql = "UPDATE timer_task SET last_run_at=NULL where id>1"
        cursor.execute(update_run_sql)
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        update_task_sql = f"UPDATE timer_update SET last_update='{now}' where id>=1"
        cursor.execute(update_task_sql)
        new_id = cursor.lastrowid
        return new_id

    # 根据图谱id查找对应数据类型
    @connect_execute_close_db
    def get_data_sourcebyids(self, ids, connection, cursor, ):
        sql = """SELECT data_source FROM data_source_table where id in ({})""".format(",".join(map(str, ids)))
        Logger.log_info(sql)
        df = pd.read_sql(sql, connection)
        # data=df.to_dict()
        return df

    # 根据图谱id查找对应的配置数据源类型
    @connect_execute_close_db
    def get_DataSourceTypebyid(self, graph_id, connection, cursor, ):
        sql = """SELECT * FROM graph_config_table where id={}""".format(graph_id)
        Logger.log_info(sql)
        df = pd.read_sql(sql, connection)
        # data=df.to_dict()
        return df

    @connect_execute_close_db
    def get_IdByConfigId(self, configids, connection, cursor):
        sql = """select `id` as kg_id, `KG_config_id` as kg_conf_id from knowledge_graph where KG_config_id in ({})""".format(
            ",".join(map(str, configids)))
        # 这个地方如果出现错误，错误报不出来。需要考虑如何处理。
        result = pd.read_sql(sql, connection)
        return result["kg_id"]

    @connect_execute_close_db
    def get_upload_id(self, graphids, connection, cursor):
        graphids = ",".join(map(str, graphids)) if isinstance(graphids, list) else graphids
        sql = f"select gid from task where transferStatus in (0,1) and gid in ({graphids}) group by gid"
        df = pd.read_sql(sql, connection)
        return df

    @connect_execute_close_db
    def get_graph_db_id(self, graphids, connection, cursor):
        graphids = ",".join(map(str, graphids))
        sql = f"select id,graph_db_id from graph_config_table where id in ({graphids})"
        df = pd.read_sql(sql, connection)
        return df

    # 根据KDB_name查找对应的KG_config_id
    @connect_execute_close_db
    def get_config_id_by_KDB_name(self, KDB_name, connection, cursor):
        sql = """SELECT KG_config_id FROM knowledge_graph WHERE KDB_name='{}'""".format(KDB_name)
        df = pd.read_sql(sql, connection)
        return df

    @connect_execute_close_db
    def get_running_task(self, graph_id, connection, cursor):
        sql = f"""SELECT * FROM graph_task_table where graph_id = {graph_id} and task_status = 'running'"""
        Logger.log_info(sql)
        df = pd.read_sql(sql, connection)
        return df

    @connect_execute_close_db
    def get_configid_by_kgid(self, kgid, connection, cursor):
        sql = f"select KG_config_id from knowledge_graph where id={kgid}"
        df = pd.read_sql(sql, connection)
        return df


graph_dao = GraphDao()
