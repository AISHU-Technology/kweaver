# -*-coding:utf-8-*-
import json
import time
from datetime import datetime, date
from croniter import croniter

from dao.graph_dao import graph_dao
from utils.ConnectUtil import redisConnect


# 计算定时任务下阶段运行时间
def CrontabRunNextTime(sched, timeFormat="%Y-%m-%d %H:%M", queryTimes=1):
    now = datetime.now()
    # 以当前时间为基准开始计算
    cron = croniter(sched, now)
    return [cron.get_next(datetime).strftime(timeFormat) for _ in range(queryTimes)]


def get_timezone():
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
    return tz


class RedisLock(object):
    def __init__(self):
        # 定时任务锁，避免同一时刻执行多个任务
        self.read_conn = redisConnect.connect_redis(3, 'read')
        self.write_conn = redisConnect.connect_redis(3, 'write')

    def get_lock(self, graph_id, task_id, expired_time=40):
        status = self.write_conn.set(graph_id, task_id, ex=expired_time, nx=True)
        if not status:
            return False
        return True

    def get_task(self, graph_id):
        task_id = self.read_conn.get(graph_id)
        return task_id


def check_run_once(trigger_type, graph_id):
    print(f'check Close tasks that only need to be run once:{graph_id} {datetime.now()}')
    try:
        if trigger_type == 1:
            time.sleep(2)
            close_key = f'close_{graph_id}'
            close_task_id = redislock.read_conn.get(close_key)
            if close_task_id:
                close_task_id = close_task_id.decode()
            graph_dao.update_timer_switch(graph_id, close_task_id, 0, False)
    except Exception as e:
        print(f'check run once error:{str(e)}')
        return False
    else:
        return True



class DateEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.strftime('%Y-%m-%d %H:%M:%S')
        elif isinstance(obj, date):
            return obj.strftime("%Y-%m-%d")
        else:
            return json.JSONEncoder.default(self, obj)

redislock = RedisLock()
