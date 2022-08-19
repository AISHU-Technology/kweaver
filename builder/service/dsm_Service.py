# -*-coding:utf-8-*-
# @Time    : 2020/8/10 18:24
# @Author  : Lowe.li
# @Email   : Lowe.li@aishu.cn
import pika
from utils.log_info import Logger
from utils.Gview import Gview
from utils.common_response_status import CommonResponseStatus
from dao.dsm_dao import dsm_dao
from dao.graph_dao import graph_dao
import arrow
from utils.CommonUtil import commonutil
from flask import Response
import datetime
import time
from utils.log_info import Logger
import pandas as pd
import json,requests
from utils.Otl_Util import otl_util
from dao.knw_dao import knw_dao

class DsmService():
    def connectTest(self, params_json, host_url):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        if params_json["data_source"] == "as" or params_json["data_source"] == "as7":
            ds_address = params_json["ds_address"]
            if "https://" not in ds_address:
                ds_address = "https://" + ds_address
                params_json["ds_address"] = ds_address
        # data_source 1 mysql 2 as 3 hive
        if params_json["data_source"] == "mysql":
            try:
                ret = dsm_dao.mysqlConnectTest(params_json)
                # 密码解密错误
                if ret == "-1":
                    ret_code = CommonResponseStatus.SERVER_ERROR.value
                    obj['cause'] = "Password encryption error"
                    obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
                    obj['message'] = "test connection fail"
                    return ret_code, obj
                # 超时处理
                elif ret == "-2":
                    ret_code = CommonResponseStatus.SERVER_ERROR.value
                    obj['cause'] = "connection %s timeout " % params_json["ds_address"]
                    obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                    obj['message'] = "test connection fail"
                    return ret_code, obj


                elif not ret or ret == None:
                    obj["res"] = "test connection"
                    return ret_code, obj
                else:
                    obj["res"] = "test connection "
                    return ret_code, obj
            except Exception as e:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                err = repr(e)
                Logger.log_error(err)
                obj['cause'] = err
                if "SQL" in err or "DatabaseError" in err or "MariaDB" in err or "column" in err.lower() or "row" in err.lower():
                    obj['cause'] = "you have an error in your SQL!"
                obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                if "password" in err:
                    obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
                    obj['cause'] = "User or Password in mysql have error"
                obj['message'] = "test connection fail"
                return ret_code, obj
        elif params_json["data_source"] == "as7":
            ret_code, obj_test = dsm_dao.as7TestCon(params_json)

            if ret_code == 200:
                obj["res"]="Anyshare7 test connection "
                return ret_code, obj
            else:
                if "JSONDecodeError" in obj_test["cause"]:
                    obj_test["cause"] = "Please check parameter ds_address and ds_port, May not match!"
                return ret_code, obj_test
        elif params_json["data_source"] == "as" :
            ret_code, obj_test = commonutil.asTestCon(params_json)
            if ret_code == 200:
                obj["res"]="Anyshare7 test connection success"
                return ret_code, obj
            else:
                if "JSONDecodeError" in obj["cause"]:
                    obj_test["cause"] = "Please check parameter ds_address and ds_port, May not match!"
                return ret_code, obj_test

        elif params_json["data_source"] == "hive":
            try:

                ret = dsm_dao.hiveConnectTest(params_json)

                if ret == "-1":#解密
                    ret_code = CommonResponseStatus.SERVER_ERROR.value
                    obj['cause'] = "Password encryption error"
                    obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
                    obj['message'] = "test connection fail"
                    return ret_code, obj
                # elif ret == "-2":###time out
                #     ret_code = CommonResponseStatus.SERVER_ERROR.value
                #     obj['cause'] = "connection %s timeout " % params_json["ds_address"]
                #     obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                #     obj['message'] = "test connection fail"
                #     return ret_code, obj
                # elif not ret or ret == None:##无表
                #     obj["res"] = "test connection"
                #     return ret_code, obj
                else:
                    obj["res"] = "test connection"
                    return ret_code, obj
            except Exception as e:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                err = repr(e)
                Logger.log_error(err)
                obj['cause'] = err
                if "SQL" in err or "DatabaseError" in err or "MariaDB" in err or "column" in err.lower() or "row" in err.lower():
                    obj['cause'] = "you have an error in your SQL!"
                obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                if "Error validating the login" in err:
                    obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
                    obj['cause'] = "User or password in hive has some error"
                obj['message'] = "test connection fail"
                return ret_code, obj

        elif params_json["data_source"] == "rabbitmq":
            try:
                user = params_json.get("ds_user")
                password = params_json.get("ds_password")
                host = params_json.get("ds_address")
                port = params_json.get("ds_port")
                queue = params_json.get("queue")
                vhost = params_json.get("vhost")

                password = commonutil.DecryptBybase64(password)
                # 配置RabbitMQ账号密码
                credentials = pika.PlainCredentials(user, password)
                # 连接RabbitMQ server
                connection = pika.BlockingConnection(
                    pika.ConnectionParameters(host=host, port=port, virtual_host=vhost, credentials=credentials, socket_timeout=3))
                # 创建链接通道
                channel = connection.channel()
                def callback(ch, method, properties, body):
                    print("Received msg: {}".format(json.loads(body)))

                channel.basic_consume(queue, callback, auto_ack=True)
                connection.close()

                obj['res'] = "test connection"
                return 200, obj
            except Exception as e:
                print("测试连接失败")
                mess = "test connection fail: RabbitMQ 连接参数错误！"
                err_code = CommonResponseStatus.REQUEST_ERROR.value
                err = repr(e)
                print(err)
                Logger.log_error("RabbitMQ测试连接失败: {}".format(err))
                if "authentication error" in err and "ConnectionClosedByBroker: (403)" in err:
                    mess = "账号错误、密码错误!"
                    err_code = CommonResponseStatus.USRPASS_ERROR.value
                elif "specified virtual host" in err and "ConnectionClosedByBroker: (530)" in err:
                    mess = "vhost输入错误!"
                    err_code = CommonResponseStatus.VHOST_ERROR.value
                elif "TCP connection attempt timed out" in err or "No route to host" in err:
                    mess = "地址host输入错误!"
                    err_code = CommonResponseStatus.HOST_PORT_ERROR.value
                elif "ConnectionRefusedError(10061, 'Unknown error')" in err or "AMQPConnectorSocketConnectError: " \
                                                                              "ConnectionRefusedError(111, " \
                                                                              "'Connection refused')" in err:
                    mess = "端口号port输入错误!"
                    err_code = CommonResponseStatus.HOST_PORT_ERROR.value
                elif "NOT_FOUND - no queue" in err:
                    mess = "队列名称queue错误!"
                    err_code = CommonResponseStatus.QUEUE_ERROR.value
                
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                obj['cause'] = mess
                obj['code'] = err_code
                obj['message'] = "test connection fail"
                return ret_code, obj
        else:
            obj['cause'] = "data_source no rule"
            obj['code'] = CommonResponseStatus.BAD_REQUEST.value
            obj['message'] = "test connection fail"
            ret_code = CommonResponseStatus.BAD_REQUEST.value

            return ret_code, obj
    def Oauth_2(self,params_json):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try :
            ds_address=params_json["ds_address"]
            ds_route=params_json["ds_route"]
            ds_auth=params_json["ds_auth"]
            ds_port=str(params_json["ds_port"])
            host_url=commonutil.getHostUrl()
            host_url=host_url.replace("http:","https:")
            if ds_auth == "":
                value_json = []
                value_json.append(ds_address)
                value_json.append(ds_port)
                ds_auth = dsm_dao.insert_token(value_json)
            redirect_uri = host_url + ds_route + "/" + str(ds_auth)
            redirect_uri_logout=redirect_uri+"logout"
            data = {
                "client_name": "test",
                "grant_types": [
                    "authorization_code",
                    "implicit",
                    "refresh_token"
                ],
                "response_types": [
                    "token id_token",
                    "code",
                    "token"
                ],
                "scope": "openid offline all",
                "redirect_uris": [
                    redirect_uri
                ],
                "post_logout_redirect_uris": [
                    redirect_uri_logout
                ],
                "metadata": {
                    "device": {
                        "client_type": "web"
                    }
                }
            }
            data = json.dumps(data)
            url = ds_address+":"+ ds_port + "/oauth2/clients"
            print(url)
            response = requests.post(url=url, data=data, verify=False,timeout=10)

            if response.status_code==201 :
                rs_json = response.json()
                client_id = rs_json["client_id"]
                client_secret = rs_json["client_secret"]
                client_id_url = "client_id=" + client_id
                redirect_uri_url="redirect_uri="+redirect_uri
                response_type_url = "response_type=" + "code"
                scope_url = "scope=" + "openid offline all"
                state_url = "state=" +commonutil.random_string(10)
                ####ds_auth 等于空插入数据，不等于空更新数据
                try:
                    # if ds_auth=="":
                    #     value_json=[]
                    #     value_json.append(ds_address)
                    #     value_json.append(redirect_uri)
                    #     value_json.append(client_id)
                    #     value_json.append(client_secret)
                    #     ds_auth=dsm_dao.insert_token(value_json)
                    # else :
                    value_json = []
                    value_json.append(ds_address)
                    value_json.append(ds_port)
                    value_json.append(redirect_uri)
                    value_json.append(client_id)
                    value_json.append(client_secret)
                    value_json.append(str(ds_auth))
                    df=dsm_dao.getdatabyauth(ds_auth)
                    if len(df) == 0:
                        ret_code = CommonResponseStatus.SERVER_ERROR.value
                        obj['cause'] = "ds_auth  %s not exist!" % ds_auth
                        obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                        obj['message'] = "Get authorization fail"
                        return ret_code, obj
                    else:
                        dsm_dao.update_token(value_json)
                        ds_auth_url= "ds_auth=" +str(ds_auth)
                        ####传给前端，跳转显示页面，用户登录，返回code
                        url = "{}/oauth2/auth?".format(ds_address+":"+ds_port)+ client_id_url +"&"+ redirect_uri_url+"&" + response_type_url +"&"+ scope_url +"&"+ state_url+"&" +ds_auth_url
                        res={}
                        res["ds_auth"]=str(ds_auth)
                        res["ds_url"]=url
                        obj["res"]=res
                        return ret_code,obj
                except Exception as e:
                    ret_code = CommonResponseStatus.SERVER_ERROR.value
                    err = repr(e)
                    Logger.log_error(err)
                    obj['cause'] = "Insert auth fail"
                    obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                    obj['message'] = "Get authorization fail"
                    return ret_code, obj

            else:
                causemsg = response.text
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                obj['cause'] = causemsg
                obj['code'] = CommonResponseStatus.DS_ADDRESS_ERROR.value
                obj['message'] = "Get authorization fail"
                return ret_code, obj
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)
            obj['cause'] = err
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            if "timeout" in err.lower() or "connectionerror" in err.lower() :
                obj['code'] = CommonResponseStatus.DS_ADDRESS_ERROR.value
            obj['message'] = "Get authorization fail"
            return ret_code, obj


    def insert_refresh_token(self,params_json):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        ds_code=params_json["ds_code"]
        ds_auth=params_json["ds_auth"]
        try :
            df=dsm_dao.getcode(ds_code)
            if len(df)!=0:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                obj['cause'] = "code has been exist"
                obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                obj['message'] = "Insert refresh_token fail"
                return ret_code, obj
            else:
                try :
                    obj_token=dsm_dao.gettokenbycode(ds_auth,ds_code)
                    if obj_token =="-1":
                        ret_code = CommonResponseStatus.SERVER_ERROR.value
                        obj['cause'] = "Get token fail"
                        obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                        obj['message'] = "Insert refresh_token fail"
                        return ret_code, obj
                    if obj_token =="-2":
                        ret_code = CommonResponseStatus.SERVER_ERROR.value
                        obj['cause'] = "ds_auth {} not exist ".format(ds_auth)
                        obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                        obj['message'] = "Insert refresh_token fail"
                        return ret_code, obj
                    value_list=[]
                    refresh_token=obj_token["refresh_token"]
                    access_token=obj_token["access_token"]
                    value_list.append(refresh_token)
                    value_list.append(access_token)
                    value_list.append(ds_code)
                    value_list.append(ds_auth)
                    df=dsm_dao.getdatabyauth(ds_auth)
                    if len(df) == 0:
                        ret_code = CommonResponseStatus.SERVER_ERROR.value
                        obj['cause'] = "ds_auth  %s not exist!" % ds_auth
                        obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                        obj['message'] = "Insert refresh_token fail"
                        return ret_code,obj
                    else:
                        try:
                            ds_auth=dsm_dao.insert_refresh_token("code",value_list)
                            obj["res"]= "Insert refreshtoken sucess "
                            return ret_code, obj
                        except Exception as e:
                            err = repr(e)
                            Logger.log_error(err)
                            ret_code = CommonResponseStatus.SERVER_ERROR.value
                            obj['cause'] = "insert token false!"
                            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                            obj['message'] = "Insert refresh_token fail"
                            return ret_code, obj
                except  Exception as e:
                    err = repr(e)
                    Logger.log_error(err)
                    ret_code = CommonResponseStatus.SERVER_ERROR.value
                    obj['cause'] = "get token false!"
                    obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                    obj['message'] = "Insert refresh_token fail"
                    return ret_code, obj

        except Exception as e:
            err = repr(e)
            Logger.log_error(err)
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            obj['cause'] = "get code false!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = "Insert refresh_token fail"
            return ret_code, obj

    def verify(self, params_json):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            ret_v, obj_v = dsm_dao.verify(params_json)
            if ret_v != CommonResponseStatus.SUCCESS.value:
                return ret_v, obj_v
            else:
                obj["res"] = "Verify success"
                return ret_code, obj
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)
            obj['cause'] = err
            obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
            obj['message'] = "insert fail"
            return ret_code, obj



    def addds(self, params_json, host_url):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        ds_id = -1  # 数据源id
        try:
            dsname = params_json["dsname"]
            knw_id = params_json["knw_id"]

            # 知识网络不存在
            df = knw_dao.get_knw_by_id(knw_id)
            if len(df) == 0:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                obj["ErrorCode"] = "Builder.service.dsm_Service.DsmService.addds.NotFindKnwError"
                obj["Description"] = "id  %s not exist!" % knw_id
                obj["Solution"] = "id  %s not exist!" % knw_id
                obj["ErrorDetails"] = "insert fail"
                obj["ErrorLink"] = ""
                return ret_code, obj, ds_id

            # 校验数据源名是否重名
            resbyname = dsm_dao.getbydsname(dsname, knw_id)
            resname = resbyname.to_dict('records')
            if len(resname) > 0:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                obj["ErrorCode"] = "Builder.service.dsm_Service.DsmService.addds.SameNameError"
                obj["Description"] = "database already have the same name"
                obj["Solution"] = "database already have the same name"
                obj["ErrorDetails"] = "insert fail"
                obj["ErrorLink"] = ""
                return ret_code, obj, ds_id


            ret = dsm_dao.insertData(params_json)
            ds_id = ret
            obj["res"] = "insert "
        except Exception as e:
            err = repr(e)
            Logger.log_error(err)
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            # err = repr(e)
            # obj['cause'] = err
            # if "SQL" in err or "DatabaseError" in err or "MariaDB" in err or "column" in err.lower() or "row" in err.lower():
            #     obj['cause'] = "you have an error in your SQL!"
            # obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj["ErrorCode"] = "Builder.service.dsm_Service.DsmService.addds.RequestError"
            obj["Description"] = "you have an error in your SQL!"
            obj["Solution"] = err
            obj["ErrorDetails"] = "insert fail"
            obj["ErrorLink"] = ""
            # Response(status=500)

        return ret_code, obj, ds_id
    def getall(self, args, host_url):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}

        try:
            page = args.get("page")
            # user = args.get("user")
            size = args.get("size")
            order = args.get("order")
            knw_id = args.get("knw_id")
            count = dsm_dao.getCountByKnwId(knw_id)
            res = {}

            # 知识网络不存在
            df = knw_dao.get_knw_by_id(knw_id)
            if len(df) == 0:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                obj['cause'] = "id  %s not exist!" % knw_id
                obj['code'] = "Builder.service.dsm_service.DsmService.getall.NotFindKnwError"
                obj['message'] = "select fail"
                return ret_code, obj

            ret = dsm_dao.getall(int(page)-1, int(size), order, knw_id)
            rec_dict = ret.to_dict('records')

            if page == "-1":
                for i in range(len(rec_dict)):
                    if "sort" in rec_dict[i]:
                        rec_dict[i].pop("sort")
                count = len(rec_dict)
            res["count"] = count
            res["df"] = rec_dict
            ret = ret.values.tolist()
            obj["res"] = res
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err or "column" in err.lower() or "row" in err.lower():
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = "Builder.service.dsm_Service.DsmService.getall.RequestError"
            obj['message'] = "insert connection fail"

        return ret_code, obj

    def getbydsname(self, args, host_url):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}

        try:
            page = args.get("page")
            dsname = args.get("dsname")
            size = args.get("size")
            order = args.get("order")
            knw_id = args.get("knw_id")

            # 知识网络不存在
            df = knw_dao.get_knw_by_id(knw_id)
            if len(df) == 0:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                obj['cause'] = "id  %s not exist!" % knw_id
                obj['code'] = "Builder.service.dsm_service.DsmService.getbydsname.NotFindKnwError"
                obj['message'] = "select fail"
                return ret_code, obj

            count = dsm_dao.getCountbyname(dsname, knw_id)
            ret = dsm_dao.getallbyname(dsname, int(page)-1, int(size), order, knw_id)
            rec_dict = ret.to_dict('records')
            res = {}
            res["count"] = count
            res["df"] = rec_dict
            obj["res"] = res
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err or "column" in err.lower() or "row" in err.lower():
                obj['cause'] = "you have an error in your SQL!"
            else:
                obj['cause'] = err
            obj['code'] = "Builder.service.dsm_Service.DsmService.getbydsname.RequestError"
            obj['message'] = "query datasource fail"

        return ret_code, obj
    def getbyid(self,id):
        df = dsm_dao.getbyid(id)
        return df

    def getCount(self, host_url):
        count = dsm_dao.getCount()
        return count

    def delete(self, params_json, host_url):
        ret_code = CommonResponseStatus.SUCCESS.value
        message = ""
        obj = {}
        flag_code = False
        flag_no_exit = False
        ids = params_json["dsids"]
        ids = set(ids)
        try :
            df = dsm_dao.getbyids(ids)
            ret_list = list(set(ids) ^ set(df["id"]))
            # 不存在的 id
            if len(ret_list) > 0:
                flag_no_exit = True
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                message += "%s not exits!" % ",".join('%s' % id2 for id2 in ret_list)

            if len(df) > 0:
                useds = graph_dao.getdsgraphuseall()
                useds = useds.dropna(axis=0, how='all')
                # useds = useds[useds["graph_ds"]]
                useds = useds['graph_ds'].drop_duplicates().values.tolist()
                used_list = []
                for i in useds:
                    i = eval(i)
                    used_list.extend(i)

                # 使用中所有的和参数中存在的id 交集 不能删除
                use_list = list(set(df["id"]).intersection(set(used_list)))
                # 参数中存在的id和不能删除的差集 可删除
                unuse_list = list(set(df["id"]) ^ set(use_list))
                if len(unuse_list) > 0:
                    ret = dsm_dao.delete(unuse_list)
                    if ret == 0:
                        ids = unuse_list
                        message += "success delete dsids  %s !" % ",".join('%s' % id2 for id2 in ids)
                    else:
                        ids = unuse_list
                        message += "failed delete dsids  %s !" % ",".join('%s' % id2 for id2 in ids)

                if len(use_list) > 0:
                    flag_code = True
                    ret_code = CommonResponseStatus.DELETE_USEDDS_ERROR.value
                    message += "%s is used cannot del!" % ",".join('%s' % id2 for id2 in use_list)
            if flag_code:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                obj['cause'] = message
                obj['code'] = CommonResponseStatus.DELETE_USEDDS_ERROR.value
                obj['message'] = "delete fail!"
            else:
                if flag_no_exit:
                    ret_code = CommonResponseStatus.SERVER_ERROR.value
                    obj['cause'] = message
                    obj['code'] = CommonResponseStatus.DS_NO_EXIST_ERROR.value
                    obj['message'] = "delete fail!"
                else:
                    obj["res"] = "success delete dsids %s !" % ids



        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err or "column" in err.lower() or "row" in err.lower():
                obj['cause'] = "you have an error in your SQL!"
            else:
                obj['cause'] = err
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = "delete %s failed!" % ",".join('%s' % id2 for id2 in ids)
        return ret_code, obj

    # 编辑数据源
    def update(self, id, params_json, host_url):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            df = dsm_dao.getbyid(id)
            if len(df) == 0:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                obj['cause'] = "dsId  %s not exist!" % id
                obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                obj['message'] = "update fail"
            else:
                dsname = params_json["dsname"]
                resbyname = dsm_dao.getbydsnameId(dsname, id)
                resname = resbyname.to_dict('records')
                if len(resname) > 0:
                    ret_code = CommonResponseStatus.SERVER_ERROR.value
                    obj['cause'] = "database already have the same name"
                    obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
                    obj['message'] = "update fail"
                    return ret_code, obj
                dsm_dao.update(id, params_json)
                obj["res"] = "update dsId "
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err or "column" in err.lower() or "row" in err.lower():
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            if "Duplicate entry" in err:
                obj['cause'] = "database already have the same name"
                obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
            obj['message'] = "update  fail"

        return ret_code, obj

    # 该数据源ID是否存在
    def checkById(self, id):
        obj = {}
        try:
            df = dsm_dao.getbyid(id)
            if len(df) == 0:
                obj['Cause'] = "ds_id  %s not exist!" % id
                obj['Code'] = CommonResponseStatus.REQUEST_ERROR.value
                obj['message'] = "ds_id error"
                return -1, obj
            else:
                return 0, {}
        except Exception as e:
            Logger.log_error(repr(e))
            obj['Cause'] = repr(e)
            obj['Code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = "error"
            return -1, obj

dsm_service = DsmService()
