# -*- coding:utf-8 -*-
import time
import random
from json.decoder import JSONDecodeError

import requests
from requests.auth import HTTPBasicAuth
from utils.common_response_status import CommonResponseStatus
from utils.log_info import Logger
from utils.my_pymysql_pool import connect_execute_commit_close_db, connect_execute_close_db
from utils.ConnectUtil import redisConnect
import pandas as pd
import datetime
import arrow
import configparser
from os import path

ASTOKEN_TIMEOUT = 55 * 60  # MariaDB中的access_token在该时间内有效，也是redis分布式锁的过期时间

config = configparser.ConfigParser()
config.read(path.join(path.dirname(path.dirname(path.dirname(path.abspath(__file__)))), 'config/asapi.conf'))


class ASToken():
    def get_token(self, ds_auth):
        """获取AS的access_token
        Returns:
            ret_code: 成功:CommonResponseStatus.SUCCESS.value, 失败:其他
            obj: 成功:access_token, 失败:{'cause':cause, 'code':code, 'message':message}
        """
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            data = self.get_data_by_auth(ds_auth)
            if len(data) == 0:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                obj['cause'] = "ds_auth %s not exist!" % ds_auth
                obj['code'] = CommonResponseStatus.TOKEN_OVERDUE_ERROR.value
                obj['message'] = "getting anyshare token failed."
                print('获取ds_auth={}的token失败'.format(ds_auth), obj)
                return ret_code, obj
            access_token = data.loc[0, 'access_token']
            refresh_token = data.loc[0, "refresh_token"]
            update_time = data.loc[0, 'update_time']
            ds_address = data.loc[0, 'ds_address']
            ds_port = data.loc[0, 'ds_port']
            client_id = data.loc[0, 'client_id']
            client_secret = data.loc[0, 'client_secret']
            if not update_time:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                obj['cause'] = 'AS未授权'
                obj['code'] = CommonResponseStatus.TOKEN_OVERDUE_ERROR.value
                obj['message'] = "Get anyshare token failed."
                print('获取ds_auth={}的token失败，AS未授权'.format(ds_auth))
                return ret_code, obj
            update_time_time = datetime.datetime.strptime(update_time, '%Y-%m-%d %H:%M:%S')
            now_time = datetime.datetime.now()
            diff_time = (now_time - update_time_time).total_seconds()
            # token有效则直接返回
            if diff_time <= ASTOKEN_TIMEOUT:
                print('获取ds_auth={}的token成功, access_token为{}'.format(ds_auth, access_token))
                return ret_code, access_token
            # 否则刷新，刷新过程使用Redis分布式锁
            redis = redisConnect.connect_redis("3", model="write")
            redis_key = 'astoken_{}'.format(ds_auth)
            # 如果不存在当前锁, 则进行加锁并设置过期时间
            if redis.set(redis_key, 'valid', ex=ASTOKEN_TIMEOUT, nx=True):
                print('获取Redis锁{}成功，开始刷新AS token'.format(redis_key))
                try:
                    ret_code, obj = self.refresh_token(ds_auth, ds_address, ds_port, refresh_token, client_id,
                                                       client_secret)
                except Exception as e:
                    ret_code = CommonResponseStatus.SERVER_ERROR.value
                    err = repr(e)
                    obj['cause'] = err
                    obj['code'] = CommonResponseStatus.UNVERIFY_ERROR.value
                    obj['message'] = "Get anyshare token failed"
                    print('刷新ds_auth={}的token失败'.format(ds_auth), obj)
                    return ret_code, obj
                # 刷新成功则将新的token信息写入MariaDB
                if ret_code == CommonResponseStatus.SUCCESS.value:
                    print('AS token 刷新成功,开始将新的token信息写入MariaDB')
                    self.insert_refresh_token([obj['refresh_token'], obj['access_token'], ds_auth])
                    print('将新的token信息写入MariaD成功, ds_auth={}的access_token为{}'.format(ds_auth, access_token))
                    return ret_code, obj['access_token']
                # 刷新失败则主动释放锁
                else:
                    Logger.log_error(obj)
                    print('AS token 刷新失败, 开始释放Redis锁{}'.format(redis_key))
                    redis.delete(redis_key)
                    print('释放Redis锁{}成功'.format(redis_key))
                    return ret_code, obj
            # 锁已存在，休眠2s后从MariaDB获取最新token并返回
            else:
                print('获取Redis锁{}失败'.format(redis_key))
                # 如果锁存在但是没有失效时间, 则进行设置, 避免出现死锁
                if redis.ttl(redis_key) == -1:
                    redis.expire(redis_key, ASTOKEN_TIMEOUT)
                # 随机等待1~2秒，避免多个进程同时访问数据库
                time.sleep(random.uniform(1, 2))
                print('重新开始获取ds_auth={}的token'.format(ds_auth))
                ret_code, obj = self.get_token(ds_auth)
                return ret_code, obj
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            obj['cause'] = err
            obj['code'] = CommonResponseStatus.UNVERIFY_ERROR.value
            obj['message'] = "Get anyshare token failed"
            print('获取ds_auth={}的token失败'.format(ds_auth), obj)
            return ret_code, obj

    def refresh_token(self, ds_auth, ds_address, ds_port, refresh_token, client_id, client_secret):
        """调用AS API刷新AS token
        Returns:
            ret_code: 成功:CommonResponseStatus.SUCCESS.value, 失败:其他
            obj: 成功:{'refresh_token':refresh_token, 'access_token', access_token}
                 失败:{'cause':cause, 'code':code, 'message':message}
        """
        print('开始刷新token')
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        source_data = self.get_source_data_by_auth(ds_auth)  # 数据源相关信息
        version = source_data.loc[0, 'data_source']
        url = '{}'.format(ds_address + ":" + ds_port) + config.get(version, "token")
        print('as版本为{}, 刷新url为{}'.format(version, url))
        max_retries = 3  # 出现异常时重试的最大次数
        while max_retries > 0:
            try:
                if version == 'as':
                    ds_user = source_data.loc[0, 'ds_user']
                    ds_password = source_data.loc[0, 'ds_password']
                    payload = {'account': ds_user, 'password': ds_password}
                    response = requests.post(url, json=payload, verify=False, timeout=(10, 20))
                    try:
                        r_json = response.json()
                    except JSONDecodeError:
                        r_json = response.content
                    # 刷新成功
                    if response.status_code == 200:
                        access_token = r_json['tokenid']
                        obj['refresh_token'] = ''
                        obj['access_token'] = access_token
                        print('as刷新token成功', obj)
                        return ret_code, obj
                    # 刷新失败
                    else:
                        ret_code = CommonResponseStatus.SERVER_ERROR.value
                        obj['cause'] = r_json
                        obj['code'] = CommonResponseStatus.UNVERIFY_ERROR.value
                        obj['message'] = "refresh anyshare token failed."
                        print('as刷新token失败', obj)
                elif version == 'as7':
                    payload = {"grant_type": "refresh_token", "refresh_token": refresh_token}
                    response = requests.post(url, auth=HTTPBasicAuth(client_id, client_secret),
                                             data=payload, verify=False, timeout=(10, 20))
                    try:
                        r_json = response.json()
                    except JSONDecodeError:
                        r_json = response.content
                    # 刷新成功
                    if response.status_code == 200:
                        access_token = r_json['access_token']
                        refresh_token = r_json['refresh_token']
                        obj['refresh_token'] = refresh_token
                        obj['access_token'] = access_token
                        print('as7刷新token成功', obj)
                        return ret_code, obj
                    # 刷新失败
                    else:
                        ret_code = CommonResponseStatus.SERVER_ERROR.value
                        obj['cause'] = r_json
                        obj['code'] = CommonResponseStatus.UNVERIFY_ERROR.value
                        obj['message'] = "refresh anyshare token failed."
                        # if "error_hint" not in r_json or "error_description" not in r_json:
                        #     obj['code'] = CommonResponseStatus.UNVERIFY_ERROR.value
                        # if "whitelisted" in r_json['error_hint'] or "client" in r_json['error_description']:
                        #     obj['code'] = CommonResponseStatus.TOKEN_OVERDUE_ERROR.value
                        print('as7刷新token失败', obj)
            # 刷新失败 异常
            except Exception as e:
                Logger.log_error(e)
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                obj['cause'] = e
                obj['code'] = CommonResponseStatus.UNVERIFY_ERROR.value
                obj['message'] = "refresh anyshare token failed."
                print('第{}次刷新token失败'.format(4 - max_retries), obj)
            time.sleep(1)
            max_retries -= 1
        # 尝试max_retries次均失败
        return ret_code, obj

    @connect_execute_commit_close_db
    def insert_refresh_token(self, values, connection, cursor):
        """将更新的token信息写入数据库
        Args:
            values: [refresh_token, access_token, ds_auth]
        """
        sql = """UPDATE author_token SET refresh_token=%s,access_token=%s,update_time=%s where ds_auth = %s"""
        sql = sql % ('"' + values[0] + '"',
                     '"' + values[1] + '"',
                     '"' + arrow.now().format('YYYY-MM-DD HH:mm:ss') + '"',
                     '"' + str(values[2]) + '"'
                     )
        Logger.log_info(sql)
        cursor.execute(sql)
        new_id = cursor.lastrowid
        return new_id

    @connect_execute_close_db
    def get_data_by_auth(self, ds_auth, connection, cursor):
        """根据ds_auth从数据库获取授权相关的信息"""
        sql = """SELECT * FROM author_token WHERE ds_auth={} """.format(ds_auth)
        Logger.log_info(sql)
        df = pd.read_sql(sql, connection)
        return df

    @connect_execute_close_db
    def get_source_data_by_auth(self, ds_auth, connection, cursor):
        """根据ds_auth从数据库获取数据源相关信息"""
        sql = """SELECT * FROM data_source_table WHERE ds_auth={} """.format(ds_auth)
        Logger.log_info(sql)
        df = pd.read_sql(sql, connection)
        return df


asToken = ASToken()
