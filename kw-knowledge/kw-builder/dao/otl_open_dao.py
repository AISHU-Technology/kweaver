# -*-coding:utf-8-*-
# @Time    : 2021/10/19 9:37
# @Author  : Lowe.li
# @Email   : Lowe.li@aishu.cn
from utils.my_pymysql_pool import connect_execute_close_db
from utils.log_info import Logger


class OtlOpenDao(object):
	@connect_execute_close_db
	def getbygraphid(self, id, connection, cursor):
		sql = """ SELECT config.id, config.`graph_baseInfo`,config.`graph_name`,config.`graph_otl`,task.`task_status`,task.`task_id` FROM `graph_config_table` AS config  LEFT JOIN graph_task_table AS task ON config.id = task.graph_id WHERE config.id =  %s"""
		Logger.log_info(sql % id)
		cursor.execute(sql, id)
		res = cursor.fetchall()
		return res


otlopendao = OtlOpenDao()