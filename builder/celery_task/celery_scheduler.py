# -*-coding:utf-8-*-
import time

from dao.graph_dao import graph_dao
from dao.graphdb_dao import GraphDB
from dao.task_dao import task_dao
from service.task_Service import task_service
from utils.ConnectUtil import redisConnect


def updatedata():
    print("实时刷新")
    # 遍历
    # task information from mysql table
    df = task_dao.get_unfinished_task()
    # df = task_dao.getCount()  # get all task information from mysql table
    # 获得任务列表中的所有task_id
    df_taskid = df["task_id"]
    df_taskid_list = df_taskid.values.tolist()
    # 遍历redis 获取所有任务的celery信息
    status_code, task_info = task_dao.gettaskall(df_taskid_list)
    if status_code == "400":
        print("redis 断开，不再更新原来数据 失败，失败原因是redis挂断")
        task_service.updatetaredis(df, task_info)
    else:
        try:
            task_service.update_task_status(df, task_info)
        except Exception as e:
            print(e)


def timer_update_task():
    # 每分钟15秒刷新timer_update
    # time.sleep(15)
    try:
        graph_dao.timer_update_task()
    except Exception as e:
        print(f'update table timer_update error:{str(e)}')


# 每5秒钟检测一次是否有nebula submit任务
def update_nebula_submit():
    try:
        read_conn = redisConnect.connect_redis(0, 'read')
        graph_db_ids = {}
        finished_graph = []
        write_conn = redisConnect.connect_redis(0, 'write')
        status = read_conn.exists("nebula_stats_job_id")
        if status:
            res = read_conn.hgetall("nebula_stats_job_id")
            if res:
                count = 0
                graph_ids = []
                graph_ids_map = {}
                delete_key = []
                for k, v in res.items():
                    count += 1
                    k = k.decode()
                    v = int(v.decode())
                    job_id = v
                    graph_name, graph_id = k.split('_')
                    graph_id = int(graph_id)
                    graph_ids_map[graph_id] = [job_id, graph_name]
                    graph_ids.append(graph_id)
                    # 避免检测任务太多，造成任务积压，数据库挂掉
                    if count > 3:
                        print("Detect up to 3 Nebula tasks at a time")
                        break
                df = graph_dao.get_graph_db_id(graph_ids)
                for count, row in enumerate(df.to_dict('records')):
                    graph_id = row['id']
                    graph_db_id = row['graph_db_id']
                    graph_db_ids[graph_id] = graph_db_id
                    grapgdb = GraphDB(graph_db_id)
                    job_id, graph_name = graph_ids_map[graph_id]
                    ngql = f"show job {job_id}"
                    state_code, res = grapgdb._nebula_exec(ngql, db=graph_name)
                    if state_code == 200:
                        num = res.row_size()
                        for index in range(num):
                            value = res.row_values(index)
                            job_id_new = value[0].as_int()
                            status = value[2].as_string()
                            if job_id_new == job_id:
                                if status == 'FINISHED':
                                    finished_graph.append(row['id'])
                                    delete_key.append(f'{graph_name}_{graph_id}')
                                break
                task_dao.update_nebula_count(graph_ids)
                for k in delete_key:
                    write_conn.hdel('nebula_stats_job_id', k)
    except Exception as e:
        print(f'update_nebula_submit error:{str(e)}')
