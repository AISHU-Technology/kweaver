import uuid

import pandas as pd
import arrow

from flask import request
from utils.my_pymysql_pool import connect_execute_close_db, connect_execute_commit_close_db
from utils.log_info import Logger


class knwDao:
    # 新增知识网络
    @connect_execute_commit_close_db
    def insert_knowledgeNetwork(self, params_json, cursor, connection):
        print("entry in save")
        values_list = []
        values_list.append(params_json["knw_name"])
        if "knw_des" not in params_json.keys():
            values_list.append("")
        else:
            values_list.append(params_json["knw_des"])
        values_list.append(params_json["knw_color"])
        values_list.append(arrow.now().format('YYYY-MM-DD HH:mm:ss'))
        values_list.append(arrow.now().format('YYYY-MM-DD HH:mm:ss'))
        identify_id = str(uuid.uuid1())
        values_list.append(identify_id)
        print(values_list)

        sql = """
                INSERT INTO knowledge_network 
                    (knw_name, knw_description, color, creation_time, update_time, identify_id) 
                VALUES(%s, %s, %s, %s, %s, %s)
                """
        cursor.execute(sql, values_list)
        new_id = cursor.lastrowid
        return new_id

    # 分页查询知识网络,knw_name为”“时查询全部
    @connect_execute_close_db
    def get_knw_by_name(self, knw_name, page, size, order, rule, connection, cursor):
        sql = """
            select  id, knw_name, knw_description, color, creation_time, update_time, identify_id,
                case 
                    when intelligence_score>0 then round(intelligence_score, 2)
                    else IFNULL(intelligence_score, -1)
                end intelligence_score,
		        case   
			        when intelligence_score<0 then 1
			        when isnull(intelligence_score)=1 then 1
			        else 0
		        end  group_column 
	        from knowledge_network
        """

        order = 'desc' if order == 'desc' else 'asc'

        if knw_name:
            knw_name = "'%" + knw_name + "%'"
            sql += f""" where knw_name like {knw_name} """

        if rule:
            sql += f""" order by group_column asc, {rule} {order}"""
        else:
            sql += f""" order by group_column asc, update_time desc """

        sql += f""" limit {page * size},{size}"""
        Logger.log_info(sql)
        df = pd.read_sql(sql, connection)
        return df

    # 编辑知识网络
    @connect_execute_commit_close_db
    def edit_knw(self, params_json, cursor, connection):
        values_list = []
        values_list.append(params_json["knw_name"])
        if "knw_des" not in params_json.keys():
            values_list.append("")
        else:
            values_list.append(params_json["knw_des"])
        values_list.append(params_json["knw_color"])
        values_list.append(arrow.now().format('YYYY-MM-DD HH:mm:ss'))
        values_list.append(params_json["knw_id"])

        sql = """UPDATE knowledge_network SET knw_name=%s, knw_description=%s, color=%s, update_time=%s WHERE id=%s """
        cursor.execute(sql, values_list)
        update_id = cursor.lastrowid
        return update_id

    # 删除知识网络
    @connect_execute_commit_close_db
    def delete_knw(self, knw_id, cursor, connection):
        sql = """DELETE FROM knowledge_network WHERE id=%s;""" % knw_id
        cursor.execute(sql)
        new_id = cursor.lastrowid
        return new_id

    # 根据ID查找知识网络
    @connect_execute_close_db
    def get_knw_by_id(self, knw_id, cursor, connection):
        sql = """SELECT * FROM knowledge_network WHERE id = %s""" % knw_id
        df = pd.read_sql(sql, connection)
        return df

    # 根据ID查找知识网络
    @connect_execute_close_db
    def get_knw_by_identify_id(self, identify_id, cursor, connection):
        sql = """
        SELECT * FROM knowledge_network WHERE identify_id = "{}";
        """
        sql = sql.format(identify_id)
        Logger.log_info(sql)
        cursor.execute(sql)
        df = pd.read_sql(sql, connection)
        return df

    # 根据知识网络名称查找ID
    @connect_execute_close_db
    def get_id_by_name(self, knowledgeNetwork_name, connection, cursor):
        sql = """
                 SELECT id FROM knowledge_network WHERE knw_name ="{}";
                 """

        sql = sql.format(knowledgeNetwork_name)
        Logger.log_info(sql)
        cursor.execute(sql)

        df = pd.read_sql(sql, connection)
        return df

    # 根据图谱ID反查对应的知识网络ID
    @connect_execute_close_db
    def get_ids_by_graph(self, graph_ids, connection, cursor):
        sql = """
                 SELECT knw_id FROM network_graph_relation WHERE graph_id in ({}) group by knw_id;
                 """
        sql = sql.format(",".join(map(str, graph_ids)))
        Logger.log_info(sql)
        df = pd.read_sql(sql, connection)
        return df

    # 根据知识网络ID查询全部知识图谱
    @connect_execute_close_db
    def get_all_graph(self, knw_id, graph_name, upload_graph, connection, cursor):
        join_str = ""
        limit_str = ""
        if upload_graph:
            join_str = "join graph_task_table gtt on gc.id = gtt.graph_id " \
                       "join graph_db on gc.graph_db_id = graph_db.id"
            limit_str += " and gtt.task_status = 'normal' " \
                         "and graph_db.type = 'nebula' " \
                         "and gc.graph_status = 'finish'"
        sql = f"""
                select
                    gc.id
                from
                    graph_config_table gc
                    {join_str}
                where
                    gc.id in (
                        select graph_id
                        from network_graph_relation
                        where knw_id = {knw_id}
                    )
                    {limit_str}
                    and gc.graph_name collate utf8_general_ci like '%{graph_name}%'"""
        df = pd.read_sql(sql, connection)
        rec_list = df.to_dict('records')
        return rec_list

    # 根据知识网络ID分页查询知识图谱
    @connect_execute_close_db
    def get_graph_by_knw(self, knw_id, page, size, order_type, graph_name, rule, upload_graph,
                         connection, cursor):
        limit_str = ""
        join_str = ""
        if upload_graph:
            join_str = """left join graph_db on gc.graph_db_id = graph_db.id"""
            limit_str += " and gt.task_status = 'normal'" \
                         " and graph_db.type = 'nebula'" \
                         " and gc.graph_status = 'finish'"
        sql = f"""
            select
                kg.`id`,
                kg.`KG_config_id` as `kgconfid`,
                kg.`KG_name` as `name`,
                kg.`status`,
                kg.`KDB_name` as `graph_db_name`,
                gt.`task_status` as `taskstatus`,
                gc.`graph_baseInfo`,
                gc.`is_upload`,
                gc.`rabbitmq_ds` as `rabbitmqDs`,
                gc.`graph_status` as `configstatus`,
                kg.`create_time`,
                kg.`hlStart`,
                kg.`hlEnd`,
                kg.`update_time` as `updateTime`,
                gc.graph_otl,
                gc.step_num
            from
                knowledge_graph kg
                LEFT JOIN graph_task_table gt ON kg.KG_config_id = gt.graph_id
                LEFT JOIN graph_config_table gc ON kg.KG_config_id = gc.id
                {join_str}
            where
                kg.KG_config_id in (
                    select graph_id
                    from network_graph_relation
                    where knw_id = {knw_id}
                )
                {limit_str}
                and kg.KG_name collate utf8_general_ci like '%{graph_name}%'
            ORDER BY
                kg.{rule} {order_type}
            limit
                {page * size}, {size};"""
        Logger.log_info(sql)
        df = pd.read_sql(sql, connection)
        rec_list = df.to_dict('records')
        otl_map = {}
        otl_ids = []
        adv_map = {}
        upload_list = []
        export_map = {}
        sql = f"""
            select
                sc.conf_name,
                kg.`KG_config_id` as kgconfid
            from
                search_config sc
                join knowledge_graph kg on kg.id = sc.kg_id
            where
                kg.KG_config_id in (
                    select graph_id
                    from network_graph_relation
                    where knw_id = {knw_id}
                )"""
        Logger.log_info(sql)
        conf_df = pd.read_sql(sql, connection)
        conf_list = conf_df.to_dict('records')
        for conf_row in conf_list:
            conf_name = conf_row['conf_name']
            kgconfid = conf_row['kgconfid']
            if conf_name:
                advconf = True
                adv_map[kgconfid] = advconf
        sql = f"""
            select
                gc.id,
                graph_db.type
            from
                graph_config_table gc
                left join graph_db on gc.graph_db_id = graph_db.id
            where
                gc.id in (
                    select graph_id
                    from network_graph_relation
                    where knw_id = {knw_id}
                )"""
        Logger.log_info(sql)
        export_df = pd.read_sql(sql, connection)
        export_res = export_df.to_dict('records')
        for export_row in export_res:
            graph_id = export_row['id']
            graph_db_type = export_row['type']
            export_map[graph_id] = graph_db_type
        for index, row in enumerate(rec_list):
            export = False
            KG_config_id = row['kgconfid']
            taskstatus = row['taskstatus']
            graph_db_type = export_map[KG_config_id]
            if taskstatus == 'normal' and graph_db_type == 'nebula':
                export = True
            rec_list[index]['export'] = export
            otl_id_list = eval(row['graph_otl'])
            otl_id = otl_id_list[0] if otl_id_list else None
            if otl_id:
                otl_ids.append(otl_id)
            is_import = True if row['is_upload'] else False
            advconf = adv_map.get(KG_config_id, False)
            display_task = False if row['is_upload'] and taskstatus == None else True
            rec_list[index]['display_task'] = display_task
            rec_list[index]['advConf'] = advconf
            rec_list[index]['is_import'] = is_import
            is_upload = False
            rec_list[index]['is_upload'] = is_upload
            graph_baseInfo = eval(row['graph_baseInfo'])
            kgDesc = ""
            if graph_baseInfo:
                kgDesc = graph_baseInfo[0]['graph_des']
            rec_list[index]['kgDesc'] = kgDesc
            rec_list[index]['otl_id'] = otl_id
        asModel = False
        if otl_ids:
            otl_ids = list(set(otl_ids))
            otl_ids = ",".join(map(str, otl_ids))
            sql = f"""select id,entity, edge from ontology_table where id in ({otl_ids})"""
            Logger.log_info(sql)
            otl_df = pd.read_sql(sql, connection)
            otl_list = otl_df.to_dict('records')
            for row in otl_list:
                entity = eval(row['entity'])
                if entity:
                    entity = entity[0]
                    if entity["model"] == "Anysharedocumentmodel" and entity["name"] == "document":
                        asModel = True
                otl_id = row['id']
                otl_map[otl_id] = asModel
        for index, row in enumerate(rec_list):
            rec_list[index]['asModel'] = asModel
            rec_list[index]['knowledge_type'] = "kg"
            graph_otl = eval(row['graph_otl'])
            if graph_otl:
                otl_id = graph_otl[0]
                asModel = otl_map[otl_id] if otl_id in otl_map else False
                rec_list[index]['asModel'] = asModel
        for index, row in enumerate(rec_list):
            del rec_list[index]['graph_baseInfo']
            del rec_list[index]['graph_otl']
        return rec_list

    # 根据知识网络ID查找关系表
    @connect_execute_close_db
    def get_relation(self, knw_id, connection, cursor):
        sql = """select id from network_graph_relation where knw_id=%s;""" % knw_id
        df = pd.read_sql(sql, connection)
        return df

    # 增加网络与图谱关系
    @connect_execute_commit_close_db
    def insert_graph_relation(self, knw_id, graph_id, connection, cursor):
        sql = """INSERT INTO network_graph_relation (knw_id, graph_id) VALUES (%s,%s)""" % (knw_id, graph_id)
        cursor.execute(sql)
        new_id = cursor.lastrowid
        return new_id

    # 删除网络与图谱关系
    @connect_execute_commit_close_db
    def delete_graph_relation(self, knw_id, graph_ids, connection, cursor):
        sql = """delete from network_graph_relation where knw_id=%s and graph_id in (%s)""" % (
            knw_id, ",".join(map(str, graph_ids)))
        cursor.execute(sql)
        new_id = cursor.lastrowid
        return new_id

    # 更新知识网络
    @connect_execute_commit_close_db
    def update_knw(self, graph_id, connection, cursor):
        values_list = [arrow.now().format('YYYY-MM-DD HH:mm:ss'),
                       graph_id]
        sql = """
                update knowledge_network set update_time=%s where id=
                (select knw_id from network_graph_relation where graph_id=%s);
            """
        cursor.execute(sql, values_list)
        update_id = cursor.lastrowid
        return update_id

    # 查询知识网络id
    @connect_execute_commit_close_db
    def check_knw_id(self, knw_id, connection, cursor):
        sql = f"""select id from knowledge_network where id = {knw_id}"""
        df = pd.read_sql(sql, connection)
        return df

    # 查询知识网络id和图谱
    @connect_execute_commit_close_db
    def check_knw_graph(self, knw_id, graph_ids, connection, cursor):
        graph_ids = ",".join(map(str, graph_ids))
        sql = f"""select id from network_graph_relation where knw_id = {knw_id} and graph_id in ({graph_ids})"""
        df = pd.read_sql(sql, connection)
        return df

    @connect_execute_close_db
    def get_count(self, knw_name, connection, cursor):
        sql = """
                  SELECT id FROM knowledge_network where knw_name like {0};
                        """
        knw_name = "'%" + knw_name + "%'"
        sql = sql.format(knw_name)
        print(sql)
        Logger.log_info(sql)
        df = pd.read_sql(sql, connection)
        return df

    @connect_execute_close_db
    def get_graph_by_knw_id(self, knw_id, connection, cursor):
        sql = """
        SELECT graph_id FROM network_graph_relation WHERE knw_id={0}
        """
        sql = sql.format(knw_id)
        df = pd.read_sql(sql, connection)
        return df

    @connect_execute_close_db
    def get_knw_id_by_graph_id(self, graph_id, connection, cursor):
        """
        根据图谱id，获取知识网络id
        :param graph_id:  图谱id
        :return: -1 图谱不存在  id
        """
        sql = """
            SELECT knw_id FROM network_graph_relation WHERE graph_id={0}
            """
        sql = sql.format(graph_id)
        df = pd.read_sql(sql, connection)
        df = df.to_dict(orient="records")
        if len(df) > 0:
            return df[0]["knw_id"]
        else:
            return -1


knw_dao = knwDao()
