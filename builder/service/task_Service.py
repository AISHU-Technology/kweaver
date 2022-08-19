# -*-coding:utf-8-*-
# @Time    : 2020/11/2 13:50
# @Author  : Lowe.li
# @Email   : Lowe.li@aishu.cn
import json
import time

import requests

from config.config import permission_manage
from dao.graph_dao import graph_dao
from utils.common_response_status import CommonResponseStatus
from dao.task_dao import task_dao
from dao.task_onto_dao import task_dao_onto
import pandas as pd
from utils.log_info import Logger
from dao.dsm_dao import dsm_dao
from flask import request
from utils.log_info import Logger


class TaskService():
    # 获得图谱根据id
    def getgraphnamebyid(self, graph_id):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:

            ret = task_dao.getgraphnamebyid(graph_id)
            rec_dict = ret.to_dict('records')
            obj["df"] = rec_dict
            if len(rec_dict) == 0:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                obj['cause'] = "graph not exist"
                obj['code'] = CommonResponseStatus.TASK_RUN_NO_GRAPH.value
                obj['message'] = "graph not exist"
        except Exception as e:
            err = repr(e)
            Logger.log_error(err)
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            obj['cause'] = "get graph fail"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = "get graph fail"

        return ret_code, obj

    # 获得图谱根据id
    def getgraphcountbyid(self, graph_id):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:

            ret = task_dao.getgraphcountbyid(graph_id)
            rec_dict = ret.to_dict('records')
            obj["df"] = rec_dict
            if len(rec_dict) == 0:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                obj['cause'] = "graph not exist"
                obj['code'] = CommonResponseStatus.TASK_RUN_NO_GRAPH.value
                obj['message'] = "graph not exist"
                obj['solution'] = "Please use valid graph_id"
        except Exception as e:
            err = repr(e)
            Logger.log_error(err)
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            # err = repr(e)
            # obj['cause'] = err
            obj['cause'] = "get graph fail"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            # if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
            #     obj['cause'] = "you have an error in your SQL!"
            # obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            # if "Duplicate entry" in err:
            #     obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
            obj['message'] = "get graph fail"
            obj['solution'] = "Please check mariadb"
            # Response(status=500)

        return ret_code, obj

    # 根据任务id 获得图谱知识量
    def get_count_by_task_id(self, task_id):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            ret = task_dao.get_count_by_task_id(task_id)
            obj["df"] = []
            if len(ret) > 0:
                # ret = self.updatetaskstatus(ret)
                rec_dict = ret.to_dict('records')
                obj["df"] = rec_dict
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            if "Duplicate entry" in err:
                obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
            obj['message'] = "task fail"
            # Response(status=500)
        return ret_code, obj

    # 根据图谱id 获得任务信息，更新后的信息
    def get_task_by_graph_id(self, graph_id):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:

            ret = task_dao.gettaskbyid(graph_id)
            obj["df"] = []
            if len(ret) > 0:
                # ret = self.updatetaskstatus(ret)
                rec_dict = ret.to_dict('records')
                obj["df"] = rec_dict

        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            if "Duplicate entry" in err:
                obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
            obj['message'] = "task fail"
            # Response(status=500)

        return ret_code, obj

    # 添加历史记录
    def update_history(self, graph_id, task_data, host_url):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            Logger.log_info("graph_id: {} task_dao.inserthistory ".format(graph_id))
            task_dao.update_history(graph_id, task_data)
            obj["res"] = "history task "
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            if "Duplicate entry" in err:
                obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
            obj['message'] = "task fail"
            # Response(status=500)

        return ret_code, obj

    # 删除任务列表
    def deletetask(self, task_id, graph_id):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:

            task_dao.deletetask(task_id, graph_id)
            obj["res"] = "delete task "
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            if "Duplicate entry" in err:
                obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
            obj['message'] = "delete task failed"

        return ret_code, obj

    # 删除任务列表

    def deletehistorytask(self, task_ids, graph_id):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            task_dao.deletehistorytask(task_ids, graph_id)
            obj["res"] = "delete history task "
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            if "Duplicate entry" in err:
                obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
            obj['message'] = "delete history task failed"

        return ret_code, obj

    # 任务错误日志
    def getreportbytaskid(self, task_id):
        data = task_dao.getredisbytaskid(task_id)
        return data

    # 任务进度
    def getprogressbytaskid(self, params_json):
        data = task_dao.getredisbytaskid(params_json.get("task_id"))
        df = task_dao.getbystatusid(params_json.get("task_id"))
        df["progress"] = [data["status"]]
        return data

    # 添加任务列表
    def addtask(self, params_json, host_url):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:

            task_dao.insertData(params_json)
            obj["res"] = "start task "
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            if "Duplicate entry" in err:
                obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
            obj['message'] = "task fail"

        return ret_code, obj

    def add_otl_task(self, otl_id, task_name, ds_id, task_type, postfix):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            ret = task_dao_onto.insert_otl_Data(otl_id, task_name, ds_id, task_type, postfix)
            obj["res"] = ret
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            if "Duplicate entry" in err:
                obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
            obj['message'] = " otl predict task fail"

        return ret_code, obj

    def seconds_to_hms(self, seconds_num):
        m, s = divmod(seconds_num, 60)
        h, m = divmod(m, 60)
        hms = "%02d:%02d:%02d" % (h, m, s)
        return hms

    # 根据任务图谱id获得历史记录
    def gethistorydata(self, params_json):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}

        try:
            page = params_json.get("page")
            graph_id = params_json.get("graph_id")
            size = params_json.get("size")
            order = params_json.get("order")
            task_type = params_json.get("task_type", 'all')
            trigger_type = params_json.get("trigger_type", 'all')
            task_status = params_json.get("task_status", 'all')
            all_task = task_dao.gethistorttaskbyid(graph_id, task_type, trigger_type, task_status)
            count = len(all_task)
            ret = task_dao.gethistortdata(graph_id, int(page) - 1, int(size), order, task_type, trigger_type,
                                          task_status)
            if len(ret) > 0:
                ret["all_time"] = ret[["end_time", "start_time"]].apply(
                    lambda x: self.seconds_to_hms(pd.Timedelta(
                        (pd.to_datetime(x["end_time"]) - pd.to_datetime(x["start_time"]))).total_seconds()), axis=1
                )
            rec_dict = ret.to_dict('records')
            res = {}
            res["count"] = count
            # res["df"] = rec_dict
            list_all = []
            for reslist in rec_dict:
                dict_all = {}
                for key in reslist:
                    if key == "create_user":
                        continue
                    if key == "error_report":
                        value = reslist[key]
                        value = eval(value)
                        dict_all[key] = value
                    else:
                        dict_all[key] = reslist[key]
                list_all.append(dict_all)

            res["df"] = list_all
            obj["res"] = res
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
                obj['cause'] = "you have an error in your SQL!"
            else:
                obj['cause'] = err
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = "query datasource fail"
            obj['solution'] = "Please check mariadb or sql"

        return ret_code, obj

    # 根据状态搜索
    def serchbystatus(self, params_json):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}

        try:
            page = params_json.get("page")
            task_status = params_json.get("status")
            size = params_json.get("size")
            order = params_json.get("order")
            graph_name = params_json.get("graph_name")
            count = task_dao.getCountbystatus(task_status, graph_name)
            ret = task_dao.getallbystatus(task_status, int(page) - 1, int(size), order)
            rec_dict = ret.to_dict('records')
            res = {}
            res["count"] = count
            res["df"] = rec_dict
            obj["res"] = res
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
                obj['cause'] = "you have an error in your SQL!"
            else:
                obj['cause'] = err
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = "query datasource fail"

        return ret_code, obj

    # 模糊查询
    def serachbyname(self, params_json):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            # 分页排序，是获得所有数据在分页分页排序，可以按照时间分页排序
            page = params_json.get("page")
            # user = args.get("user")
            size = params_json.get("size")
            order = params_json.get("order")
            df = task_dao.getdatabyname(params_json.get("graph_name"))
            graph_name = params_json.get("graph_name", "")
            status = params_json.get("status", "")
            dfs, count = self.tasksort(df, page, size, order, status, graph_name)

            res = {}
            res["count"] = count
            res["df"] = dfs.to_dict('records')

            obj["res"] = res
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = "insert connection fail"

        return ret_code, obj

    # 过滤正在运行和等待中的任务的数量
    def runtasknum(self, df):
        df_run = df.loc[df['task_status'] == 'running']
        df_wait = df.loc[df['task_status'] == 'waiting']
        # df_other = df.loc[~df['task_status'].isin(['running', "waiting"])]

        # df_all = pd.DataFrame()
        # df_all = df_all.append(df_run)
        # df_all = df_all.append(df_wait)
        # df_all = df_all.append(df_other)

        return len(df_run) + len(df_wait)

    # 分页排序
    def tasksort(self, df, page, size, order, status, graph_name):
        # 根据条件过滤之后再排序
        graph_name = graph_name.lower()
        if graph_name != "":
            # df = df.loc[df["graph_name"].str.contains(graph_name)]
            dd = []
            for index, row in df.iterrows():
                state = row["graph_name"]
                state = state.lower()
                if state.__contains__(graph_name):
                    dd.append(row)
            df = pd.DataFrame(dd)

        if status != "all" and len(df) > 0:
            print(22)
            df = df.loc[df["task_status"] == status]

        if len(df) > 0:
            df_run = df.loc[df['task_status'] == 'running']
            df_wait = df.loc[df['task_status'] == 'waiting']
            df_other = df.loc[~df['task_status'].isin(['running', "waiting"])]
        else:
            df_run = pd.DataFrame()
            df_wait = pd.DataFrame()
            df_other = pd.DataFrame()

        df_all = pd.DataFrame()
        df_all = df_all.append(df_run)
        df_all = df_all.append(df_wait)
        df_all = df_all.append(df_other)
        ascend = False
        if order == "ascend":
            ascend = True
        if len(df_all) > 0:
            dfs = df_all.groupby("task_status", sort=False).apply(
                lambda x: x.sort_values("create_time", ascending=ascend).reset_index(drop=True))
            count = len(dfs)
        else:
            dfs = pd.DataFrame()
            count = len(dfs)

        dfs = dfs[(int(page) - 1) * int(size): (int(page) - 1) * int(size) + int(size)]
        return dfs, count

    # 停止任务 更新状态
    def updatestoptask(self, task_id):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}

        try:
            task_dao.updatestatusbyid("stop", "", task_id)
            obj["res"] = "update status success"
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
                obj['cause'] = "you have an error in your SQL!"
            else:
                obj['cause'] = err
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = "update status fail"

        return ret_code, obj

    def updatetaredis(self, df, task_info):
        for index, row in df.iterrows():
            task_status = row["task_status"]
            if task_status == "running" or task_status == "waiting":  # 如果redis挂掉 更改状态，
                error_report = {"result": {"cause": task_info, "message": task_info},
                                "status": "FAILURE",
                                "task_id": row['task_id']}
                task_dao.updatestatusbyid("failed", '"' + str(error_report) + '"', row['task_id'])
                graph_id = row["graph_id"]  # redis 挂掉之后 修改任务状态，并修改图谱状态
                status = "failed"
                task_dao.upKgstatus(graph_id, status)
                # redis挂断插入历史数据
                from datetime import datetime
                dt = datetime.now()
                dt = str(dt.strftime("%Y-%m-%d %H:%M:%S"))
                dt = dt.split(".")[0]
                row["task_status"] = "failed"
                row["end_time"] = dt
                row["error_report"] = str(error_report)
                self.update_history(row["graph_id"], row, "host_url")

    # 定时跟新任务状态 updatetatus2
    def updatetatus2(self, df, task_info, host_url):
        # message_ip = "kg-manager"
        # message_port = "6800"
        try:
            # 根据任务id 获取任务的状态并改变任务状态
            status = ["graph_baseInfo", "graph_ds", "graph_otl", "graph_InfoExt", "graph_KMap", "graph_KMerge"]
            for index, row in df.iterrows():
                task = task_info.loc[task_info["task_id"] == str(row['task_id'])]
                error_report = ""
                # 任务在redis列表中，处理，不在不处理
                if len(task) > 0:
                    task = task.to_dict('records')
                    task = task[0]
                    task_state = task["status"]

                    # url = "https://" + message_ip + ":" + message_port + "/api/manager/v1/message"
                    # username = row["create_user"]
                    # userid = dsm_dao.getuseridbyname(username)

                    # 默认运行中 如果不在运行中的状态改变状态 其他状态不变 normal edit running waiting failed stop
                    if task_state not in status:
                        if task_state == "PENDING":
                            df.loc[index, 'task_status'] = "waiting"
                            status2 = "waiting"
                            task_dao.updatestatusbyid(status2, error_report, row['task_id'])
                            graph_id = row["graph_id"]
                            task_dao.upKgstatus(graph_id, status2)
                        elif task_state == "SUCCESS":
                            if row["task_status"] != "normal":
                                df.loc[index, 'task_status'] = "normal"
                                status2 = "normal"
                                row["task_status"] = "normal"
                                row["end_time"] = task["date_done"]
                                # 如果成功 或者失败插入历史数据 检查历史数据是否已经有了
                                history_df = task_dao.gethistortbytime(row['task_id'], task["date_done"])
                                if len(history_df) == 0:
                                    Logger.log_info("graph_id: {} SUCCESS start insert history".format(row["graph_id"]))
                                    self.update_history(row["graph_id"], row, host_url)
                                taskstat = task_dao.gettaskupdata(row['task_id'], "normal")
                                Logger.log_info("graph_id: {} SUCCESS end insert history".format(row["graph_id"]))
                                if len(taskstat) == 0:
                                    task_dao.updatestatusse(status2, row)
                                    graph_id = row["graph_id"]
                                    task_dao.upKgstatus(graph_id, status2)

                                    # message = "graph %s succeed".format(str(graph_id))
                                    # res = self.task_status_send(url, graph_id, userid, message)
                                    # print(res)


                        elif task_state == "FAILURE":
                            if row["task_status"] != "failed":
                                df.loc[index, 'task_status'] = "failed"
                                error_report = task["all_res"]
                                df.loc[index, 'error_report'] = str(error_report)
                                status2 = "failed"
                                row["task_status"] = "failed"
                                row["end_time"] = task["date_done"]
                                row["error_report"] = str(error_report)
                                history_df = task_dao.gethistortbytime(row['task_id'], task["date_done"])
                                if len(history_df) == 0:
                                    Logger.log_info("graph_id: {} FAILURE start insert history".format(row["graph_id"]))
                                    self.update_history(row["graph_id"], row, host_url)
                                task_ta = task_dao.getbystatusid(row['task_id'])
                                Logger.log_info("graph_id: {} end insert history".format(row["graph_id"]))
                                if len(task_ta) > 0:
                                    Logger.log_info("graph_id: {} FAILURE start update".format(row["graph_id"]))
                                    task_ta = task_ta.to_dict('records')
                                    task_ta = task_ta[0]
                                    task_service.deletetask(None, task_ta["graph_id"])
                                    task_dao.addtaskerr(task_ta, "failed", str(error_report))
                                    graph_id = row["graph_id"]
                                    task_dao.upKgstatus(graph_id, status2)
                                    Logger.log_info("graph_id: {} FAILURE end update".format(row["graph_id"]))

                                    # message = "graph %s failed".format(str(graph_id))
                                    # res = self.task_status_send(url, graph_id, userid, message)
                                    # print(res)


                        elif task_state == "REVOKED":
                            if row["task_status"] != "stop":
                                df.loc[index, 'task_status'] = "stop"
                                status2 = "stop"
                                task_dao.updatestatusbyid(status2, error_report, row['task_id'])
                                graph_id = row["graph_id"]
                                task_dao.upKgstatus(graph_id, status2)
                                row["end_time"] = task["date_done"]
                                self.update_history(row["graph_id"], row, host_url)
                                # message = "graph %s stoped".format(str(graph_id))
                                # res = self.task_status_send(url, graph_id, userid, message)
                                # print(res)
                        else:
                            df.loc[index, 'task_status'] = str(task_state)
                            status2 = str(task_state)
                            task_dao.updatestatusbyid(status2, error_report, row['task_id'])
                    else:
                        if row["task_status"] != "running":
                            df.loc[index, 'task_status'] = "running"
                            status2 = "running"
                            taskstat = task_dao.gettaskupdata(row['task_id'], "running")
                            if len(taskstat) == 0:
                                task_dao.updatestatusbyid(status2, error_report, row['task_id'])
                                graph_id = row["graph_id"]
                                task_dao.upKgstatus(graph_id, status2)

                                # message = "graph %s running".format(str(graph_id))
                                # res = self.task_status_send(url, graph_id, userid, message)
                                # print(res)
                # else:
                #     task_state = task["status"]
                #     if task_state =="running" or task_state=="waiting":
                #         status2 = "stop"
                #         task_dao.updatestatusbyid(status2, "error_report", row['task_id'])
                #         graph_id = row["graph_id"]
                #         task_dao.upKgstatus(graph_id, status2)
        except Exception as e:
            err = repr(e)
            Logger.log_error(err)
        return df

    def update_otl_status2(self, df, task_info, host_url):
        try:
            for index, row in df.iterrows():
                try:
                    task = task_info.loc[task_info["task_id"] == str(row['celery_task_id'])]
                    status2 = ""
                    error_report = ""
                    # 任务在redis列表中，处理，不在不处理
                    if len(task) > 0:
                        task = task.to_dict('records')
                        task = task[0]
                        task_state = task["status"]
                        # 默认运行中 如果不在运行中的状态改变状态 其他状态不变 normal edit running waiting failed stop
                        if task_state == "PENDING":
                            df.loc[index, 'task_status'] = "running"
                            status2 = "running"
                            finished_time = task["date_done"]
                            task_dao_onto.update_otl_status_byceleryid(status2, error_report, row['celery_task_id'],
                                                                       finished_time)
                        elif task_state == "SUCCESS":  ###更新結果
                            task_status = row["task_status"]
                            if task_status != "finished":
                                df.loc[index, 'task_status'] = "finished"
                            status2 = "finished"
                            result = task["result"]["res"]
                            finished_time = task["date_done"]
                            task_dao_onto.update_otl_status_byceleryid(status2, result, row['celery_task_id'],
                                                                       finished_time)
                            file_list = task["result"]["file_list"]
                            task_dao_onto.add_file_status(file_list, row['celery_task_id'])

                        elif task_state == "FAILURE":  ###更新結果
                            if row["task_status"] != "failed":
                                df.loc[index, 'task_status'] = "failed"
                                error_report = task["all_res"]
                            status2 = "failed"
                            result = task["result"]
                            finished_time = task["date_done"]
                            # result=str(result).replace("'",'"')
                            task_dao_onto.update_otl_status_byceleryid(status2, result, row['celery_task_id'],
                                                                       finished_time)
                        else:
                            df.loc[index, 'task_status'] = str(task_state)
                            status2 = str(task_state)
                            result = task["result"]
                            finished_time = task["date_done"]
                            task_dao_onto.update_otl_status_byceleryid(status2, result, row['celery_task_id'],
                                                                       finished_time)
                except Exception as e:
                    err = repr(e)
                    Logger.log_error(err)
                    continue
            return df
        except Exception as e:
            err = repr(e)
            Logger.log_error(err)
            return df

    # def getrunningtask(self):
    #     ret_code = CommonResponseStatus.SUCCESS.value
    #     obj={}
    #     try:
    #         df = task_dao.get_otl_Count()
    #         # 获得任务列表中的所有task_id
    #         df_taskid = df["celery_task_id"]
    #         df_taskid_list = df_taskid.values.tolist()
    #         # 遍历获取所有任务的信息
    #         status_code, task_info = task_dao.get_otl_taskall(df_taskid_list)
    #         if status_code!=200:
    #             return status_code, task_info
    #         else:
    #             status=task_info["status"].values.tolist()
    #             if status.count("PENDING")>=3:
    #                 obj["running"]=False
    #                 return ret_code,obj
    #             else:
    #                 obj["running"] = True
    #                 return ret_code,obj
    #
    #     except Exception as e:
    #         ret_code = CommonResponseStatus.SERVER_ERROR.value
    #         err = repr(e)
    #         obj['cause'] = err
    #         if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
    #             obj['cause'] = "you have an error in your SQL!"
    #         obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
    #         if "Duplicate entry" in err:
    #             obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
    #         obj['message'] = " otl predict task fail"
    #
    #     return ret_code, obj

    def getrunningtask(self):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            df = task_dao_onto.getrunningtask()
            task_status = df["task_status"].values.tolist()
            if task_status.count("running") >= 3:
                obj["running"] = False
                return ret_code, obj
            else:
                obj["running"] = True
                return ret_code, obj
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            if "Duplicate entry" in err:
                obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
            obj['message'] = " otl predict task fail"

            return ret_code, obj

    # 获取正在运行的任务
    def getruntask(self, args, host_url):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            # # 获取之前刷新一次
            # import celery_scheduler
            # celery_scheduler.updatedata()
            kgIds = args.get("kgIds")
            if len(kgIds) != 0:
                df = task_dao.getRunCount(kgIds)
            else:
                df = []
            # # 更新任务的状态
            # df = self.updatetaskstatus(df)  #
            # num = self.runtasknum(df)

            res = {}
            res["count"] = len(df)
            obj["res"] = res
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = "insert connection fail"

        return ret_code, obj

    # 获取任务详情
    def getdetailtask(self, graph_id, host_url):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            detail_v = task_dao.taskdetail(graph_id)
            obj["res"] = str(detail_v)
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = "insert connection fail"

        return ret_code, obj

    # 获取任务列表
    def getalltask(self, args, host_url):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            # 分页排序，是获得所有数据在分页排序，因为有三层排序，不知道第n页的数据
            kgIds = args.get("kgIds")
            propertyIds = args.get("propertyId")
            page = args.get("page")
            # user = args.get("user")
            size = args.get("size")
            order = args.get("order")
            status = args.get("status")
            graph_name = args.get("graph_name")
            task_type = args.get("task_type")
            trigger_type = args.get("trigger_type")
            graph_id = args.get("graph_id")
            graph_name = graph_name.replace("_", "\_")
            count = task_dao.getnumbysn(status, graph_name, graph_id, task_type, trigger_type)
            invalid_graph_df = task_dao.get_invalid_graph()
            invalid_graph_ids = invalid_graph_df['id'].tolist()
            # df = task_dao.getCount()
            # v1.0.04之前的版本 分组排序
            # dfs,count = self.tasksort(df, page, size, order,status,graph_name)
            dfs = task_dao.getallbysn(int(page) - 1, int(size), order, status, graph_name, graph_id, task_type,
                                      trigger_type)
            if len(dfs) > 0:
                dfs["all_time"] = dfs[["end_time", "start_time"]].apply(
                    lambda x: self.seconds_to_hms(pd.Timedelta(
                        (pd.to_datetime(x["end_time"]) - pd.to_datetime(x["start_time"]))).total_seconds()) if x[
                        "end_time"] else None, axis=1)
            if permission_manage:
                df_data = pd.DataFrame({"graph_id": kgIds, "propertyId": propertyIds})
                dfs = pd.merge(dfs, df_data, on=["graph_id"], how="left")
            # 将Nan类型转为0
            dfs = dfs.fillna(value=0)
            rec_dict = dfs.to_dict('records')
            res = {}
            res["count"] = count
            list_all = []
            for reslist in rec_dict:
                effective_storage = True
                dict_all = {}
                graph_id = reslist['graph_id']
                if graph_id in invalid_graph_ids:
                    effective_storage = False
                dict_all['effective_storage'] = effective_storage
                for key in reslist:
                    if key == "create_user":
                        continue
                    if key == "error_report":
                        value = reslist[key]
                        if value != "":
                            value = eval(str(value))
                            # value = value.replace("#", '"')
                        else:
                            value = ""
                        dict_all[key] = value
                    if key in ("end_time", "all_time"):
                        value = reslist[key]
                        if value == 0:
                            dict_all[key] = None
                        else:
                            dict_all[key] = value
                    # elif key == "graph_id":
                    #     detail_v = task_dao.taskdetail(reslist["graph_id"])
                    #     dict_all["detail"] = str(detail_v)
                    #     dict_all[key] = reslist[key]
                    else:
                        dict_all[key] = reslist[key]

                list_all.append(dict_all)

            res["df"] = list_all
            # res["df"] = dfs.to_dict('records')

            obj["res"] = res
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = "insert connection fail"
            obj['solution'] = "Please check mariadb or sql"
        return ret_code, obj

    def update_otl_task(self, status, error_report, celery_task_id, task_id, finished_time):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:

            task_dao_onto.update_otl_statusbyid(status, error_report, celery_task_id, task_id, finished_time)
            obj["res"] = "update task "
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            if "Duplicate entry" in err:
                obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
            obj['message'] = "update otl task fail"

        return ret_code, obj

    def get_task_by_task_id(self, task_id):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:

            ret = task_dao_onto.get_task_by_task_id(task_id)
            obj["df"] = ret
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            if "Duplicate entry" in err:
                obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
            obj['message'] = "get task by task_id fail"

        return ret_code, obj

    def get_all_otl_task(self, page, size, status, otl_id):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            ret = task_dao_onto.get_all_otl_task(page, size, status, otl_id)
            obj["df"] = ret

        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            if "Duplicate entry" in err:
                obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
            obj['message'] = "get task of otl fail"

        return ret_code, obj

    def get_all_by_otlid(self, otl_id):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            ret = task_dao_onto.get_all_by_otlid(otl_id)
            obj["df"] = ret

        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)

            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            if "Duplicate entry" in err:
                obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
            obj['message'] = "get task of otl fail"

        return ret_code, obj

    def get_all_otl_task_result(self, used_task, otl_id):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:

            ret = task_dao_onto.get_all_otl_task_result(used_task, otl_id)
            obj["df"] = ret
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            if "Duplicate entry" in err:
                obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
            obj['message'] = "get all otl task result  fail"

        return ret_code, obj

    def get_finished_otl_task_result(self, otl_id):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            ret = task_dao_onto.get_finished_otl_task_result(otl_id)
            obj["df"] = []
            if len(ret) > 0:
                rec_dict = ret.to_dict('records')
                obj["df"] = rec_dict
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            if "Duplicate entry" in err:
                obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
            obj['message'] = "get finished otl task result fail"

        return ret_code, obj

    def add_file_status(self, file_list, task_id):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            ret = task_dao_onto.add_file_status(file_list, task_id)
            obj["df"] = []
            if len(ret) > 0:
                rec_dict = ret.to_dict('records')
                obj["df"] = rec_dict
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)

            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            if "Duplicate entry" in err:
                obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
            obj['message'] = "add file status fail"

        return ret_code, obj

    def delete_otl_task(self, task_id):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            task_dao_onto.delete_otl_task(task_id)
            obj["res"] = " delete task " + str(task_id) + " success "
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            if "Duplicate entry" in err:
                obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
            obj['message'] = "delete task fail"

        return ret_code, obj

    def get_all_task_from_otl_table(self, otl_id):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            ret = task_dao_onto.get_all_task_from_otl_table(otl_id)
            obj["df"] = ret
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            if "Duplicate entry" in err:
                obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
            obj['message'] = "get all task fail"

        return ret_code, obj

    def get_multi_task_name(self, otl_id):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:

            df = task_dao_onto.get_multi_filesname(otl_id)
            num = len(df) + 1
            task_name = "Task" + str(num)
            return ret_code, task_name
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            if "Duplicate entry" in err:
                obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
            obj['message'] = "get_multi_task_name failed"
            return ret_code, obj

    def update_otl_task_filelist(self, table_list, task_id):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:

            df = task_dao_onto.update_otl_task_filelist(table_list, task_id)
            return ret_code, df
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            if "Duplicate entry" in err:
                obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
            obj['message'] = "update_otl_task_filelist"
            return ret_code, obj

    def get_task_list(self, task_list):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:

            df = task_dao_onto.get_task_list(task_list)
            obj["df"] = df
            return ret_code, obj
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            if "Duplicate entry" in err:
                obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
            obj['message'] = "get_task_list fail"
            return ret_code, obj

    # 图谱状态消息推送
    # def task_status_send(self, url, graphId, userid, message):
    #     params = {}
    #     params["pushTime"] = str(time.time())
    #     params["sender"] = "builder"
    #     params["receiver"] = userid
    #     params["type"] = "task"
    #     params["taskStatus"] = "success"
    #     params["graphId"] = graphId
    #     params["body"] = message
    #     try:
    #         response = requests.request("POST", url, data=params)
    #         if response.status_code == 200:
    #             mess = "message of graph status send success"
    #         else:
    #             mess = "message of graph status send failed"
    #     except:
    #         mess = "service error, can't send message"
    #     return mess

    # 根据定时任务id获取定时任务
    def get_timer_by_id(self, task_id, graph_id):
        graph_id = int(graph_id)
        code = CommonResponseStatus.SUCCESS.value
        desc = None
        detail = None
        solution = None
        data = {}
        try:
            ret = task_dao.get_timer_by_id(task_id, graph_id)
        except Exception as e:
            err = repr(e)
            Logger.log_error(err)
            desc = "get timer task failed"
            detail = f'{err}'
            solution = "Please check mariadb status"
            code = CommonResponseStatus.REQUEST_ERROR.value
        else:
            rec_dict = ret.to_dict('records')
            if len(rec_dict) == 0:
                desc = "timer task not exist"
                detail = "timer task not exist"
                solution = "Please user valid task_id"
                code = CommonResponseStatus.TIMER_TASK_NOT_EXIST.value
            else:
                rec_dict[0]['date_list'] = json.loads(rec_dict[0]['date_list'])
                data['data'] = rec_dict
        data['error_code'] = code
        data['desc'] = desc
        data['detail'] = detail
        data['solution'] = solution
        return code, data

    # 获取定时任务总数和每页数据
    def get_timer_data(self, graph_id, order_type, page, size):
        code = CommonResponseStatus.SUCCESS.value
        data = {}
        try:
            df = graph_dao.select_timed_count(graph_id)
            res = df.to_dict('records')
            count = res[0]['count']
            data['count'] = count
            df = graph_dao.select_timed_page(graph_id, order_type, page, size)
            res = df.to_dict('records')
            for index, row in enumerate(res):
                res[index]['date_list'] = json.loads(row['date_list'])
            data['search'] = res
        except Exception as e:
            err = repr(e)
            Logger.log_error(err)
            data['error_code'] = CommonResponseStatus.REQUEST_ERROR.value
            data['desc'] = "get timer task failed"
            data['detail'] = f'{err}'
            data['solution'] = "Please check mariadb status"
        return code, data

    # 定时任务开关
    def update_timer_switch(self, graph_id, task_id, enabled, update_user):
        code = CommonResponseStatus.SUCCESS.value
        data = {}
        try:
            graph_dao.update_timer_switch(graph_id, task_id, enabled, update_user)
        except Exception as e:
            err = repr(e)
            Logger.log_error(err)
            data['error_code'] = CommonResponseStatus.REQUEST_ERROR.value
            data['desc'] = "get timer task failed"
            data['detail'] = f'{err}'
            data['solution'] = "Please check mariadb status"
        return code, data


task_service = TaskService()
