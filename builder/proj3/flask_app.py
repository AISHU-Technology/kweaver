# -*-coding:utf-8-*-
# @Time    : 2020/10/17 17:41
# @Author  : Lowe.li
# @Email   : Lowe.li@aishu.cn
import os
import time
from flask import Flask
from blue import add_app
from flask_apscheduler import APScheduler
import sys
import os
from redis.sentinel import Sentinel
sys.path.append(os.path.abspath("../"))
print("工作路基2:{}".format(os.getcwd()))
from config import config
from utils.ConnectUtil import redisConnect

class ConfigOtl(object):  # 创建配置，用类
    # 任务列表
    JOBS = [
        {  # 第二个任务，每隔5S执行一次
            'id': 'job1',
            'func': '__main__:otl_method_test', # 方法名
            'args': (), # 入参
            'trigger': 'interval', # interval表示循环任务
            'seconds': 10
        }
    ]
def otl_method_test():
    import celery_scheduler_otl
    celery_scheduler_otl.update_otl_data()
    celery_scheduler_otl.update_otl_table()

redis_cluster_mode = str(os.getenv("REDISCLUSTERMODE", ""))
app = Flask(__name__)
redis_add ,redis_port ,redis_user , redis_passwd ,master_name,redis_sentinel_user,redis_sentinel_password= redisConnect.get_config()
if config.local_testing != True:
    if redis_cluster_mode == "sentinel":
        BROKER_URL = 'sentinel://' + redis_user + ":" + redis_passwd + "@" + redis_add + ':' + redis_port + "/10"
        # { 'sentinel_kwargs': { "master_name": master_name,'password': "password" } }# 指定 Broker
        BROKER_TRANSPORT_OPTIONS = {'master_name': master_name,
                                    'sentinel_kwargs': {'password': redis_sentinel_password}}
        CELERY_RESULT_BACKEND = 'sentinel://' + redis_user + ":" + redis_passwd + "@" + redis_add + ':' + redis_port + "/11"  # 指定 Backend
        # CELERY_RESULT_BACKEND_TRANSPORT_OPTIONS = {"master_name": master_name}
        app.config['CELERY_BROKER_URL'] = BROKER_URL
        app.config['CELERY_BROKER_TRANSPORT_OPTIONS'] = BROKER_TRANSPORT_OPTIONS
        app.config['CELERY_RESULT_BACKEND'] = CELERY_RESULT_BACKEND
        app.config['CELERY_RESULT_BACKEND_TRANSPORT_OPTIONS'] = BROKER_TRANSPORT_OPTIONS
        print(app.config)
        app.config['CELERYD_MAX_TASKS_PER_CHILD'] = 1
        # 将Flask中的配置直接传递给Celery
        app.config.from_object(ConfigOtl)
        # cel.conf.update(app.config)
        # celery = Celery(app.name, broker=app.config['CELERY_BROKER_URL'],)
        # celery.conf.update(app.config)
        # celery_controller_app = Blueprint('celery_controller_app', __name__)
    else:
        # 配置消息代理的路径，如果是在远程服务器上，则配置远程服务器中redis的URL
        # redis: //:password @ hostname: port / db_number
        app.config[
            'CELERY_BROKER_URL'] = 'redis://' + redis_user + ":" + redis_passwd + "@" + redis_add + ':' + redis_port + '/10'
        # 要存储 Celery 任务的状态或运行结果时就必须要配置
        app.config[
            'CELERY_RESULT_BACKEND'] = 'redis://' + redis_user + ":" + redis_passwd + "@" + redis_add + ':' + redis_port + '/11'
        app.config['CELERYD_MAX_TASKS_PER_CHILD'] = 1
        app.config.from_object(ConfigOtl)  # 为实例化的flask引入配置
else :
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

    # 设置时区
    set_timezone()


    scheduler = APScheduler(BackgroundScheduler())
    # scheduler = APScheduler()
    scheduler.init_app(app)
    scheduler.start()
    app.register_blueprint(add_app)
    host_str = '0.0.0.0'
    app.run(host=host_str, port=6488, debug=True)




