# -*-coding:utf-8-*-
# @Time    : 2020/11/28 18:50
# @Author  : Lowe.li
# @Email   : Lowe.li@aishu.cn

import pandas as pd
import sys
import traceback

from utils.log_info import Logger
import common.stand_log as log_oper

def update_otl_data():
	# 遍历
	from dao.task_onto_dao import task_dao_onto
	from service.task_Service import task_service
	res = task_dao_onto.get_otl_Count()
	# 获得任务列表中的所有task_id
	df_taskid_list = []
	for info in res:
		df_taskid_list.append(info["celery_task_id"])
	# 遍历获取所有任务的信息
	status_code, task_info = task_dao_onto.get_otl_taskall(df_taskid_list)
	if status_code == "400":
		Logger.log_info("redis 断开，不再更新原来数据 失败，失败原因是redis挂断")
		# task_service.updateotltaredis(df, "host_url")
	else:
		try:
			df = pd.DataFrame(res)
			task_service.update_otl_status2(df, task_info,"host_url")
		except Exception as e:
			error_log = log_oper.get_error_log(repr(e), sys._getframe(), traceback.format_exc())
			Logger.log_error(error_log)

def update_otl_table():
	from dao.task_onto_dao import task_dao_onto
	from dao.otl_dao import otl_dao
	rec_dict = otl_dao.getall(-2,0,"","all")
	for one in rec_dict:
		otl_id = one["id"]
		used_task = eval(one["used_task"])
		entity = eval(one["entity"])
		entitynums = len(entity)
		task_in_table = task_dao_onto.get_all_by_otlid(otl_id)
		alltask = [info["task_id"] for info in task_in_table]
		running_task = [info["task_status"] for info in task_in_table]
		if "running" in running_task:
			otl_status = "running"
		else:
			if entitynums == 0:
				otl_status = "pending"
			else:
				otl_status = "available"
				difference = [i for i in alltask if i not in used_task]
				if len(difference) != 0:
					otl_status = "pending"

		otl_dao.update_state(otl_id,otl_status)






