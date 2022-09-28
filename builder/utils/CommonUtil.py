# -*-coding:utf-8-*-
import base64
import socket

from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_v1_5 as Cipher_pkcsl_v1_5
from configparser import ConfigParser
from config import config as Config
import requests
import json

from third_party_service.anyshare.token import asToken
from utils.common_response_status import CommonResponseStatus
from flask import request
import re

import string,random




public_key = '''-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC7JL0DcaMUHumSdhxXTxqiABBC
DERhRJIsAPB++zx1INgSEKPGbexDt1ojcNAc0fI+G/yTuQcgH1EW8posgUni0mcT
E6CnjkVbv8ILgCuhy+4eu+2lApDwQPD9Tr6J8k21Ruu2sWV5Z1VRuQFqGm/c5vaT
OQE5VFOIXPVTaa25mQIDAQAB
-----END PUBLIC KEY-----
'''
class Commonutil(object):
    def __init__(self):
        self.public_key = Config.public_key


#  /^(?=^.{3,255}$)[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+$/

    def is_valid_domain(self, value):
        # domian_pattern = re.compile(
        #     '^(([a-zA-Z]{1})|([a-zA-Z]{1}[a-zA-Z]{1})|([a-zA-Z]{1}[0-9]{1})|([0-9]{1}[a-zA-Z]{1})|([a-zA-Z0-9][-_.a-zA-Z0-9]{0,61}[a-zA-Z0-9]))\.([a-zA-Z]{2,13}|[a-zA-Z0-9-]{2,30}.[a-zA-Z]{2,3})$'
        # )
        if "--" in value:
            return False

        domian_pattern = re.compile(
            r'^(?=^.{3,255}$)[a-zA-Z0-9][-_a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-_a-zA-Z0-9]{0,62})+$'
        )
        ip_pattern = re.compile(
            '^(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|[1-9])\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)$')
        return True if domian_pattern.match(value) or ip_pattern.match(value) else False


    def getMethodParam(self):
        params_json = {}
        param_ = 0
        message = ""

        try:
            if request.method == "GET":
                params_json = request.args.to_dict()
            else:
                params_json = request.get_data()
                # print(params_json)
                params_json = json.loads(params_json)
        except Exception as e:
            message = repr(e)
            param_ = -1
        return param_, params_json, message


    # base64加密
    def EncryptBybase64(self, password):
        # 想将字符串转编码成base64,要先将字符串转换成二进制数据
        password = password.encode("utf-8")
        str_password = base64.b64encode(password)  # 被编码的参数必须是二进制数据
        return str_password

    # base64 解密
    def DecryptBybase64(self, str_password):
        # 将base64解码成字符串
        password = base64.b64decode(str_password).decode("utf-8")
        return password

        # 'https://www.cnblogs.com/songzhixue/'


    # rsa加密
    def RSAEndcode(self, msg):
        msg = bytes(msg, encoding="utf8")
        rsakey = RSA.importKey(self.public_key)
        cipher = Cipher_pkcsl_v1_5.new(rsakey)
        cipher_text = base64.b64encode(cipher.encrypt(msg))
        return cipher_text.decode()

    # 通过配置文件读取 用户名和密码
    def getUserInfoByConfig(self, filename):

        # filename = "../Config/as.config"
        encoding = "utf-8"
        config = ConfigParser()
        config.read(filename, encoding)
        account = config['loginconfig'].get('account')
        password = config['loginconfig'].get('password')
        # pub_key = config['pub_key'].get('pub_key')
        return account, password
    # 通过配置文件读取 url path
    def getUrl(self, filename, url_path_name):
        encoding = "utf-8"
        config = ConfigParser()
        config.read(filename, encoding)
        url = config['url_path'].get(url_path_name)
        return url


    def getdocidbypath(self,ds_address,ds_port,access_token,ds_path,flag="test"):
        """根据路径名判断是否为文件夹"""
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        url ="{}:{}/api/efast/v1/file/getinfobypath".format(ds_address,ds_port)
        payload = {"namepath":ds_path}
        headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + access_token
        }
        try:
            response = requests.request("POST", url, headers=headers, data=json.dumps(payload), timeout=10,verify=False)
            resp_json = response.json()
            if response.status_code == 200:  #####获得docid 获得路径
                docid = resp_json["docid"]
                if resp_json["size"] != -1:
                    ret_code = CommonResponseStatus.SERVER_ERROR.value
                    obj['cause'] = "%s not a directory!" % ds_path
                    obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                    obj['message'] = "Get docid by ds_path Fail"
                    return ret_code, obj
                if flag=="test":
                    res="Get docid by ds_path success "
                    obj["res"]=res
                    return ret_code, obj
                else :
                    obj["docid"]=docid
                    return ret_code, obj

            else:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                obj['cause'] = resp_json['cause']
                obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                obj['message'] = "Get docid by ds_path Fail"
                return ret_code, obj
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            obj['cause'] = err
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = "Get docid by ds_path Fail"
            return ret_code, obj









    def random_string(self, n):
        passwd = ""
        num = string.ascii_letters + string.digits
        for _ in range(n):
            passwd += random.choice(num)
        return passwd

    def asTestCon(self, params_json):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            try:
                r_code, token_obj = asToken.get_token(params_json["ds_auth"])
            except Exception as e:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                err = repr(e)
                obj['cause'] = err
                obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                obj['message'] = "test connection fail"
                return ret_code, obj

            if r_code == 200:
                tokenid = token_obj
                url = params_json["ds_address"] + ':' + str(params_json["ds_port"]) + "/api/v1/file/getinfobypath"
                payload = {"namepath": params_json["ds_path"]}
                headers = {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + tokenid
                }
                try:
                    response = requests.request("POST", url, headers=headers, data=json.dumps(payload))

                    if response.status_code == 200:
                        resp_json = response.json()
                        if resp_json["size"] != -1:
                            ret_code = CommonResponseStatus.SERVER_ERROR.value
                            obj['cause'] = "%s not a directory!" % params_json["ds_path"]
                            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                            obj['message'] = "test connection fail"
                            return ret_code, obj
                        else:
                            obj["res"] = "test connection"
                            return ret_code, obj
                    else:
                        resp_json = response.json()
                        ret_code = CommonResponseStatus.SERVER_ERROR.value
                        obj['cause'] = resp_json['cause']
                        obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                        obj['message'] = "test connection fail"
                        return ret_code, obj
                except Exception as e:
                    ret_code = CommonResponseStatus.SERVER_ERROR.value
                    err = repr(e)
                    obj['cause'] = err
                    obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                    obj['message'] = "test connection fail"
                    return ret_code, obj
            else:
                rs_json = token_obj
                causemsg = rs_json['cause']
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                obj['cause'] = rs_json['cause']
                obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                if "用户名或密码不正确" in causemsg or "RSA_private" in causemsg:
                    obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
                obj['message'] = "test connection fail"
                return ret_code, obj

        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            obj['cause'] = err
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = "test connection fail"
            return ret_code, obj

    def getHostUrl(self):
        studio_ip = socket.gethostbyname("kwhost")
        hostUrl = f"http://{studio_ip}/"
        return hostUrl

    def updatemongo(self, db, collection, filter, source):
        find_dict = {"name":filter["name"]}
        if source == "type_sa":
            find_dict["type_nw"] = "true"
        ss = db[collection].find_one(find_dict)
        if ss:  ##如果存在
            update = {"$set": {source: "true"}}
            db[collection].update_many(find_dict, update)
        else:
            if source != "type_sa":
                data = {"name": filter["name"],
                        "adlabel_kcid": filter["name"],
                        "kc_topic_tags": "",
                        "weight": "",
                        "type_as": "false",
                        "type_sa": "false",
                        "type_nw": "false",
                        "type_kc": "false",
                        "ds_id":str(filter["ds_id"])}
                data[source] = "true"
                db[collection].insert_one(data)













commonutil = Commonutil()
