# -*-coding:utf-8-*-
import os
import time
from flask import Flask
from flask_apscheduler import APScheduler
import sys
import os

sys.path.append(os.path.abspath("../"))
print("工作路基2:{}".format(os.getcwd()))
from config import config
from utils.ConnectUtil import redisConnect
from onto_blue import add_app
from task_blue import task_app


class ConfigOtl(object):  # 创建配置，用类
    # 任务列表
    JOBS = [
        {  # 第二个任务，每隔5S执行一次
            'id': 'job1',
            'func': '__main__:otl_method_test',  # 方法名
            'args': (),  # 入参
            'trigger': 'interval',  # interval表示循环任务
            'seconds': 10
        }
    ]


def otl_method_test():
    import celery_scheduler_otl
    celery_scheduler_otl.update_otl_data()
    celery_scheduler_otl.update_otl_table()


app = Flask(__name__)
redis_add, redis_port, redis_user, redis_passwd, master_name, redis_sentinel_user, redis_sentinel_password, redis_cluster_mode = redisConnect.get_config()
if config.local_testing != True:
    if redis_user is None:
        redis_user = ""
    if redis_passwd is None:
        redis_passwd = ""
    if redis_cluster_mode == "sentinel":
        sentinel_url = ""
        redis_user_url = f"{redis_user}:{redis_passwd}@"
        if redis_user_url == "@":
            redis_user_url = ""
        for index, sentinel_node in enumerate(redis_add):
            sentinel_host, sentinel_port = sentinel_node
            sentinel_url += f"sentinel://{redis_user_url}{sentinel_host}:{sentinel_port}/"
            sentinel_url += "{0}"
            if index != len(redis_add):
                sentinel_url += ";"
        BROKER_URL = sentinel_url.format(10)
        print(BROKER_URL,'-----------------')
        # { 'sentinel_kwargs': { "master_name": master_name,'password': "password" } }# 指定 Broker
        BROKER_TRANSPORT_OPTIONS = {'master_name': master_name, 'password': redis_sentinel_password,
                                    'sentinel_kwargs': {'password': redis_sentinel_password,
                                                        "username": redis_sentinel_user}}
        CELERY_RESULT_BACKEND = sentinel_url.format(11)  # 指定 Backend
        # CELERY_RESULT_BACKEND_TRANSPORT_OPTIONS = {"master_name": master_name}
        app.config['CELERY_BROKER_URL'] = BROKER_URL
        app.config['CELERY_BROKER_TRANSPORT_OPTIONS'] = BROKER_TRANSPORT_OPTIONS
        app.config['CELERY_RESULT_BACKEND'] = CELERY_RESULT_BACKEND
        app.config['CELERY_RESULT_BACKEND_TRANSPORT_OPTIONS'] = BROKER_TRANSPORT_OPTIONS
        print(app.config)
        app.config['CELERYD_MAX_TASKS_PER_CHILD'] = 1
        # 将Flask中的配置直接传递给Celery
        app.config.from_object(ConfigOtl)
    else:
        redis_url = ""
        redis_user_url = f"{redis_user}:{redis_passwd}@"
        if redis_user_url == "@":
            redis_user_url = ""
        redis_url = f"redis://{redis_user_url}{redis_add}:{redis_port}/" + "{0}"
        app.config[
            'CELERY_BROKER_URL'] = redis_url.format(10)
        # 要存储 Celery 任务的状态或运行结果时就必须要配置
        app.config['CELERY_RESULT_BACKEND'] = redis_url.format(11)
        app.config['CELERYD_MAX_TASKS_PER_CHILD'] = 1
        app.config.from_object(ConfigOtl)  # 为实例化的flask引入配置
else:
    app.config['CELERY_BROKER_URL'] = 'redis://' + config.redis_add + ':' + config.redis_port + '/10'
    # 要存储 Celery 任务的状态或运行结果时就必须要配置
    app.config['CELERY_RESULT_BACKEND'] = 'redis://' + config.redis_add + ':' + config.redis_port + '/11'


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


if __name__ == "__main__":
    from apscheduler.schedulers.background import BackgroundScheduler
    import task

    ctx = app.app_context()
    ctx.push()

    # 设置时区
    set_timezone()

    scheduler = APScheduler(BackgroundScheduler())
    # scheduler = APScheduler()
    scheduler.init_app(app)
    scheduler.start()
    app.register_blueprint(add_app)
    app.register_blueprint(task_app)
    host_str = '0.0.0.0'
    app.run(host=host_str, port=6488, debug=True)
