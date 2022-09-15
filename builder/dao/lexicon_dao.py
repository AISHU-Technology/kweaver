# -*- coding: utf-8 -*-
import arrow
import pandas as pd

from utils.log_info import Logger
from utils.my_pymysql_pool import connect_execute_commit_close_db, connect_execute_close_db


class LexiconDao:
    """
    对词库 lexcion 的管理和维护
    """
    
    @connect_execute_commit_close_db
    def insert_lexicon(self, params_json, cursor, connection):
        """ 新建词库 """
        value_list = []
        value_list.append(params_json.get("name"))  # 词库名称
        value_list.append(str(params_json.get("description", "")))  # 词库描述
        labels = params_json.get("labels", [])
        value_list.append(str(labels))  # 词库标签
        value_list.append(params_json.get("knowledge_id"))  # 知识网络ID
        value_list.append(arrow.now().format('YYYY-MM-DD HH:mm:ss'))  # 创建时间
        value_list.append(arrow.now().format('YYYY-MM-DD HH:mm:ss'))  # 最终操作时间
        value_list.append(str(params_json.get("columns", [])))  # 词库title
        value_list.append("running")  # 词库status
        value_list.append("")  # 词库error_info
        
        sql = """
                INSERT INTO lexicon (lexicon_name, description, labels, knowledge_id,
                create_time, update_time, columns, status, error_info) VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s)
                """
        Logger.log_info("insert_lexicon: {}".format(sql))
        cursor.execute(sql, value_list)
        new_id = cursor.lastrowid
        return new_id
    
    @connect_execute_commit_close_db
    def get_id_by_name(self, lexicon_name, knowledge_id, connection, cursor):
        """ 根据词库名称查找ID """
        sql = """
                 SELECT id FROM lexicon WHERE lexicon_name ="{}" AND knowledge_id={};
                """
        sql = sql.format(lexicon_name, knowledge_id)
        Logger.log_info(sql)
        df = pd.read_sql(sql, connection)
        return df
    
    @connect_execute_commit_close_db
    def get_knowledge_by_id(self, knowledge_id, connection, cursor):
        """ 根据词库名称查找ID """
        sql = """
                     SELECT id FROM knowledge_network WHERE id ={};
                    """
        sql = sql.format(knowledge_id)
        Logger.log_info(sql)
        df = pd.read_sql(sql, connection)
        return df
    
    @connect_execute_commit_close_db
    def get_knowledge_by_lexicon_id(self, lexicon_id, connection, cursor):
        """ 根据词库名称查找ID """
        sql = """
                         SELECT knowledge_id FROM lexicon WHERE id ={};
                        """
        sql = sql.format(lexicon_id)
        Logger.log_info(sql)
        df = pd.read_sql(sql, connection)
        return df
    
    @connect_execute_commit_close_db
    def get_lexicon_count(self, knowledge_id, connection, cursor):
        """ 返回指定knowledge_id下的所有词库数量"""
        
        sql = """
                    SELECT id FROM lexicon WHERE knowledge_id={};
                            """
        sql = sql.format(knowledge_id)
        Logger.log_info(sql)
        df = pd.read_sql(sql, connection)
        count = len(df)
        return count
    
    @connect_execute_commit_close_db
    def get_all_lexicon(self, knowledge_id, rule, order_type, page, size, connection, cursor):
        """ 返回指定knowledge_id下的所有词库信息（id和name）"""
        if rule == "name":
            rule = "lexicon_name"
        
        sql = """
                SELECT * FROM lexicon WHERE knowledge_id={} ORDER BY {} {} LIMIT {}, {};
                        """
        sql = sql.format(knowledge_id, rule, order_type, (page - 1) * size, size)
        Logger.log_info(sql)
        df = pd.read_sql(sql, connection)
        return df
    
    @connect_execute_commit_close_db
    def get_all_lexicon_by_name(self, knowledge_id, search_name, connection, cursor):
        """ 在指定knowledge_id下的所有词库中根据名称模糊搜索"""
        # 在名字中模糊搜索
        sql = """
                   SELECT * FROM lexicon WHERE knowledge_id={} AND lexicon_name LIKE '%{}%';
               """
        search_name = search_name.replace('"', '').replace("'", "")
        sql = sql.format(knowledge_id, search_name)
        Logger.log_info(sql)
        df = pd.read_sql(sql, connection)
        return df
    
    @connect_execute_commit_close_db
    def get_all_lexicon_by_label(self, knowledge_id, search_label, connection, cursor):
        """ 在指定knowledge_id下的所有词库中根据标签模糊搜索"""
        # 在标签中模糊搜索
        sql = """
                      SELECT * FROM lexicon WHERE knowledge_id={} AND labels LIKE '%{}%';
                  """
        search_label = search_label.replace('"', '').replace("'", "")
        sql = sql.format(knowledge_id, search_label)
        Logger.log_info(sql)
        df = pd.read_sql(sql, connection)
        return df
    
    @connect_execute_commit_close_db
    def get_all_labels(self, knowledge_id, connection, cursor):
        """ 返回指定knowledge_id下的所有词库的标签"""
        sql = """
                    SELECT labels FROM lexicon WHERE knowledge_id={} ORDER BY update_time DESC;
                """
        sql = sql.format(knowledge_id)
        Logger.log_info(sql)
        df = pd.read_sql(sql, connection)
        return df
    
    @connect_execute_commit_close_db
    def get_all_status(self, lexicon_ids, connection, cursor):
        """ 返回指定knowledge_id下的所有词库的标签"""
        sql = """
                    SELECT id FROM lexicon WHERE status!='{}' AND id IN ({});""".format("running",
                                                                                        ",".join(map(str, lexicon_ids)))
        Logger.log_info(sql)
        df = pd.read_sql(sql, connection)
        return df
    
    @connect_execute_commit_close_db
    def get_lexicon_by_id(self, ids, connection, cursor):
        """ 根据id查找词库信息"""
        if isinstance(ids, int):
            sql = """SELECT * FROM lexicon WHERE id={};""".format(ids)
        else:
            sql = """SELECT * FROM lexicon WHERE id IN ({});""".format(",".join(map(str, ids)))
        Logger.log_info(sql)
        df = pd.read_sql(sql, connection)
        return df
    
    @connect_execute_commit_close_db
    def get_lexicon_by_condition(self, name, page, size, connection, cursor):
        """ 根据词库名称模糊搜索查找词库"""
        sql = """
                    SELECT id, lexicon_name FROM lexicon WHERE lexicon_name LIKE {} ORDER BY update_time DESC LIMIT {}, {};
                   """
        sql = sql.format(name, (page - 1) * size, size)
        Logger.log_info(sql)
        df = pd.read_sql(sql, connection)
        return df
    
    @connect_execute_commit_close_db
    def get_columns_from_lexicon(self, id, connection, cursor):
        """ 获取用户name和uuid"""
        sql = """
                    SELECT columns FROM lexicon WHERE id={};
            """.format(id)
        Logger.log_info(sql)
        df = pd.read_sql(sql, connection)
        return df
    
    @connect_execute_commit_close_db
    def update_lexicon(self, id, name, labels, description, connection, cursor):
        """ 编辑词库信息"""
        sql = """
                UPDATE lexicon SET lexicon_name='{}', labels='{}', description='{}', update_time='{}' WHERE id={};
            """
        update_time = arrow.now().format('YYYY-MM-DD HH:mm:ss')
        sql = sql.format(name, str(labels).replace("'", '"'), description, update_time, id)
        Logger.log_info("update lexicon: {}".format(sql))
        cursor.execute(sql)
        new_id = cursor.lastrowid
        return new_id
    
    @connect_execute_commit_close_db
    def update_lexicon_user_and_time(self, id, connection, cursor):
        """ 编辑词库信息"""
        sql = """
                    UPDATE lexicon SET update_time='{}' WHERE id={};
                """
        update_time = arrow.now().format('YYYY-MM-DD HH:mm:ss')
        sql = sql.format(update_time, id)
        Logger.log_info("update lexicon: {}".format(sql))
        cursor.execute(sql)
        new_id = cursor.lastrowid
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
        Logger.log_info("update lexicon error_info: {}".format(sql))
        new_id = cursor.lastrowid
        return new_id
    
    @connect_execute_commit_close_db
    def update_lexicon_columns(self, id, columns, connection, cursor):
        """ 编辑词库信息"""
        sql = """
                        UPDATE lexicon SET update_time='{}', columns='{}' WHERE id={};
                    """
        update_time = arrow.now().format('YYYY-MM-DD HH:mm:ss')
        columns = str(columns).replace("'", '"')
        sql = sql.format(update_time, columns, id)
        Logger.log_info("update lexicon: {}".format(sql))
        cursor.execute(sql)
        new_id = cursor.lastrowid
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
        new_id = cursor.lastrowid
        return new_id
    
    @connect_execute_commit_close_db
    def delete_lexicon(self, ids, connection, cursor):
        """ 根据id查找词库信息"""
        sql = """
                DELETE FROM lexicon WHERE id IN ({});
               """
        sql = sql.format(",".join(map(str, ids)))
        Logger.log_info("delete lexicon: {}".format(sql))
        cursor.execute(sql)
        new_id = cursor.lastrowid
        return new_id
    
    def write_lexicon2mongo(self, db, mongodb_name, word_dict_list):
        """ 词汇信息写入 monogodb """
        data = db[mongodb_name].find_one()
        if not data:
            keys = list(word_dict_list[0].keys())
            _index = [(str(key), 1) for key in keys]
            db[mongodb_name].create_index(_index, unique=True)
        try:
            db[mongodb_name].insert_many(word_dict_list, ordered=False)
        except Exception as e:
            if "E11000 duplicate key error collection" in repr(e):
                pass
    
    def is_word_exist_mongo(self, db, mongodb_name, word_info):
        if not db[mongodb_name].find_one(word_info):  # mongodb不存在该词汇
            return False
        return True
    
    def update_lexicon2mongo(self, db, mongodb_name, old_info, new_info):
        """ mongodb 修改词汇信息 """
        # data = db[mongodb_name].find(new_info).count()
        # if data == 0:
        #     db[mongodb_name].remove(old_info)
        #     db[mongodb_name].insert_one(new_info)
        db[mongodb_name].update_one(old_info, {"$set": new_info})
        # else:
        #     db[mongodb_name].remove(old_info)
        #     db[mongodb_name].remove(new_info)
        #     db[mongodb_name].insert_one(new_info)
        #     # old_info和new_info一样
        #     if old_info == new_info:
        #         db[mongodb_name].insert_one(new_info)
    
    def delete_lexicon_word2mongo(self, db, mongodb_name, word_dict_list):
        """ 从mongodb中删除某些词汇信息 """
        for word_dict in word_dict_list:
            db[mongodb_name].delete_many(word_dict)
    
    def get_all_lexicon2mongo(self, db, mongodb_name, page, size):
        """ 获取mongodb中指定词库的所有词汇信息 """
        words = []
        count = db[mongodb_name].count()
        word_infos = db[mongodb_name].find().sort([("_id", -1)]).limit(size).skip((page - 1) * size)
        for word in word_infos:
            word.pop("_id")
            words.append(word)
        return count, words
    
    def get_all_words_from_mongo(self, db, mongodb_name):
        """ 获取mongodb中指定词库的所有词汇 """
        words = []
        word_infos = db[mongodb_name].find().sort([("_id", -1)])
        for word in word_infos:
            word.pop("_id")
            words.append(word)
        return words
    
    def get_words_from_mongo_by_title(self, db, mongodb_name, title):
        """ 获取mongodb中指定词库的所有词汇 """
        word_infos = db[mongodb_name].find({}, {title: 1, "_id": 0}).sort([("_id", -1)])
        
        return word_infos
    
    def get_word_in_title_mongo(self, db, mongodb_name, title, word, page, size):
        """mongodb中搜索某在指定字段中搜索词汇"""
        res = []
        count_num = db[mongodb_name].find({title: word}).count()
        query_res = db[mongodb_name].find({title: word}, {"_id": 0}).sort([("_id", -1)]).limit(size).skip(
            (page - 1) * size)
        
        for line in query_res:
            res.append(line)
        return count_num, res
    
    def get_word_by_condition_mongo(self, db, mongodb_name, word, page, size):
        """mongodb中搜索某词汇"""
        count_num = 0
        res = []
        data = db[mongodb_name].find_one()
        if not data:
            res = []
        else:
            columns = list(data.keys())
            columns.remove("_id")
            if word:
                condition = [{column: word} for column in columns]
                count_num = db[mongodb_name].find({"$or": condition}).count()
                query_res = db[mongodb_name].find({"$or": condition}).sort([("_id", -1)]).limit(size).skip(
                    (page - 1) * size)
                Logger.log_info("search: {}".format(condition))
            else:
                count_num = db[mongodb_name].find().count()
                query_res = db[mongodb_name].find().sort([("_id", -1)]).limit(size).skip((page - 1) * size)
            
            for line in query_res:
                line.pop("_id", None)
                res.append(line)
        return count_num, res
    
    def delete_lexicon_2mongo(self, db, mongodb_name):
        """ 从mongodb中删除某个词库 """
        db[mongodb_name].drop()
    
    def get_one_word_lexicon_2mongo(self, db, mongodb_name):
        """ 从mongodb指定词库获取一个词汇 """
        data = db[mongodb_name].find_one()
        return data
    
    def get_word_2word_cloud(self, db, mongodb_name, topk):
        """ 从mongodb指定词库获取topk个词汇"""
        pass


lexicon_dao = LexiconDao()
