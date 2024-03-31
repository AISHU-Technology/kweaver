# -*-coding:utf-8-*-
# @Time    : 2020/10/17 17:41
# @Author  : Lowe.li
# @Email   : Lowe.li@aishu.cn
import json
import os
import sys
import traceback
from urllib import parse

import requests
from celery import Celery

sys.path.insert(0, os.path.abspath("../"))
import common.stand_log as log_oper
from celery_task.celery_flask_app import app
from config import config as Config
from utils.log_info import Logger
from utils.util import get_timezone, redislock

# 初始化定时任务，默认为空
beat_schedule = {}
beat_scheduler = 'celery_task.celery_beat:DatabaseScheduler'
# The maximum number of seconds beat can sleep between checking the schedule.
# default: 0
beat_max_loop_interval = 10
ip = os.getenv("RDSHOST")
port = int(os.getenv("RDSPORT", '3320'))
user = os.getenv("RDSUSER")
passwd = str(os.getenv("RDSPASS"))
database = os.getenv("RDSDBNAME")
passwd = parse.quote_plus(passwd)
if os.getenv('DB_TYPE') == "DM8":
    db_conn_driver = f'dm+dmPython://{user}:{passwd}@{ip}:{port}/?schema={database}'
else:
    db_conn_driver = f'mysql+pymysql://{user}:{passwd}@{ip}:{port}/{database}'
beat_dburi = db_conn_driver
beat_config = dict(
    beat_schedule=beat_schedule,
    beat_scheduler=beat_scheduler,
    beat_max_loop_interval=beat_max_loop_interval,
    beat_dburi=beat_dburi,
    # timezone=get_timezone(),
    timezone="Asia/Shanghai",
    worker_max_tasks_per_child=10
)
redis_cluster_mode = str(os.getenv("REDISCLUSTERMODE", "master-slave"))

# celery从这些模块导入任务
celery_includes = [app.name,
                   'extractions.standard_extract',
                   'buildertask_daemon'
                   ]

if Config.local_testing != True:
    if redis_cluster_mode == "sentinel":
        # 初始化Celery
        cel = Celery(app.name,
                     broker=app.config['CELERY_BROKER_URL'],
                     broker_transport_options=app.config['CELERY_BROKER_TRANSPORT_OPTIONS'],
                     backend=app.config['CELERY_RESULT_BACKEND'],
                     result_backend_transport_options=app.config['CELERY_RESULT_BACKEND_TRANSPORT_OPTIONS'],
                     result_expires=app.config['CELERY_RESULT_EXPIRES'],
                     include=celery_includes
                     )

        # # 将Flask中的配置直接传递给Celery
        # cel.conf.update(app.config)
        Logger.log_info("-------------------------celery config -------------------------")
        Logger.log_info(cel.conf.broker_url)
        cel.conf.broker_transport_options = app.config['CELERY_BROKER_TRANSPORT_OPTIONS']
        Logger.log_info(cel.conf.broker_transport_options)
        Logger.log_info(cel.conf.result_backend)
        cel.conf.result_backend_transport_options = app.config['CELERY_RESULT_BACKEND_TRANSPORT_OPTIONS']
        cel.conf.result_expires = app.config['CELERY_RESULT_EXPIRES']
        Logger.log_info(cel.conf.result_backend_transport_options)
        # cel.conf.update(app.config)
        cel.conf.update(beat_config)
        Logger.log_info("-------------------------app+cel config -------------------------")
        Logger.log_info(cel.conf.broker_url)
        Logger.log_info(cel.conf.broker_transport_options)
        Logger.log_info(cel.conf.result_backend)
        Logger.log_info(cel.conf.result_backend_transport_options)
    if redis_cluster_mode == "master-slave":
        # 初始化Celery
        cel = Celery(app.name,
                     broker=app.config['CELERY_BROKER_URL'],
                     backend=app.config['CELERY_RESULT_BACKEND'],
                     include=celery_includes,
                     broker_connection_retry_on_startup=True
                     )

        # 将Flask中的配置直接传递给Celery
        # cel.conf.update(app.config)
        cel.conf.update(beat_config)
else:
    # 初始化Celery
    cel = Celery(app.name,
                 broker=app.config['CELERY_BROKER_URL'],
                 backend=app.config['CELERY_RESULT_BACKEND'],
                 include=celery_includes
                 )

    # 将Flask中的配置直接传递给Celery
    cel.conf.update(app.config)


@cel.task
def send_builder_task(task_type, graph_id, user_id, trigger_type, cycle, task_id):
    url = "http://localhost:6485/buildertask"
    # url = "http://10.4.37.76:6485/buildertask" #本地测试
    payload = {"tasktype": task_type, "graph_id": graph_id, "trigger_type": trigger_type}
    Logger.log_info(f'start timer task,payload: {payload}')
    headers = {
        'Content-Type': 'application/json',
        'userId': user_id
    }
    close_key = f'close_{graph_id}'
    try:
        # 定时任务需要进行任务注册防止同一时刻运行同一个图谱任务
        if cycle:
            if cycle == 'one':
                if not redislock.read_conn.exists(close_key):
                    redislock.write_conn.set(close_key, task_id)
                    redislock.write_conn.expire(close_key, 50)
            status = redislock.get_lock(graph_id, task_id)
            if not status:
                Logger.log_info(f"timer_task_id:{task_id} skip,the graph:{graph_id} task is runninig or waiting")
                return
        response = requests.request("POST", url, headers=headers, data=json.dumps(payload))
        res_json = response.json()
        code = res_json["code"]
        if code != 200:
            Logger.log_info(f'send timer error,res_json:{res_json}')
        else:
            Logger.log_info(f"send timer success,task_id:{task_id}")
    except Exception as e:
        error_log = log_oper.get_error_log(f'send timer exception:{str(e)}', sys._getframe(), traceback.format_exc())
        Logger.log_error(error_log)
