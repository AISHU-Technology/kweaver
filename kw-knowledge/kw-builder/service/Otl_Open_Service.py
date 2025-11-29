# -*-coding:utf-8-*-
# @Time    : 2021/10/18 11:39
# @Author  : Lowe.li
# @Email   : Lowe.li@aishu.cn


from dao.graph_dao import graph_dao
from utils.common_response_status import CommonResponseStatus
from utils.log_info import Logger
import common.stand_log as log_oper
from dao.otl_open_dao import otlopendao
from dao.otl_dao import otl_dao
from dao.task_onto_dao import task_dao_onto
from dao.graphdb_dao import GraphDB
import random
import re
import sys
import traceback
from flask_babel import gettext as _l


class OtlOpenService():

	def getGraphById(self, graph_id):
		ret_code = CommonResponseStatus.SUCCESS.value
		obj = {}
		otl_ids = []
		try:
			rec_dict = otlopendao.getbygraphid(graph_id)
			# df = graph_dao.getOtlBygraphId(graph_id)
			for v in rec_dict:
				otl_ids.append(v["graph_otl"])
			otl_ids = list(set(otl_ids))
			# obj["df"] = rec_dict
			# 图谱ID 不存在 或者 本体ID不存在
			if len(rec_dict) == 0 or len(otl_ids) == 0:
				ret_code = CommonResponseStatus.SERVER_ERROR.value
				obj = self.errorobj(CommonResponseStatus.OTL_OPEN_GRAPH_NOT_EXIST.value,
									"graph not exist or otl not exist!",
									"enter an existing graph id or make sure you create the ontology.",
									"graph not exist or otl not exist!", "")
				error_log = log_oper.get_error_log("graph {} not exist or otl not exist!".format(graph_id), sys._getframe())
				Logger.log_error(error_log)
			else:
				# 校验图数据库是否存在、校验图数据库DB名是否存在
				rec_dict = rec_dict[0]
				DB_ERROR = False
				dbname_exits_flag = False
				db_dict = graph_dao.getkgdbipnamebyid(graph_id)
				task_status = rec_dict["task_status"]
				if len(db_dict) == 0:
					error_log = log_oper.get_error_log("graph data not exist!", sys._getframe())  # 无数据
					Logger.log_error(error_log)
					DB_ERROR = True
				else:
					try:
						graphdb = GraphDB()
						graph_DBName = db_dict["KDB_name"]
						code, databases = graphdb.get_list()
						if graph_DBName in databases:
							dbname_exits_flag = True

						# db  需要测试连接一下是否可用
						# graph_Service.test_avaible_db(graph_DBAddress, graph_DBPort, username, password)
					except Exception as e:
						DB_ERROR = True
						error_log = log_oper.get_error_log(repr(e), sys._getframe(), traceback.format_exc())
						Logger.log_error(error_log)
				if DB_ERROR:
					ret_code = CommonResponseStatus.SERVER_ERROR.value
					obj = self.errorobj(CommonResponseStatus.OTL_OPEN_GRAPH_CANNOT_USE.value,
										"graph DB Unusable!",
										"ensure that the diagram database is available",
										"graph DB Unusable!", "")
					
					return ret_code, obj, rec_dict
				if not dbname_exits_flag:
					ret_code = CommonResponseStatus.SERVER_ERROR.value
					obj = self.errorobj(CommonResponseStatus.OTL_OPEN_GRAPH_DB_NOT_EXIST.value,
										"graph database not exist!",
										"ensure that the diagram database name exists",
										"graph database not exist!", "")
					
					return ret_code, obj, rec_dict
				if task_status == "running" or task_status == "waiting":
					ret_code = CommonResponseStatus.SERVER_ERROR.value
					obj = self.errorobj(CommonResponseStatus.OTL_OPEN_GRAPH_RUNNING.value,
										"graph is running cannot edit!",
										"wait for the end of the task",
										"graph is running cannot edit!", "")
					return ret_code, obj, rec_dict

		except Exception as e:
			err = repr(e)
			error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
			Logger.log_error(error_log)
			obj = self.errorobj(CommonResponseStatus.REQUEST_ERROR.value,
								str(err),
								"Please contact the administrator!",
								err, "")
			ret_code = CommonResponseStatus.SERVER_ERROR.value
			rec_dict = []
			
		return ret_code, obj, rec_dict

	def updateotlschema(self, params_json, rec_dict, graph_id):
		"""更新本体schema
		Args:
			params_json: 传入参数
			rec_dict: 图谱配置信息
			graph_id: 图谱id
		"""
		obj = {}
		# 获取参数
		operationtype = params_json.get("operationtype", None)  # add delete update drop
		data_type = params_json.get("data_type", None)  # entity edge entityindex edgeindex entityproperty edgeproperty
		classname = params_json.get("classname", None)
		propertyname = params_json.get("propertyname", None)
		propertytype = params_json.get("propertytype",
									   None)  # boolean,float,double,string,decimal,datetime,date,integer
		altertype = params_json.get("altertype", None)  # 修改name还是 类型 [name,type]
		oldname = params_json.get("oldname", None)  # 要修改的属性名称
		indextype = params_json.get("indextype", None)  # 索引类型 [fulltext,uniqueindex]
		indexproperties = params_json.get("indexproperties", None)  # 索引字段 [name, id....]
		edgein = params_json.get("edgein", None)  # 入边
		edgeout = params_json.get("edgeout", None)  # 出边
		unsafe = params_json.get("unsafe", None)  # 出边
		# 校验参数
		rule_operation_type = ["add", "delete", "update", "drop"]
		rule_datatype = ["entity", "edge", "entityindex", "edgeindex", "entityproperty", "edgeproperty"]
		# 校验操作类型
		if operationtype not in rule_operation_type:
			ret_code = 400
			obj["ErrorCode"] = 400000
			obj["Description"] = 'parameter operationtype illegal,must be in ["add", "delete", "update", "drop"]'
			obj["Solution"] = "modify parameter operationtype."
			obj["ErrorDetails"] = 'parameter operationtype illegal,must be in ["add", "delete", "update", "drop"]'
			obj["ErrorLink"] = ""
			return ret_code, obj
		# 校验操作对象类型
		if data_type not in rule_datatype:
			ret_code = 400
			obj = self.errorobj(400000, 'parameter data_type illegal,must be in ["entity", "edge", "index", "property"]',
								"modify parameter data_type.",
								'parameter data_type illegal,must be in ["entity", "edge", "index", "property"]', "")
			return ret_code, obj
		# 校验类名（实体类、边类）
		if classname is None:
			ret_code = 400
			obj = self.errorobj(400000, 'parameter classname cannot be empty!', "assign values to parameter classname.",
						  'parameter classname cannot be empty!', "")
			return ret_code, obj
		elif type(classname).__name__ != "str":
			ret_code = 400
			obj = self.errorobj(400000, 'The parameter classname type must be string!', "assign values to parameter classname.",
						  'The parameter classname type must be string!', "")
			return ret_code, obj
		else:
			if len(classname) > 50 or not re.search(u'^[_a-zA-Z0-9\u4e00-\u9fa5]+$', classname):
				ret_code = 400
				obj = self.errorobj(400000,
									'parameter classname error,Because classname {}  Length over 50 or Characters are not _, Chinese, English！'.format(
										classname),
									"parameter classname {} Length less than 50 or Characters are not _, Chinese, English！".format(
										classname),
									'parameter classname error,Because classname {}  Length over 50 or Characters are not _, Chinese, English！'.format(
										classname), "")
				return ret_code, obj

		ret_code, obj = self.generateorientsql(operationtype, data_type, classname, [rec_dict], graph_id=graph_id, edgein=edgein,
											   edgeout=edgeout,
											   propertyname=propertyname, propertytype=propertytype,
											   indextype=indextype, indexproperties=indexproperties,
											   altertype=altertype, oldname=oldname, unsafe=unsafe)
			

		return ret_code, obj

	def generateorientsql(self, operationtype, data_type, classname, rec_dict, **kw):
		'''本体编辑和图谱schema修改 具体实现过程'''
		ret_code = CommonResponseStatus.SUCCESS.value
		NAME_EXIST_ERROR = CommonResponseStatus.OTL_OPEN_NAME_EXIST.value
		obj = {}
		graph_id = int(rec_dict[0]["id"])
		db = eval(rec_dict[0]['graph_baseInfo'])['graph_DBName']
		graphdb = GraphDB()
		try:
			orient_sql_list = []  # 需要执行的不是一个sql；默认创建name 属性，使用事务的方式创建
			if operationtype == "add":
				if data_type == "entity":
					schema_entity_old, schema_edge_old = self.getoldotl(rec_dict)

					if classname in schema_entity_old:
						ret_code = 500
						obj = self.errorobj(NAME_EXIST_ERROR,
											'parameter classname error,Because classname {} already exists!'.format(
												classname), "Change classname {} to nonexistent.".format(classname),
											'parameter classname error,Because classname {} already exists!'.format(
												classname), "")
						
						return ret_code, obj
					# 修改图数据库schema 之 addentity
					code, res = graphdb.create_class(db, classname, pro_dict={'name': 'string'})
					if code != 200:
						desc = errdetail = solu = ''
						if graphdb.type == 'orientDB':
							desc = errdetail = str(res.get('errors'))
							solu = 'orientdb create class error'
						elif graphdb.type == 'nebulaGraph':
							desc = errdetail = res.error_msg()
							solu = 'nebula create class error'
						
						return 500,  self.errorobj(500001, desc, solu, errdetail, '')

					# 修改本体
					otl_dict, otlid = self.getotldict(rec_dict, classname)
					params_json_new = {}
					oldentity = eval(otl_dict[0]["entity"])
					oldeedge = eval(otl_dict[0]["edge"])
					entity_id = oldentity[len(oldentity) - 1]["entity_id"] if len(oldentity) > 0 else 0
					color = self.random_color()
					properties = [["name", "string"]]
					properties_index = ["name"]
					new_entity = self.buildentity(classname, color, entity_id + 1, properties, properties_index)
					oldentity.append(new_entity)

					params_json_new["entity"] = oldentity
					params_json_new["edge"] = eval(otl_dict[0]["edge"])
					params_json_new["used_task"] = []
					params_json_new["flag"] = "save"
					params_json_new["ontology_id"] = otlid

					# 插入修改后本体
					ret_code, ret_message = self.updateotl_info(otlid, params_json_new, graph_id, "host_url", "-1")
					if ret_code == 200:
						obj['res'] = "{} {} {} success".format(operationtype, data_type, classname)
						Logger.log_info("{} {} {} success".format(operationtype, data_type, classname))
						
						return ret_code, obj
					
					return ret_code, ret_message

				elif data_type == "edge":
					if kw["edgein"] is None:
						ret_code = 400
						obj = self.errorobj(400000, 'parameter edgein cannot be empty!',
											"assign values to parameter edgein.",
											'parameter edgein cannot be empty!', "")
						
						return ret_code, obj
					elif type(kw["edgein"]).__name__ != "str":
						ret_code = 400
						obj = self.errorobj(400000, 'The parameter edgein type must be string!',
											"assign values to parameter edgein.",
											'The parameter edgein type must be string!', "")
						
						return ret_code, obj
					else:
						if len(kw["edgein"]) > 50 or not re.search(u'^[_a-zA-Z0-9\u4e00-\u9fa5]+$',
																   kw["edgein"]):
							ret_code = 400
							obj = self.errorobj(400000,
												'parameter edgein error,Because edgein {}  Length over 50 or Characters are not _, Chinese, English！'.format(
													kw["edgein"]),
												"parameter edgein {} Length less than 50 or Characters are not _, Chinese, English！".format(
													kw["edgein"]),
												'parameter edgein error,Because edgein {}  Length over 50 or Characters are not _, Chinese, English！'.format(
													kw["edgein"]), "")
							
							return ret_code, obj

					if kw["edgeout"] is None:
						ret_code = 400
						obj = self.errorobj(400000, 'parameter edgeout cannot be empty!',
											"assign values to parameter edgeout.",
											'parameter edgeout cannot be empty!', "")
						
						return ret_code, obj
					elif type(kw["edgeout"]).__name__ != "str":
						ret_code = 400
						obj = self.errorobj(400000, 'The parameter edgeout type must be string!',
											"assign values to parameter edgeout.",
											'The parameter edgeout type must be string!', "")
						
						return ret_code, obj
					else:
						if len(kw["edgeout"]) > 50 or not re.search(u'^[_a-zA-Z0-9\u4e00-\u9fa5]+$',
																	kw["edgeout"]):
							ret_code = 400
							obj = self.errorobj(400000,
												'parameter edgeout error,Because edgeout {}  Length over 50 or Characters are not _, Chinese, English！'.format(
													kw["edgeout"]),
												"parameter edgeout {} Length less than 50 or Characters are not _, Chinese, English！".format(
													kw["edgeout"]),
												'parameter edgein error,Because edgeout {}  Length over 50 or Characters are not _, Chinese, English！'.format(
													kw["edgeout"]), "")
							
							return ret_code, obj
					schema_entity_old, schema_edge_old = self.getoldotl(rec_dict)
					# 只判断边类名称是否已存在
					if classname in schema_edge_old:
						ret_code = 500
						obj = self.errorobj(NAME_EXIST_ERROR,
											'parameter classname error,Because classname {} already exists!'.format(
												classname), "Change classname {} to nonexistent.".format(classname),
											'parameter classname error,Because classname {} already exists!'.format(
												classname), "")
						
						return ret_code, obj

					if kw["edgein"] not in schema_entity_old:
						ret_code = 500
						obj = self.errorobj(NAME_EXIST_ERROR,
											'parameter edgein error,Because edgein {} not exists!'.format(
												kw["edgein"]),
											"Change edgein {} .".format(kw["edgein"]),
											'parameter edgein error,Because edgein {} not exists!'.format(
												kw["edgein"]), "")
						
						return ret_code, obj
					if kw["edgeout"] not in schema_entity_old:
						ret_code = 500
						obj = self.errorobj(NAME_EXIST_ERROR,
											'parameter edgeout error,Because edgeout {} not exists!'.format(
												kw["edgeout"]),
											"Change edgeout {}.".format(kw["edgeout"]),
											'parameter edgeout error,Because edgeout {} not exists!'.format(
												kw["edgeout"]), "")
						
						return ret_code, obj
					# 修改图数据库schema 之 addedge
					code, res = graphdb.create_edge_class(classname, ['name'],
														  {classname: {'name': 'string'}}, db)
					if code != 200:
						desc = errdetail = solu = ''
						if graphdb.type == 'orientDB':
							desc = errdetail = str(res.get('errors'))
							solu = 'orientdb create edge class error'
						elif graphdb.type == 'nebulaGraph':
							desc = errdetail = res.error_msg()
							solu = 'nebula create edge class error'
						
						return 500, self.errorobj(500001, desc, solu, errdetail, '')

					# 修改本体
					otl_dict, otlid = self.getotldict(rec_dict, classname)
					params_json_new = {}
					oldentity = eval(otl_dict[0]["entity"])
					oldeedge = eval(otl_dict[0]["edge"])
					edge_id = oldeedge[len(oldeedge) - 1]["edge_id"] if len(oldeedge) > 0 else 0
					color = self.random_color()
					properties = [["name", "string"]]
					properties_index = ["name"]
					relations = [kw["edgeout"], classname, kw["edgein"]]
					new_edge = self.buildedge(classname, color, edge_id + 1, properties, properties_index, relations)
					oldeedge.append(new_edge)

					params_json_new["entity"] = oldentity
					params_json_new["edge"] = oldeedge
					params_json_new["used_task"] = []
					params_json_new["flag"] = "save"
					params_json_new["ontology_id"] = otlid
					# 插入修改后的本体
					ret_code, ret_message = self.updateotl_info(otlid, params_json_new, graph_id, "host_url", "-1")
					if ret_code == 200:
						message = "{} {} {} from {} to {} success".format(operationtype, data_type, classname,
																		  kw["edgeout"], kw["edgein"])
						obj['res'] = message
						Logger.log_info(message)
						
						return ret_code, obj
					
					return ret_code, ret_message
				elif "property" in data_type:
					if kw["propertyname"] is None:
						ret_code = 400
						obj = self.errorobj(400000, 'parameter propertyname cannot be empty !',
											"assign values to parameter propertyname.",
											'parameter edgein cannot be propertyname !', "")
						
						return ret_code, obj
					elif type(kw["propertyname"]).__name__ != "str":
						ret_code = 400
						obj = self.errorobj(400000, 'The parameter propertyname type must be string!',
											"assign values to parameter propertyname.",
											'The parameter propertyname type must be string!', "")
						
						return ret_code, obj
					else:
						if len(kw["propertyname"]) > 50 or not re.search(u'^[_a-zA-Z0-9\u4e00-\u9fa5]+$',
																		 kw["propertyname"]):
							ret_code = 400
							obj = self.errorobj(400000,
												'parameter propertyname error,Because propertyname {}  Length over 50 or Characters are not _, Chinese, English！'.format(
													kw["propertyname"]),
												"parameter propertyname {} Length less than 50 or Characters are not _, Chinese, English！".format(
													kw["propertyname"]),
												'parameter propertyname error,Because propertyname {}  Length over 50 or Characters are not _, Chinese, English！'.format(
													kw["propertyname"]), "")
							
							return ret_code, obj
					if kw["propertytype"] is None:
						ret_code = 400
						obj = self.errorobj(400000, 'parameter propertytype cannot be empty!',
											"assign values to parameter propertytype.",
											'parameter propertytype be empty!', "")
						
						return ret_code, obj
					else:  # 属性类型是否正确
						if kw["propertytype"] not in ["boolean", "float", "double", "string", "decimal", "datetime",
													  "date", "integer"]:
							ret_code = 400
							obj = self.errorobj(400000,
												'parameter propertytype illegal,must be in ["boolean","float","double","string","decimal","datetime","date","integer"]',
												"modify parameter propertytype.",
												'parameter propertytype illegal,must be in ["boolean","float","double","string","decimal","datetime","date","integer"]',
												"")
							
							return ret_code, obj
					# 原来的实体类 和 边类
					schema_entity_old, schema_edge_old = self.getoldotl(rec_dict)
					if data_type == "entityproperty":
						schema_old_en_ed = schema_entity_old
					elif data_type == "edgeproperty":
						schema_old_en_ed = schema_edge_old
					# 类是否存在
					if classname in schema_old_en_ed:
						# 属性是否已存在
						if kw["propertyname"] in schema_old_en_ed[classname]:
							ret_code = 500
							obj = self.errorobj(NAME_EXIST_ERROR,
												'parameter propertyname error,Because propertyname {} already exists in class {}!'.format(
													kw["propertyname"], classname),
												"Please change propertyname the value does not already exist {}.".format(
													str(schema_old_en_ed[classname])),
												'parameter propertyname error,Because propertyname {} already exists in class {}!'.format(
													kw["propertyname"], classname), "")
							
							return ret_code, obj
					else:
						ret_code = 500
						obj = self.errorobj(NAME_EXIST_ERROR,
											'parameter classname {} does not exist!'.format(classname),
											"Please fill in an classname existing .",
											'parameter classname {} does not exist!'.format(classname), "")
						
						return ret_code, obj
					# 修改图数据库schema 之 addproperty
					if data_type == "entityproperty":
						class_type = 'tag'
					elif data_type == "edgeproperty":
						class_type = 'edge'
					code, res = graphdb.alter_class(db, classname, class_type=class_type, op='add_prop',
													otl_pro=[kw["propertyname"]],
													en_pro_dict={classname: {kw["propertyname"]: kw["propertytype"]}}
													)
					if code != 200:
						desc = errdetail = solu = ''
						if graphdb.type == 'orientDB':
							desc = errdetail = str(res.get('errors'))
							solu = 'orientdb add property error'
						elif graphdb.type == 'nebulaGraph':
							desc = errdetail = res.error_msg()
							solu = 'nebula add property error'
						
						return 500, self.errorobj(500001, desc, solu, errdetail, '')
					# 修改本体
					otl_dict, otlid = self.getotldict(rec_dict, classname)
					params_json_new = {}
					oldentity = eval(otl_dict[0]["entity"])
					oldeedge = eval(otl_dict[0]["edge"])
					if data_type == "entityproperty":
						otl_old_en_ed = oldentity
					elif data_type == "edgeproperty":
						otl_old_en_ed = oldeedge
					for i in range(len(otl_old_en_ed)):
						if classname == otl_old_en_ed[i]["name"]:
							class_properties = otl_old_en_ed[i]["properties"]
							class_properties.append({'name': str(kw["propertyname"]),
													 'data_type': str(kw["propertytype"])})
							otl_old_en_ed[i]["properties"] = class_properties
							break
					if data_type == "entityproperty":
						params_json_new["entity"] = otl_old_en_ed
						params_json_new["edge"] = oldeedge
					elif data_type == "edgeproperty":
						params_json_new["entity"] = oldentity
						params_json_new["edge"] = otl_old_en_ed
					params_json_new["used_task"] = []
					params_json_new["flag"] = "save"
					params_json_new["ontology_id"] = otlid
					# 插入修改后的本体
					ret_code, ret_message = self.updateotl_info(otlid, params_json_new, graph_id, "host_url", "-1")
					if ret_code == 200:
						message = "{} {} {}: {}  success".format(operationtype, data_type, classname, kw["propertyname"])
						obj['res'] = message
						Logger.log_info(message)
						
						return ret_code, obj
					
					return ret_code, ret_message
				elif "index" in data_type:
					if kw["indexproperties"] is None or type(kw["indexproperties"]) != list:
						ret_code = 400
						obj = self.errorobj(400000,
											'parameter indexproperties cannot be empty and indexproperties must be list!',
											"assign values to parameter indexproperties.",
											'parameter edgein cannot be indexproperties and indexproperties must be list!',
											"")
						
						return ret_code, obj
					for listElement in kw["indexproperties"]:
						if type(listElement).__name__ != "str":
							ret_code = 400
							obj = self.errorobj(400000,
												'The types in the parameters indexproperties must all be string!',
												"assign values to parameter indexproperties.",
												'The types in the parameters indexproperties must all be string!',
												"")
							
							return ret_code, obj
						if len(listElement) > 50 or not re.search(u'^[_a-zA-Z0-9\u4e00-\u9fa5]+$',
																		 listElement):
							ret_code = 400
							obj = self.errorobj(400000,
												'parameter indexproperties error,Because indexproperties {}  Length over 50 or Characters are not _, Chinese, English！'.format(
													listElement),
												"parameter indexproperties {} Length less than 50 or Characters are not _, Chinese, English！".format(
													listElement),
												'parameter indexproperties error,Because indexproperties {}  Length over 50 or Characters are not _, Chinese, English！'.format(
													listElement), "")
							
							return ret_code, obj


					if kw["indextype"] is None:
						ret_code = 400
						obj = self.errorobj(400000, 'parameter indextype cannot be empty!',
											"assign values to parameter indextype.",
											'parameter indextype be empty!', "")
						
						return ret_code, obj
					else:  # 属性类型是否正确  "uniqueindex" 去除
						if kw["indextype"] not in ["fulltext"]:
							ret_code = 400
							obj = self.errorobj(400000, 'parameter indextype illegal,must be in ["fulltext"]',
												"modify parameter indextype.",
												'parameter indextype illegal,must be in ["fulltext"]', "")
							
							return ret_code, obj
					# 原来的实体类 和 边类
					schema_entity_old, schema_edge_old = self.getoldotl(rec_dict)
					if data_type == "entityindex":
						schema_old_en_ed = schema_entity_old
					elif data_type == "edgeindex":
						schema_old_en_ed = schema_edge_old
					# 类是否存在
					if classname in schema_old_en_ed:
						# 判断 要建索引的字段是否都在 类的索引内
						if not set(kw["indexproperties"]) <= set(schema_old_en_ed[classname]):
							ret_code = 500
							obj = self.errorobj(NAME_EXIST_ERROR,
												'The field to be indexed is not in {}!'.format(
													schema_old_en_ed[classname]),
												"Check the elements {} in the collection indexproperties ,must be in {}.".format(
													str(kw["indexproperties"]), str(schema_old_en_ed[classname])),
												'The field to be indexed is not in {}!'.format(
													schema_old_en_ed[classname]), "")
							
							return ret_code, obj
					else:
						ret_code = 500
						obj = self.errorobj(NAME_EXIST_ERROR,
											'parameter classname {} does not exist!'.format(classname),
											"Please fill in an classname existing .",
											'parameter classname {} does not exist!'.format(classname), "")
						
						return ret_code, obj

					# 修改图数据库schema 之 addindex
					code, res = graphdb.get_present_index(db)
					_, present_index_name, _, _ = res
					code, res = graphdb.create_full_index(classname, kw["indexproperties"], present_index_name, db)
					if code != 200:
						desc = errdetail = solu = ''
						if graphdb.type == 'orientDB':
							desc = errdetail = str(res.get('errors'))
							solu = 'orientdb add property error'
						elif graphdb.type == 'nebulaGraph':
							desc = errdetail = str(res.get('error'))
							solu = 'nebula add property error'
						
						return 500, self.errorobj(500001, desc, solu, errdetail, '')

					if kw["indextype"] == "fulltext":
						# 修改本体
						otl_dict, otlid = self.getotldict(rec_dict, classname)
						params_json_new = {}
						oldentity = eval(otl_dict[0]["entity"])
						oldeedge = eval(otl_dict[0]["edge"])
						if data_type == "entityindex":
							otl_old_en_ed = oldentity
						elif data_type == "edgeindex":
							otl_old_en_ed = oldeedge
						for i in range(len(otl_old_en_ed)):
							if classname == otl_old_en_ed[i]["name"]:
								# 直接将索引属性替换新的
								if "name" not in kw["indexproperties"]:
									kw["indexproperties"].append("name")
								otl_old_en_ed[i]["properties_index"] = kw["indexproperties"]
						if data_type == "entityindex":
							params_json_new["entity"] = otl_old_en_ed
							params_json_new["edge"] = oldeedge
						elif data_type == "edgeindex":
							params_json_new["entity"] = oldentity
							params_json_new["edge"] = otl_old_en_ed
						params_json_new["used_task"] = []
						params_json_new["flag"] = "save"
						params_json_new["ontology_id"] = otlid
						# 插入修改后本体
						ret_code, ret_message = self.updateotl_info(otlid, params_json_new, graph_id, "host_url", "-1")
						if ret_code == 200:
							message = "{} {} {}: {}  success".format(operationtype, data_type, classname,
																	 kw["indexproperties"])
							obj['res'] = message
							
							return ret_code, obj
						
						return ret_code, ret_message
					else:
						message = "{} {} {}: {}  success".format(operationtype, data_type, classname,
																 kw["indexproperties"])
						obj['res'] = message
						
						return ret_code, obj
			elif operationtype == "update":
				if data_type == "entity" or data_type == "edge":
					if kw["altertype"] is None:
						ret_code = 400
						obj = self.errorobj(400000, 'parameter altertype cannot be empty!',
											"assign values to parameter altertype.",
											'parameter altertype be empty!', "")
						
						return ret_code, obj
					else:  # 属性类型是否正确
						if kw["altertype"] not in ["name"]:
							ret_code = 400
							obj = self.errorobj(400000, 'parameter propertytype illegal,must be in ["name"]',
												"modify parameter altertype.",
												'parameter propertytype illegal,must be in ["name"]', "")
							
							return ret_code, obj
					if kw["oldname"] is None:
						ret_code = 400
						obj = self.errorobj(400000, 'parameter oldname cannot be empty!',
											"assign values to parameter oldname.",
											'parameter oldname altertype be empty!', "")
						
						return ret_code, obj
					elif type(kw["oldname"]).__name__ != "str":
						ret_code = 400
						obj = self.errorobj(400000, 'The parameter oldname type must be string!',
											"assign values to parameter oldname.",
											'The parameter oldname type must be string!', "")
						
						return ret_code, obj
					else:
						if len(kw["oldname"]) > 50 or not re.search(u'^[_a-zA-Z0-9\u4e00-\u9fa5]+$',
																		 kw["oldname"]):
							ret_code = 400
							obj = self.errorobj(400000,
												'parameter oldname error,Because oldname {}  Length over 50 or Characters are not _, Chinese, English！'.format(
													kw["oldname"]),
												"parameter oldname {} Length less than 50 or Characters are not _, Chinese, English！".format(
													kw["oldname"]),
												'parameter oldname error,Because oldname {}  Length over 50 or Characters are not _, Chinese, English！'.format(
													kw["oldname"]), "")
							
							return ret_code, obj
					if kw["unsafe"] is None:
						kw["unsafe"] = False
					else:  # 属性类型是否正确
						if kw["unsafe"] not in ["True", "False"]:
							ret_code = 400
							obj = self.errorobj(400000, 'parameter unsafe illegal,must be in ["True", "False"]',
												"modify parameter unsafe.",
												'parameter unsafe illegal,must be in ["True", "False"]', "")
							
							return ret_code, obj

					# 原来的实体类 和 边类
					schema_entity_old, schema_edge_old = self.getoldotl(rec_dict)
					if data_type == "entity":
						schema_old_en_ed = schema_entity_old
					elif data_type == "edge":
						schema_old_en_ed = schema_edge_old
					# 类是否存在
					if kw["oldname"] not in schema_old_en_ed:
						ret_code = 500
						obj = self.errorobj(NAME_EXIST_ERROR,
											'parameter oldname {} does not exist!'.format(kw["oldname"]),
											"Please fill in an oldname existing .",
											'parameter oldname {} does not exist!'.format(kw["oldname"]), "")
						
						return ret_code, obj
					if classname in schema_old_en_ed:
						if kw["oldname"] != classname:  # 传入一样的名称
							ret_code = 500
							obj = self.errorobj(NAME_EXIST_ERROR,
												'parameter classname error,Because classname {} already exists !'.format(
													classname),
												"Please change classname the value does not already exist {}.".format(
													classname),
												'parameter classname error,Because classname {} already exists !'.format(
													classname), "")
							
							return ret_code, obj

					if graphdb.type != 'orientDB':
						obj = self.errorobj(500001, 'nebula does not support alter class name.',
												  'you can not alter class name for nebula graphdb.',
												  'nebula does not support alter class name.', '')
						
						return 500, obj
					# 修改图数据库schema 之 updateclass
					code, res = graphdb.alter_class(db, classname, op='alter_name', oldname=kw["oldname"], unsafe=kw["unsafe"])
					if code != 200:
						desc = errdetail = str(res.get('errors'))
						solu = 'orientdb alter class name error'
						
						return 500, self.errorobj(500001, desc, solu, errdetail, '')
					# 修改 class name  如果实体类 已作为出边入边 修改 in  out
					# 修改本体
					otl_dict, otlid = self.getotldict(rec_dict, classname)

					params_json_new = {}
					oldentity = eval(otl_dict[0]["entity"])
					oldeedge = eval(otl_dict[0]["edge"])

					# 如果是实体类
					if data_type == "entity":
						# 将原来的类名 替换成新的类名
						for i in range(len(oldentity)):
							if kw["oldname"] == oldentity[i]["name"]:
								oldentity[i]["name"] = classname
								break
						# 如果是实体类名， 关系类中可能有使用到 该实体类名
						for i in range(len(oldeedge)):
							relations = oldeedge[i]["relations"]
							if kw["oldname"] in relations:
								relations[relations.index(kw["oldname"])] = classname
								oldeedge[i]["relations"] = relations
						params_json_new["entity"] = oldentity
						params_json_new["edge"] = oldeedge
					# 如果是修改关系类名，只修改关系类名就可
					if data_type == "edge":
						# 将原来的类名 替换成新的类名
						for i in range(len(oldeedge)):
							if kw["oldname"] == oldeedge[i]["name"]:
								oldeedge[i]["name"] = classname
								break
						params_json_new["entity"] = oldentity
						params_json_new["edge"] = oldeedge
					params_json_new["used_task"] = []
					params_json_new["flag"] = "save"
					params_json_new["ontology_id"] = otlid
					# 插入修改后的本体
					ret_code, ret_message = self.updateotl_info(otlid, params_json_new, graph_id, "host_url", "-1")
					if ret_code == 200:
						message = "{} {} {}: {}  success".format(operationtype, data_type, kw["oldname"], classname)
						obj['res'] = message
						Logger.log_info(message)
						
						return ret_code, obj
					
					return ret_code, ret_message
				elif "property" in data_type:
					if kw["altertype"] is None:
						ret_code = 400
						obj = self.errorobj(400000, 'parameter altertype cannot be empty!',
											"assign values to parameter altertype.",
											'parameter altertype be empty!', "")
						
						return ret_code, obj
					else:  # 属性类型是否正确
						if kw["altertype"] not in ["name"]:
							ret_code = 400
							obj = self.errorobj(400000, 'parameter propertytype illegal,must be in ["name"]',
												"modify parameter altertype.",
												'parameter propertytype illegal,must be in ["name"]', "")
							
							return ret_code, obj
					# 要修改的属性名称
					if kw["oldname"] is None:
						ret_code = 400
						obj = self.errorobj(400000, 'parameter oldname cannot be empty!',
											"assign values to parameter oldname.",
											'parameter oldname cannot be empty!', "")
						
						return ret_code, obj
					elif type(kw["oldname"]).__name__ != "str":
						ret_code = 400
						obj = self.errorobj(400000, 'The parameter oldname type must be string!',
											"assign values to parameter oldname.",
											'The parameter oldname type must be string!', "")
						
						return ret_code, obj
					elif len(kw["oldname"]) > 50 or not re.search(u'^[_a-zA-Z0-9\u4e00-\u9fa5]+$',
																	kw["oldname"]):
						ret_code = 400
						obj = self.errorobj(400000,
											'parameter oldname error,Because oldname {}  Length over 50 or Characters are not _, Chinese, English！'.format(
												kw["oldname"]),
											"parameter oldname {} Length less than 50 or Characters are not _, Chinese, English！".format(
												kw["oldname"]),
											'parameter oldname error,Because oldname {}  Length over 50 or Characters are not _, Chinese, English！'.format(
												kw["oldname"]), "")
						
						return ret_code, obj

					else:
						if kw["oldname"] == "name":
							ret_code = 400
							obj = self.errorobj(400000, 'parameter oldname cannot be name!',
												"assign values to parameter oldname.",
												'parameter oldname cannot be name!', "")
							
							return ret_code, obj
					# 修改属性 type  需要 参数 propertytype
					if kw["altertype"] == "type":
						if kw["propertytype"] is None:
							ret_code = 400
							obj = self.errorobj(400000, 'parameter propertytype cannot be empty!',
												"assign values to parameter propertytype.",
												'parameter propertytype be empty!', "")
							
							return ret_code, obj
						else:  # 属性类型是否正确
							if kw["propertytype"] not in ["boolean", "float", "double", "string", "decimal", "datetime",
														  "date", "integer"]:
								ret_code = 400
								obj = self.errorobj(400000,
													'parameter propertytype illegal,must be in ["boolean","float","double","string","decimal","datetime","date","integer"]',
													"modify parameter propertytype.",
													'parameter propertytype illegal,must be in ["boolean","float","double","string","decimal","datetime","date","integer"]',
													"")
								
								return ret_code, obj
					# 修改属性 中的name时  需要 参数 propertyname
					if kw["altertype"] == "name":
						if kw["propertyname"] is None:
							ret_code = 400
							obj = self.errorobj(400000, 'parameter propertyname cannot be empty!',
												"assign values to parameter propertyname.",
												'parameter propertyname be empty!', "")
							
							return ret_code, obj
						elif type(kw["propertyname"]).__name__ != "str":
							ret_code = 400
							obj = self.errorobj(400000, 'The parameter propertyname type must be string!',
												"assign values to parameter propertyname.",
												'The parameter propertyname type must be string!', "")
							
							return ret_code, obj
						else:
							if len(kw["propertyname"]) > 50 or not re.search(u'^[_a-zA-Z0-9\u4e00-\u9fa5]+$',
																			 kw["propertyname"]):
								ret_code = 400
								obj = self.errorobj(400000,
													'parameter propertyname error,Because propertyname {}  Length over 50 or Characters are not _, Chinese, English！'.format(
														kw["propertyname"]),
													"parameter propertyname {} Length less than 50 or Characters are not _, Chinese, English！".format(
														kw["propertyname"]),
													'parameter propertyname error,Because propertyname {}  Length over 50 or Characters are not _, Chinese, English！'.format(
														kw["propertyname"]), "")
								
								return ret_code, obj

					# 原来的实体类 和 边类
					schema_entity_old, schema_edge_old = self.getoldotl(rec_dict)
					if data_type == "entityproperty":
						schema_old_en_ed = schema_entity_old
					elif data_type == "edgeproperty":
						schema_old_en_ed = schema_edge_old
					# 类是否存在
					if classname in schema_old_en_ed:
						if kw["altertype"] == "name":
							# 判断要修改的属性是否存在
							if kw["oldname"] not in schema_old_en_ed[classname]:
								ret_code = 500
								obj = self.errorobj(NAME_EXIST_ERROR,
													'parameter oldname error,Because oldname {} does not exist!'.format(
														kw["oldname"]),
													"Please fill in an propertyname existing .",
													'parameter propertyname error,Because oldname {} does not exist!'.format(
														kw["oldname"]), "")
								
								return ret_code, obj
							# 判断 修改后的属性 是否合法 1.属性名已存在不能修改 2.字符规则
							if kw["propertyname"] in schema_old_en_ed[classname]:
								if kw["propertyname"] != kw["oldname"]:
									ret_code = 500
									obj = self.errorobj(NAME_EXIST_ERROR,
														'parameter propertyname error,Because propertyname {} already exists in class {}!'.format(
															kw["propertyname"], classname),
														"Please change propertyname the value does not already exist {}.".format(
															str(schema_old_en_ed[classname])),
														'parameter propertyname error,Because propertyname {} already exists in class {}!'.format(
															kw["propertyname"], classname), "")
									
									return ret_code, obj


					else:
						ret_code = 500
						obj = self.errorobj(NAME_EXIST_ERROR,
											'parameter classname {} does not exist!'.format(classname),
											"Please fill in an classname existing .",
											'parameter classname {} does not exist!'.format(classname), "")
						
						return ret_code, obj
					if graphdb.type != 'orientDB':
						obj = self.errorobj(500001, 'nebula does not support alter property name.',
												  'you can not alter property name for nebula graphdb.',
												  'nebula does not support alter property name.', '')
						
						return 500, obj
					# 修改图数据库schema 之 updateproperty
					code, res = graphdb.alter_class(db, classname, op='alter_prop', oldname=kw["oldname"],
													altertype=kw["altertype"], propertyname=kw["propertyname"],
													propertytype=kw["propertytype"])
					if code != 200:
						desc = errdetail = str(res.get('errors'))
						solu = 'orientdb alter class name error'
						
						return 500, self.errorobj(500001, desc, solu, errdetail, '')

					# 修改本体
					otl_dict, otlid = self.getotldict(rec_dict, classname)
					params_json_new = {}
					oldentity = eval(otl_dict[0]["entity"])
					oldeedge = eval(otl_dict[0]["edge"])
					if data_type == "entityproperty":
						otl_old_en_ed = oldentity
					elif data_type == "edgeproperty":
						otl_old_en_ed = oldeedge
					for i in range(len(otl_old_en_ed)):
						if classname == otl_old_en_ed[i]["name"]:
							class_properties = otl_old_en_ed[i]["properties"]
							for ptindex in range(len(class_properties)):
								pro_type = class_properties[ptindex]
								if pro_type['name'] == kw["oldname"]:
									if kw["altertype"] == "type":
										pro_type['data_type'] = kw["propertytype"]
									if kw["altertype"] == "name":
										pro_type['name'] = kw["propertyname"]
									class_properties[ptindex] = pro_type
									otl_old_en_ed[i]["properties"] = class_properties
									break
							properties_index = otl_old_en_ed[i]["properties_index"]
							if kw["oldname"] in properties_index:
								properties_index[properties_index.index(kw["oldname"])] = kw["propertyname"]
								otl_old_en_ed[i]["properties_index"] = properties_index
					if data_type == "entityproperty":
						params_json_new["entity"] = otl_old_en_ed
						params_json_new["edge"] = oldeedge
					elif data_type == "edgeproperty":
						params_json_new["entity"] = oldentity
						params_json_new["edge"] = otl_old_en_ed
					params_json_new["used_task"] = []
					params_json_new["flag"] = "save"
					params_json_new["ontology_id"] = otlid
					# 插入修改后的本体
					ret_code, ret_message = self.updateotl_info(otlid, params_json_new, graph_id, "host_url", "-1")
					if ret_code == 200:
						message = "{} {} {}: {}  success".format(operationtype, data_type, classname, kw["propertyname"])
						obj['res'] = message
						Logger.log_info(message)
						
						return ret_code, obj
					
					return ret_code, ret_message
				else:
					ret_code = 400
					obj = self.errorobj(400000, 'parameter data_type is illegal!',
										"assign values to parameter propertyname.",
										'parameter propertyname is illegal !', "")
					
					return ret_code, obj

			elif operationtype == "delete":
				if data_type == "entity" or data_type == "edge":
					# 原来的实体类 和 边类
					schema_entity_old, schema_edge_old = self.getoldotl(rec_dict)
					if data_type == "entity":
						schema_old_en_ed = schema_entity_old
					elif data_type == "edge":
						schema_old_en_ed = schema_edge_old
					# 类是否存在
					if classname not in schema_old_en_ed:
						ret_code = 500
						obj = self.errorobj(NAME_EXIST_ERROR,
											'parameter classname {} does not exist!'.format(classname),
											"Please fill in an classname existing .",
											'parameter classname {} does not exist!'.format(classname), "")
						
						return ret_code, obj
					# 修改图数据库schema 之 dropclass
					# 删除实体了，跟实体相关的边还在
					if data_type == "entity":
						class_type = 'tag'
					elif data_type == "edge":
						class_type = 'edge'
					code, res = graphdb.drop_class(db, classname, class_type=class_type)
					if code != 200:
						desc = errdetail = solu = ''
						if graphdb.type == 'orientDB':
							desc = errdetail = str(res.get('errors'))
							solu = 'orientdb drop class error'
						elif graphdb.type == 'nebulaGraph':
							try:
								# 报错信息来自于nebula
								desc = errdetail = res.error_msg()
							except Exception:
								# 报错信息来自于es
								desc = errdetail = str(res.get('error'))
							solu = 'nebula drop class error'
						
						return 500, self.errorobj(500001, desc, solu, errdetail, '')

					# 修改本体
					otl_dict, otlid = self.getotldict(rec_dict, classname)
					params_json_new = {}
					oldentity = eval(otl_dict[0]["entity"])
					oldeedge = eval(otl_dict[0]["edge"])
					if data_type == "entity":
						otl_old_en_ed = oldentity
					elif data_type == "edge":
						otl_old_en_ed = oldeedge
					# 重组新的实体类和边类
					otl_new_en_ed = []
					for i in range(len(otl_old_en_ed)):
						if classname == otl_old_en_ed[i]["name"]:
							if data_type == "entity":
								# 如果是实体类， 关系类中可能有使用到 该实体类,则将该关系删除
								newedge = []
								for edgeindex in range(len(oldeedge)):
									relations = oldeedge[edgeindex]["relations"]
									if classname not in relations:
										newedge.append(oldeedge[edgeindex])
								oldeedge = newedge
						else:
							otl_new_en_ed.append(otl_old_en_ed[i])
					otl_old_en_ed = otl_new_en_ed
					if data_type == "entity":
						params_json_new["entity"] = otl_old_en_ed
						params_json_new["edge"] = oldeedge
					elif data_type == "edge":
						params_json_new["entity"] = oldentity
						params_json_new["edge"] = otl_old_en_ed
					params_json_new["used_task"] = []
					params_json_new["flag"] = "save"
					params_json_new["ontology_id"] = otlid
					# 插入修改后的本体
					ret_code, ret_message = self.updateotl_info(otlid, params_json_new, graph_id, "host_url", "-1")
					if ret_code == 200:
						message = "{} {} {}: {}  success".format(operationtype, data_type, classname,
																 kw["propertyname"])
						obj['res'] = message
						Logger.log_info(message)
						
						return ret_code, obj
					
					return ret_code, ret_message


				elif "property" in data_type:
					if kw["propertyname"] is None:
						ret_code = 400
						obj = self.errorobj(400000, 'parameter propertyname cannot be empty !',
											"assign values to parameter propertyname.",
											'parameter propertyname cannot be empty !', "")
						
						return ret_code, obj
					elif type(kw["propertyname"]).__name__ != "str":
						ret_code = 400
						obj = self.errorobj(400000, 'The parameter propertyname type must be string!',
											"assign values to parameter propertyname.",
											'The parameter propertyname type must be string!', "")
						
						return ret_code, obj
					elif len(kw["propertyname"]) > 50 or not re.search(u'^[_a-zA-Z0-9\u4e00-\u9fa5]+$',
																	 kw["propertyname"]):
						ret_code = 400
						obj = self.errorobj(400000,
											'parameter propertyname error,Because propertyname {}  Length over 50 or Characters are not _, Chinese, English！'.format(
												kw["propertyname"]),
											"parameter propertyname {} Length less than 50 or Characters are not _, Chinese, English！".format(
												kw["propertyname"]),
											'parameter propertyname error,Because propertyname {}  Length over 50 or Characters are not _, Chinese, English！'.format(
												kw["propertyname"]), "")
						
						return ret_code, obj
					else:
						if kw["propertyname"] == "name":
							ret_code = 400
							obj = self.errorobj(400000, 'parameter propertyname cannot be name !',
												"assign values to parameter propertyname.",
												'parameter propertyname cannot be name !', "")
							
							return ret_code, obj

					if kw["unsafe"] is None:
						kw["unsafe"] = False
					else:  # 属性类型是否正确
						if kw["unsafe"] not in ["True", "False"]:
							ret_code = 400
							obj = self.errorobj(400000, 'parameter unsafe illegal,must be in ["True", "False"]',
												"modify parameter unsafe.",
												'parameter unsafe illegal,must be in ["True", "False"]', "")
							
							return ret_code, obj

					# 原来的实体类 和 边类
					schema_entity_old, schema_edge_old = self.getoldotl(rec_dict)
					if data_type == "entityproperty":
						schema_old_en_ed = schema_entity_old
					elif data_type == "edgeproperty":
						schema_old_en_ed = schema_edge_old
					# 类是否存在
					if classname in schema_old_en_ed:
						# 判断要修改的属性是否存在
						if kw["propertyname"] not in schema_old_en_ed[classname]:
							ret_code = 500
							obj = self.errorobj(NAME_EXIST_ERROR,
												'parameter propertyname error,Because propertyname {} does not exist!'.format(
													kw["propertyname"]),
												"Please fill in an propertyname existing .",
												'parameter propertyname error,Because propertyname {} does not exist!'.format(
													kw["propertyname"]), "")
							
							return ret_code, obj

					else:
						ret_code = 500
						obj = self.errorobj(NAME_EXIST_ERROR,
											'parameter classname {} does not exist!'.format(classname),
											"Please fill in an classname existing .",
											'parameter classname {} does not exist!'.format(classname), "")
						
						return ret_code, obj
					# 修改图数据库schema 之 deleteproperty
					if data_type == "entityproperty":
						class_type = 'tag'
					elif data_type == "edgeproperty":
						class_type = 'edge'
					code, res = graphdb.alter_class(db, classname, class_type=class_type, op='drop_prop',
													propertyname=kw["propertyname"], unsafe=kw["unsafe"])
					if code != 200:
						desc = errdetail = solu = ''
						if graphdb.type == 'orientDB':
							desc = errdetail = str(res.get('errors'))
							solu = 'orientdb drop property error'
						elif graphdb.type == 'nebulaGraph':
							try:
								# 报错信息来自于nebula
								desc = errdetail = res.error_msg()
							except Exception:
								# 报错信息来自于es
								desc = errdetail = str(res.get('error'))
							solu = 'nebula drop property error'
						
						return 500, self.errorobj(500001, desc, solu, errdetail, '')

					# 修改本体
					otl_dict, otlid = self.getotldict(rec_dict, classname)
					params_json_new = {}
					oldentity = eval(otl_dict[0]["entity"])
					oldeedge = eval(otl_dict[0]["edge"])
					if data_type == "entityproperty":
						otl_old_en_ed = oldentity
					elif data_type == "edgeproperty":
						otl_old_en_ed = oldeedge
					for i in range(len(otl_old_en_ed)):
						if classname == otl_old_en_ed[i]["name"]:
							class_properties = otl_old_en_ed[i]["properties"]
							for ptindex in range(len(class_properties)):
								pro_type = class_properties[ptindex]
								if pro_type['name'] == kw["propertyname"]:
									class_properties.pop(ptindex)
									otl_old_en_ed[i]["properties"] = class_properties
									break
							properties_index = otl_old_en_ed[i]["properties_index"]
							if kw["propertyname"] in properties_index:
								properties_index.pop(properties_index.index(kw["propertyname"]))
								otl_old_en_ed[i]["properties_index"] = properties_index
					if data_type == "entityproperty":
						params_json_new["entity"] = otl_old_en_ed
						params_json_new["edge"] = oldeedge
					elif data_type == "edgeproperty":
						params_json_new["entity"] = oldentity
						params_json_new["edge"] = otl_old_en_ed
					params_json_new["used_task"] = []
					params_json_new["flag"] = "save"
					params_json_new["ontology_id"] = otlid
					# 插入修改后的本体
					ret_code, ret_message = self.updateotl_info(otlid, params_json_new, graph_id, "host_url", "-1")
					if ret_code == 200:
						message = "{} {} {}: {}  success".format(operationtype, data_type, classname, kw["propertyname"])
						obj['res'] = message
						Logger.log_info(message)
						
						return ret_code, obj
					
					return ret_code, ret_message
				else:
					ret_code = 400
					obj = self.errorobj(400000, 'parameter data_type is illegal!',
										"assign values to parameter propertyname.",
										'parameter propertyname is illegal !', "")
					
					return ret_code, obj
		except Exception as e:
			ret_code = CommonResponseStatus.SERVER_ERROR.value
			err = repr(e)
			obj = self.errorobj(500001, err, "Please contact the administrator!", err, "")
			
			return ret_code, obj

	def getotldict(self, rec_dict, classname):
		"""
		Args:
			rec_dict: 图谱配置信息
		Returns:
			otl_dict: 本体信息 [dict]
			otlid: 本体id
		"""
		rec_dict = rec_dict[0]
		graph_otl = rec_dict["graph_otl"]
		otlid = int(graph_otl)
		# 本体
		if graph_otl is not None and graph_otl != "":
			otl_dict = otl_dao.getbyid(otlid)
			
			return otl_dict, otlid
			
		return {}, otlid

	def getoldotl(self, rec_dict):
		"""获取旧的本体信息
		Args:
			rec_dict: 图谱配置信息
		Returns:
			schema_entity_old：本体实体类信息 {实体类名: 属性列表}
			schema_edge_old: 实体边类信息 {边类名: 属性列表}
		"""
		# 类名是否需要参数校验
		schema_entity_old = {}
		schema_edge_old = {}
		if len(rec_dict) > 0:
			rec_dict = rec_dict[0]
			graph_otl = rec_dict["graph_otl"]
			# 本体
			if graph_otl is not None and graph_otl != "":
				otl_dict = otl_dao.getbyid(graph_otl)
				for entitys in eval(otl_dict[0]["entity"]):
					en_properties = entitys["properties"]
					en_pros = []
					for en_pro in en_properties:
						en_pros.append(en_pro['name'])
					schema_entity_old[entitys["name"]] = en_pros
				for edges in eval(otl_dict[0]["edge"]):
					ed_properties = edges["properties"]
					ed_pros = []
					for ed_pro in ed_properties:
						ed_pros.append(ed_pro['name'])
					schema_edge_old[edges["name"]] = ed_pros
			
		return schema_entity_old, schema_edge_old

	def errorobj(self, code, desc, solu, errdetail, errlink):
		obj = {}
		obj["ErrorCode"] = code
		obj["Description"] = desc
		obj["Solution"] = solu
		obj["ErrorDetails"] = errdetail
		obj["ErrorLink"] = errlink
		return obj

	def oriendb_batch_http(self, address, db, sql, port, username, password):
		import requests
		from requests.auth import HTTPBasicAuth
		orient_url = "http://{}:{}/batch/{}".format(address, port, db)
		body = {
			"transaction": False,
			"operations": [
				{
					"type": "script",
					"language": "sql",
					"script": sql
				}
			]
		}
		headers = {"Connection": "close"}
		or_res = requests.post(url=orient_url, headers=headers, json=body,
							   auth=HTTPBasicAuth(username, password))
		if or_res.status_code != 200:
			obj = self.errorobj(500001, eval(or_res.content), "orientdb sql error", eval(or_res.content), or_res.url)
			return 500, obj
		return 200, {}

	def updateotl_info(self, otl_id, params_json, graph_id, host_url, flag):
		ret_code = CommonResponseStatus.SUCCESS.value
		obj = {}
		try:
			ret = otl_dao.getbyid(otl_id)
			otl_id = params_json["ontology_id"]
			flag_save = params_json["flag"]
			all_data = task_dao_onto.get_all_by_otlid(otl_id)
			alltask = [info["task_id"] for info in all_data]
			params_json["all_task"] = alltask
			running_task = [info["task_status"] for info in all_data]
			if "running" in running_task:
				if flag_save == "nextstep":
					ret_code = CommonResponseStatus.SERVER_ERROR.value
					obj['cause'] = _l("Operation failed, importing entities in bulk, please try again later")
					obj['code'] = CommonResponseStatus.CANT_SAVE_OTL.value
					obj['message'] = "insert fail"
					
					return ret_code, obj

			# 本体不存在
			if len(ret) == 0:
				ret_code = CommonResponseStatus.SERVER_ERROR.value
				obj['cause'] = "id  %s not exist!" % otl_id
				obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
				obj['message'] = "update fail"
				
				return ret_code, obj
			# 不可编辑  #被使用能编辑
			else:
				otl_dao.update_info(otl_id, params_json, graph_id)
				obj["res"] = "update "
				

		except Exception as e:
			ret_code = CommonResponseStatus.SERVER_ERROR.value
			err = repr(e)
			error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
			Logger.log_error(error_log)
			obj['cause'] = err
			if "SQL" in err or "DatabaseError" in err or "MariaDB" in err or "column" in err.lower() or "row" in err.lower():
				obj['cause'] = "you have an error in your SQL!"
			obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
			if "Duplicate entry" in err:
				obj['cause'] = "database already have the same name"
				obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
			obj['message'] = "update fail"
				

		return ret_code, obj

	def random_color(self):
		colors1 = '0123456789ABCDEF'
		num = "#"
		for _ in range(6):
			num += random.choice(colors1)
		return num

	def buildentity(self, classname, color, id, properties, properties_index):
		new_entity = {"entity_id": id,
					  "colour": str(color),
					  "ds_name": "",
					  "data_type": "",
					  "data_source": "",
					  "ds_path": "",
					  "ds_id": "",
					  "extract_type": "",
					  "name": str(classname),
					  "source_table": [],
					  "source_type": "manual",
					  "properties": properties,
					  "file_type": "",
					  "task_id": "",
					  "properties_index": properties_index,
					  "model": "",
					  "ds_address": "",
					  'alias': str(classname)}
		return new_entity

	def buildedge(self, classname, color, id, properties, properties_index, relations):
		new_edge = {"edge_id": id,
					"colour": str(color),
					"ds_name": "",
					"data_type": "",
					"data_source": "",
					"ds_id": "",
					"extract_type": "",
					"name": str(classname),
					"source_table": [],
					"source_type": "manual",
					"properties": properties,
					"file_type": "",
					"task_id": "",
					"properties_index": properties_index,
					"model": "",
					"relations": relations,
					"ds_address": "",
					'alias': str(classname)}
		return new_edge


otlOpenSerivice = OtlOpenService()
