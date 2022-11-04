# -*-coding:utf-8-*-

def update_otl_data():
	print("实时刷新")
	# 遍历
	from dao.task_onto_dao import task_dao_onto
	from service.task_Service import task_service
	df = task_dao_onto.get_otl_Count()
	# print(df)
	# 获得任务列表中的所有task_id
	df_taskid = df["celery_task_id"]
	df_taskid_list = df_taskid.values.tolist()
	# 遍历获取所有任务的信息
	status_code, task_info = task_dao_onto.get_otl_taskall(df_taskid_list)
	# print(task_info)
	if status_code == "400":
		print("redis 断开，不再更新原来数据 失败，失败原因是redis挂断")
	else:
		try:
			task_service.update_otl_status2(df, task_info)
		except Exception as e:
			print(e)

def update_otl_table():
	print("实时刷新state")
	from dao.task_onto_dao import task_dao_onto
	from dao.otl_dao import otl_dao
	task = otl_dao.getall(-2,0,"","all")
	rec_dict = task.to_dict('records')
	for one in rec_dict:
		otl_id = one["id"]
		used_task = eval(one["used_task"])
		entity = eval(one["entity"])
		entitynums = len(entity)
		task_in_table = task_dao_onto.get_all_by_otlid(otl_id)
		alltask = task_in_table["task_id"].tolist()
		running_task = task_in_table["task_status"].tolist()
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






