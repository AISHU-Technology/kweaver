import uuid
import arrow
import rdsdriver
from utils.my_pymysql_pool import connect_execute_close_db, connect_execute_commit_close_db
from utils.log_info import Logger


class knwDao:
    # 新增知识网络
    @connect_execute_commit_close_db
    def insert_knowledgeNetwork(self, params_json, cursor, connection):
        Logger.log_info("entry in save")
        # create_by = request.headers.get("userId")  # 创建者id
        create_by = ""
        values_list = []
        values_list.append(params_json["knw_name"])
        if "knw_des" not in params_json.keys():
            values_list.append("")
        else:
            values_list.append(params_json["knw_des"])
        values_list.append(params_json["knw_color"])
        values_list.append(create_by)
        values_list.append(create_by)
        values_list.append(arrow.now().format('YYYY-MM-DD HH:mm:ss'))
        values_list.append(arrow.now().format('YYYY-MM-DD HH:mm:ss'))
        identify_id = str(uuid.uuid1())
        values_list.append(identify_id)
        values_list.append(params_json.get('to_be_uploaded', 0))

        values_list.append(params_json["knw_name"])

        Logger.log_info(values_list)

        sql = """
                INSERT INTO knowledge_network (knw_name, knw_description, color, create_by, update_by, 
                create_time, update_time, identify_id, to_be_uploaded) SELECT %s, %s, %s, %s, %s, %s, %s, %s, %s
                WHERE NOT EXISTS (SELECT id from knowledge_network where knw_name=%s)
                """
        Logger.log_info(sql % tuple(values_list))
        cursor.execute(sql, values_list)
        new_id = rdsdriver.process_last_row_id(cursor.lastrowid)
        return new_id

    # 分页查询知识网络,knw_name为”“时查询全部
    @connect_execute_close_db
    def get_knw_by_name(self, knw_name, page, size, order, rule, knw_ids, connection, cursor):
        if len(knw_ids) == 0:
            knw_ids = "select id from knowledge_network"
        else:
            knw_ids = ",".join(map(str, knw_ids)) if knw_ids else 'null'

        # sql = """
        #             select knw.*, a1.username AS creator_name, a2.username AS operator_name,
        #                 case
        #                     when intelligence_score<0 then 1
        #                     when isnull(intelligence_score)=1 then 1
        #                     else 0
        #                 end  group_column
        #             from knowledge_network knw
        #             left join account a1 on a1.account_id=create_by
        #             left join account a2 on a2.account_id=update_by
        #             where knw.id in ({})
        #         """.format(knw_ids)

        sql = """
                    select knw.*,
                        case 
                            when intelligence_score<0 then 1
                            when isnull(intelligence_score)=1 then 1
                            else 0
                        end  group_column 
                    from knowledge_network knw
                    where knw.id in ({})
                """.format(knw_ids)

        order = 'desc' if order == 'desc' else 'asc'

        if knw_name:
            sql += f""" and knw_name like %s """

        if rule:
            if rule == 'intelligence_score':
                sql += f""" order by group_column asc, intelligence_score {order}, update_time desc """
            else:
                sql += f""" order by {rule} {order}"""
        else:
            sql += f"""  order by update_time desc """

        sql += f""" limit {page * size},{size}"""
        Logger.log_info(sql)
        if knw_name:
            knw_name = "%" + knw_name + "%"
            cursor.execute(sql, knw_name)
        else:
            cursor.execute(sql)
        res = cursor.fetchall()
        return res

    # 编辑知识网络
    @connect_execute_commit_close_db
    def edit_knw(self, params_json, cursor, connection):
        # operator_id = request.headers.get("userId")
        operator_id = ""
        values_list = []
        values_list.append(params_json["knw_name"])
        if "knw_des" not in params_json.keys():
            values_list.append("")
        else:
            values_list.append(params_json["knw_des"])
        values_list.append(params_json["knw_color"])
        values_list.append(operator_id)
        values_list.append(arrow.now().format('YYYY-MM-DD HH:mm:ss'))
        to_be_uploaded_sql = ''
        if params_json.get('to_be_uploaded') in [0, 1]:
            to_be_uploaded_sql = ', to_be_uploaded=%s '
            values_list.append(params_json.get('to_be_uploaded'))

        values_list.append(params_json["knw_id"])

        sql = "UPDATE knowledge_network " \
              "SET knw_name=%s, " \
                    "knw_description=%s, " \
                    "color=%s, " \
                    "update_by=%s, " \
                    "update_time=%s " \
                    f"{to_be_uploaded_sql}" \
              "WHERE id=%s "
        Logger.log_info(sql % tuple(values_list))
        cursor.execute(sql, values_list)
        update_id = rdsdriver.process_last_row_id(cursor.lastrowid)
        return update_id

    # 删除知识网络
    @connect_execute_commit_close_db
    def delete_knw(self, knw_id, cursor, connection):
        sql = """DELETE FROM knowledge_network WHERE id=%s;""" % knw_id
        Logger.log_info(sql)
        cursor.execute(sql)
        new_id = rdsdriver.process_last_row_id(cursor.lastrowid)
        return new_id

    # 根据ID查找知识网络
    @connect_execute_close_db
    def get_knw_by_id(self, knw_id, cursor, connection):
        sql = """SELECT * FROM knowledge_network WHERE id = %s""" % knw_id
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    # 根据ID查找知识网络
    @connect_execute_close_db
    def get_knw_by_identify_id(self, identify_id, cursor, connection):
        sql = """
        SELECT * FROM knowledge_network WHERE identify_id = '{}';
        """
        sql = sql.format(identify_id)
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    # 根据知识网络名称查找ID
    @connect_execute_close_db
    def get_id_by_name(self, knowledgeNetwork_name, connection, cursor):
        sql = """SELECT id FROM knowledge_network WHERE knw_name=%s;"""
        Logger.log_info(sql % knowledgeNetwork_name)
        cursor.execute(sql, knowledgeNetwork_name)
        res = cursor.fetchall()
        return res

    # 根据图谱ID反查对应的知识网络ID
    @connect_execute_close_db
    def get_ids_by_graph(self, graph_ids, connection, cursor):
        sql = """
                 SELECT knw_id FROM graph_config_table WHERE id in ({}) group by knw_id;
                 """
        sql = sql.format(",".join(map(str, graph_ids)))
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    # 根据创建者userId查找知识网络
    @connect_execute_close_db
    def get_knw_by_uuid(self, connection, cursor):
        # userId = request.headers.get("userId")
        userId = ""
        sql = """
                SELECT * FROM knowledge_network WHERE create_by=%s;        
                """
        Logger.log_info(sql % userId)
        cursor.execute(sql, [userId])
        res = cursor.fetchall()
        return res

    # 根据知识网络ID查询全部知识图谱
    @connect_execute_close_db
    def get_all_graph(self, knw_id, graph_ids, graph_name, filter, connection, cursor):
        if graph_ids is None:
            limit_str = " "
        elif len(graph_ids) > 0:
            graph_ids = ",".join(map(str, graph_ids))
            limit_str = f" and gc.id in ({graph_ids}) "
        join_str = ""
        knw_limit_str = " " if knw_id == "-1" else f" and gc.knw_id = {knw_id} "
        if filter == 'upload' or filter == 'export':
            join_str = "join graph_task_table gtt on gc.id = gtt.graph_id "
            limit_str += " and gtt.task_status = 'normal' " \
                         " and gc.step_num >= 4"
        elif filter == 'running_success':
            join_str = " join graph_task_history_table gtht on gc.id = gtht.graph_id "
            limit_str += " and gtht.task_status='normal' "
        sql = f"""
                select
                    distinct gc.id
                from
                    graph_config_table gc
                    {join_str}
                where
                    gc.graph_name like %s
                    {knw_limit_str}
                    {limit_str} """
        Logger.log_info(sql)
        cursor.execute(sql, '%' + graph_name + '%')
        rec_list = cursor.fetchall()
        rec_list_new = []
        for index, row in enumerate(rec_list):
            rec_list_new.append(rec_list[index])
        return rec_list_new

    # 根据知识网络ID分页查询知识图谱
    @connect_execute_close_db
    def get_graph_by_knw(self, knw_id, graph_ids, page, size, order_type, graph_name, rule, filter,
                         connection, cursor):
        if graph_ids is None:
            limit_str = " "
        elif len(graph_ids) > 0:
            graph_ids = ",".join(map(str, graph_ids))
            limit_str = f" and gc.id in ({graph_ids}) "
        join_str = ""
        knw_limit_str = " " if knw_id == "-1" else f" and gc.knw_id = {knw_id} "
        if filter == 'upload' or filter == 'export':
            limit_str += " and gt.task_status = 'normal'" \
                         " and gc.step_num >= 4"
        elif filter == 'running_success':
            join_str = " left join graph_task_history_table gtht on gc.id = gtht.graph_id "
            limit_str += " and gtht.task_status='normal' "
        sql = f"""
            select
                distinct gc.`id`,
                gc.`graph_name` as `name`,
                gc.`status`,
                gc.`KDB_name` as `graph_db_name`,
                gt.`task_status` as `taskstatus`,
                gc.`graph_baseInfo`,
                gc.`is_upload`,
                gc.`rabbitmq_ds` as `rabbitmqDs`,
                gc.`create_time`,
                gc.`update_time` as `updateTime`,
--                     a1.`username` as `createUser`,
--                     a2.`username` as `updateUser`,
                gc.graph_otl,
                gc.step_num,
                gc.knw_id
            from
                graph_config_table gc
                LEFT JOIN graph_task_table gt ON gc.id = gt.graph_id
--                     LEFT JOIN account a1 ON a1.account_id = gc.create_by
--                     LEFT JOIN account a2 ON a2.account_id = gc.update_by
                {join_str}
            where
                gc.graph_name like %s
                {knw_limit_str}
                {limit_str}
            ORDER BY
                gc.{rule} {order_type}
            limit
                {page * size}, {size};"""
        Logger.log_info(sql)
        cursor.execute(sql, '%' + graph_name + '%')
        rec_list = cursor.fetchall()
        otl_ids = []
        rec_list_new = []
        for index, row in enumerate(rec_list):
            export = False
            taskstatus = row['taskstatus']
            if taskstatus == 'normal':
                export = True
            rec_list[index]['export'] = export
            otl_id = row['graph_otl']
            if otl_id:
                otl_ids.append(otl_id)
            is_import = True if row['is_upload'] else False
            rec_list[index]['is_import'] = is_import
            rec_list[index].pop('is_upload')
            graph_baseInfo = eval(row['graph_baseInfo'].replace('\n', '\\n'))
            kgDesc = ""
            graph_db_name = ""
            if graph_baseInfo:
                kgDesc = graph_baseInfo['graph_des']
                graph_db_name = graph_baseInfo['graph_DBName']
            rec_list[index]['kgDesc'] = kgDesc
            rec_list[index]['graph_db_name'] = graph_db_name
            rec_list[index]['otl_id'] = otl_id
            rec_list_new.append(rec_list[index])
        rec_list = rec_list_new
        for index, row in enumerate(rec_list):
            rec_list[index]['knowledge_type'] = "kg"
            del rec_list[index]['graph_baseInfo']
            del rec_list[index]['graph_otl']
        return rec_list

    # 根据知识网络ID查找其创建者
    @connect_execute_close_db
    def get_creator(self, knw_id, connection, cursor):
        sql = """select create_by from knowledge_network where id={};"""
        sql = sql.format(knw_id)
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    # 根据知识网络ID查找关系表
    @connect_execute_close_db
    def get_relation(self, knw_id, connection, cursor):
        sql = """select id from graph_config_table where knw_id=%s;""" % knw_id
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    # 更新知识网络
    @connect_execute_commit_close_db
    def update_knw(self, graph_id, connection, cursor):
        # userId = request.headers.get("userId")
        userId = ""
        values_list = [userId,
                       arrow.now().format('YYYY-MM-DD HH:mm:ss'),
                       graph_id]
        sql = """
                update knowledge_network set update_by=%s ,update_time=%s where id=
                (select knw_id from graph_config_table where id=%s);
            """
        Logger.log_info(sql % tuple(values_list))
        cursor.execute(sql, values_list)
        update_id = rdsdriver.process_last_row_id(cursor.lastrowid)
        return update_id

    # 查询知识网络id
    @connect_execute_commit_close_db
    def check_knw_id(self, knw_id, connection, cursor):
        sql = f"""select id from knowledge_network where id = {knw_id}"""
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    # 查询知识网络id和图谱
    @connect_execute_commit_close_db
    def check_knw_graph(self, knw_id, graph_ids, connection, cursor):
        graph_ids = ",".join(map(str, graph_ids))
        sql = f"""select id from graph_config_table where knw_id = {knw_id} and id in ({graph_ids})"""
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    @connect_execute_close_db
    def get_count(self, knw_name, knw_ids, connection, cursor):
        condition = ""
        if len(knw_ids) > 0:
            condition = " and id in ({})".format(",".join(map(str, knw_ids)))
        knw_name = "%" + knw_name + "%"
        sql = f"""SELECT id FROM knowledge_network where knw_name like %s""" + condition + """;"""
        Logger.log_info(sql % knw_name)
        cursor.execute(sql, knw_name)
        res = cursor.fetchall()
        return res

    @connect_execute_close_db
    def get_graph_count(self, knw_id, knw_name, graph_ids, connection, cursor):
        knw_name = "%" + knw_name + "%"
        graph_ids = ','.join(
            [str(graph_id) for graph_id in graph_ids]) if graph_ids else "select id from graph_config_table"
        sql = f"""
                    SELECT id FROM graph_config_table 
                        where graph_name like %s 
                        and knw_id = {knw_id} 
                        and id in ({graph_ids})
                """
        Logger.log_info(sql % knw_name)
        cursor.execute(sql, knw_name)
        res = cursor.fetchall()
        return res

    @connect_execute_close_db
    def get_graph_by_knw_id(self, knw_id, connection, cursor):
        sql = """
        SELECT id as graph_id FROM graph_config_table WHERE knw_id={0}
        """
        sql = sql.format(knw_id)
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    @connect_execute_close_db
    def get_knw_id_by_graph_id(self, graph_id, connection, cursor):
        """
        根据图谱id，获取知识网络id
        :param graph_id:  图谱id
        :return: -1 图谱不存在  id
        """
        sql = """
            SELECT knw_id FROM graph_config_table WHERE id={0}
            """
        sql = sql.format(graph_id)
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        if len(res) > 0:
            return res[0]["knw_id"]
        else:
            return -1

    @connect_execute_close_db
    def get_id_by_lexicon(self, lexicon_ids, connection, cursor):
        lexicon_ids = [str(lexicon_id) for lexicon_id in lexicon_ids]
        sql = """
                select distinct knowledge_id from lexicon where id in ({});
            """.format(','.join(lexicon_ids))
        Logger.log_info(sql)
        cursor.execute(sql)
        return cursor.fetchall()

    @connect_execute_close_db
    def get_id_by_ds(self, ds_ids, connection, cursor):
        ds_ids = [str(ds_id) for ds_id in ds_ids]
        sql = """
                select distinct knw_id from data_source_table where id in ({});
            """.format(','.join(ds_ids))
        Logger.log_info(sql)
        cursor.execute(sql)
        return cursor.fetchall()

    @connect_execute_close_db
    def get_graph_ids_by_knw(self, knw_ids, connection, cursor):
        knw_ids = [str(knw_id) for knw_id in knw_ids]
        sql = """
                select distinct id as graph_id from graph_config_table where knw_id in ({});
            """.format(','.join(knw_ids))
        Logger.log_info(sql)
        cursor.execute(sql)
        return cursor.fetchall()

    @connect_execute_close_db
    def get_count_by_ids(self, knw_ids, connection, cursor):
        sql = """select id from knowledge_network where id in ({});""".format(','.join(knw_ids))
        Logger.log_info(sql)
        cursor.execute(sql)
        return len(cursor.fetchall())

    @connect_execute_close_db
    def get_knw_by_ids(self, knw_ids, page, size, connection, cursor):
        # sql = """
        #     select kn.id, kn.color, kn.create_time create_time, kn.identify_id, kn.intelligence_score,
        #         kn.knw_description, kn.knw_name, kn.update_time, a1.username create_by, a2.username update_by
        #     from knowledge_network kn
        #     left join account a1 on kn.create_by = a1.account_id
        #     left join account a2 on kn.update_by = a2.account_id
        #     where kn.id in ({})
        #     limit {}, {}
        #     """.format(','.join(knw_ids), str((int(page) - 1) * int(size)), size)
        sql = """
            select kn.id, kn.color, kn.create_time create_time, kn.identify_id, kn.intelligence_score, 
                kn.knw_description, kn.knw_name, kn.update_time 
            from knowledge_network kn 
            where kn.id in ({}) 
            limit {}, {}
            """.format(','.join(knw_ids), str((int(page) - 1) * int(size)), size)
        Logger.log_info(sql)
        cursor.execute(sql)
        return cursor.fetchall()


knw_dao = knwDao()
