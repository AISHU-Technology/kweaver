# -*- coding: utf-8 -*-
'''
@Author ：Jay.zhu
@Date ：2022/8/12 16:42
'''

import arrow
import rdsdriver

from dao.intelligence_dao import intelligence_dao
from utils.log_info import Logger
from utils.my_pymysql_pool import connect_execute_commit_close_db, connect_execute_close_db
from snowflake import SnowflakeGenerator

class LexiconDao:
    """
    对词库 lexcion 的管理和维护
    """
    
    @connect_execute_commit_close_db
    def insert_lexicon(self, params_json, user_id, cursor, connection):
        """ 新建词库 """
        value_list = []
        value_list.append(params_json.get("name"))  # 词库名称
        value_list.append(str(params_json.get("description", "")))  # 词库描述
        value_list.append(params_json.get("knowledge_id"))  # 知识网络ID
        value_list.append(user_id)  # 创建者uuid
        value_list.append(user_id)  # 最终操作人uuid
        value_list.append(arrow.now().format('YYYY-MM-DD HH:mm:ss'))  # 创建时间
        value_list.append(arrow.now().format('YYYY-MM-DD HH:mm:ss'))  # 最终操作时间
        value_list.append(str(params_json.get("columns", [])))  # 词库title
        value_list.append(params_json.get("status", "running"))  # 词库status
        value_list.append("")  # 词库error_info
        value_list.append(params_json.get("mode", ""))
        value_list.append("")

        sql = """
                INSERT INTO lexicon (lexicon_name, description, knowledge_id, create_by,
                 update_by, create_time, update_time, columns, status, error_info, mode, extract_info)
                 VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                """
        Logger.log_info("insert_lexicon: {}".format(sql % tuple(value_list)))
        cursor.execute(sql, value_list)
        new_id = rdsdriver.process_last_row_id(cursor.lastrowid)
        return new_id
    
    @connect_execute_commit_close_db
    def get_id_by_name(self, lexicon_name, knowledge_id, connection, cursor):
        """ 根据词库名称查找ID """
        sql = """
                 SELECT id FROM lexicon WHERE lexicon_name = %s AND knowledge_id=%s;
                """
        value_list = [lexicon_name, knowledge_id]
        Logger.log_info(sql % tuple(value_list))
        cursor.execute(sql, value_list)
        res = cursor.fetchall()
        return res
    
    @connect_execute_commit_close_db
    def get_knowledge_by_id(self, knowledge_id, connection, cursor):
        """ 查找知识网络ID """
        sql = """
                     SELECT id FROM knowledge_network WHERE id ={};
                    """
        sql = sql.format(knowledge_id)
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res
    
    @connect_execute_commit_close_db
    def get_knowledge_by_lexicon_id(self, lexicon_id, connection, cursor):
        """ 根据词库名称查找ID """
        sql = """
                         SELECT knowledge_id FROM lexicon WHERE id ={};
                        """
        sql = sql.format(lexicon_id)
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    @connect_execute_commit_close_db
    def get_lexicon_count(self, knowledge_id, lexicon_ids, connection, cursor):
        """ 返回指定knowledge_id下的所有词库数量"""
        condition = " "
        if len(lexicon_ids) > 0:
            condition = " AND id IN ({}) ".format(",".join(map(str, lexicon_ids)))
        sql = """ SELECT id FROM lexicon WHERE knowledge_id={} """ + condition + """;"""
        sql = sql.format(knowledge_id)
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return len(res)
    
    @connect_execute_commit_close_db
    def get_all_lexicon(self, knowledge_id, rule, order_type, page, size, lexicon_ids, connection, cursor):
        """ 返回指定knowledge_id下的所有词库信息（id和name）"""
        condition = " "
        if len(lexicon_ids) > 0:
            condition = " AND id IN ({}) ".format(",".join(map(str, lexicon_ids)))

        sql = """ SELECT * FROM lexicon WHERE knowledge_id={}""" + condition + """ ORDER BY {} {} LIMIT {}, {}; """
        sql = sql.format(knowledge_id, rule, order_type, (page - 1) * size, size)
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res
    
    @connect_execute_commit_close_db
    def get_all_lexicon_by_name(self, knowledge_id, search_name, lexicon_ids, connection, cursor):
        """ 在指定knowledge_id下的所有词库中根据名称模糊搜索"""
        # 在名字中模糊搜索
        condition = " "
        if len(lexicon_ids) > 0:
            condition = " AND id IN ({}) ".format(",".join(map(str, lexicon_ids)))
        sql = """ SELECT * FROM lexicon WHERE knowledge_id=%s """ + condition + """AND lexicon_name LIKE %s; """
        value_list = [knowledge_id, '%' + search_name + '%']
        Logger.log_info(sql % tuple(value_list))
        cursor.execute(sql, value_list)
        res = cursor.fetchall()
        return res

    @connect_execute_commit_close_db
    def get_all_status(self, lexicon_ids, connection, cursor):
        """ 返回指定knowledge_id下的所有词库的标签"""
        sql = """SELECT id FROM lexicon WHERE status!='{}' AND id IN ({});""".format("running", ",".join(map(str, lexicon_ids)))
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res
    
    @connect_execute_commit_close_db
    def get_lexicon_by_id(self, ids, connection, cursor):
        """ 根据id查找词库信息"""
        if isinstance(ids, int):
            sql = """SELECT * FROM lexicon WHERE id={};""".format(ids)
        else:
            sql = """SELECT * FROM lexicon WHERE id IN ({});""".format(",".join(map(str, ids)))
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res
    
    @connect_execute_commit_close_db
    def get_lexicon_by_condition(self, name, page, size, connection, cursor):
        """ 根据词库名称模糊搜索查找词库"""
        sql = """
                    SELECT id, lexicon_name FROM lexicon WHERE lexicon_name LIKE {} ORDER BY update_time DESC LIMIT {}, {};
                   """
        sql = sql.format(name, (page - 1) * size, size)
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res
    
    @connect_execute_commit_close_db
    def get_columns_from_lexicon(self, id, connection, cursor):
        """ 获取用户name和userId"""
        sql = """
                    SELECT `columns` FROM lexicon WHERE id=%s;
            """
        Logger.log_info(sql)
        cursor.execute(sql, id)
        res = cursor.fetchall()
        return res
    
    @connect_execute_commit_close_db
    def update_lexicon(self, id, name, description, extract_info, user_id, connection, cursor):
        """ 编辑词库信息"""
        value_list = []
        update_by = user_id
        update_time = arrow.now().format('YYYY-MM-DD HH:mm:ss')
        value_list.append(name)
        value_list.append(description)
        value_list.append(update_by)
        value_list.append(update_time)
        if extract_info is not None:
            value_list.append(str(extract_info))
            sql = """
                UPDATE lexicon SET lexicon_name=%s, description=%s, update_by=%s, update_time=%s, extract_info=%s
                 WHERE id=%s;
            """
        else:
            sql = """
                UPDATE lexicon SET lexicon_name=%s, description=%s, update_by=%s, update_time=%s WHERE id=%s;
            """
        value_list.append(id)
        Logger.log_info("update lexicon: {}".format(sql % tuple(value_list)))
        cursor.execute(sql, value_list)
        new_id = rdsdriver.process_last_row_id(cursor.lastrowid)
        return new_id
    
    @connect_execute_commit_close_db
    def update_lexicon_user_and_time(self, id, user_id, connection, cursor):
        """ 编辑词库信息"""
        sql = """
                    UPDATE lexicon SET update_by='{}', update_time='{}' WHERE id={};
                """
        update_by = user_id
        update_time = arrow.now().format('YYYY-MM-DD HH:mm:ss')
        sql = sql.format(update_by, update_time, id)
        Logger.log_info("update lexicon: {}".format(sql))
        cursor.execute(sql)
        new_id = rdsdriver.process_last_row_id(cursor.lastrowid)
        return new_id

    @connect_execute_commit_close_db
    def update_lexicon_error_info(self, id, error_info, connection, cursor):
        """ 编辑词库信息"""
        values_list = []
        sql = """
                        UPDATE lexicon SET error_info=%s WHERE id=%s;
                    """
        values_list.append(error_info)
        values_list.append(str(id))
        cursor.execute(sql, values_list)
        Logger.log_info("update lexicon error_info: {}".format(sql % tuple(values_list)))
        new_id = rdsdriver.process_last_row_id(cursor.lastrowid)
        return new_id
    
    @connect_execute_commit_close_db
    def update_lexicon_columns(self, id, columns, user_id, connection, cursor):
        """ 编辑词库信息"""
        sql = """
                        UPDATE lexicon SET update_by='{}', update_time='{}', columns='{}' WHERE id={};
                    """
        update_by = user_id
        update_time = arrow.now().format('YYYY-MM-DD HH:mm:ss')
        columns = str(columns).replace("'", '"')
        sql = sql.format(update_by, update_time, columns, id)
        Logger.log_info("update lexicon: {}".format(sql))
        cursor.execute(sql)
        new_id = rdsdriver.process_last_row_id(cursor.lastrowid)
        return new_id

    @connect_execute_commit_close_db
    def update_lexicon_status(self, id, status, connection, cursor):
        """ 编辑词库信息"""
        if status == "running":
            sql = """
                            UPDATE lexicon SET status='{}', error_info='' WHERE id={};
                        """
            sql = sql.format(status, id)
        else:
            sql = """
                                    UPDATE lexicon SET status='{}' WHERE id={};
                                """
            sql = sql.format(status, id)
        Logger.log_info("update lexicon status: {}".format(sql))
        cursor.execute(sql)
        new_id = rdsdriver.process_last_row_id(cursor.lastrowid)
        return new_id
        
    @connect_execute_commit_close_db
    def delete_lexicon(self, ids, connection, cursor):
        """ 根据id删除词库信息与词库知识量 """
        sql = """
                DELETE FROM lexicon WHERE id IN ({});
               """
        sql2 = """
                delete from intelligence_records where resource_id in ({}) and type=1;
        """.format(",".join(map(str, ids)))
        sql = sql.format(",".join(map(str, ids)))
        Logger.log_info("delete lexicon: {}".format(sql))
        cursor.execute(sql)
        new_id = rdsdriver.process_last_row_id(cursor.lastrowid)
        Logger.log_info(sql2)
        cursor.execute(sql2)
        return new_id

    @connect_execute_close_db
    def get_lexicon_by_knw(self, knw_ids, connection, cursor):
        knw_ids = [str(knw_id) for knw_id in knw_ids]
        sql = """ select id from lexicon where knowledge_id in ({}); """.format(','.join(knw_ids))
        Logger.log_info(sql)
        cursor.execute(sql)
        return cursor.fetchall()

    @connect_execute_commit_close_db
    def init_status(self, connection, cursor):
        sql = """update lexicon set status='failed', error_info='Service interruption' where status='running';"""
        Logger.log_info(sql)
        cursor.execute(sql)
        return rdsdriver.process_last_row_id(cursor.lastrowid)

    @connect_execute_commit_close_db
    def write_lexicon_words(self, user_id, lexicon_id, word_dict_list, cursor, connection):
        """ 导入词汇 """

        mode = ""
        value_list = []
        gen = SnowflakeGenerator(42)
        for word_dict in word_dict_list:
            value_list.append(next(gen))  # 雪花id
            value_list.append(lexicon_id)
            if "synonym" in word_dict:
                mode = "std"
                value_list.append(word_dict["synonym"])
                value_list.append(word_dict["std_name"])
                value_list.append(word_dict["std_property"])
                value_list.append(word_dict["ent_name"])
                value_list.append(word_dict["graph_id"])

            elif "vid" in word_dict:
                mode = "entity_link"
                value_list.append(word_dict["words"])
                value_list.append(word_dict["vid"])
                value_list.append(word_dict["ent_name"])
                value_list.append(word_dict["graph_id"])
            else:
                mode = "custom"
                value_list.append(word_dict["words"])

            value_list.append(user_id)  # 创建者uuid
            value_list.append(user_id)  # 最终操作人uuid
            value_list.append(arrow.now().format('YYYY-MM-DD HH:mm:ss'))  # 创建时间
            value_list.append(arrow.now().format('YYYY-MM-DD HH:mm:ss'))  # 最终操作时间

        table_name = "lexicon_" + mode + "_words"
        sql = "SELECT count(*) FROM {} WHERE lexicon_id =%s;"
        sql = sql.format(table_name)
        Logger.log_info(sql)
        cursor.execute(sql, lexicon_id)
        ret = cursor.fetchall()
        if ret[0]["count"] <= 0:
            # 根据词汇格式修改mode
            sql2 = "UPDATE lexicon SET mode=%s WHERE id=%s;"
            Logger.log_info("update lexicon: {}".format(sql2))
            cursor.execute(sql2, (mode, id))

            intelligence_dao.create_lexicon_knowledge(lexicon_id)

        sql = """
                INSERT INTO {} (id, lexicon_id, {}, create_by, update_by, create_time, update_time)
                 VALUES{}
                """

        if mode == "std":
            sql = sql.format(table_name, "synonym, std_name, std_property, ent_name, graph_id",
                             ",".join(["(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)"] * len(word_dict_list)))
        elif mode == "entity_link":
            sql = sql.format(table_name, "words, vid, ent_name, graph_id",
                             ",".join(["(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)"] * len(word_dict_list)))
        elif mode == "custom":
            sql = sql.format(table_name, "words",
                             ",".join(["(%s,%s,%s,%s,%s,%s,%s)"] * len(word_dict_list)))


        Logger.log_info("insert_lexicon: {}".format(sql % tuple(value_list)))
        cursor.execute(sql, value_list)

        count = ret[0]["count"] + len(word_dict_list)
        intelligence_dao.update_lexicon_knowledge(lexicon_id, count, "add")

    @connect_execute_close_db
    def get_mode_by_lexicon_id(self, lexicon_id, connection, cursor):
        sql = """
                    SELECT `mode` FROM lexicon WHERE id=%s;
            """
        Logger.log_info(sql)
        cursor.execute(sql, lexicon_id)
        res = cursor.fetchall()
        return res[0]["mode"]

    @connect_execute_close_db
    def is_word_exist_info(self, lexicon_id, word_info, cursor, connection):

        mode = self.get_mode_by_lexicon_id(lexicon_id)

        if not mode:
            return False

        sql = "SELECT count(*) FROM {} WHERE lexicon_id =%s and {};"
        table_name = "lexicon_" + mode + "_words"

        condition = ""
        values = ()
        if "synonym" in word_info:
            condition = "synonym = %s and std_name = %s and std_property = %s and ent_name = %s and graph_id = %s"
            values = (lexicon_id, word_info["synonym"], word_info["std_name"], word_info["std_property"], word_info["ent_name"], word_info["graph_id"])

        elif "vid" in word_info:
            condition = "words = %s and vid = %s and ent_name = %s and graph_id = %s"
            values = (lexicon_id, word_info["words"], word_info["vid"], word_info["ent_name"], word_info["graph_id"])
        else:
            condition = "words = %s"
            values = (lexicon_id, word_info["words"])


        sql = sql.format(table_name, condition)
        Logger.log_info(sql)
        cursor.execute(sql, values)
        ret = cursor.fetchall()
        if ret[0]["count"] <= 0:  # 词库对应词汇表不存在该词汇
            return False
        return True

    @connect_execute_close_db
    def is_word_exist_id(self, lexicon_id, word_id, cursor, connection):

        mode = self.get_mode_by_lexicon_id(lexicon_id)

        if not mode:
            return False

        sql = "SELECT count(*) FROM {} WHERE lexicon_id = %s and id = %s;"
        table_name = "lexicon_" + mode + "_words"


        sql = sql.format(table_name)
        Logger.log_info(sql)
        cursor.execute(sql, (lexicon_id, word_id))
        ret = cursor.fetchall()
        if ret[0]["count"] <= 0:  # 词库对应词汇表不存在该词汇
            return False
        return True

    @connect_execute_commit_close_db
    def update_word(self, lexicon_id, word_id, new_info, cursor, connection):
        """ 修改词汇信息 """
        mode = self.get_mode_by_lexicon_id(lexicon_id)


        sql = "UPDATE {} SET {} WHERE lexicon_id =%s and id =%s;"
        table_name = "lexicon_" + mode + "_words"

        new_value = ""
        values = ()
        if mode == "std":
            new_value = "synonym = %s, std_name = %s, std_property = %s, ent_name = %s, graph_id = %s"
            values = (new_info["synonym"], new_info["std_name"], new_info["std_property"],
                      new_info["ent_name"], new_info["graph_id"], lexicon_id, word_id)
        elif mode == "entity_link":
            new_value = "words = %s, vid = %s, ent_name = %s, graph_id = %s"
            values = (new_info["words"], new_info["vid"], new_info["ent_name"], new_info["graph_id"], lexicon_id, word_id)
        else:
            new_value = "words = %s"
            values = (new_info["words"], lexicon_id, word_id)

        sql = sql.format(table_name, new_value)
        Logger.log_info(sql)
        cursor.execute(sql, values)

    @connect_execute_commit_close_db
    def delete_words(self, lexicon_id, word_ids, cursor, connection):
        """ 删除某些词汇信息 """
        mode = self.get_mode_by_lexicon_id(lexicon_id)

        sql = "DELETE FROM {} WHERE lexicon_id =%s and id in (%s);"
        table_name = "lexicon_" + mode + "_words"
        condition = ','.join([str(word_id) for word_id in word_ids])
        sql = sql.format(table_name)
        Logger.log_info(sql)
        cursor.execute(sql, (lexicon_id, condition))

        intelligence_dao.update_lexicon_knowledge(lexicon_id, len(word_ids), "reduce")

    @connect_execute_close_db
    def get_words_page(self, lexicon_id, page, size, cursor, connection):
        """ 分页获取指定词库的所有词汇信息 """

        mode = self.get_mode_by_lexicon_id(lexicon_id)

        sql = "SELECT * FROM {} WHERE lexicon_id =%s limit %s,%s;"
        table_name = "lexicon_" + mode + "_words"
        sql = sql.format(table_name)
        Logger.log_info(sql)
        cursor.execute(sql, (lexicon_id, (page - 1) * size, size))
        words = cursor.fetchall()
        for row in words:
            row['id'] = str(row['id'])

        sql2 = "SELECT id FROM {} WHERE lexicon_id =%s;"
        sql2 = sql2.format(table_name)
        Logger.log_info(sql2)
        cursor.execute(sql2, lexicon_id)
        ret = cursor.fetchall()

        return len(ret), words

    @connect_execute_close_db
    def get_all_words(self, lexicon_id, cursor, connection):
        """ 获取指定词库的所有词汇 """

        mode = self.get_mode_by_lexicon_id(lexicon_id)

        sql = "SELECT * FROM {} WHERE lexicon_id =%s;"
        table_name = "lexicon_" + mode + "_words"
        sql = sql.format(table_name)
        Logger.log_info(sql)
        cursor.execute(sql, lexicon_id)
        words = cursor.fetchall()
        for row in words:
            row['id'] = str(row['id'])
        return words

    @connect_execute_close_db
    def get_word_by_condition(self, lexicon_id, word, page, size, cursor, connection):
        """搜索指定词库的某词汇"""

        mode = self.get_mode_by_lexicon_id(lexicon_id)

        table_name = "lexicon_" + mode + "_words"
        #总数
        sql = "SELECT id FROM {} WHERE lexicon_id = %s "
        sql = sql.format(table_name)
        if mode == "std":
            sql = sql+"and (synonym like %s or std_name like %s or std_property like %s or ent_name like %s or graph_id like %s)"
            cursor.execute(sql, (lexicon_id, "%"+word+"%", "%"+word+"%", "%"+word+"%", "%"+word+"%", "%"+word+"%"))
        elif mode == "entity_link":
            sql = sql+"and (words like %s or vid like %s or ent_name like %s or graph_id like %s)"
            cursor.execute(sql, (lexicon_id, "%"+word+"%", "%"+word+"%", "%"+word+"%", "%"+word+"%"))
        else:
            sql = sql+"and words like %s"
            cursor.execute(sql, (lexicon_id, "%"+word+"%"))

        Logger.log_info(sql)
        res = cursor.fetchall()
        count_num = len(res)

        #数据
        sql = "SELECT * FROM {} WHERE lexicon_id = %s "
        sql = sql.format(table_name)
        if mode == "std":
            sql = sql+"and (synonym like %s or std_name like %s or std_property like %s or ent_name like %s or graph_id like %s) limit %s,%s"
            cursor.execute(sql, (lexicon_id, "%"+word+"%", "%"+word+"%", "%"+word+"%", "%"+word+"%", "%"+word+"%", (page - 1) * size, size))
        elif mode == "entity_link":
            sql = sql+"and (words like %s or vid like %s or ent_name like %s or graph_id like %s) limit %s,%s"
            cursor.execute(sql, (lexicon_id, "%"+word+"%", "%"+word+"%", "%"+word+"%", "%"+word+"%", (page - 1) * size, size))
        else:
            sql = sql+"and words like %s limit %s,%s"
            cursor.execute(sql, (lexicon_id, "%"+word+"%", (page - 1) * size, size))

        Logger.log_info(sql)
        res = cursor.fetchall()
        for row in res:
            row['id'] = str(row['id'])

        return count_num, res

    @connect_execute_commit_close_db
    def delete_all_words(self, lexicon_id, cursor, connection):
        """ 删除指定词库对应的所有词汇 """

        mode = self.get_mode_by_lexicon_id(lexicon_id)

        sql = "DELETE FROM {} WHERE lexicon_id =%s;"
        table_name = "lexicon_" + mode + "_words"
        sql = sql.format(table_name)
        Logger.log_info(sql)
        cursor.execute(sql, lexicon_id)


lexicon_dao = LexiconDao()
