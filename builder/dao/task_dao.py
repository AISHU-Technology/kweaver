# -*-coding:utf-8-*-
# @Time    : 2020/11/2 13:54
# @Author  : Lowe.li
# @Email   : Lowe.li@aishu.cn
from utils.my_pymysql_pool import connect_execute_commit_close_db, connect_execute_close_db
import arrow
import pandas as pd
import datetime
import configparser
import redis
from utils.log_info import Logger
import json
from utils.CommonUtil import commonutil
from utils.ConnectUtil import redisConnect
from utils.log_info import Logger
from common.errorcode import codes


class TaskDao(object):
    # 初始化redis

    # 初始化redis中graph_count
    def init_graph_count(self):
        try:
            db = "0"
            r = redisConnect.connect_redis(db, model="read")
            # 刚启动时，没有redis还没有graph_count，初始化为0
            if r.get(b"graph_count"):
                count = {"entities": 0, "edges": 0, "pro": 0, "all": 0}
                r.set("graph_count", json.dumps(count))
        except Exception as e:
            err = repr(e)
            if "service not known" in err:
                print("service not known!")
            elif "No route to host" in err:
                print("No route to host!")
            elif "DB index is out of range" in err:
                print("DB index is out of range!")
            else:
                print("redis is down!-6")

    def initredis(self):
        try:
            # pool = redis.ConnectionPool(host=celeryconfig.redis_add, port=celeryconfig.redis_port, db=2)
            r = redisConnect.connect_redis(db=2, model="read")
            w = redisConnect.connect_redis(db=2, model="write")
            df = task_dao.getCount()
            # 获得任务列表中的所有task_id
            df_taskid = df["task_id"]
            df_taskid_list = df_taskid.values.tolist()
            for taskid in df_taskid_list:
                key = "celery-task-meta-" + taskid
                data = r.get(key)
                data = data.decode("utf-8")
                redisdata = json.loads(data)
                status = redisdata["status"]
                task_id = redisdata["task_id"]
                k_v = "celery-task-meta-" + task_id
                from datetime import datetime
                utc_time = datetime.utcnow().isoformat()
                va = {
                    "status": "REVOKED",
                    "result": {
                        "current": "builder server restart and stop task"
                    },
                    "traceback": "null",
                    "children": [],
                    "date_done": utc_time,
                    "task_id": task_id
                }
                status_diy = ["graph_baseInfo", "graph_ds", "graph_otl", "graph_InfoExt", "graph_KMap", "graph_KMerge",
                              "PENDING", "RUNNING"]
                if status in status_diy:
                    w.set(k_v, json.dumps(va).encode())
        except Exception as e:
            err = repr(e)
            if "service not known" in err:
                print("service not known!")
            elif "No route to host" in err:
                print("No route to host!")
            elif "DB index is out of range" in err:
                print("DB index is out of range!")
            else:
                print("redis is down!-7")

    # 遍历redis 获得任务的信息，供定时刷新用
    def gettaskall(self, df_taskid_list):
        try:
            r = redisConnect.connect_redis(model="read", db=2)
            # keys = r.keys()

            task_id = []
            status = []
            date_done_list = []
            result = []
            all_res = []
            # for i in keys:
            #     key = i.decode("utf-8")
            #     taskid_key = key.split("celery-task-meta-")
            if len(df_taskid_list) != 0:
                for taskid in df_taskid_list:
                    key = "celery-task-meta-" + str(taskid)
                    data = r.get(key)
                    if data != None:
                        data = data.decode("utf-8")
                        redisdata = json.loads(data)
                        task_id.append(redisdata["task_id"])
                        status.append(redisdata["status"])
                        date_done = redisdata["date_done"]
                        if date_done is None or date_done == "null":
                            end_time = "None"
                        else:
                            date_done = date_done.split(".")[0]
                            UTC_FORMAT = "%Y-%m-%dT%H:%M:%S"
                            utcTime = datetime.datetime.strptime(date_done, UTC_FORMAT)
                            end_time = utcTime + datetime.timedelta(hours=8)
                        date_done_list.append(str(end_time))
                        redisdata["date_done"] = str(end_time)
                        result.append(redisdata["result"])
                        all_res.append(redisdata)

            df = pd.DataFrame({"task_id": task_id, "status": status, "date_done": date_done_list,
                               "result": result, "all_res": all_res})
            return "200", df
        except Exception as e:
            err = repr(e)
            print(err)
            if "No route to host" in err:
                return "400", "No route to host!"
            elif "service not known" in err:
                return "400", "service not known!"
            elif "DB index is out of range" in err:
                return "400", "DB index is out of range!"
            else:
                return "400", str(err) + "1"

    def getstatusbytaskid(self, taskid):
        try:
            r = redisConnect.connect_redis(db=2, model="read")
            # keys = r.keys()
            status = ""
            # for i in keys:
            #     key = i.decode("utf-8")
            #     if taskid in key:
            key = "celery-task-meta-" + str(taskid)
            data = r.get(key)
            if data != None:
                data = data.decode("utf-8")
                redisdata = json.loads(data)
                status = redisdata["status"]
            return status
        except Exception as e:
            err = repr(e)
            print(err)
            if "No route to host" in err:
                return "400", "No route to host!"
            elif "service not known" in err:
                return "400", "service not known!"
            elif "DB index is out of range" in err:
                return "400", "DB index is out of range!"
            else:
                return "400", str(err) + "2"

    def getredisbytaskid(self, taskid):
        try:
            r = redisConnect.connect_redis(db=2, model="read")
            # keys = r.keys()
            redisdata = {}
            # for i in keys:
            #     key = i.decode("utf-8")
            #     if taskid in key:
            key = "celery-task-meta-" + str(taskid)
            data = r.get(key)
            data = data.decode("utf-8")
            redisdata = json.loads(data)
            return redisdata
        except Exception as e:
            err = repr(e)
            print(err)
            if "No route to host" in err:
                return "400", "No route to host!"
            elif "service not known" in err:
                return "400", "service not known!"
            elif "DB index is out of range" in err:
                return "400", "DB index is out of range!"
            else:
                return "400", str(err) + "3"

    # 获取根据状态
    @connect_execute_close_db
    def getCountbystatus(self, task_status, graph_name, connection, cursor, ):
        # 默认
        sql = """
                     SELECT * FROM graph_task_table where task_status = {0};
                     """
        if task_status != "all":
            sql = """
                     SELECT * FROM graph_task_table where task_status = {0};
                     """

        status = '"' + task_status + '"'
        sql = sql.format(status)
        df = pd.read_sql(sql, connection)
        return len(df)

    # 根据图谱id获得历史数据分页排序
    @connect_execute_close_db
    def gethistortdata(self, graph_id, page, size, order, task_type, trigger_type, task_status, connection, cursor):
        limit_str = ""
        if task_status != 'all':
            limit_str += f" and task_status='{task_status}'"
        if trigger_type != 'all':
            limit_str += f" and trigger_type='{trigger_type}'"
        if task_type != 'all':
            limit_str += f" and task_type='{task_type}'"
        sql = """
            SELECT *
            FROM graph_task_history_table
            where
              graph_id = {0}
              {3}
            order by start_time Desc
            limit {1}, {2};"""
        if order == "descend":
            sql = """
                SELECT *
                FROM graph_task_history_table
                where
                  graph_id = {0}
                  {3}
                order by start_time asc
                limit {1}, {2};"""
        status = '"' + graph_id + '"'
        sql = sql.format(status, page * size, size, limit_str)
        Logger.log_info(sql)
        df = pd.read_sql(sql, connection)
        return df

    # 根据状态排序
    @connect_execute_close_db
    def getallbystatus(self, task_status, page, size, order, connection, cursor):
        sql = """
                   SELECT * FROM graph_task_table  where task_status = {0}  order by create_time  Desc limit {1}, {2};
                   """
        if order == "descend":
            sql = """
              SELECT * FROM graph_task_table  where task_status = {0}  order by create_time  asc limit {1}, {2};

                    """
        # user = '"' + user + '"'
        status = '"' + task_status + '"'
        sql = sql.format(status, page * size, size)
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

    @connect_execute_close_db
    def getFulltextEnginebyId(self, fulltext_id, connection, cursor):
        sql = """
                     SELECT * FROM fulltext_engine where id = %s;
                      """ % (fulltext_id)
        df = pd.read_sql(sql, connection)
        return df

    # 根据任务id 获得任务
    @connect_execute_close_db
    def getbystatusid(self, id, connection, cursor, ):
        sql = """SELECT * FROM graph_task_table where task_id = %s""" % ('"' + id + '"')
        # sql = sql.format()
        df = pd.read_sql(sql, connection)
        # data=df.to_dict()
        return df

    # 根据任务id 获得图谱数据
    @connect_execute_close_db
    def get_count_by_task_id(self, task_id, connection, cursor, ):
        sql = """SELECT * FROM graph_task_history_table where task_id = %s""" % ('"' + task_id + '"')
        df = pd.read_sql(sql, connection)
        return df

    # 根据图谱id 获得图谱数量
    @connect_execute_close_db
    def getgraphcountbyid(self, graph_id, connection, cursor):
        sql = """SELECT id FROM graph_config_table where id = %s""" % (graph_id)
        # sql = """SELECT id FROM graph_task_table where graph_id = %s""" % (graph_id)
        df = pd.read_sql(sql, connection)
        return df
        # 根据图谱id 获得图谱数量

    @connect_execute_close_db
    def getgraphnamebyid(self, graph_id, connection, cursor):
        sql = """SELECT graph_name FROM graph_config_table where id = %s""" % (graph_id)
        df = pd.read_sql(sql, connection)
        return df

    @connect_execute_close_db
    def gettaskbyid(self, id, connection, cursor):
        sql = """
            SELECT *
            FROM graph_task_table
            where graph_id = %s""" % (id)
        df = pd.read_sql(sql, connection)
        return df

     # 根据图谱id获得历史数据
    @connect_execute_close_db
    def gethistortbytaskid(self, task_id, connection, cursor, ):
        sql = """SELECT id FROM graph_task_history_table where task_id = %s""" % ('"' + task_id + '"')
        # sql = sql.format()
        df = pd.read_sql(sql, connection)
        # data=df.to_dict()
        return df

    @connect_execute_close_db
    def gethistortbytime(self, task_id, endtime, connection, cursor, ):
        sql = """SELECT id FROM graph_task_history_table where task_id = %s and end_time = %s """ % (
            '"' + task_id + '"', '"' + endtime + '"')
        # sql = sql.format()
        df = pd.read_sql(sql, connection)
        # data=df.to_dict()
        return df

    @connect_execute_close_db
    def gettaskupdata(self, task_id, task_status, connection, cursor, ):
        sql = """SELECT id FROM graph_task_table where task_id = %s and task_status = %s """ % (
            '"' + task_id + '"', '"' + task_status + '"')
        # sql = sql.format()
        df = pd.read_sql(sql, connection)
        # data=df.to_dict()
        return df

    # 根据图谱id获得历史数据
    @connect_execute_close_db
    def gethistorttaskbyid(self, id, task_type, trigger_type, task_status, connection, cursor, ):
        sql = """SELECT id FROM graph_task_history_table where graph_id = %s""" % ('"' + id + '"')
        if task_status != 'all':
            sql += f" and task_status='{task_status}'"
        if trigger_type != 'all':
            sql += f" and trigger_type='{trigger_type}'"
        if task_type != 'all':
            sql += f" and task_type='{task_type}'"
        # sql = sql.format()
        df = pd.read_sql(sql, connection)
        # data=df.to_dict()
        return df

    # 删除任务列表
    @connect_execute_commit_close_db
    def deletetask(self, task_id, graph_id, connection, cursor):
        if task_id:
            limit_str = f"task_id= '{task_id}' and graph_id={graph_id}"
        else:
            limit_str = f"graph_id={graph_id}"
        sql = f"""DELETE FROM graph_task_table WHERE {limit_str}"""
        cursor.execute(sql)
        new_id = cursor.lastrowid
        return new_id

    @connect_execute_commit_close_db
    def deletehistorytask(self, task_ids, graph_id, connection, cursor):
        print(task_ids)
        print(type(task_ids))
        task_ids = ','.join("'{0}'".format(x) for x in task_ids)
        sql = f"""DELETE FROM graph_task_history_table WHERE task_id in ({task_ids}) and graph_id={graph_id}"""
        print(sql)
        cursor.execute(sql)
        new_id = cursor.lastrowid
        return new_id

    # 根据图谱id 获得图谱数据库信息
    @connect_execute_close_db
    def geKGDBbyid(self, graph_id, connection, cursor):
        from service.graph_Service import graph_Service

        ret_code, obj = graph_Service.getGraphById(graph_id)
        return obj["res"]

    def getotlnum(self, graph_otl):
        graph_otl = graph_otl[0]
        resdict = {}
        resdict["propertynums"] = []
        entitypronum = 0
        edgepronum = 0
        # resdict["edgepropertynums"] = 0
        # 遍历每条 dict
        for key in graph_otl:
            value = graph_otl[key]
            if key == "entity":
                # value = eval(value)
                entitynums = len(value)
                resdict["entitynums"] = entitynums
                if entitynums == 0:
                    entitypronum = 0 + entitypronum
                else:
                    # 遍历属性dict
                    for property in value:
                        for property_key in property:
                            if property_key == "properties":
                                p_v = property[property_key]
                                # property_value = eval(property[property_key])
                                propertynums = len(p_v)
                                entitypronum = propertynums + entitypronum

            if key == "edge":
                edgenums = len(value)
                resdict["edgenums"] = len(value)
                # value = eval(value)
                if edgenums == 0:
                    edgepronum = 0 + edgepronum
                else:
                    # 遍历属性dict
                    for property in value:
                        for property_key in property:
                            if property_key == "properties":
                                p_v = property[property_key]
                                # property_value = eval(property[property_key])
                                propertynums = len(p_v)
                                edgepronum = propertynums + edgepronum
            resdict["propertynums"] = [entitypronum, edgepronum]
        return resdict

    @connect_execute_commit_close_db
    def addtaskerr(self, params_json, status, error_report, connection, cursor):
        values_list = []
        task_id = params_json["task_id"]
        values_list.append(params_json["graph_id"])
        values_list.append(params_json["graph_name"])
        values_list.append(params_json["task_id"])
        values_list.append(status)
        values_list.append(params_json["create_time"])
        # values_list.append(params_json["user_email"])
        values_list.append(str(error_report))
        values_list.append(params_json.get("task_type", ""))
        values_list.append(params_json.get("trigger_type", 0))
        sql = """INSERT INTO graph_task_table (graph_id, graph_name, task_id, task_status,create_time,
                  error_report,task_type,trigger_type) VALUES(%s,%s,%s,%s,%s,%s,%s,%s)"""
        cursor.execute(sql, values_list)
        new_id = cursor.lastrowid
        values_list = [status, str(error_report), task_id]
        sql = """UPDATE graph_task_history_table SET task_status=%s,error_report=%s where task_id = %s"""
        cursor.execute(sql, values_list)
        return new_id

    # 任务管理详细能不能查看
    def taskdetail(self, graph_id):
        from service.graph_Service import graph_Service
        ret_code, obj = graph_Service.getGraphById(graph_id)
        res = obj["res"]
        graph_baseInfo = res["graph_baseInfo"]
        graph_DBName = ''
        graph_db_id = 0
        for baseInfo in graph_baseInfo:
            graph_DBName = baseInfo["graph_DBName"]
            graph_db_id = baseInfo["graph_db_id"]
        from dao.graphdb_dao import GraphDB
        graphdb = GraphDB(graph_db_id)
        code, countres = graphdb.count(graph_DBName)
        if code != codes.successCode:
            return False
        edges, entities, name2count, _, _, edge2pros, entity2pros = countres
        if entities > 0:
            return True
        return False

    # 更新总任务记录
    @connect_execute_commit_close_db
    def update_history(self, graph_id, task_data, connection, cursor):
        values_list = []
        values_list.append(task_data["end_time"])
        # 实体数量
        # 图谱数量
        # 总数
        values_list.append(100)
        res = self.geKGDBbyid(graph_id)
        graph_baseInfo = res["graph_baseInfo"]
        graph_otl = res["graph_otl"]
        resdict = self.getotlnum(graph_otl)
        otl_en_num = resdict["entitynums"]
        edgenums = resdict["edgenums"]
        propertynums = resdict["propertynums"]
        entity_pro_num = propertynums[0]
        edge_pro_num = propertynums[1]
        values_list.append(otl_en_num)
        values_list.append(edgenums)
        values_list.append(entity_pro_num)
        values_list.append(edge_pro_num)
        mongo_db = ""
        graph_db_id = 0
        for baseInfo in graph_baseInfo:
            mongo_db = baseInfo["graph_DBName"]  # 图数据库名也是MongoDB数据库名
            graph_db_id = baseInfo["graph_db_id"]  # 图数据库名也是MongoDB数据库名
        from dao.graphdb_dao import GraphDB
        graphdb = GraphDB(graph_db_id)
        code, countres = graphdb.count(mongo_db)
        edges, entities = 0, 0
        if code == codes.successCode:
            edges, entities, name2count, _, _, edge2pros, entity2pros = countres
        g_e_count = edges
        g_v_count = entities
        values_list.append(g_e_count)
        values_list.append(g_v_count)
        print(str(task_data["error_report"]))
        values_list.append(str(task_data["error_report"]))
        values_list.append(task_data["task_id"])
        print(values_list)
        sql = """UPDATE graph_task_history_table SET end_time=%s,all_num=%s,entity_num=%s,edge_num=%s,entity_pro_num=%s,
                  edge_pro_num=%s,graph_edge=%s,graph_entity=%s,error_report=%s  where task_id = %s"""
        cursor.execute(sql, values_list)
        new_id = cursor.lastrowid
        Logger.log_info(
            "graph_id: {}, {} task_dao.inserthistory after id is {}".format(graph_id, task_data["task_status"], new_id))
        return new_id

    # 插入任务列表数据
    @connect_execute_commit_close_db
    def insertData(self, params_json, connection, cursor):
        values_list = []
        values_list.append(params_json["graph_id"])
        values_list.append(params_json["graph_name"])
        values_list.append(params_json["task_id"])
        values_list.append(params_json["task_status"])
        values_list.append(arrow.now().format('YYYY-MM-DD HH:mm:ss'))
        values_list.append(params_json["task_type"])
        values_list.append(params_json["trigger_type"])
        sql = """INSERT INTO graph_task_table (graph_id, graph_name, task_id, task_status,create_time,
                  task_type,trigger_type) VALUES(%s,%s,%s,%s,%s,%s,%s)"""
        cursor.execute(sql, values_list)
        new_id = cursor.lastrowid
        # 插入历史记录表
        sql = """INSERT INTO graph_task_history_table (graph_id, graph_name, task_id, task_status,start_time,
                  task_type,trigger_type) VALUES(%s,%s,%s,%s,%s,%s,%s)"""
        cursor.execute(sql, values_list)
        return new_id

    # 获得所有的任务列表
    @connect_execute_close_db
    def getCount(self, connection, cursor, ):
        sql = """
                SELECT * FROM graph_task_table;
                """
        df = pd.read_sql(sql, connection)
        return df

    @connect_execute_close_db
    def getnumbysn(self, status, graph_name, graph_id, task_type, trigger_type, connection, cursor, ):
        sql = f"""SELECT id FROM graph_task_history_table where graph_id={graph_id}"""
        if status != "all":
            sql += f" and task_status='{status}'"
        if task_type != "all":
            sql += f" and task_type='{task_type}'"
        if trigger_type != "all":
            sql += f" and trigger_type={trigger_type}"
        sql += f" and graph_name collate utf8_general_ci like '%{graph_name}%'"
        df = pd.read_sql(sql, connection)
        return len(df)

    @connect_execute_close_db
    def getallbysn(self, page, size, order, status, graph_name, graph_id, task_type, trigger_type, connection,
                   cursor, ):
        limit_str = ""
        if status != "all":
            limit_str += f" and task_his.task_status='{status}'"
        if task_type != "all":
            limit_str += f" and task_his.task_type='{task_type}'"
        if trigger_type != "all":
            limit_str += f" and task_his.trigger_type={trigger_type}"
        limit_str += f" and graph_name collate utf8_general_ci like '%{graph_name}%'"
        order_map = {"descend": "desc", "ascend": "asc"}
        sql = f"""
            SELECT
              task_his.*,
              kg.KG_config_id as kg_id
            FROM
              graph_task_history_table task_his
              left join knowledge_graph kg on kg.KG_config_id = task_his.graph_id
            where
              graph_id = {graph_id} {limit_str}
            order by
              start_time {order_map[order]}
            limit
              {page * size},
              {size}"""
        df = pd.read_sql(sql, connection)
        return df

    # 获得正在运行的任务
    @connect_execute_close_db
    def getRunByid(self, graph_id, connection, cursor, ):
        sql = """SELECT * FROM graph_task_table where (task_status="running" OR  task_status="waiting") and  graph_id=%s	"""
        sql = sql % ('"' + graph_id + '"')
        df = pd.read_sql(sql, connection)
        return df

    # 根据名字获取所有的任务
    @connect_execute_close_db
    def getdatabyname(self, graph_name, connection, cursor, ):
        sql = """
                SELECT * FROM graph_task_table WHERE graph_name like {0};
                 """
        name = '"%' + graph_name + '%"'
        sql = sql.format(name)
        df = pd.read_sql(sql, connection)
        return df
        # 更新状态

    @connect_execute_commit_close_db
    def updatestaskgname(self, graph_id, graph_name, connection, cursor):
        sql = """UPDATE graph_task_table SET graph_name=%s WHERE graph_id=%s	"""
        sql = sql % ('"' + graph_name + '"', '"' + graph_id + '"')
        cursor.execute(sql)
        new_id = cursor.lastrowid
        # 刷新任务总表
        sql = """UPDATE graph_task_history_table SET graph_name=%s WHERE graph_id=%s"""
        sql = sql % ('"' + graph_name + '"', '"' + graph_id + '"')
        cursor.execute(sql)
        return new_id

    @connect_execute_commit_close_db
    def updatehistorygname(self, graph_id, graph_name, connection, cursor):
        sql = """UPDATE graph_task_history_table SET graph_name=%s WHERE graph_id=%s	"""
        sql = sql % ('"' + graph_name + '"', '"' + graph_id + '"')
        cursor.execute(sql)
        new_id = cursor.lastrowid
        return new_id

    @connect_execute_commit_close_db
    def upKgstatus(self, graph_id, status, connection, cursor):
        sql = """UPDATE knowledge_graph SET status=%s WHERE KG_config_id=%s	"""
        sql = sql % ('"' + status + '"', '"' + str(graph_id) + '"')
        cursor.execute(sql)
        new_id = cursor.lastrowid
        return new_id

    # 更新状态
    @connect_execute_commit_close_db
    def updatestatusbyid(self, status, error_report, task_id, connection, cursor):
        values_list = []
        values_list.append(status)
        error_report = str(error_report)
        # error_report = error_report.replace('"', "'")
        values_list.append(error_report)
        values_list.append(str(task_id))
        sql = """UPDATE graph_task_table SET task_status=%s,error_report=%s  where task_id = %s"""
        sql_his = """UPDATE graph_task_history_table SET task_status=%s,error_report=%s  where task_id = %s"""
        sql = sql % ('"' + values_list[0] + '"', str(values_list[1]), '"' + values_list[2] + '"')
        sql_his = sql_his % ('"' + values_list[0] + '"', str(values_list[1]), '"' + values_list[2] + '"')
        if error_report == "":
            sql = """UPDATE graph_task_table SET task_status=%s  where task_id = %s"""
            sql_his = """UPDATE graph_task_history_table SET task_status=%s  where task_id = %s"""
            sql = sql % ('"' + values_list[0] + '"', '"' + values_list[2] + '"')
            sql_his = sql_his % ('"' + values_list[0] + '"', '"' + values_list[2] + '"')
        cursor.execute(sql)
        new_id = cursor.lastrowid
        # 更新任务总表
        cursor.execute(sql_his)
        return new_id

    @connect_execute_commit_close_db
    def updatestatusse(self, status, row, connection, cursor):
        task_id = row["task_id"]
        error_report = row["error_report"]
        values_list = []
        values_list.append(status)
        # error_report = error_report.replace('"', "#")
        values_list.append(str(error_report))
        values_list.append(str(task_id))
        # sql = """UPDATE graph_task_table SET (task_status,error_report ) VALUES (%s,%s)where task_id = """ + "'"+task_id+"'"
        # cursor.execute(sql, values_list)
        sql = """UPDATE graph_task_table SET task_status=%s,error_report=%s  where task_id = %s"""
        sql = sql % ('"' + values_list[0] + '"', '"' + values_list[1] + '"', '"' + values_list[2] + '"')
        cursor.execute(sql)
        new_id = cursor.lastrowid
        sql = """UPDATE graph_task_history_table SET task_status=%s,error_report=%s  where task_id = %s"""
        sql = sql % ('"' + values_list[0] + '"', '"' + values_list[1] + '"', '"' + values_list[2] + '"')
        cursor.execute(sql)
        return new_id

    @connect_execute_close_db
    def getgraphrun(self, page, size, order, connection, cursor):
        sql_run = """SELECT * FROM graph_task_table where task_status="running"  order by create_time Desc limit {0}, {1};"""
        if order == "descend":
            sql_run = """SELECT * FROM graph_task_table where task_status="running"  order by create_time asc limit {0}, {1} ;"""
        sql_run = sql_run.format(page * size, size)
        df_run = pd.read_sql(sql_run, connection)
        return df_run

    # 递归 判断上一个第几页数据小于size
    def fac(self, page, size, order):
        df_run = self.getgraphrun(page, size, order)
        if len(df_run) < size and len(df_run) > 0:
            return len(df_run), page
        return self.fac(page - 1, size, order)

    # 获取所有数据
    @connect_execute_close_db
    def getall(self, page, size, order, connection, cursor):
        # num , p = self.fac( page, size, order)
        # 第一排序运行中
        sql_run = """SELECT * FROM graph_task_table where task_status="running"  order by create_time Desc limit {0}, {1};"""
        if order == "descend":
            sql_run = """SELECT * FROM graph_task_table where task_status="running"  order by create_time asc limit {0}, {1} ;"""
        sql_run = sql_run.format(page * size, size)
        df_run = pd.read_sql(sql_run, connection)

        df_run_len = len(df_run)
        print(df_run)
        print(df_run_len)
        # 第二排序等待中
        if df_run_len < size:
            if page > 0:
                page = page - 1
            sql_wait = """ SELECT * FROM graph_task_table where task_status!="running" and task_status="waiting"  order by create_time  Desc limit {0}, {1}; """
            if order == "descend":
                sql_wait = """SELECT * FROM graph_task_table where task_status!="running" and task_status="waiting" order by create_time asc limit {0}, {1} ; """
            sql_wait = sql_wait.format(page * size, size)
            df_wait = pd.read_sql(sql_wait, connection)

            all_df = df_run.append(df_wait[:size - df_run_len])
            print(222)
            print(all_df)
            all_df_len = len(all_df)
            print(all_df_len)

            # 第三排序 其他状态
            if all_df_len < size:
                if page > 0:
                    page = page - 1
                sql = """ SELECT * FROM graph_task_table where task_status!="running" and task_status!="waiting"  order by create_time  Desc limit {0}, {1}; """
                if order == "descend":
                    sql = """SELECT * FROM graph_task_table where task_status!="running" and task_status!="waiting" order by create_time asc limit {0}, {1} ; """
                sql = sql.format(page * size, size)
                df = pd.read_sql(sql, connection)

                res_df = all_df.append(df[:size - all_df_len])
                print(33)
                print(res_df)
                return res_df
            return all_df
        return df_run

    # 根据图谱id和定时任务id 获得图谱数量
    @connect_execute_close_db
    def get_timer_by_id(self, task_id, graph_id, connection, cursor):
        sql = f"SELECT graph_id,task_id,cycle,date_time,date_list,enabled,crontab_id,task_type FROM timer_task where task_id = '{task_id}' and graph_id={graph_id}"
        df = pd.read_sql(sql, connection)
        return df

    @connect_execute_close_db
    def get_graph_conf_list_by_configs(self, configIds, connection, cursor):
        sql = """select * from(
                    select * from (
                            select knowledge_graph.id as kg_id, 
                                    `KG_name` as kg_name, 
                                    `status`,
                                    graph_task_table.task_status as `task_status`, 
                                    graph_config_table.graph_status as `config_status`, 
                                    knowledge_graph.`update_time`
                            from (knowledge_graph INNER JOIN graph_db ON graph_db.ip = knowledge_graph.KDB_ip)
                            LEFT JOIN graph_task_table 
                            on knowledge_graph.KG_config_id = graph_task_table.graph_id 
                            LEFT JOIN graph_config_table 
                            on knowledge_graph.KG_config_id = graph_config_table.id
                    ) as t1 
                where t1.KG_id in (
                        select kg_id 
                        from search_config 
                        where kg_id in ({0})
                        group by kg_id
                    )
            )  as t2 
            ORDER BY update_time DESC, KG_name"""
        sql = sql.format(",".join(map(str, configIds)))
        df = pd.read_sql(sql, connection)
        return df

    # def graph_count_func(self,sql,address, mongo_db):
    #     import requests
    #     from requests.auth import HTTPBasicAuth
    #
    #     ret = self.getGraphDBbyIp(address)
    #     rec_dict = ret.to_dict('records')
    #     if len(rec_dict) == 0:
    #         return "0"
    #     rec_dict = rec_dict[0]
    #     graph_DBPort = rec_dict["port"]
    #     adminname = rec_dict["user"]
    #     adminpassword = rec_dict["password"]
    #     try:
    #         url = 'http://' + address + ':' + str(graph_DBPort) + '/database/' + mongo_db
    #         r = requests.get(url, auth=(adminname, adminpassword),timeout=5)
    #     except Exception as e:
    #         return "0"
    #     orient_url = "http://{}:{}/command/{}/sql".format(address, "2480", mongo_db)
    #     body = {"command": sql}
    #     or_res = requests.post(url=orient_url, json=body, auth=HTTPBasicAuth(adminname, adminpassword))
    #     counts = "0"
    #     if or_res.status_code ==200:
    #         or_res = or_res.json()
    #     #     result = or_res["result"]
    #     #     counts = result[0]
    #     #     counts = counts["count"]
    #
    #         return or_res
    #     else:
    #         return "0"
    @connect_execute_close_db
    def get_invalid_graph(self, connection, cursor):
        sql = """select distinct id from graph_config_table where graph_db_id not in (select id from graph_db)"""
        df = pd.read_sql(sql, connection)
        return df

    # 更新nebula顶点和边数量
    @connect_execute_commit_close_db
    def update_nebula_count(self, graph_ids, connection, cursor):
        new_id = None
        for graph_id in graph_ids:
            values_list = []
            res = self.geKGDBbyid(graph_id)
            graph_baseInfo = res["graph_baseInfo"]
            mongo_db = ""
            graph_db_id = 0
            for baseInfo in graph_baseInfo:
                mongo_db = baseInfo["graph_DBName"]  # 图数据库名也是MongoDB数据库名
                graph_db_id = baseInfo["graph_db_id"]  # 图数据库名也是MongoDB数据库名
            from dao.graphdb_dao import GraphDB
            graphdb = GraphDB(graph_db_id)
            code, countres = graphdb.count(mongo_db)
            edges, entities = 0, 0
            if code == codes.successCode:
                edges, entities, name2count, _, _, edge2pros, entity2pros = countres
            g_e_count = edges
            g_v_count = entities
            values_list.append(g_e_count)
            values_list.append(g_v_count)
            sql = f"""update graph_task_history_table set count_status=true,graph_edge=%s,graph_entity=%s where task_id 
                     in (select task_id from graph_task_table where graph_id = {graph_id})"""
            cursor.execute(sql, values_list)
            new_id = cursor.lastrowid
        return new_id

    @connect_execute_close_db
    def check_task_status(self, graph_id, task_status, connection, cursor):
        """
        根据传入的id，状态，任务类型，判断当前任务是否正在运行。
        :param graph_id: 图谱配置id
        :param task_status: 任务状态
        :return: True 正常，False 不正常
        """
        sql = """select gt.task_status,gc.graph_status from graph_config_table gc left join graph_task_table gt on gt.graph_id=gc.id
                where gc.id = {0} """.format(graph_id)
        df = pd.read_sql(sql, connection)
        df = df.to_dict("records")[0]
        if df['task_status'] != 'normal' or df['graph_status'] != 'finish':
            return True
        else:
            return False

    @connect_execute_close_db
    def check_storage_type(self, graph_id, connection, cursor):
        sql = f"""select gb.type from graph_config_table gct join graph_db gb on 
                  gct.graph_db_id = gb.id where gct.id={graph_id}"""
        df = pd.read_sql(sql, connection)
        res = df.to_dict("records")[0]
        db_type = res['type']
        if db_type != 'nebula':
            return True
        else:
            return False


task_dao = TaskDao()
