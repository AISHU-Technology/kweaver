# -*-coding:utf-8-*-
# @Time    : 2020/10/17 13:46
# @Author  : Lowe.li
# @Email   : Lowe.li@aishu.cn
import time
import redis
import json
from flask import Flask
from flask_apscheduler import APScheduler
import sys
import os
from redis.sentinel import Sentinel

sys.path.append(os.path.abspath("../"))
from config import config

print("工作路基:{}".format(os.getcwd()))
from utils.ConnectUtil import redisConnect
from common.errorcode import codes

class Config(object):  # 创建配置，用类
    # 任务列表
    JOBS = [
        # {  # 第一个任务
        #     'id': 'job1',
        #     'func': '__main__:job_1',
        #     'args': (1, 2),
        #     'trigger': 'cron', # cron表示定时任务
        #     'hour': 19,
        #     'minute': 27
        # },
        {  # 第二个任务，每隔5S执行一次
            'id': 'job2',
            'func': '__main__:method_updatetask',  # 方法名
            'args': (),  # 入参
            'trigger': 'interval',  # interval表示循环任务
            'seconds': 10,
        },
        {  # 第二个任务，每隔5S执行一次
            'id': 'job3',
            'func': '__main__:grapg_count_update',  # 方法名
            'args': (),  # 入参
            'trigger': 'interval',  # interval表示循环任务
            'seconds': 300,
        },
        {  # 第三个任务，每分钟执行一次
            'id': 'job4',
            'func': '__main__:timer_updatetask',  # 方法名
            'args': (),  # 入参
            'trigger': 'cron',
            'second': '15'
        },
        {  # 第四个任务，每隔5S执行一次
            'id': 'job5',
            'func': '__main__:nebula_updatetask',  # 方法名
            'args': (),  # 入参
            'trigger': 'interval',  # interval表示循环任务
            'seconds': 5,
        },
    ]


def nebula_updatetask():
    import celery_scheduler
    celery_scheduler.update_nebula_submit()


def timer_updatetask():
    import celery_scheduler
    celery_scheduler.timer_update_task()


def method_updatetask():
    import celery_scheduler
    celery_scheduler.updatedata()


def grapg_count_update():
    from controller.graph_count_controller import get_graph_count_all
    code, res = get_graph_count_all()
    if code == codes.successCode:
        db = "0"
        r = redisConnect.connect_redis(db, model="write")
        r.set("graph_count", json.dumps(res))


def set_timezone():
    tz = time.strftime('%Z', time.localtime())
    if tz == "CST":
        tz = "Asia/Shanghai"
    elif tz == "CEST":
        tz = "CET"
    elif tz == "EDT":
        tz = "EST5EDT"
    elif tz == "BST":
        tz = "GMT"
    elif tz == "PDT":
        tz = "PST8PDT"
    elif tz == "CDT":
        tz = "CST6CDT"
    elif tz == "JST":
        tz = "Asia/Tokyo"
    os.environ["TZ"] = tz


redis_cluster_mode = str(os.getenv("REDISCLUSTERMODE", ""))
# 配置
app = Flask(__name__)
redis_add, redis_port, redis_user, redis_passwd, master_name, redis_sentinel_user, redis_sentinel_password = redisConnect.get_config()
if config.local_testing != True:
    if redis_cluster_mode == "sentinel":
        # 密碼
        ## redis://:password@hostname:port/db_number
        # 配置消息代理的路径，如果是在远程服务器上，则配置远程服务器中redis的URL
        # 哨兵
        ##'sentinel://root:redis@localhost:26079;sentinel://root:redis@localhost:26080;sentinel://root:redis@localhost:26081'
        # 哨兵密碼
        # "sentinel://:mypassword@192.168.1.1:26379/1;sentinel://:mypassword@192.168.1.2:26379/1;sentinel://:mypassword@192.168.1.3:26379/1"
        app.config[
            'CELERY_BROKER_URL'] = 'sentinel://' + redis_user + ":" + redis_passwd + "@" + redis_add + ':' + redis_port + "/1"
        # 要存储 Celery 任务的状态或运行结果时就必须要配置
        BROKER_TRANSPORT_OPTIONS = {'master_name': master_name,
                                    'sentinel_kwargs': {'password': redis_sentinel_password}}
        app.config['CELERY_BROKER_TRANSPORT_OPTIONS'] = BROKER_TRANSPORT_OPTIONS
        app.config[
            'CELERY_RESULT_BACKEND'] = 'sentinel://' + redis_user + ":" + redis_passwd + "@" + redis_add + ':' + redis_port + "/2"
        app.config['CELERY_RESULT_BACKEND_TRANSPORT_OPTIONS'] = BROKER_TRANSPORT_OPTIONS
        print(app.config)
        app.config['CELERYD_MAX_TASKS_PER_CHILD'] = 1
        app.config.from_object(Config)  # 为实例化的flask引入配置
    if redis_cluster_mode == "master-slave":
        # 配置消息代理的路径，如果是在远程服务器上，则配置远程服务器中redis的URL
        # redis: //:password @ hostname: port / db_number
        app.config[
            'CELERY_BROKER_URL'] = 'redis://' + redis_user + ":" + redis_passwd + "@" + redis_add + ':' + redis_port + '/1'
        # 要存储 Celery 任务的状态或运行结果时就必须要配置
        app.config[
            'CELERY_RESULT_BACKEND'] = 'redis://' + redis_user + ":" + redis_passwd + "@" + redis_add + ':' + redis_port + '/2'
        app.config['CELERYD_MAX_TASKS_PER_CHILD'] = 1
        app.config.from_object(Config)  # 为实例化的flask引入配置
else:
    # 配置消息代理的路径，如果是在远程服务器上，则配置远程服务器中redis的URL
    app.config['CELERY_BROKER_URL'] = 'redis://' + config.redis_add + ':' + config.redis_port + '/1'
    # 要存储 Celery 任务的状态或运行结果时就必须要配置
    app.config['CELERY_RESULT_BACKEND'] = 'redis://' + config.redis_add + ':' + config.redis_port + '/2'

if __name__ == "__main__":
    from celery_blue import celery_controller_app
    from apscheduler.schedulers.background import BackgroundScheduler

    # America/Chicago Asia/Shanghai

    # 设置时区
    set_timezone()

    scheduler = APScheduler(BackgroundScheduler())
    app.register_blueprint(celery_controller_app)
    # scheduler = APScheduler()
    scheduler.init_app(app)
    scheduler.start()
    host_str = '0.0.0.0'
    app.run(host=host_str, port=6485, debug=True)
