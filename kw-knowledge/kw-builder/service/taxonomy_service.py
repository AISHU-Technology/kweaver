# -*- coding:utf-8 -*-
import hashlib
import sys
import time
import traceback
import uuid as uuid_obj
import requests
from flask_babel import gettext as _l
from requests.auth import HTTPBasicAuth
import common.stand_log as log_oper
from common.errorcode import codes
from common.errorcode.gview import Gview
from common.exception.base import ExceptLevel
from common.exception.graphdb_exception import GraphDBException
from common.exception.opensearch_exception import OpensearchException
from dao.graphdb_dao import GraphDB
from dao.knw_dao import knw_dao
from dao.taxonomy_dao import taxonomy_dao
from utils.log_info import Logger


class TaxonomyService():
    def create_taxonomy(self, params_json):
        '''
        创建术语库
        '''
        # 知识网络id是否存在
        res = knw_dao.check_knw_id(params_json['knw_id'])
        if len(res) == 0:
            code = codes.Builder_TaxonomyService_CreateTaxonomy_KnwIdNotExist
            
            return 500, Gview.TErrorreturn(code, knw_id=params_json['knw_id'])

        # 校验是否有新建权限
        # auth_list = data_auth.get_data_permission([params_json['knw_id']], 'kn', params_json['userId'],
        #                                           params_json['roles'])
        # if drivenConstants.KN_ADD_TAXONOMY not in auth_list[0]['codes']:
        #     code = codes.Builder_TaxonomyService_CreateTaxonomy_NoPermissionError
        #     
        #     return 500, Gview.TErrorreturn(code)

        # 术语库名称是否重复
        if taxonomy_dao.is_name_exist(params_json['name'], params_json['knw_id'], -1):
            code = codes.Builder_TaxonomyService_CreateTaxonomy_DuplicateName
            
            return 500, Gview.TErrorreturn(code, name=params_json['name'])

        db_name = "adt{}".format(str(uuid_obj.uuid1()).replace('-', ''))
        taxonomy_id = -1
        graphdb = GraphDB()
        try:
            # nebula创建图空间
            ngql = 'CREATE SPACE `{}` (partition_num = 30,replica_factor = 1,vid_type = FIXED_STRING(32))' \
                .format(db_name)
            code, res = graphdb._nebula_exec(ngql=ngql)
            if code != 200:
                error_log = log_oper.get_error_log(
                    'create space {} failed'.format(db_name),
                    sys._getframe())
                Logger.log_error(error_log)
                code = codes.Builder_TaxonomyService_CreateTaxonomy_NebulaError
                raise GraphDBException((ExceptLevel.ERROR, code, res.error_msg()))
            message = 'nebula 创建图空间 {} 成功'.format(db_name)
            Logger.log_info(message)
            # 此处等待2个心跳时间
            time.sleep(20)
            # nebula创建schema
            ngql = 'CREATE TAG IF NOT EXISTS `word`()'
            code, res = graphdb._nebula_exec(ngql, db_name)
            if code != 200:
                error_log = log_oper.get_error_log(
                    'create tag `word` failed',
                    sys._getframe())
                Logger.log_error(error_log)
                code = codes.Builder_TaxonomyService_CreateTaxonomy_NebulaError
                raise GraphDBException((ExceptLevel.ERROR, code, res.error_msg()))
            message = 'nebula 在图空间 {} 创建 tag word 成功'.format(db_name)
            Logger.log_info(message)
            ngql = 'CREATE EDGE IF NOT EXISTS `subClassOf`()'
            code, res = graphdb._nebula_exec(ngql, db_name)
            if code != 200:
                error_log = log_oper.get_error_log(
                    'create edge `subClassOf` failed',
                    sys._getframe())
                Logger.log_error(error_log)
                code = codes.Builder_TaxonomyService_CreateTaxonomy_NebulaError
                raise GraphDBException((ExceptLevel.ERROR, code, res.error_msg()))
            message = 'nebula 在图空间 {} 创建 edge subClassOf 成功'.format(db_name)
            Logger.log_info(message)
            ngql = 'CREATE EDGE IF NOT EXISTS `isPartOf`()'
            code, res = graphdb._nebula_exec(ngql, db_name)
            if code != 200:
                error_log = log_oper.get_error_log(
                    'create edge `isPartOf` failed',
                    sys._getframe())
                Logger.log_error(error_log)
                code = codes.Builder_TaxonomyService_CreateTaxonomy_NebulaError
                raise GraphDBException((ExceptLevel.ERROR, code, res.error_msg()))
            message = 'nebula 在图空间 {} 创建 edge isPartOf 成功'.format(db_name)
            Logger.log_info(message)
            # 此处等待2个心跳时间
            time.sleep(20)
            # nebula创建root点
            code, res = graphdb._nebula_exec('''insert vertex word() values 'root':()''', db_name)
            if code != 200:
                error_log = log_oper.get_error_log(
                    'insert vertex root failed',
                    sys._getframe())
                Logger.log_error(error_log)
                code = codes.Builder_TaxonomyService_CreateTaxonomy_NebulaError
                raise GraphDBException((ExceptLevel.ERROR, code, res.error_msg()))
            message = 'nebula 在图空间 {} 创建 vertex root 成功'.format(db_name)
            Logger.log_info(message)
            # opensearch创建索引
            # 获取节点数
            url = 'http://{}:{}/_nodes'.format(graphdb.esaddress, graphdb.esport)
            try:
                response = requests.get(url=url, auth=HTTPBasicAuth(graphdb.esusername, graphdb.espassword),
                                        verify=False, timeout=10)
            except requests.exceptions.ConnectionError:
                error_log = 'create db {} failed. opensearch connection error. '.format(db_name)
                error_log = log_oper.get_error_log(error_log, sys._getframe())
                Logger.log_error(error_log)
                code = codes.Builder_TaxonomyService_CreateTaxonomy_OpensearchError
                raise OpensearchException((ExceptLevel.ERROR, code, _l("opensearch connection error")))
            if response.status_code != 200:
                message = 'create db {} failed. get opensearch node information failed. '.format(db_name)
                try:
                    message += response.json()
                except:
                    message += str(response.content)
                error_log = log_oper.get_error_log(message, sys._getframe())
                Logger.log_error(error_log)
                code = codes.Builder_TaxonomyService_CreateTaxonomy_OpensearchError
                raise OpensearchException((ExceptLevel.ERROR, code, message))
            nodenum = response.json()['_nodes']['total']
            replicanum = 1
            if nodenum == 1:
                replicanum = 0
            url = 'http://{}:{}/{}'.format(graphdb.esaddress, graphdb.esport, db_name)
            body = {
                "settings": {
                    "number_of_shards": min(3, nodenum),
                    "number_of_replicas": replicanum
                },
                "mappings": {
                    "properties": {
                        "label": {
                            "type": "nested"
                        }
                    }
                }
            }
            try:
                response = requests.put(url=url, json=body,
                                        auth=HTTPBasicAuth(graphdb.esusername, graphdb.espassword),
                                        verify=False, timeout=10)
            except requests.exceptions.ConnectionError:
                error_log = 'create db {} failed. opensearch connection error. '.format(db_name)
                error_log = log_oper.get_error_log(error_log, sys._getframe())
                Logger.log_error(error_log)
                code = codes.Builder_TaxonomyService_CreateTaxonomy_OpensearchError
                raise OpensearchException((ExceptLevel.ERROR, code, _l("opensearch connection error")))
            if response.status_code != 200 \
                    and response.json()['error']['type'] != 'resource_already_exists_exception':
                message = 'create db {} failed. create opensearch index failed. '.format(db_name)
                try:
                    message += response.json()
                except:
                    message += str(response.content)
                error_log = log_oper.get_error_log(message, sys._getframe())
                Logger.log_error(error_log)
                code = codes.Builder_TaxonomyService_CreateTaxonomy_OpensearchError
                raise OpensearchException((ExceptLevel.ERROR, code, message))
            message = 'opensearch 创建索引 {} 成功'.format(db_name)
            Logger.log_info(message)
            # 将db_name记录进mysql
            params_json['db_name'] = db_name
            taxonomy_id = taxonomy_dao.insert_taxonomy(params_json)
        except GraphDBException as e:
            # 删除nebula图空间
            ngql = 'drop space if exists `{}`'.format(db_name)
            graphdb._nebula_exec(ngql, db_name)
            code = e.delegate.error_value
            message = e.delegate.error_msg
            
            return 500, Gview.TErrorreturn(code, description=message, cause=message)
        except OpensearchException as e:
            # 删除nebula图空间
            ngql = 'drop space if exists `{}`'.format(db_name)
            graphdb._nebula_exec(ngql, db_name)
            # 删除opensearch索引
            url = 'http://{}:{}/{}'.format(graphdb.esaddress, graphdb.esport, db_name)
            params = {'ignore_unavailable': 'true'}
            try:
                response = requests.delete(url=url, params=params,
                                           auth=HTTPBasicAuth(graphdb.esusername, graphdb.espassword),
                                           verify=False, timeout=10)
            except requests.exceptions.ConnectionError:
                error_log = 'opensearch delete index {} failed. opensearch connection error'.format(db_name)
                error_log = log_oper.get_error_log(error_log, sys._getframe())
                Logger.log_error(error_log)
            if response.status_code != 200:
                error_log = 'opensearch delete index {} failed'.format(db_name)
                try:
                    error_log += response.json()
                except:
                    error_log += str(response.content)
                error_log = log_oper.get_error_log(error_log, sys._getframe())
                Logger.log_error(error_log)
            code = e.delegate.error_value
            message = e.delegate.error_msg
            
            return 500, Gview.TErrorreturn(code, message=message)
        except Exception as e:
            # 删除nebula图空间
            ngql = 'drop space if exists `{}`'.format(db_name)
            graphdb._nebula_exec(ngql, db_name)
            # 删除opensearch索引
            url = 'http://{}:{}/{}'.format(graphdb.esaddress, graphdb.esport, db_name)
            params = {'ignore_unavailable': 'true'}
            try:
                response = requests.delete(url=url, params=params,
                                           auth=HTTPBasicAuth(graphdb.esusername, graphdb.espassword),
                                           verify=False, timeout=10)
            except requests.exceptions.ConnectionError:
                error_log = 'opensearch delete index {} failed. opensearch connection error'.format(db_name)
                error_log = log_oper.get_error_log(error_log, sys._getframe())
                Logger.log_error(error_log)
            if response.status_code != 200:
                error_log = 'opensearch delete index {} failed'.format(db_name)
                try:
                    error_log += response.json()
                except:
                    error_log += str(response.content)
                error_log = log_oper.get_error_log(error_log, sys._getframe())
                Logger.log_error(error_log)
            # 删除mysql数据
            taxonomy_dao.delete_taxonomies([taxonomy_id])
            error_log = log_oper.get_error_log("insert taxonomy db_name failed: {}".format(repr(e)),
                                               sys._getframe(),
                                               traceback.format_exc())
            Logger.log_error(error_log)
            code = codes.Builder_TaxonomyController_CreateTaxonomy_UnknownError
            
            return 500, Gview.TErrorreturn(code, description=str(e), cause=str(e))

        
        return 200, Gview.json_return(taxonomy_id)

    def edit_taxonomy(self, taxonomy_id: int, params_json: dict):
        '''
        编辑术语库
        Args:
            taxonomy_id: 术语库id
            params_json:
                name: 术语库名称
                default_language: 默认语言
                description: 描述
        '''
        knw_id = taxonomy_dao.get_knw_by_id(taxonomy_id)
        if not knw_id:
            code = codes.Builder_TaxonomyService_EditTaxonomy_TaxonomyIdNotExist
            
            return 500, Gview.TErrorreturn(code, taxonomy_id=taxonomy_id)
        knw_id = knw_id[0]['knw_id']
        # 校验是否有编辑权限
        # auth_list = data_auth.get_data_permission([taxonomy_id], drivenConstants.TAXONOMY, params_json['userId'],
        #                                           params_json['roles'])
        # if drivenConstants.TAXONOMY_EDIT not in auth_list[0]['codes']:
        #     code = codes.Builder_TaxonomyService_EditTaxonomy_NoPermissionError
        #     
        #     return 500, Gview.TErrorreturn(code, id=taxonomy_id)
        # 校验同一知识网络下是否重名
        if taxonomy_dao.is_name_exist(params_json['name'], knw_id, taxonomy_id):
            code = codes.Builder_TaxonomyService_EditTaxonomy_DuplicateName
            
            return 500, Gview.TErrorreturn(code, name=params_json['name'])

        taxonomy_dao.edit_taxonomy(taxonomy_id, params_json)
        
        return 200, Gview.json_return('success')

    def get_taxonomy_list(self, params_json: dict):
        '''
        获取术语库列表
        Args:
            params_json:
                knw_id
                page
                size
                rule
                order
                name
        '''
        # 知识网络id是否存在
        res = knw_dao.check_knw_id(params_json['knw_id'])
        if len(res) == 0:
            code = codes.Builder_TaxonomyService_GetTaxonomyList_KnwIdNotExist
            
            return 500, Gview.TErrorreturn(code, knw_id=params_json['knw_id'])
        # all_taxonomy = taxonomy_dao.get_taxonomy_list(params_json)
        # 获取有权限的id列表
        # auth_list = data_auth.get_data_permission([t['id'] for t in all_taxonomy],
        #                                           drivenConstants.TAXONOMY, params_json['userId'],
        #                                           params_json['roles'])
        # authorized_ids = [auth['dataId']
        #                   for auth in auth_list
        #                   if drivenConstants.TAXONOMY_VIEW in auth['codes']]
        # params_json['ids'] = authorized_ids
        all_taxonomy = taxonomy_dao.get_taxonomy_list(params_json)
        count = len(all_taxonomy)
        taxonomy_list = taxonomy_dao.get_taxonomy_list_by_page(params_json)
        res = {'count': count,
               'taxonomies': taxonomy_list}
        
        return 200, Gview.json_return(res)

    def delete_taxonomy(self, taxonomy_ids: list[int], params_json: dict):
        '''
        删除术语库
        '''
        # 校验术语库id是否存在
        error_res = []
        taxonomy_ids_to_delete = []
        not_exist_ids = []
        for taxonomy_id in taxonomy_ids:
            if taxonomy_dao.is_id_exist(taxonomy_id):
                taxonomy_ids_to_delete.append(taxonomy_id)
            else:
                not_exist_ids.append(taxonomy_id)
        if not_exist_ids:
            code = codes.Builder_TaxonomyService_DeleteTaxonomy_TaxonomyIdNotExist
            error_res.append(
                Gview.TErrorreturn(code, taxonomy_id=not_exist_ids,
                                   ErrorDetails=','.join([str(i) for i in not_exist_ids])).json)
        taxonomy_ids = taxonomy_ids_to_delete

        message = 'delete taxonomy {}'.format(taxonomy_ids)
        Logger.log_info(message)

        if taxonomy_ids:
            graphdb = GraphDB()
            db_names = taxonomy_dao.get_db_names(taxonomy_ids)
            for taxonomy_id, db_name in db_names.items():
                # 逻辑删除
                taxonomy_dao.delete_taxonomies_logically([taxonomy_id])
                # 删除opensearch
                url = 'http://{}:{}/{}'.format(graphdb.esaddress, graphdb.esport, db_name)
                try:
                    response = requests.delete(url=url,
                                               params={'ignore_unavailable': 'true'},
                                               auth=HTTPBasicAuth(graphdb.esusername, graphdb.espassword),
                                               verify=False, timeout=10)
                except requests.exceptions.ConnectionError:
                    error_log = 'delete opensearch index failed: {}. opensearch connection error'.format(message)
                    error_log = log_oper.get_error_log(error_log, sys._getframe())
                    Logger.log_error(error_log)
                    continue
                if response.status_code != 200:
                    try:
                        message = response.json()
                    except:
                        message = str(response.content)
                    error_log = 'delete opensearch index failed: {}'.format(message)
                    error_log = log_oper.get_error_log(error_log, sys._getframe())
                    Logger.log_error(error_log)
                    continue
                # 删除nebula
                ngql = 'DROP SPACE IF EXISTS `{}`; '.format(db_name)
                code, res = graphdb._nebula_exec(ngql)
                if code != 200:
                    error_log = log_oper.get_error_log(
                        'nebula drop space {} failed: {}'.format(db_name, res.error_msg()), sys._getframe())
                    Logger.log_error(error_log)
                    continue
                # 删除权限
                # data_auth.delete_permission([taxonomy_id], drivenConstants.TAXONOMY)
                # 删除mysql记录
                taxonomy_dao.delete_taxonomies([taxonomy_id])
        res = {'res': ','.join([str(i) for i in taxonomy_ids]),
               'error': error_res}
        
        return 200, Gview.json_return(res)

    def add_word(self, taxonomy_id: int, params_json: dict):
        '''
        添加词
        Args:
            taxonomy_id:
            params_json:
                parent: 可选，父级词的id，若不传该参数，则将新建的词添加至顶级
                label: 词的基本信息，有且仅有一个语言的基本信息
                    zh_CN/zh_TW/en:
                        name
                        description
                        synonym
        '''
        db_name = taxonomy_dao.get_db_names(taxonomy_id)
        # 术语库id是否存在
        if len(db_name) == 0:
            code = codes.Builder_TaxonomyService_AddWord_TaxonomyIdNotExist
            
            return 500, Gview.TErrorreturn(code, taxonomy_id=taxonomy_id)
        db_name = db_name[taxonomy_id]
        # 校验术语库编辑权限
        # auth_list = data_auth.get_data_permission([taxonomy_id], drivenConstants.TAXONOMY, params_json['userId'],
        #                                           params_json['roles'])
        # if drivenConstants.TAXONOMY_EDIT not in auth_list[0]['codes']:
        #     code = codes.Builder_TaxonomyService_AddWord_NoPermissionError
        #     
        #     return 500, Gview.TErrorreturn(code, id=taxonomy_id)
        graphdb = GraphDB()
        # 检查是否重名
        language = params_json['language']
        name = params_json['name']
        code, message = self.is_name_exist(db_name, language, name)
        if code == 409:
            code = codes.Builder_TaxonomyService_AddWord_DuplicateName
            
            return 500, Gview.TErrorreturn(code, name=name)
        elif code != 200:
            error_log = log_oper.get_error_log('opensearch检测 {} {} 是否重名失败: {}'.format(language, name, message),
                                               sys._getframe())
            Logger.log_error(error_log)
            code = codes.Builder_TaxonomyService_AddWord_OpensearchError
            
            return 500, Gview.TErrorreturn(code, message=message)
        # parent是否存在
        if 'parent' in params_json:
            parent = params_json['parent']
            code, message = self.is_word_exist(db_name, parent)
            if code == 404:
                code = codes.Builder_TaxonomyService_AddWord_ParentNotExist
                
                return 500, Gview.TErrorreturn(code, word_id=parent)
            elif code != 200:
                error_log = log_oper.get_error_log('opensearch检测{}是否存在失败: {}'.format(parent, message),
                                                   sys._getframe())
                Logger.log_error(error_log)
                code = codes.Builder_TaxonomyService_AddWord_OpensearchError
                
                return 500, Gview.TErrorreturn(code, message=message)
        '''
        word_id的生成方式:
        1. uuid
            可能的问题：多线程请求接口来不及检测词是否重名，产生多个词的id，但是重名。
            解决方式：使用redis分布式锁，key为词的名字，避免产生多个重名的词。（较复杂，下次优化再做）
        2. 哈希值
            计算方式：词的名字+语言+时间戳（单位为秒）
            同一秒内同名的词产生的id相同，避免产生多条重名词的问题，也避免修改词又添加新的词后id重复的问题。
        '''
        # word_id = str(uuid_obj.uuid1()).replace('-', '')
        word_id = get_md5(name + language + str(int(time.time())))
        # nebula新建词
        ngql = "INSERT VERTEX `word`() VALUES '{}': ()".format(word_id)
        code, res = graphdb._nebula_exec(ngql, db_name)
        if code != 200:
            if not res.is_succeeded() and 'SpaceNotFound' in res.error_msg():
                code = codes.Builder_TaxonomyService_AddWord_DBNotExistError
                
                return 500, Gview.TErrorreturn(code)
            else:
                code = codes.Builder_TaxonomyService_AddWord_NebulaError
                
                return 500, Gview.TErrorreturn(code,
                                               description=res.error_msg(),
                                               cause=_l("Nebula Internal Server Error"))
        # nebula建立关系
        parent = 'root'
        parent_count = 0
        child_count = 0
        if 'parent' in params_json:
            parent = params_json['parent']
            parent_count = 1
        ngql = '''insert edge subClassOf() values '{}'->'{}':()'''.format(word_id, parent)
        code, res = graphdb._nebula_exec(ngql, db_name)
        if code != 200:
            code = codes.Builder_TaxonomyService_AddWord_NebulaError
            
            return 500, Gview.TErrorreturn(code,
                                           description=res.error_msg(),
                                           cause=_l("Nebula Internal Server Error"))
        # opensearch新建词
        url = 'http://{}:{}/{}/_doc/{}'.format(graphdb.esaddress, graphdb.esport, db_name, word_id)
        body = {
            'label': [{
                'name': name,
                'description': '',
                'synonym': [],
                'language': language
            }],
            'level': {
                "parent_count": parent_count,
                "child_count": child_count
            }
        }
        try:
            response = requests.post(url, json=body, params={'refresh': 'true'},
                                     auth=HTTPBasicAuth(graphdb.esusername, graphdb.espassword),
                                     verify=False, timeout=10)
        except requests.exceptions.ConnectionError:
            message = _l('opensearch connection error')
            error_log = log_oper.get_error_log('opensearch新建文档失败: {}'.format(message), sys._getframe())
            Logger.log_error(error_log)
            code = codes.Builder_TaxonomyService_AddWord_OpensearchError
            
            return 500, Gview.TErrorreturn(code, message=message)
        if response.status_code not in [200, 201]:
            try:
                message = response.json()
            except:
                message = str(response.content)
            error_log = log_oper.get_error_log('opensearch新建文档失败: {}'.format(message), sys._getframe())
            Logger.log_error(error_log)
            code = codes.Builder_TaxonomyService_AddWord_OpensearchError
            
            return 500, Gview.TErrorreturn(code, message=message)
        # opensearch修改上级词的level为有下级
        if parent != 'root':
            url = 'http://{}:{}/{}/_update/{}'.format(graphdb.esaddress, graphdb.esport, db_name, parent)
            body = {
                "script": {
                    "lang": "painless",
                    "source": "ctx._source.level.child_count = ctx._source.level.child_count + 1"
                }
            }
            try:
                response = requests.post(url, json=body, params={'refresh': 'true'},
                                         auth=HTTPBasicAuth(graphdb.esusername, graphdb.espassword),
                                         verify=False, timeout=10)
            except requests.exceptions.ConnectionError:
                message = _l('opensearch connection error')
                error_log = log_oper.get_error_log('opensearch修改{}的level失败: {}'.format(parent, message),
                                                   sys._getframe())
                Logger.log_error(error_log)
                code = codes.Builder_TaxonomyService_AddWord_OpensearchError
                
                return 500, Gview.TErrorreturn(code, message=message)
            if response.status_code != 200:
                try:
                    message = response.json()
                except:
                    message = str(response.content)
                error_log = log_oper.get_error_log('opensearch修改{}的level失败: {}'.format(parent, message),
                                                   sys._getframe())
                Logger.log_error(error_log)
                code = codes.Builder_TaxonomyService_AddWord_OpensearchError
                
                return 500, Gview.TErrorreturn(code, message=message)
        # 更新术语库word_num
        url = 'http://{}:{}/{}/_count'.format(graphdb.esaddress, graphdb.esport, db_name)
        try:
            response = requests.get(url, auth=HTTPBasicAuth(graphdb.esusername, graphdb.espassword),
                                    verify=False, timeout=10)
        except requests.exceptions.ConnectionError:
            message = _l('opensearch connection error')
            error_log = log_oper.get_error_log('获取opensearch文档数失败: {}'.format(message), sys._getframe())
            Logger.log_error(error_log)
            code = codes.Builder_TaxonomyService_AddWord_OpensearchError
            
            return 500, Gview.TErrorreturn(code, message=message)
        if response.status_code != 200:
            try:
                message = response.json()
            except:
                message = str(response.content)
            error_log = log_oper.get_error_log('获取opensearch文档数失败: {}'.format(message), sys._getframe())
            Logger.log_error(error_log)
            code = codes.Builder_TaxonomyService_AddWord_OpensearchError
            
            return 500, Gview.TErrorreturn(code, message=message)
        word_num = response.json()['count']
        taxonomy_dao.update_word_num(taxonomy_id, word_num, params_json['userId'])
        self.update_knowledge(taxonomy_id, db_name)
        
        return 200, Gview.json_return(word_id)

    def is_word_exist(self, db_name: str, word_id: str) -> tuple[int, str]:
        '''
        词是否在opensearch中存在
        Args:
            db_name:
            word_id:
        Returns:
            code: 200-存在 404-不存在 500-错误
            message:
        '''
        graphdb = GraphDB()
        url = 'http://{}:{}/{}/_doc/{}'.format(graphdb.esaddress, graphdb.esport, db_name, word_id)
        try:
            response = requests.get(url, auth=HTTPBasicAuth(graphdb.esusername, graphdb.espassword),
                                    verify=False, timeout=10)
        except requests.exceptions.ConnectionError:
            message = _l('opensearch connection error')
            return 500, message
        try:
            message = response.json()
        except:
            message = str(response.content)
        
        return response.status_code, message

    def is_name_exist(self, db_name: str, language: str, name: str) -> tuple[int, str]:
        '''
        词是否重名
        Args:
            db_name:
            language:
            name:

        Returns:
            code: 200-不重名 409-重名 500-错误
            message
        '''
        graphdb = GraphDB()
        url = 'http://{}:{}/{}/_search'.format(graphdb.esaddress, graphdb.esport, db_name)
        body = {
            "query": {
                "nested": {
                    "path": "label",
                    "query": {
                        "bool": {
                            "must": [
                                {
                                    "match": {
                                        "label.name.keyword": name
                                    }
                                },
                                {
                                    "match": {
                                        "label.language.keyword": language
                                    }
                                }
                            ]
                        }
                    }
                }
            },
            "track_total_hits": True
        }
        try:
            response = requests.get(url, json=body, auth=HTTPBasicAuth(graphdb.esusername, graphdb.espassword),
                                    verify=False, timeout=10)
        except requests.exceptions.ConnectionError:
            message = _l('opensearch connection error')
            
            return 500, message
        if response.status_code != 200:
            try:
                message = response.json()
            except:
                message = str(response.content)
            
            return 500, message
        if response.json()['hits']['total']['value'] > 0:
            return 409, ''
        
        return 200, ''

    def edit_word_label(self, taxonomy_id: int, word_id: str, params_json: dict):
        db_name = taxonomy_dao.get_db_names(taxonomy_id)
        # 术语库id是否存在
        if len(db_name) == 0:
            code = codes.Builder_TaxonomyService_EditWordLabel_TaxonomyIdNotExist
            
            return 500, Gview.TErrorreturn(code, taxonomy_id=taxonomy_id)
        db_name = db_name[taxonomy_id]
        # 校验术语库编辑权限
        # auth_list = data_auth.get_data_permission([taxonomy_id], drivenConstants.TAXONOMY, params_json['userId'],
        #                                           params_json['roles'])
        # if drivenConstants.TAXONOMY_EDIT not in auth_list[0]['codes']:
        #     code = codes.Builder_TaxonomyService_EditWordLabel_NoPermissionError
        #     
        #     return 500, Gview.TErrorreturn(code, id=taxonomy_id)
        graphdb = GraphDB()
        # 校验词的id是否存在
        code, message = self.is_word_exist(db_name, word_id)
        if code == 404:
            code = codes.Builder_TaxonomyService_EditWordLabel_WordIdNotExist
            
            return 500, Gview.TErrorreturn(code, word_id=word_id)
        elif code != 200:
            error_log = log_oper.get_error_log('opensearch检测{}是否存在失败: {}'.format(word_id, message),
                                               sys._getframe())
            Logger.log_error(error_log)
            code = codes.Builder_TaxonomyService_EditWordLabel_OpensearchError
            
            return 500, Gview.TErrorreturn(code, message=message)
        doc_label = message['_source']['label']
        action = params_json['action']
        language = params_json['language']
        if action == 'add':
            name = params_json['label']['name']
            # 校验该语言无基本信息
            flag = False
            for a_label in doc_label:
                if a_label['language'] == language:
                    flag = True
                    break
            if flag:
                code = codes.Builder_TaxonomyService_EditWordLabel_LanguageExists
                
                return 500, Gview.TErrorreturn(code, language=language)
            # 校验是否重名
            code, message = self.is_name_exist(db_name, language, name)
            if code == 409:
                code = codes.Builder_TaxonomyService_EditWordLabel_DuplicateName
                
                return 500, Gview.TErrorreturn(code, language=language, name=name)
            elif code != 200:
                error_log = log_oper.get_error_log('opensearch检测 {} {} 是否重名失败: {}'.format(language, name, message),
                                                   sys._getframe())
                Logger.log_error(error_log)
                code = codes.Builder_TaxonomyService_EditWordLabel_OpensearchError
                
                return 500, Gview.TErrorreturn(code, message=message)
            # 新增该语言的基本信息
            url = 'http://{}:{}/{}/_update/{}'.format(graphdb.esaddress, graphdb.esport, db_name, word_id)
            body = {
                "script": {
                    "source": "ctx._source.label.add(params.label)",
                    "params": {
                        "label": {
                            "name": name,
                            "description": params_json['label']['description'],
                            "synonym": params_json['label']['synonym'],
                            "language": language
                        }
                    }
                }
            }
            try:
                response = requests.post(url, json=body, params={'refresh': 'true'},
                                         auth=HTTPBasicAuth(graphdb.esusername, graphdb.espassword),
                                         verify=False, timeout=10)
            except requests.exceptions.ConnectionError:
                message = _l('opensearch connection error')
                error_log = log_oper.get_error_log(
                    'opensearch新增 {} 的基本信息失败: {}'.format(word_id, message),
                    sys._getframe())
                Logger.log_error(error_log)
                code = codes.Builder_TaxonomyService_EditWordLabel_OpensearchError
                
                return 500, Gview.TErrorreturn(code, message=message)
            if response.status_code != 200:
                try:
                    message = response.json()
                except:
                    message = str(response.content)
                error_log = log_oper.get_error_log(
                    'opensearch新增 {} 的基本信息失败: {}'.format(word_id, message),
                    sys._getframe())
                Logger.log_error(error_log)
                code = codes.Builder_TaxonomyService_EditWordLabel_OpensearchError
                
                return 500, Gview.TErrorreturn(code, message=message)
        elif action == 'update':
            name = params_json['label']['name']
            # 校验该语言有基本信息
            flag = False
            for a_label in doc_label:
                if a_label['language'] == language:
                    flag = True
                    break
            if not flag:
                code = codes.Builder_TaxonomyService_EditWordLabel_LanguageNotExists
                
                return 500, Gview.TErrorreturn(code, language=language)
            # 校验是否重名
            url = 'http://{}:{}/{}/_search'.format(graphdb.esaddress, graphdb.esport, db_name)
            body = {
                "query": {
                    "nested": {
                        "path": "label",
                        "query": {
                            "bool": {
                                "must": [
                                    {"match": {"label.language.keyword": language}},
                                    {"match": {"label.name.keyword": name}}
                                ],
                                "must_not": [
                                    {"term": {"_id": word_id}}
                                ]
                            }
                        }
                    }
                },
                "track_total_hits": True
            }
            try:
                response = requests.get(url, json=body, auth=HTTPBasicAuth(graphdb.esusername, graphdb.espassword),
                                        verify=False, timeout=10)
            except requests.exceptions.ConnectionError:
                message = _l('opensearch connection error')
                error_log = log_oper.get_error_log(
                    'opensearch校验 {} {} {} 是否重名失败: {}'.format(word_id, language, name, message),
                    sys._getframe())
                Logger.log_error(error_log)
                code = codes.Builder_TaxonomyService_EditWordLabel_OpensearchError
                
                return 500, Gview.TErrorreturn(code, message=message)
            if response.status_code != 200:
                try:
                    message = response.json()
                except:
                    message = str(response.content)
                error_log = log_oper.get_error_log(
                    'opensearch校验 {} {} {} 是否重名失败: {}'.format(word_id, language, name, message),
                    sys._getframe())
                Logger.log_error(error_log)
                code = codes.Builder_TaxonomyService_EditWordLabel_OpensearchError
                
                return 500, Gview.TErrorreturn(code, message=message)
            if response.json()['hits']['total']['value'] > 0:
                code = codes.Builder_TaxonomyService_EditWordLabel_DuplicateName
                
                return 500, Gview.TErrorreturn(code, language=language, name=name)
            # 修改基本信息
            url = 'http://{}:{}/{}/_update/{}'.format(graphdb.esaddress, graphdb.esport, db_name, word_id)
            body = {
                "script": {
                    "source": "for(e in ctx._source.label) " \
                              "{if (e.language == '%s') " \
                              "{e.name = '%s';" \
                              "e.description = '%s';" \
                              "e.synonym = %s}}" \
                              % (
                                  language,
                                  self.str_process(name),
                                  self.str_process(params_json['label']['description']),
                                  '[' + ','.join(["'{}'".format(self.str_process(i)) for i in
                                                  params_json['label']['synonym']]) + ']'
                              )
                }
            }
            try:
                response = requests.post(url, json=body, params={'refresh': 'true'},
                                         auth=HTTPBasicAuth(graphdb.esusername, graphdb.espassword),
                                         verify=False, timeout=10)
            except requests.exceptions.ConnectionError:
                message = _l('opensearch connection error')
                error_log = log_oper.get_error_log(
                    'opensearch修改 {} 的基本信息失败: {}'.format(word_id, message),
                    sys._getframe())
                Logger.log_error(error_log)
                code = codes.Builder_TaxonomyService_EditWordLabel_OpensearchError
                
                return 500, Gview.TErrorreturn(code, message=message)
            if response.status_code != 200:
                try:
                    message = response.json()
                except:
                    message = str(response.content)
                error_log = log_oper.get_error_log(
                    'opensearch修改 {} 的基本信息失败: {}'.format(word_id, message),
                    sys._getframe())
                Logger.log_error(error_log)
                code = codes.Builder_TaxonomyService_EditWordLabel_OpensearchError
                
                return 500, Gview.TErrorreturn(code, message=message)
        elif action == 'remove':
            # 校验该语言有基本信息
            flag = False
            for a_label in doc_label:
                if a_label['language'] == language:
                    flag = True
                    break
            if not flag:
                code = codes.Builder_TaxonomyService_EditWordLabel_LanguageNotExists
                
                return 500, Gview.TErrorreturn(code, language=language)
            # 至少需留一种语言的基本信息
            if len(doc_label) <= 1:
                code = codes.Builder_TaxonomyService_EditWordLabel_LastLanguage
                
                return 500, Gview.TErrorreturn(code)
            # 删除该语言的基本信息
            url = 'http://{}:{}/{}/_update/{}'.format(graphdb.esaddress, graphdb.esport, db_name, word_id)
            body = {
                "script": {
                    "source": "ctx._source.label.removeIf(label -> label.language == params.language)",
                    "params": {
                        "language": language
                    }
                }
            }
            try:
                response = requests.post(url, json=body, params={'refresh': 'true'},
                                         auth=HTTPBasicAuth(graphdb.esusername, graphdb.espassword),
                                         verify=False, timeout=10)
            except requests.exceptions.ConnectionError:
                message = _l('opensearch connection error')
                error_log = log_oper.get_error_log(
                    'opensearch删除 {} 的基本信息失败: {}'.format(word_id, message),
                    sys._getframe())
                Logger.log_error(error_log)
                code = codes.Builder_TaxonomyService_EditWordLabel_OpensearchError
                
                return 500, Gview.TErrorreturn(code, message=message)
            if response.status_code != 200:
                try:
                    message = response.json()
                except:
                    message = str(response.content)
                error_log = log_oper.get_error_log(
                    'opensearch删除 {} 的基本信息失败: {}'.format(word_id, message),
                    sys._getframe())
                Logger.log_error(error_log)
                code = codes.Builder_TaxonomyService_EditWordLabel_OpensearchError
                
                return 500, Gview.TErrorreturn(code, message=message)
        taxonomy_dao.update_time(taxonomy_id, params_json['userId'])
        
        return 200, Gview.json_return('success')

    def edit_word_level(self, taxonomy_id: int, word_id: str, params_json: dict):
        db_name = taxonomy_dao.get_db_names(taxonomy_id)
        # 术语库id是否存在
        if len(db_name) == 0:
            code = codes.Builder_TaxonomyService_EditWordLevel_TaxonomyIdNotExist
            
            return 500, Gview.TErrorreturn(code, taxonomy_id=taxonomy_id)
        db_name = db_name[taxonomy_id]
        # 校验术语库编辑权限
        # auth_list = data_auth.get_data_permission([taxonomy_id], drivenConstants.TAXONOMY, params_json['userId'],
        #                                           params_json['roles'])
        # if drivenConstants.TAXONOMY_EDIT not in auth_list[0]['codes']:
        #     code = codes.Builder_TaxonomyService_EditWordLevel_NoPermissionError
        #     
        #     return 500, Gview.TErrorreturn(code, id=taxonomy_id)
        graphdb = GraphDB()
        # 校验词的id是否存在
        code, message = self.is_word_exist(db_name, word_id)
        if code == 404:
            code = codes.Builder_TaxonomyService_EditWordLevel_WordIdNotExist
            
            return 500, Gview.TErrorreturn(code, word_id=word_id)
        elif code != 200:
            error_log = log_oper.get_error_log(
                'opensearch校验 {} 是否存在失败: {}'.format(word_id, message),
                sys._getframe())
            Logger.log_error(error_log)
            code = codes.Builder_TaxonomyService_EditWordLevel_OpensearchError
            
            return 500, Gview.TErrorreturn(code, message=message)
        parent = params_json['parent']
        if parent == word_id:
            code = codes.Builder_TaxonomyService_EditWordLevel_LoopExists
            
            return 500, Gview.TErrorreturn(code)
        # 校验parent是否存在
        if parent != 'root':
            code, message = self.is_word_exist(db_name, parent)
            if code == 404:
                code = codes.Builder_TaxonomyService_EditWordLevel_WordIdNotExist
                
                return 500, Gview.TErrorreturn(code, word_id=parent)
            elif code != 200:
                error_log = log_oper.get_error_log(
                    'opensearch校验 {} 是否存在失败: {}'.format(parent, message),
                    sys._getframe())
                Logger.log_error(error_log)
                code = codes.Builder_TaxonomyService_EditWordLevel_OpensearchError
                
                return 500, Gview.TErrorreturn(code, message=message)
        # 检测是否有环
        ngql = '''match p=(v1:word)<-[e:subClassOf*]-(v2:word) where id(v1)=="{}" and id(v2)=="{}" return p''' \
            .format(word_id, parent)
        code, res = graphdb._nebula_exec(ngql, db_name)
        if code != 200:
            code = codes.Builder_TaxonomyService_EditWordLevel_NebulaError
            
            return 500, Gview.TErrorreturn(code,
                                           description=res.error_msg(),
                                           cause=_l("Nebula Internal Server Error"))
        if res.row_size() > 0:
            code = codes.Builder_TaxonomyService_EditWordLevel_LoopExists
            
            return 500, Gview.TErrorreturn(code)
        # 获取原来的上级
        ngql = '''go from '{}' over subClassOf yield dst(edge)'''.format(word_id)
        code, res = graphdb._nebula_exec(ngql, db_name)
        if code != 200:
            code = codes.Builder_TaxonomyService_EditWordLevel_NebulaError
            
            return 500, Gview.TErrorreturn(code,
                                           description=res.error_msg(),
                                           cause=_l("Nebula Internal Server Error"))
        ex_parent = res.row_values(0)[0].as_string()
        if ex_parent == parent:
            
            return 200, Gview.json_return('success')
        # 删除原来的上级关系
        ngql = '''delete edge `subClassOf` "{}" -> "{}"'''.format(word_id, ex_parent)
        code, res = graphdb._nebula_exec(ngql, db_name)
        if code != 200:
            code = codes.Builder_TaxonomyService_EditWordLevel_NebulaError
            
            return 500, Gview.TErrorreturn(code,
                                           description=res.error_msg(),
                                           cause=_l("Nebula Internal Server Error"))
        # 修改原来的上级词的level
        if ex_parent != 'root':
            url = 'http://{}:{}/{}/_update/{}'.format(graphdb.esaddress, graphdb.esport, db_name, ex_parent)
            body = {
                "script": {
                    "lang": "painless",
                    "source": "ctx._source.level.child_count = ctx._source.level.child_count - 1"
                }
            }
            try:
                response = requests.post(url, json=body, params={'refresh': 'true'},
                                         auth=HTTPBasicAuth(graphdb.esusername, graphdb.espassword),
                                         verify=False, timeout=10)
            except requests.exceptions.ConnectionError:
                message = _l('opensearch connection error')
                error_log = log_oper.get_error_log(
                    'opensearch修改 {} 的level失败: {}'.format(ex_parent, message),
                    sys._getframe())
                Logger.log_error(error_log)
                code = codes.Builder_TaxonomyService_EditWordLevel_OpensearchError
                
                return 500, Gview.TErrorreturn(code, message=message)
            if response.status_code != 200:
                try:
                    message = response.json()
                except:
                    message = str(response.content)
                error_log = log_oper.get_error_log(
                    'opensearch修改 {} 的level失败: {}'.format(ex_parent, message),
                    sys._getframe())
                Logger.log_error(error_log)
                code = codes.Builder_TaxonomyService_EditWordLevel_OpensearchError
                
                return 500, Gview.TErrorreturn(code, message=message)
        # 新建上级关系
        ngql = '''insert edge subClassOf() values '{}'->'{}':()'''.format(word_id, parent)
        code, res = graphdb._nebula_exec(ngql, db_name)
        if code != 200:
            code = codes.Builder_TaxonomyService_EditWordLevel_NebulaError
            
            return 500, Gview.TErrorreturn(code,
                                           description=res.error_msg(),
                                           cause=_l("Nebula Internal Server Error"))
        # 修改上级词的level
        if parent != 'root':
            url = 'http://{}:{}/{}/_update/{}'.format(graphdb.esaddress, graphdb.esport, db_name, parent)
            body = {
                "script": {
                    "lang": "painless",
                    "source": "ctx._source.level.child_count = ctx._source.level.child_count + 1"
                }
            }
            try:
                response = requests.post(url, json=body, params={'refresh': 'true'},
                                         auth=HTTPBasicAuth(graphdb.esusername, graphdb.espassword),
                                         verify=False, timeout=10)
            except requests.exceptions.ConnectionError:
                message = _l('opensearch connection error')
                error_log = log_oper.get_error_log(
                    'opensearch修改 {} 的level失败: {}'.format(ex_parent, message),
                    sys._getframe())
                Logger.log_error(error_log)
                code = codes.Builder_TaxonomyService_EditWordLevel_OpensearchError
                
                return 500, Gview.TErrorreturn(code, message=message)
            if response.status_code != 200:
                try:
                    message = response.json()
                except:
                    message = str(response.content)
                error_log = log_oper.get_error_log(
                    'opensearch修改 {} 的level失败: {}'.format(ex_parent, message),
                    sys._getframe())
                Logger.log_error(error_log)
                code = codes.Builder_TaxonomyService_EditWordLevel_OpensearchError
                
                return 500, Gview.TErrorreturn(code, message=message)
        # 修改当前词的 level
        if ex_parent == 'root' and parent != 'root':
            url = 'http://{}:{}/{}/_update/{}'.format(graphdb.esaddress, graphdb.esport, db_name, word_id)
            body = {
                "script": {
                    "lang": "painless",
                    "source": "ctx._source.level.parent_count = 1"
                }
            }
            try:
                response = requests.post(url, json=body, params={'refresh': 'true'},
                                         auth=HTTPBasicAuth(graphdb.esusername, graphdb.espassword),
                                         verify=False, timeout=10)
            except requests.exceptions.ConnectionError:
                message = _l('opensearch connection error')
                error_log = log_oper.get_error_log(
                    'opensearch修改 {} 的level失败: {}'.format(word_id, message),
                    sys._getframe())
                Logger.log_error(error_log)
                code = codes.Builder_TaxonomyService_EditWordLevel_OpensearchError
                
                return 500, Gview.TErrorreturn(code, message=message)
            if response.status_code != 200:
                try:
                    message = response.json()
                except:
                    message = str(response.content)
                error_log = log_oper.get_error_log(
                    'opensearch修改 {} 的level失败: {}'.format(word_id, message),
                    sys._getframe())
                Logger.log_error(error_log)
                code = codes.Builder_TaxonomyService_EditWordLevel_OpensearchError
                
                return 500, Gview.TErrorreturn(code, message=message)
        elif ex_parent != 'root' and parent == 'root':
            url = 'http://{}:{}/{}/_update/{}'.format(graphdb.esaddress, graphdb.esport, db_name, word_id)
            body = {
                "script": {
                    "lang": "painless",
                    "source": "ctx._source.level.parent_count = 0"
                }
            }
            try:
                response = requests.post(url, json=body, params={'refresh': 'true'},
                                         auth=HTTPBasicAuth(graphdb.esusername, graphdb.espassword),
                                         verify=False, timeout=10)
            except requests.exceptions.ConnectionError:
                message = _l('opensearch connection error')
                error_log = log_oper.get_error_log(
                    'opensearch修改 {} 的level失败: {}'.format(word_id, message),
                    sys._getframe())
                Logger.log_error(error_log)
                code = codes.Builder_TaxonomyService_EditWordLevel_OpensearchError
                
                return 500, Gview.TErrorreturn(code, message=message)
            if response.status_code != 200:
                try:
                    message = response.json()
                except:
                    message = str(response.content)
                error_log = log_oper.get_error_log(
                    'opensearch修改 {} 的level失败: {}'.format(word_id, message),
                    sys._getframe())
                Logger.log_error(error_log)
                code = codes.Builder_TaxonomyService_EditWordLevel_OpensearchError
                
                return 500, Gview.TErrorreturn(code, message=message)
        taxonomy_dao.update_time(taxonomy_id, params_json['userId'])
        
        return 200, Gview.json_return('success')

    def get_top_words(self, taxonomy_id: int, params_json: dict):
        db_name = taxonomy_dao.get_db_names(taxonomy_id)
        # 术语库id是否存在
        if len(db_name) == 0:
            code = codes.Builder_TaxonomyService_GetTopWords_TaxonomyIdNotExist
            
            return 500, Gview.TErrorreturn(code, taxonomy_id=taxonomy_id)
        db_name = db_name[taxonomy_id]
        graphdb = GraphDB()
        top_words = []
        # 获取无上级有下级的词
        url = 'http://{}:{}/{}/_search'.format(graphdb.esaddress, graphdb.esport, db_name)
        body = {
            "query": {
                "bool": {
                    "must": [
                        {
                            "term": {
                                "level.parent_count": 0
                            }
                        },
                        {
                            "range": {
                                "level.child_count": {
                                    "gte": 1
                                }
                            }
                        }
                    ]
                }
            },
            "track_total_hits": True,
            "from": 0,
            "size": 1000
        }
        try:
            response = requests.get(url, json=body, auth=HTTPBasicAuth(graphdb.esusername, graphdb.espassword),
                                    verify=False, timeout=10)
        except requests.exceptions.ConnectionError:
            message = _l('opensearch connection error')
            error_log = log_oper.get_error_log(
                'opensearch获取 {} 无上级有下级的词失败: {}'.format(db_name, message),
                sys._getframe())
            Logger.log_error(error_log)
            code = codes.Builder_TaxonomyService_GetTopWords_OpensearchError
            
            return 500, Gview.TErrorreturn(code, message=message)
        if response.status_code != 200:
            try:
                message = response.json()
            except:
                message = str(response.content)
            error_log = log_oper.get_error_log(
                'opensearch获取 {} 无上级有下级的词失败: {}'.format(db_name, message),
                sys._getframe())
            Logger.log_error(error_log)
            code = codes.Builder_TaxonomyService_GetTopWords_OpensearchError
            
            return 500, Gview.TErrorreturn(code, message=message)
        for doc in response.json()['hits']['hits']:
            a_doc = {
                'id': doc['_id'],
                'label': doc['_source']['label'],
                'level': doc['_source']['level']
            }
            top_words.append(a_doc)
        # 获取无上级无下级的词
        url = 'http://{}:{}/{}/_search'.format(graphdb.esaddress, graphdb.esport, db_name)
        body = {
            "query": {
                "bool": {
                    "must": [
                        {
                            "term": {
                                "level.parent_count": 0
                            }
                        },
                        {
                            "range": {
                                "level.child_count": {
                                    "lte": 0
                                }
                            }
                        }
                    ]
                }
            },
            "track_total_hits": True,
            "from": 0,
            "size": 1000
        }
        try:
            response = requests.get(url, json=body, auth=HTTPBasicAuth(graphdb.esusername, graphdb.espassword),
                                    verify=False, timeout=10)
        except requests.exceptions.ConnectionError:
            message = _l('opensearch connection error')
            error_log = log_oper.get_error_log(
                'opensearch获取 {} 无上级无下级的词失败: {}'.format(db_name, message),
                sys._getframe())
            Logger.log_error(error_log)
            code = codes.Builder_TaxonomyService_GetTopWords_OpensearchError
            
            return 500, Gview.TErrorreturn(code, message=message)
        if response.status_code != 200:
            try:
                message = response.json()
            except:
                message = str(response.content)
            error_log = log_oper.get_error_log(
                'opensearch获取 {} 无上级无下级的词失败: {}'.format(db_name, message),
                sys._getframe())
            Logger.log_error(error_log)
            code = codes.Builder_TaxonomyService_GetTopWords_OpensearchError
            
            return 500, Gview.TErrorreturn(code, message=message)
        for doc in response.json()['hits']['hits']:
            a_doc = {
                'id': doc['_id'],
                'label': doc['_source']['label'],
                'level': doc['_source']['level']
            }
            top_words.append(a_doc)
        
        return 200, Gview.json_return(top_words)

    def get_child_words(self, taxonomy_id: int, word_ids: list[str], params_json: dict):
        db_name = taxonomy_dao.get_db_names(taxonomy_id)
        # 术语库id是否存在
        if len(db_name) == 0:
            code = codes.Builder_TaxonomyService_GetChildWords_TaxonomyIdNotExist
            
            return 500, Gview.TErrorreturn(code, taxonomy_id=taxonomy_id)
        db_name = db_name[taxonomy_id]
        # 校验术语库查看权限
        # auth_list = data_auth.get_data_permission([taxonomy_id], drivenConstants.TAXONOMY, params_json['userId'],
        #                                           params_json['roles'])
        # if drivenConstants.TAXONOMY_VIEW not in auth_list[0]['codes']:
        #     code = codes.Builder_TaxonomyService_GetChildWords_NoPermissionError
        #     
        #     return 500, Gview.TErrorreturn(code, id=taxonomy_id)
        graphdb = GraphDB()
        # 检查word_id是否存在
        for word_id in word_ids:
            code, message = self.is_word_exist(db_name, word_id)
            if code == 404:
                code = codes.Builder_TaxonomyService_GetChildWords_WordIdNotExist
                
                return 500, Gview.TErrorreturn(code, word_id=word_id)
            elif code != 200:
                error_log = log_oper.get_error_log(
                    'opensearch检测 {} 是否存在失败: {}'.format(word_id, message),
                    sys._getframe())
                Logger.log_error(error_log)
                code = codes.Builder_TaxonomyService_GetChildWords_OpensearchError
                
                return 500, Gview.TErrorreturn(code, message=message)
        child_words = {}
        for word_id in word_ids:
            ngql = '''go from '{}' over subClassOf reversely yield src(edge)'''.format(word_id)
            code, res = graphdb._nebula_exec(ngql, db_name)
            if code != 200:
                code = codes.Builder_TaxonomyService_GetChildWords_NebulaError
                
                return 500, Gview.TErrorreturn(code,
                                               description=res.error_msg(),
                                               cause=_l('Nebula Internal Server Error. Get child word failed'))
            child_ids = []
            children = []
            for i in range(res.row_size()):
                child_ids.append(res.row_values(i)[0].as_string())
            url = 'http://{}:{}/{}/_search'.format(graphdb.esaddress, graphdb.esport, db_name)
            # 获取有上级有下级的词
            body = {
                "query": {
                    "bool": {
                        "must": [
                            {"term": {"level.parent_count": 1}},
                            {"range": {"level.child_count": {"gte": 1}}}
                        ],
                        "filter": [
                            {"ids": {"values": child_ids}}
                        ]
                    }
                },
                "track_total_hits": True,
                "from": 0,
                "size": 1000
            }
            try:
                response = requests.get(url, json=body, auth=HTTPBasicAuth(graphdb.esusername, graphdb.espassword),
                                        verify=False, timeout=10)
            except requests.exceptions.ConnectionError:
                message = _l('opensearch connection error')
                error_log = log_oper.get_error_log(
                    'opensearch在{}范围内获取有上级有下级的词失败: {}'.format(child_ids, message),
                    sys._getframe())
                Logger.log_error(error_log)
                code = codes.Builder_TaxonomyService_GetChildWords_OpensearchError
                
                return 500, Gview.TErrorreturn(code, message=message)
            if response.status_code != 200:
                try:
                    message = response.json()
                except:
                    message = str(response.content)
                error_log = log_oper.get_error_log(
                    'opensearch在{}范围内获取有上级有下级的词失败: {}'.format(child_ids, message),
                    sys._getframe())
                Logger.log_error(error_log)
                code = codes.Builder_TaxonomyService_GetChildWords_OpensearchError
                
                return 500, Gview.TErrorreturn(code, message=message)
            for doc in response.json()['hits']['hits']:
                a_doc = {
                    'id': doc['_id'],
                    'label': doc['_source']['label'],
                    'level': doc['_source']['level']
                }
                children.append(a_doc)
            # 获取有上级无下级的词
            body = {
                "query": {
                    "bool": {
                        "must": [
                            {"term": {"level.parent_count": 1}},
                            {"range": {"level.child_count": {"lte": 0}}}
                        ],
                        "filter": [
                            {"ids": {"values": child_ids}}
                        ]
                    }
                },
                "track_total_hits": True,
                "from": 0,
                "size": 1000
            }
            try:
                response = requests.get(url, json=body, auth=HTTPBasicAuth(graphdb.esusername, graphdb.espassword),
                                        verify=False, timeout=10)
            except requests.exceptions.ConnectionError:
                message = _l('opensearch connection error')
                error_log = log_oper.get_error_log(
                    'opensearch在{}范围内获取有上级无下级的词失败: {}'.format(child_ids, message),
                    sys._getframe())
                Logger.log_error(error_log)
                code = codes.Builder_TaxonomyService_GetChildWords_OpensearchError
                
                return 500, Gview.TErrorreturn(code, message=message)
            if response.status_code != 200:
                try:
                    message = response.json()
                except:
                    message = str(response.content)
                error_log = log_oper.get_error_log(
                    'opensearch在{}范围内获取有上级无下级的词失败: {}'.format(child_ids, message),
                    sys._getframe())
                Logger.log_error(error_log)
                code = codes.Builder_TaxonomyService_GetChildWords_OpensearchError
                
                return 500, Gview.TErrorreturn(code, message=message)
            for doc in response.json()['hits']['hits']:
                a_doc = {
                    'id': doc['_id'],
                    'label': doc['_source']['label'],
                    'level': doc['_source']['level']
                }
                children.append(a_doc)
            child_words[word_id] = children
        
        return 200, Gview.json_return(child_words)

    def get_words(self, taxonomy_id: int, word_ids: list[str], params_json: dict):
        db_name = taxonomy_dao.get_db_names(taxonomy_id)
        # 术语库id是否存在
        if len(db_name) == 0:
            code = codes.Builder_TaxonomyService_GetWords_TaxonomyIdNotExist
            
            return 500, Gview.TErrorreturn(code, taxonomy_id=taxonomy_id)
        db_name = db_name[taxonomy_id]
        graphdb = GraphDB()
        url = 'http://{}:{}/{}/_search'.format(graphdb.esaddress, graphdb.esport, db_name)
        body = {
            "query": {
                "ids": {
                    "values": word_ids
                }
            },
            "track_total_hits": True,
            "from": 0,
            "size": 1000
        }
        try:
            response = requests.get(url, json=body, auth=HTTPBasicAuth(graphdb.esusername, graphdb.espassword),
                                    verify=False, timeout=10)
        except requests.exceptions.ConnectionError:
            message = _l('opensearch connection error')
            error_log = log_oper.get_error_log(
                'opensearch获取词 {} 失败: {}'.format(word_ids, message),
                sys._getframe())
            Logger.log_error(error_log)
            code = codes.Builder_TaxonomyService_GetWords_OpensearchError
            
            return 500, Gview.TErrorreturn(code, message=message)
        if response.status_code != 200:
            try:
                message = response.json()
            except:
                message = str(response.content)
            error_log = log_oper.get_error_log(
                'opensearch获取词 {} 失败: {}'.format(word_ids, message),
                sys._getframe())
            Logger.log_error(error_log)
            code = codes.Builder_TaxonomyService_GetWords_OpensearchError
            
            return 500, Gview.TErrorreturn(code, message=message)
        word_infos = {}
        for doc in response.json()['hits']['hits']:
            word_infos[doc['_id']] = {
                'id': doc['_id'],
                'label': doc['_source']['label'],
                'level': doc['_source']['level']
            }
        
        return 200, Gview.json_return(word_infos)

    def search_word(self, taxonomy_id: int, params_json: dict):
        db_name = taxonomy_dao.get_db_names(taxonomy_id)
        # 术语库id是否存在
        if len(db_name) == 0:
            code = codes.Builder_TaxonomyService_SearchWord_TaxonomyIdNotExist
            
            return 500, Gview.TErrorreturn(code, taxonomy_id=taxonomy_id)
        db_name = db_name[taxonomy_id]
        search_res = []
        if not params_json['query']:
            
            return 200, Gview.json_return(search_res)
        graphdb = GraphDB()
        url = 'http://{}:{}/{}/_search'.format(graphdb.esaddress, graphdb.esport, db_name)
        if params_json['field'] == 'name_and_synonym':
            body = {
                "query": {
                    "nested": {
                        "path": "label",
                        "query": {
                            "bool": {
                                "should": [
                                    {
                                        "wildcard": {
                                            "label.name.keyword": "*{}*".format(
                                                self.str_process(params_json['query']))
                                        }
                                    },
                                    {
                                        "wildcard": {
                                            "label.synonym.keyword": "*{}*".format(
                                                self.str_process(params_json['query']))
                                        }
                                    }
                                ]
                            }
                        }
                    }
                },
                "track_total_hits": True,
                "from": 0,
                "size": 1000
            }
            try:
                response = requests.get(url, json=body, auth=HTTPBasicAuth(graphdb.esusername, graphdb.espassword),
                                        verify=False, timeout=10)
            except requests.exceptions.ConnectionError:
                message = _l('opensearch connection error')
                error_log = log_oper.get_error_log(
                    'opensearch搜索 {} 失败: {}'.format(params_json['query'], message),
                    sys._getframe())
                Logger.log_error(error_log)
                code = codes.Builder_TaxonomyService_SearchWord_OpensearchError
                
                return 500, Gview.TErrorreturn(code, message=message)
            if response.status_code != 200:
                try:
                    message = response.json()
                except:
                    message = str(response.content)
                error_log = log_oper.get_error_log(
                    'opensearch搜索 {} 失败: {}'.format(params_json['query'], message),
                    sys._getframe())
                Logger.log_error(error_log)
                code = codes.Builder_TaxonomyService_SearchWord_OpensearchError
                
                return 500, Gview.TErrorreturn(code, message=message)
            for doc in response.json()['hits']['hits']:
                a_doc = {
                    'id': doc['_id'],
                    'label': doc['_source']['label'],
                    'level': doc['_source']['level']
                }
                search_res.append(a_doc)
        elif params_json['field'] == 'displayed':
            body = {
                "query": {
                    "nested": {
                        "path": "label",
                        "query": {
                            "wildcard": {
                                "label.name.keyword": "*{}*".format(self.str_process(params_json['query']))
                            }
                        },
                        "inner_hits": {
                            "_source": "label"
                        }
                    }
                },
                "track_total_hits": True,
                "from": 0,
                "size": 1000
            }
            try:
                response = requests.get(url, json=body, auth=HTTPBasicAuth(graphdb.esusername, graphdb.espassword),
                                        verify=False, timeout=10)
            except requests.exceptions.ConnectionError:
                message = _l('opensearch connection error')
                error_log = log_oper.get_error_log(
                    'opensearch搜索 {} 失败: {}'.format(params_json['query'], message),
                    sys._getframe())
                Logger.log_error(error_log)
                code = codes.Builder_TaxonomyService_SearchWord_OpensearchError
                
                return 500, Gview.TErrorreturn(code, message=message)
            if response.status_code != 200:
                try:
                    message = response.json()
                except:
                    message = str(response.content)
                error_log = log_oper.get_error_log(
                    'opensearch搜索 {} 失败: {}'.format(params_json['query'], message),
                    sys._getframe())
                Logger.log_error(error_log)
                code = codes.Builder_TaxonomyService_SearchWord_OpensearchError
                
                return 500, Gview.TErrorreturn(code, message=message)
            for doc in response.json()['hits']['hits']:
                flag = False
                for inner_hits in doc['inner_hits']['label']['hits']['hits']:
                    if inner_hits['_nested']['offset'] == 0 \
                            or inner_hits['_source']['language'] == params_json['language']:
                        flag = True
                        break
                if flag:
                    search_res.append({
                        'id': doc['_id'],
                        'label': doc['_source']['label'],
                        'level': doc['_source']['level']
                    })
        
        return 200, Gview.json_return(search_res)

    def locate_word(self, taxonomy_id: int, word_id: str, params_json: dict):
        db_name = taxonomy_dao.get_db_names(taxonomy_id)
        # 术语库id是否存在
        if len(db_name) == 0:
            code = codes.Builder_TaxonomyService_LocateWord_TaxonomyIdNotExist
            
            return 500, Gview.TErrorreturn(code, taxonomy_id=taxonomy_id)
        db_name = db_name[taxonomy_id]
        locate_res = []
        if not word_id:
            
            return 200, Gview.json_return(locate_res)
        graphdb = GraphDB()
        # 检查word_id是否存在
        code, message = self.is_word_exist(db_name, word_id)
        if code == 404:
            code = codes.Builder_TaxonomyService_LocateWord_WordIdNotExist
            
            return 500, Gview.TErrorreturn(code, word_id=word_id)
        elif code != 200:
            error_log = log_oper.get_error_log(
                'opensearch检测 {} 是否存在失败: {}'.format(word_id, message),
                sys._getframe())
            Logger.log_error(error_log)
            code = codes.Builder_TaxonomyService_LocateWord_OpensearchError
            
            return 500, Gview.TErrorreturn(code, message=message)
        # 获取路径
        ngql = '''match p=(v1:word)<-[e:subClassOf*]-(v2:word) where id(v1)=="root" and id(v2)=="{}" return p'''.format(
            word_id)
        code, res = graphdb._nebula_exec(ngql, db_name)
        if code != 200:
            code = codes.Builder_TaxonomyService_LocateWord_NebulaError
            
            return 500, Gview.TErrorreturn(code,
                                           description=res.error_msg(),
                                           cause=_l("Nebula Internal Server Error"))
        nodes = res.row_values(0)[0].as_path().nodes()
        for node in nodes:
            locate_res.append(node.get_id().as_string())
        
        return 200, Gview.json_return(locate_res)

    def delete_word(self, taxonomy_id: int, params_json: dict):
        db_name = taxonomy_dao.get_db_names(taxonomy_id)
        # 术语库id是否存在
        if len(db_name) == 0:
            code = codes.Builder_TaxonomyService_DeleteWord_TaxonomyIdNotExist
            
            return 500, Gview.TErrorreturn(code, taxonomy_id=taxonomy_id)
        db_name = db_name[taxonomy_id]
        try:
            if params_json['delete_option'] == 'delete_one':
                self.delete_one(params_json['word_ids'], db_name)
            elif params_json['delete_option'] == 'delete_sub':
                self.delete_sub(params_json['word_ids'], db_name)
        except GraphDBException as e:
            code = e.delegate.error_value
            message = e.delegate.error_msg
            
            return 500, Gview.TErrorreturn(code, description=message, cause=message)
        except OpensearchException as e:
            code = e.delegate.error_value
            message = e.delegate.error_msg
            
            return 500, Gview.TErrorreturn(code, message=message)
        # 更新术语库word_num
        graphdb = GraphDB()
        url = 'http://{}:{}/{}/_count'.format(graphdb.esaddress, graphdb.esport, db_name)
        try:
            response = requests.get(url, auth=HTTPBasicAuth(graphdb.esusername, graphdb.espassword),
                                    verify=False, timeout=10)
        except requests.exceptions.ConnectionError:
            message = _l('opensearch connection error')
            error_log = log_oper.get_error_log(
                'opensearch获取文档数失败: {}'.format(message),
                sys._getframe())
            Logger.log_error(error_log)
            code = codes.Builder_TaxonomyService_DeleteWord_OpensearchError
            
            return 500, Gview.TErrorreturn(code, message=message)
        if response.status_code != 200:
            try:
                message = response.json()
            except:
                message = str(response.content)
            error_log = log_oper.get_error_log(
                'opensearch获取文档数失败: {}'.format(message),
                sys._getframe())
            Logger.log_error(error_log)
            code = codes.Builder_TaxonomyService_DeleteWord_OpensearchError
            
            return 500, Gview.TErrorreturn(code, message=message)
        word_num = response.json()['count']
        taxonomy_dao.update_word_num(taxonomy_id, word_num, params_json['userId'])
        self.update_knowledge(taxonomy_id, db_name)
        
        return 200, Gview.json_return('success')

    def delete_one(self, word_ids: list[str], db_name):
        # 仅删除此术语，其下术语将孤立在术语列表中
        if len(word_ids) == 0:
            return
        graphdb = GraphDB()
        word_ids_str = []
        for word_id in word_ids:
            word_ids_str.append("'{}'".format(word_id))
        word_ids_str = ','.join(word_ids_str)
        # 修改下级词的level,下级词连接至root
        ngql = '''go from {} over subClassOf reversely yield src(edge)'''.format(word_ids_str)
        code, res = graphdb._nebula_exec(ngql, db_name)
        if code != 200:
            message = 'nebula get child word of {} failed: {}'.format(word_ids, res.error_msg())
            error_log = log_oper.get_error_log(message, sys._getframe())
            Logger.log_error(error_log)
            
            code = codes.Builder_TaxonomyService_DeleteWord_NebulaError
            raise GraphDBException((ExceptLevel.ERROR, code, _l("Nebula Internal Server Error")))
        child_ids = []
        for i in range(res.row_size()):
            child_ids.append(res.row_values(i)[0].as_string())
        if child_ids:
            url = 'http://{}:{}/{}/_update_by_query'.format(graphdb.esaddress, graphdb.esport, db_name)
            body = {
                "query": {
                    "ids": {
                        "values": child_ids
                    }
                },
                "script": {
                    "lang": "painless",
                    "source": "ctx._source.level.parent_count = ctx._source.level.parent_count - 1"
                }
            }
            try:
                response = requests.post(url, json=body, params={'refresh': 'true'},
                                         auth=HTTPBasicAuth(graphdb.esusername, graphdb.espassword),
                                         verify=False, timeout=10)
            except requests.exceptions.ConnectionError:
                message = _l('opensearch connection error')
                error_log = 'opensearch update level of child word of {} failed: {}'.format(word_ids, message)
                error_log = log_oper.get_error_log(error_log, sys._getframe())
                Logger.log_error(error_log)
                
                code = codes.Builder_TaxonomyService_DeleteWord_OpensearchError
                raise OpensearchException((ExceptLevel.ERROR, code, message))
            if response.status_code != 200:
                try:
                    message = response.json()
                except:
                    message = str(response.content)
                error_log = 'opensearch update level of child word of {} failed: {}'.format(word_ids, message)
                error_log = log_oper.get_error_log(error_log, sys._getframe())
                Logger.log_error(error_log)
                
                code = codes.Builder_TaxonomyService_DeleteWord_OpensearchError
                raise OpensearchException((ExceptLevel.ERROR, code, message))
            edges = []
            for child_id in child_ids:
                edges.append("'{}'->'root':()".format(child_id))
            ngql = '''insert edge subClassOf() values {}'''.format(','.join(edges))
            code, res = graphdb._nebula_exec(ngql, db_name)
            if code != 200:
                message = 'insert edges {} -> root failed: {}'.format(child_ids, res.error_msg())
                error_log = log_oper.get_error_log(message, sys._getframe())
                Logger.log_error(error_log)
                
                code = codes.Builder_TaxonomyService_DeleteWord_NebulaError
                raise GraphDBException((ExceptLevel.ERROR, code, _l("Nebula Internal Server Error")))
        # 修改上级词的level
        ngql = '''go from {} over subClassOf yield dst(edge)'''.format(word_ids_str)
        code, res = graphdb._nebula_exec(ngql, db_name)
        if code != 200:
            message = 'nebula get parent word of {} failed: {}'.format(word_ids, res.error_msg())
            error_log = log_oper.get_error_log(message, sys._getframe())
            Logger.log_error(error_log)
            
            code = codes.Builder_TaxonomyService_DeleteWord_NebulaError
            raise GraphDBException((ExceptLevel.ERROR, code, _l("Nebula Internal Server Error")))
        parent_ids = []
        for i in range(res.row_size()):
            parent_ids.append(res.row_values(i)[0].as_string())
        if parent_ids:
            url = 'http://{}:{}/{}/_update_by_query'.format(graphdb.esaddress, graphdb.esport, db_name)
            body = {
                "query": {
                    "ids": {
                        "values": parent_ids
                    }
                },
                "script": {
                    "lang": "painless",
                    "source": "ctx._source.level.child_count = ctx._source.level.child_count - 1"
                }
            }
            try:
                response = requests.post(url, json=body, params={'refresh': 'true'},
                                         auth=HTTPBasicAuth(graphdb.esusername, graphdb.espassword),
                                         verify=False, timeout=10)
            except requests.exceptions.ConnectionError:
                message = _l('opensearch connection error')
                error_log = 'opensearch update level of parent word of {} failed: {}'.format(word_ids, message)
                error_log = log_oper.get_error_log(error_log, sys._getframe())
                Logger.log_error(error_log)
                
                code = codes.Builder_TaxonomyService_DeleteWord_OpensearchError
                raise OpensearchException((ExceptLevel.ERROR, code, message))
            if response.status_code != 200:
                try:
                    message = response.json()
                except:
                    message = str(response.content)
                error_log = 'opensearch update level of parent word of {} failed: {}'.format(word_ids, message)
                error_log = log_oper.get_error_log(error_log, sys._getframe())
                Logger.log_error(error_log)
                
                code = codes.Builder_TaxonomyService_DeleteWord_OpensearchError
                raise OpensearchException((ExceptLevel.ERROR, code, message))
        # opensearch delete
        url = 'http://{}:{}/{}/_delete_by_query'.format(graphdb.esaddress, graphdb.esport, db_name)
        body = {
            "query": {
                "ids": {
                    "values": word_ids
                }
            }
        }
        try:
            response = requests.post(url, json=body, params={'refresh': 'true'},
                                     auth=HTTPBasicAuth(graphdb.esusername, graphdb.espassword),
                                     verify=False, timeout=10)
        except requests.exceptions.ConnectionError:
            message = _l('opensearch connection error')
            error_log = 'opensearch delete word {} failed: {}'.format(word_ids, message)
            error_log = log_oper.get_error_log(error_log, sys._getframe())
            Logger.log_error(error_log)
            
            code = codes.Builder_TaxonomyService_DeleteWord_OpensearchError
            raise OpensearchException((ExceptLevel.ERROR, code, message))
        if response.status_code != 200:
            try:
                message = response.json()
            except:
                message = str(response.content)
            error_log = 'opensearch delete word {} failed: {}'.format(word_ids, message)
            error_log = log_oper.get_error_log(error_log, sys._getframe())
            Logger.log_error(error_log)
            
            code = codes.Builder_TaxonomyService_DeleteWord_OpensearchError
            raise OpensearchException((ExceptLevel.ERROR, code, message))
        # nebula delete
        ngql = '''delete vertex {} with edge'''.format(word_ids_str)
        code, res = graphdb._nebula_exec(ngql, db_name)
        if code != 200:
            message = 'nebula delete word {} failed: {}'.format(word_ids, res.error_msg())
            error_log = log_oper.get_error_log(message, sys._getframe())
            Logger.log_error(error_log)
            
            code = codes.Builder_TaxonomyService_DeleteWord_NebulaError
            raise GraphDBException((ExceptLevel.ERROR, code, _l("Nebula Internal Server Error")))          

    def delete_sub(self, word_ids: list[str], db_name):
        # 删除术语及其下所有术语
        if len(word_ids) == 0:
            return
        graphdb = GraphDB()
        # 修改上级词的level
        word_ids_str = []
        for word_id in word_ids:
            word_ids_str.append("'{}'".format(word_id))
        word_ids_str = ','.join(word_ids_str)
        ngql = '''go from {} over subClassOf yield dst(edge)'''.format(word_ids_str)
        code, res = graphdb._nebula_exec(ngql, db_name)
        if code != 200:
            message = 'nebula get parent word of {} failed: {}'.format(word_ids, res.error_msg())
            error_log = log_oper.get_error_log(message, sys._getframe())
            Logger.log_error(error_log)
            
            code = codes.Builder_TaxonomyService_DeleteWord_NebulaError
            raise GraphDBException((ExceptLevel.ERROR, code, _l("Nebula Internal Server Error")))
        parent_ids = []
        for i in range(res.row_size()):
            parent_ids.append(res.row_values(i)[0].as_string())
        if parent_ids:
            url = 'http://{}:{}/{}/_update_by_query'.format(graphdb.esaddress, graphdb.esport, db_name)
            body = {
                "query": {
                    "ids": {
                        "values": parent_ids
                    }
                },
                "script": {
                    "lang": "painless",
                    "source": "ctx._source.level.child_count = ctx._source.level.child_count - 1"
                }
            }
            try:
                response = requests.post(url, json=body, params={'refresh': 'true'},
                                         auth=HTTPBasicAuth(graphdb.esusername, graphdb.espassword),
                                         verify=False, timeout=10)
            except requests.exceptions.ConnectionError:
                message = _l('opensearch connection error')
                error_log = 'opensearch update level of parent word of {} failed: {}'.format(word_ids, message)
                error_log = log_oper.get_error_log(error_log, sys._getframe())
                Logger.log_error(error_log)
                
                code = codes.Builder_TaxonomyService_DeleteWord_OpensearchError
                raise OpensearchException((ExceptLevel.ERROR, code, message))
            if response.status_code != 200:
                try:
                    message = response.json()
                except:
                    message = str(response.content)
                error_log = 'opensearch update level of parent word of {} failed: {}'.format(word_ids, message)
                error_log = log_oper.get_error_log(error_log, sys._getframe())
                Logger.log_error(error_log)
                
                code = codes.Builder_TaxonomyService_DeleteWord_OpensearchError
                raise OpensearchException((ExceptLevel.ERROR, code, message))
        self.delete_sub_recursively(word_ids, db_name)
            
    def delete_sub_recursively(self, word_ids: list[str], db_name):
        # 递归删除目标词及其下级词
        if len(word_ids) == 0:
            return
        graphdb = GraphDB()
        word_ids_str = []
        for word_id in word_ids:
            word_ids_str.append("'{}'".format(word_id))
        word_ids_str = ','.join(word_ids_str)
        ngql = '''go from {} over subClassOf reversely yield src(edge)'''.format(word_ids_str)
        code, res = graphdb._nebula_exec(ngql, db_name)
        if code != 200:
            message = 'nebula get child word of {} failed: {}'.format(word_ids, res.error_msg())
            error_log = log_oper.get_error_log(message, sys._getframe())
            Logger.log_error(error_log)
            
            code = codes.Builder_TaxonomyService_DeleteWord_NebulaError
            raise GraphDBException((ExceptLevel.ERROR, code, _l("Nebula Internal Server Error")))
        child_ids = []
        for i in range(res.row_size()):
            child_ids.append(res.row_values(i)[0].as_string())
        self.delete_sub_recursively(child_ids, db_name)
        # opensearch delete
        url = 'http://{}:{}/{}/_delete_by_query'.format(graphdb.esaddress, graphdb.esport, db_name)
        body = {
            "query": {
                "ids": {
                    "values": word_ids
                }
            }
        }
        try:
            response = requests.post(url, json=body, params={'refresh': 'true'},
                                     auth=HTTPBasicAuth(graphdb.esusername, graphdb.espassword),
                                     verify=False, timeout=10)
        except requests.exceptions.ConnectionError:
            message = _l('opensearch connection error')
            error_log = 'opensearch delete word {} failed: {}'.format(word_ids, message)
            error_log = log_oper.get_error_log(error_log, sys._getframe())
            Logger.log_error(error_log)
            
            code = codes.Builder_TaxonomyService_DeleteWord_OpensearchError
            raise OpensearchException((ExceptLevel.ERROR, code, message))
        if response.status_code != 200:
            try:
                message = response.json()
            except:
                message = str(response.content)
            error_log = 'opensearch delete word {} failed: {}'.format(word_ids, message)
            error_log = log_oper.get_error_log(error_log, sys._getframe())
            Logger.log_error(error_log)
            
            code = codes.Builder_TaxonomyService_DeleteWord_OpensearchError
            raise OpensearchException((ExceptLevel.ERROR, code, message))
        # nebula delete
        ngql = '''delete vertex {} with edge'''.format(word_ids_str)
        code, res = graphdb._nebula_exec(ngql, db_name)
        if code != 200:
            message = 'nebula delete word {} failed: {}'.format(word_ids, res.error_msg())
            error_log = log_oper.get_error_log(message, sys._getframe())
            Logger.log_error(error_log)
            
            code = codes.Builder_TaxonomyService_DeleteWord_NebulaError
            raise GraphDBException((ExceptLevel.ERROR, code, _l("Nebula Internal Server Error")))
            
    def edit_custom_relation(self, taxonomy_id: int, params_json: dict):
        db_name = taxonomy_dao.get_db_names(taxonomy_id)
        # 术语库id是否存在
        if len(db_name) == 0:
            code = codes.Builder_TaxonomyService_EditCustomRelation_TaxonomyIdNotExist
            
            return 500, Gview.TErrorreturn(code, taxonomy_id=taxonomy_id)
        db_name = db_name[taxonomy_id]
        sql_ret = taxonomy_dao.get_custom_relation_by_taxonomy_id(taxonomy_id)
        origin_custom_relation = {}
        origin_custom_relation_name_id = {}
        for a_ret in sql_ret:
            origin_custom_relation[a_ret['id']] = a_ret['name']
            origin_custom_relation_name_id[a_ret['name']] = a_ret['id']
        new_custom_relation = list(origin_custom_relation.values())
        # 执行
        graphdb = GraphDB()
        new_ids = {}
        remove_ids = []
        error_res = []
        for change_item in params_json['change_list']:
            if change_item['action'] == 'add':
                name = change_item['name']
                if name in new_custom_relation:
                    if name in origin_custom_relation_name_id:
                        new_ids[name] = origin_custom_relation_name_id[name]
                    continue
                # nebula新建关系
                ngql = 'DROP EDGE IF EXISTS `{}`;'.format(name)
                ngql += 'CREATE EDGE IF NOT EXISTS `{}`()'.format(name.replace('\\', '\\\\'))
                code, res = graphdb._nebula_exec(ngql, db_name)
                if code != 200:
                    code = codes.Builder_TaxonomyService_EditCustomRelation_NebulaError
                    
                    error_res.append(Gview.TErrorreturn(code,
                                                   description=res.error_msg(),
                                                   cause=_l("Nebula Internal Server Error"))
                                     .json)
                    break
                # mysql记录
                new_id = taxonomy_dao.insert_custom_relation(name, taxonomy_id, params_json)
                new_ids[name] = new_id
            elif change_item['action'] == 'remove':
                custom_relation_id = change_item['id']
                if custom_relation_id not in origin_custom_relation:
                    remove_ids.append(custom_relation_id)
                    continue
                name = origin_custom_relation[custom_relation_id]
                new_custom_relation.remove(name)
                # mysql记录
                taxonomy_dao.delete_custom_relation(custom_relation_id)
                remove_ids.append(custom_relation_id)
                # nebula删除关系
                ngql = 'DROP EDGE IF EXISTS `{}`'.format(name)
                code, res = graphdb._nebula_exec(ngql, db_name)
                if code != 200:
                    code = codes.Builder_TaxonomyService_EditCustomRelation_NebulaError
                    
                    error_res.append(Gview.TErrorreturn(code,
                                                        description=res.error_msg(),
                                                        cause=_l("Nebula Internal Server Error"))
                                     .json)
                    break
        if error_res:
            res = {'new_ids': new_ids, 'remove_ids': remove_ids, 'error': error_res}
            taxonomy_dao.update_time(taxonomy_id, params_json['userId'])
            return 500, Gview.json_return(res)
        # # 等待2个nebula心跳时间
        # time.sleep(20)
        res = {'new_ids': new_ids, 'remove_ids': remove_ids}
        taxonomy_dao.update_time(taxonomy_id, params_json['userId'])
        
        return 200, Gview.json_return(res)

    def get_custom_relation(self, taxonomy_id: int, params_json: dict):
        # 术语库id是否存在
        if not taxonomy_dao.is_id_exist(taxonomy_id):
            code = codes.Builder_TaxonomyService_GetCustomRelation_TaxonomyIdNotExist
            
            return 500, Gview.TErrorreturn(code, taxonomy_id=taxonomy_id)
        custom_relation = taxonomy_dao.get_custom_relation_by_taxonomy_id(taxonomy_id)
        
        return 200, Gview.json_return(custom_relation)

    def create_relation_ispartof(self, taxonomy_id: int, params_json: dict):
        db_name = taxonomy_dao.get_db_names(taxonomy_id)
        # 术语库id是否存在
        if len(db_name) == 0:
            code = codes.Builder_TaxonomyService_CreateRelationIspartof_TaxonomyIdNotExist
            
            return 500, Gview.TErrorreturn(code, taxonomy_id=taxonomy_id)
        db_name = db_name[taxonomy_id]
        # 校验词的id是否存在
        start_word_id = params_json['start_word_id']
        end_word_id_list = params_json['end_word_id_list']
        for word_id in [start_word_id, *end_word_id_list]:
            code, message = self.is_word_exist(db_name, word_id)
            if code == 404:
                code = codes.Builder_TaxonomyService_CreateRelationIspartof_WordIdNotExist
                
                return 500, Gview.TErrorreturn(code, word_id=word_id)
            elif code != 200:
                error_log = log_oper.get_error_log(
                    'opensearch检测 {} 是否存在失败: {}'.format(word_id, message),
                    sys._getframe())
                Logger.log_error(error_log)
                code = codes.Builder_TaxonomyService_CreateRelationIspartof_OpensearchError
                
                return 500, Gview.TErrorreturn(code, message=message)
        # 新建关系
        graphdb = GraphDB()
        edge_str = []
        for end_word_id in end_word_id_list:
            edge_str.append('"{}"->"{}":()'.format(end_word_id, start_word_id))
        edge_str = ','.join(edge_str)
        ngql = 'insert edge `isPartOf`() values {}'.format(edge_str)
        code, res = graphdb._nebula_exec(ngql, db_name)
        if code != 200:
            code = codes.Builder_TaxonomyService_CreateRelationIspartof_NebulaError
            
            return 500, Gview.TErrorreturn(code,
                                           description=res.error_msg(),
                                           cause=_l("Nebula Internal Server Error"))
        taxonomy_dao.update_time(taxonomy_id, params_json['userId'])
        self.update_knowledge(taxonomy_id, db_name)
        
        return 200, Gview.json_return('success')

    def delete_relation_ispartof(self, taxonomy_id: int, params_json: dict):
        db_name = taxonomy_dao.get_db_names(taxonomy_id)
        # 术语库id是否存在
        if len(db_name) == 0:
            code = codes.Builder_TaxonomyService_DeleteRelationIspartof_TaxonomyIdNotExist
            
            return 500, Gview.TErrorreturn(code, taxonomy_id=taxonomy_id)
        db_name = db_name[taxonomy_id]
        start_word_id = params_json['start_word_id']
        end_word_id_list = params_json['end_word_id_list']
        # 删除关系
        graphdb = GraphDB()
        edge_str = []
        for end_word_id in end_word_id_list:
            edge_str.append('"{}"->"{}"'.format(end_word_id, start_word_id))
        edge_str = ','.join(edge_str)
        ngql = 'delete edge `isPartOf` {}'.format(edge_str)
        code, res = graphdb._nebula_exec(ngql, db_name)
        if code != 200:
            code = codes.Builder_TaxonomyService_DeleteRelationIspartof_NebulaError
            
            return 500, Gview.TErrorreturn(code,
                                           description=res.error_msg(),
                                           cause=_l("Nebula Internal Server Error"))
        taxonomy_dao.update_time(taxonomy_id, params_json['userId'])
        self.update_knowledge(taxonomy_id, db_name)
        
        return 200, Gview.json_return('success')

    def edit_relation_custom(self, taxonomy_id: int, params_json: dict):
        db_name = taxonomy_dao.get_db_names(taxonomy_id)
        # 术语库id是否存在
        if len(db_name) == 0:
            code = codes.Builder_TaxonomyService_EditRelationCustom_TaxonomyIdNotExist
            
            return 500, Gview.TErrorreturn(code, taxonomy_id=taxonomy_id)
        db_name = db_name[taxonomy_id]
        # 校验关系是否存在
        custom_relations = taxonomy_dao.get_custom_relation_by_taxonomy_id(taxonomy_id)
        relation_exists = False
        relation_name = ''
        for relation in custom_relations:
            if params_json['relation_id'] == relation['id']:
                relation_exists = True
                relation_name = relation['name']
                break
        if not relation_exists:
            code = codes.Builder_TaxonomyService_EditRelationCustom_CustomRelationIdNotExists
            
            return 500, Gview.TErrorreturn(code)
        # 校验词的id是否存在
        start_word_id = params_json['start_word_id']
        add_end_word_id_list = params_json['add_end_word_id_list']
        remove_end_word_id_list = params_json['remove_end_word_id_list']
        for word_id in [start_word_id, *add_end_word_id_list]:
            code, message = self.is_word_exist(db_name, word_id)
            if code == 404:
                code = codes.Builder_TaxonomyService_EditRelationCustom_WordIdNotExist
                
                return 500, Gview.TErrorreturn(code, word_id=word_id)
            elif code != 200:
                error_log = log_oper.get_error_log(
                    'opensearch检测 {} 是否存在失败: {}'.format(word_id, message),
                    sys._getframe())
                Logger.log_error(error_log)
                code = codes.Builder_TaxonomyService_EditRelationCustom_OpensearchError
                
                return 500, Gview.TErrorreturn(code, message=message)
        graphdb = GraphDB()
        # 添加关系
        edge_str = []
        for end_word_id in add_end_word_id_list:
            edge_str.append('"{}"->"{}":()'.format(start_word_id, end_word_id))
        if edge_str:
            edge_str = ','.join(edge_str)
            ngql = 'insert edge `{}` values {}'.format(relation_name.replace('\\', '\\\\'), edge_str)
            code, res = graphdb._nebula_exec(ngql, db_name)
            if code != 200:
                code = codes.Builder_TaxonomyService_EditRelationCustom_NebulaError
                
                return 500, Gview.TErrorreturn(code,
                                               description=res.error_msg(),
                                               cause=_l("Nebula Internal Server Error"))
        # 删除关系
        edge_str = []
        for end_word_id in remove_end_word_id_list:
            edge_str.append('"{}"->"{}"'.format(start_word_id, end_word_id))
        if edge_str:
            edge_str = ','.join(edge_str)
            ngql = 'delete edge `{}` {}'.format(relation_name.replace('\\', '\\\\'), edge_str)
            code, res = graphdb._nebula_exec(ngql, db_name)
            if code != 200:
                code = codes.Builder_TaxonomyService_EditRelationCustom_NebulaError
                
                return 500, Gview.TErrorreturn(code,
                                               description=res.error_msg(),
                                               cause=_l("Nebula Internal Server Error"))
        taxonomy_dao.update_time(taxonomy_id, params_json['userId'])
        self.update_knowledge(taxonomy_id, db_name)
        
        return 200, Gview.json_return('success')

    def delete_relation_custom(self, taxonomy_id: int, params_json: dict):
        db_name = taxonomy_dao.get_db_names(taxonomy_id)
        # 术语库id是否存在
        if len(db_name) == 0:
            code = codes.Builder_TaxonomyService_DeleteRelationCustom_TaxonomyIdNotExist
            
            return 500, Gview.TErrorreturn(code, taxonomy_id=taxonomy_id)
        db_name = db_name[taxonomy_id]
        error_res = []
        # 校验关系是否存在
        custom_relations = taxonomy_dao.get_custom_relation_by_taxonomy_id(taxonomy_id)
        custom_relations = {relation['id']: relation['name'] for relation in custom_relations}
        custom_relation_ids = list(custom_relations.keys())
        not_exist_id = set(params_json['relation_ids']) - set(custom_relation_ids)
        if len(not_exist_id) > 0:
            error_log = log_oper.get_error_log('自定义关系id {} 不存在'.format(not_exist_id), sys._getframe())
            Logger.log_error(error_log)
            code = codes.Builder_TaxonomyService_DeleteRelationCustom_CustomRelationIdNotExists
            error_res.append(Gview.TErrorreturn(code, relation_id=','.join([str(i) for i in not_exist_id])).json)

        # 校验词的id是否存在
        word_id = params_json['word_id']
        code, message = self.is_word_exist(db_name, word_id)
        if code == 404:
            
            return 200, Gview.json_return('success')
        elif code != 200:
            error_log = log_oper.get_error_log(
                'opensearch检测 {} 是否存在失败: {}'.format(word_id, message),
                sys._getframe())
            Logger.log_error(error_log)
            code = codes.Builder_TaxonomyService_DeleteRelationCustom_OpensearchError
            
            return 500, Gview.TErrorreturn(code, message=message)
        graphdb = GraphDB()
        success_ids = []
        error_ids = []
        for relation_id in params_json['relation_ids']:
            if relation_id in not_exist_id:
                continue
            relation_name = custom_relations[relation_id]
            # 删除关系
            ngql = 'go from "{word_id}" over `{relation_name}` yield src(edge) as s, dst(edge) as d ' \
                   '| delete edge `{relation_name}` $-.s -> $-.d' \
                .format(word_id=word_id, relation_name=relation_name.replace("\\", "\\\\"))
            code, res = graphdb._nebula_exec(ngql, db_name)
            if code != 200:
                error_ids.append(relation_id)
                continue
            success_ids.append(relation_id)
        if len(error_ids) > 0:
            code = codes.Builder_TaxonomyService_DeleteRelationCustom_NebulaError
            error_res.append(Gview.TErrorreturn(code,
                                                description=res.error_msg(),
                                                cause=','.join([str(i) for i in error_ids])
                                                ).json)
        taxonomy_dao.update_time(taxonomy_id, params_json['userId'])
        self.update_knowledge(taxonomy_id, db_name)
        
        res = {'error': error_res,
               'res': ','.join([str(i) for i in success_ids])}
        return 200, Gview.json_return(res)

    def get_relation_ispartof(self, taxonomy_id: int, params_json: dict):
        db_name = taxonomy_dao.get_db_names(taxonomy_id)
        # 术语库id是否存在
        if len(db_name) == 0:
            code = codes.Builder_TaxonomyService_GetRelationIspartof_TaxonomyIdNotExist
            
            return 500, Gview.TErrorreturn(code, taxonomy_id=taxonomy_id)
        db_name = db_name[taxonomy_id]
        # 校验词的id是否存在
        word_id = params_json['word_id']
        code, message = self.is_word_exist(db_name, word_id)
        if code == 404:
            code = codes.Builder_TaxonomyService_GetRelationIspartof_WordIdNotExist
            
            return 500, Gview.TErrorreturn(code, word_id=word_id)
        elif code != 200:
            error_log = log_oper.get_error_log(
                'opensearch检测 {} 是否存在失败: {}'.format(word_id, message),
                sys._getframe())
            Logger.log_error(error_log)
            code = codes.Builder_TaxonomyService_GetRelationIspartof_OpensearchError
            
            return 500, Gview.TErrorreturn(code, message=message)
        graphdb = GraphDB()
        # 获取属性
        # nebula获取id
        ngql = 'go from "{word_id}" over `isPartOf` reversely yield src(edge) as s'.format(word_id=word_id)
        code, res = graphdb._nebula_exec(ngql, db_name)
        if code != 200:
            code = codes.Builder_TaxonomyService_GetRelationIspartof_NebulaError
            
            return 500, Gview.TErrorreturn(code,
                                           description=res.error_msg(),
                                           cause=_l("Nebula Internal Server Error"))
        result_word_ids = []
        result_word = []
        for i in range(res.row_size()):
            result_word_ids.append(res.row_values(i)[0].as_string())
        # opensearch获取基本信息
        url = 'http://{}:{}/{}/_search'.format(graphdb.esaddress, graphdb.esport, db_name)
        query = params_json.get('query')
        if query:
            # 搜索
            body = {
                "query": {
                    "bool": {
                        "must": [
                            {
                                "nested": {
                                    "path": "label",
                                    "query": {
                                        "wildcard": {
                                            "label.name.keyword": "*{}*".format(self.str_process(query))
                                        }
                                    },
                                    "inner_hits": {
                                        "_source": "label"
                                    }
                                }
                            }
                        ],
                        "filter": {
                            "ids": {
                                "values": result_word_ids
                            }
                        }
                    }
                },
                "track_total_hits": True,
                "from": 0,
                "size": 1000
            }
            try:
                response = requests.get(url, json=body, auth=HTTPBasicAuth(graphdb.esusername, graphdb.espassword),
                                        verify=False, timeout=10)
            except requests.exceptions.ConnectionError:
                message = _l('opensearch connection error')
                error_log = log_oper.get_error_log(
                    'opensearch在 {} 范围内搜索 {} 失败: {}'.format(result_word_ids, query, message),
                    sys._getframe())
                Logger.log_error(error_log)
                code = codes.Builder_TaxonomyService_GetRelationIspartof_OpensearchError
                
                return 500, Gview.TErrorreturn(code, message=message)
            if response.status_code != 200:
                try:
                    message = response.json()
                except:
                    message = str(response.content)
                error_log = log_oper.get_error_log(
                    'opensearch在 {} 范围内搜索 {} 失败: {}'.format(result_word_ids, query, message),
                    sys._getframe())
                Logger.log_error(error_log)
                code = codes.Builder_TaxonomyService_GetRelationIspartof_OpensearchError
                
                return 500, Gview.TErrorreturn(code, message=message)
            for doc in response.json()['hits']['hits']:
                flag = False
                for inner_hits in doc['inner_hits']['label']['hits']['hits']:
                    if inner_hits['_nested']['offset'] == 0 \
                            or inner_hits['_source']['language'] == params_json['language']:
                        flag = True
                        break
                if flag:
                    result_word.append({
                        'id': doc['_id'],
                        'label': doc['_source']['label']
                    })
        else:
            body = {
                "query": {
                    "ids": {
                        "values": result_word_ids
                    }
                },
                "track_total_hits": True,
                "from": 0,
                "size": 1000
            }
            try:
                response = requests.get(url, json=body, auth=HTTPBasicAuth(graphdb.esusername, graphdb.espassword),
                                        verify=False, timeout=10)
            except requests.exceptions.ConnectionError:
                message = _l('opensearch connection error')
                error_log = log_oper.get_error_log(
                    'opensearch获取 {} 失败: {}'.format(result_word_ids, message),
                    sys._getframe())
                Logger.log_error(error_log)
                code = codes.Builder_TaxonomyService_GetRelationIspartof_OpensearchError
                
                return 500, Gview.TErrorreturn(code, message=message)
            if response.status_code != 200:
                try:
                    message = response.json()
                except:
                    message = str(response.content)
                error_log = log_oper.get_error_log(
                    'opensearch获取 {} 失败: {}'.format(result_word_ids, message),
                    sys._getframe())
                Logger.log_error(error_log)
                code = codes.Builder_TaxonomyService_GetRelationIspartof_OpensearchError
                
                return 500, Gview.TErrorreturn(code, message=message)
            for doc in response.json()['hits']['hits']:
                a_doc = {
                    'id': doc['_id'],
                    'label': doc['_source']['label']
                }
                result_word.append(a_doc)
        
        return 200, Gview.json_return(result_word)

    def get_relation_custom(self, taxonomy_id: int, params_json: dict):
        db_name = taxonomy_dao.get_db_names(taxonomy_id)
        # 术语库id是否存在
        if len(db_name) == 0:
            code = codes.Builder_TaxonomyService_GetRelationCustom_TaxonomyIdNotExist
            
            return 500, Gview.TErrorreturn(code, taxonomy_id=taxonomy_id)
        db_name = db_name[taxonomy_id]
        # 校验词的id是否存在
        word_id = params_json['word_id']
        code, message = self.is_word_exist(db_name, word_id)
        if code == 404:
            code = codes.Builder_TaxonomyService_GetRelationCustom_WordIdNotExist
            
            return 500, Gview.TErrorreturn(code, word_id=word_id)
        elif code != 200:
            error_log = log_oper.get_error_log(
                'opensearch检测 {} 是否存在失败: {}'.format(word_id, message),
                sys._getframe())
            Logger.log_error(error_log)
            code = codes.Builder_TaxonomyService_GetRelationCustom_OpensearchError
            
            return 500, Gview.TErrorreturn(code, message=message)
        graphdb = GraphDB()
        result_list = []
        # 获取自定义关系
        custom_relations = taxonomy_dao.get_custom_relation_by_taxonomy_id(taxonomy_id)
        for relation in custom_relations:
            relation_id = relation['id']
            relation_name = relation['name']
            # nebula获取id
            ngql = 'go from "{word_id}" over `{relation_name}` yield dst(edge) as d' \
                .format(word_id=word_id, relation_name=relation_name.replace("\\", "\\\\"))
            code, res = graphdb._nebula_exec(ngql, db_name)
            if code != 200:
                # schema未创建则跳过
                if 'not found' in res.error_msg():
                    continue
                code = codes.Builder_TaxonomyService_GetRelationCustom_NebulaError
                
                return 500, Gview.TErrorreturn(code,
                                               description=res.error_msg(),
                                               cause=_l("Nebula Internal Server Error"))
            result_word_ids = []
            result_word = []
            for i in range(res.row_size()):
                result_word_ids.append(res.row_values(i)[0].as_string())
            if len(result_word_ids) > 0:
                # opensearch获取基本信息
                url = 'http://{}:{}/{}/_search'.format(graphdb.esaddress, graphdb.esport, db_name)
                query = params_json.get('query')
                if query:
                    # 搜索
                    body = {
                        "query": {
                            "bool": {
                                "must": [
                                    {
                                        "nested": {
                                            "path": "label",
                                            "query": {
                                                "wildcard": {
                                                    "label.name.keyword": "*{}*".format(self.str_process(query))
                                                }
                                            },
                                            "inner_hits": {
                                                "_source": "label"
                                            }
                                        }
                                    }
                                ],
                                "filter": {
                                    "ids": {
                                        "values": result_word_ids
                                    }
                                }
                            }
                        },
                        "track_total_hits": True,
                        "from": 0,
                        "size": 1000
                    }
                    try:
                        response = requests.get(url, json=body,
                                                auth=HTTPBasicAuth(graphdb.esusername, graphdb.espassword),
                                                verify=False, timeout=10)
                    except requests.exceptions.ConnectionError:
                        message = _l('opensearch connection error')
                        error_log = log_oper.get_error_log(
                            'opensearch在 {} 范围内搜索 {} 失败: {}'.format(result_word_ids, query, message),
                            sys._getframe())
                        Logger.log_error(error_log)
                        code = codes.Builder_TaxonomyService_GetRelationCustom_OpensearchError
                        
                        return 500, Gview.TErrorreturn(code, message=message)
                    if response.status_code != 200:
                        try:
                            message = response.json()
                        except:
                            message = str(response.content)
                        error_log = log_oper.get_error_log(
                            'opensearch在 {} 范围内搜索 {} 失败: {}'.format(result_word_ids, query, message),
                            sys._getframe())
                        Logger.log_error(error_log)
                        code = codes.Builder_TaxonomyService_GetRelationCustom_OpensearchError
                        
                        return 500, Gview.TErrorreturn(code, message=message)
                    for doc in response.json()['hits']['hits']:
                        flag = False
                        for inner_hits in doc['inner_hits']['label']['hits']['hits']:
                            if inner_hits['_nested']['offset'] == 0 \
                                    or inner_hits['_source']['language'] == params_json['language']:
                                flag = True
                                break
                        if flag:
                            result_word.append({
                                'id': doc['_id'],
                                'label': doc['_source']['label']
                            })
                else:
                    body = {
                        "query": {
                            "ids": {
                                "values": result_word_ids
                            }
                        },
                        "track_total_hits": True,
                        "from": 0,
                        "size": 1000
                    }
                    response = requests.get(url, json=body,
                                            auth=HTTPBasicAuth(graphdb.esusername, graphdb.espassword),
                                            verify=False, timeout=10)
                    if response.status_code != 200:
                        try:
                            message = response.json()
                        except:
                            message = str(response.content)
                        error_log = log_oper.get_error_log(
                            'opensearch获取 {} 失败: {}'.format(result_word_ids, message),
                            sys._getframe())
                        Logger.log_error(error_log)
                        code = codes.Builder_TaxonomyService_GetRelationCustom_OpensearchError
                        
                        return 500, Gview.TErrorreturn(code, message=message)
                    for doc in response.json()['hits']['hits']:
                        a_doc = {
                            'id': doc['_id'],
                            'label': doc['_source']['label']
                        }
                        result_word.append(a_doc)
                if len(result_word) > 0:
                    result_list.append({
                        'relation_id': relation_id,
                        'relation_name': relation_name,
                        'words': result_word
                    })
        
        return 200, Gview.json_return(result_list)

    def str_process(self, s):
        ''' 对特殊字符进行处理
        用于 opensearch script 语句'''
        return s.replace('\\', '\\\\') \
            .replace("\'", "\\'")

    def update_knowledge(self, taxonomy_id: int, db_name: str):
        graphdb = GraphDB()
        graphdb._nebula_exec('SUBMIT JOB stats', db_name)

        retry_num = 3
        code = 0
        res = None
        while retry_num > 0:
            code, res = graphdb._nebula_exec('show stats', db_name)
            if code == 500 and res.error_msg() == "Job is not finished!":
                retry_num -= 1
                time.sleep(0.2)
            else:
                break

        if code != 200:
            error_log = log_oper.get_error_log('统计术语库知识量失败！', sys._getframe())
            Logger.log_error(error_log)
            return

        edges = res.row_values(res.row_size() - 1)[2].as_int()
        vertices = res.row_values(res.row_size() - 2)[2].as_int()

        knowledge_info = taxonomy_dao.get_taxonomy_knowledge_by_id(taxonomy_id)
        if len(knowledge_info) == 0:
            taxonomy_dao.insert_knowledge(taxonomy_id, edges + vertices * 3)
        else:
            taxonomy_dao.update_knowledge(taxonomy_id, edges + vertices * 3)


def get_md5(data):
    if isinstance(data, str):
        data = data.encode("utf-8")
    md = hashlib.md5()
    md.update(data)
    return md.hexdigest()


taxonomy_service = TaxonomyService()
