# -*-coding:utf-8-*-
# @Time    : 2020/11/28 0:37
# @Author  : Lowe.li
# @Email   : Lowe.li@aishu.cn

# 定时任务
# class APSchedulerJobConfig(object):
#   SCHEDULER_API_ENABLED = True
#   JOBS = [
#       {
#         'id': 'No1', # 任务唯一ID
#         'func': 'celery_task.celery_flask_app:method_test', # 执行任务的function名称，app.test 就是 app下面的`test.py` 文件，`shishi` 是方法名称。文件模块和方法之间用冒号":"，而不是用英文的"."
#         'args': '', #如果function需要参数，就在这里添加
#         'trigger': {
#           'type': 'cron', # 类型
#           # 'day_of_week': "0-6", # 可定义具体哪几天要执行
#           # 'hour': '*', # 小时数
#           # 'minute': '1',
#           'second': '3' # "*/3" 表示每3秒执行一次，单独一个"3" 表示每分钟的3秒。现在就是每一分钟的第3秒时循环执行。
#         }
#       },
#     {
#       'id': 'No2',  # 任务唯一ID
#       'func': 'celery_task.celery_flask_app:otl_method_test',
#       # 执行任务的function名称，app.test 就是 app下面的`test.py` 文件，`shishi` 是方法名称。文件模块和方法之间用冒号":"，而不是用英文的"."
#       'args': '',  # 如果function需要参数，就在这里添加
#       'trigger': {
#         'type': 'cron',  # 类型
#         # 'day_of_week': "0-6", # 可定义具体哪几天要执行
#         # 'hour': '*', # 小时数
#         # 'minute': '1',
#         'second': '30'  # "*/3" 表示每3秒执行一次，单独一个"3" 表示每分钟的3秒。现在就是每一分钟的第3秒时循环执行。
#       }
#     }
#   ]