# -*-coding:utf-8-*-
# @Time    : 2020/10/17 17:41
# @Author  : Lowe.li
# @Email   : Lowe.li@aishu.cn
import base64
import json
import random
import re
import string
from configparser import ConfigParser
from enum import Enum

import requests
from Crypto.Cipher import PKCS1_v1_5 as Cipher_pkcsl_v1_5
from Crypto.PublicKey import RSA
from flask import request
from flask_babel import gettext as _l
from jsonschema import ValidationError

from config import config as Config
from utils.common_response_status import CommonResponseStatus

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
        ipv4_pattern = re.compile(
            '^(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|[1-9])\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)$')
        ipv6_pattern = re.compile(
            '^((([0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){1,7}:)|(([0-9A-Fa-f]{1,4}:){6}:[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){5}(:[0-9A-Fa-f]{1,4}){1,2})|(([0-9A-Fa-f]{1,4}:){4}(:[0-9A-Fa-f]{1,4}){1,3})|(([0-9A-Fa-f]{1,4}:){3}(:[0-9A-Fa-f]{1,4}){1,4})|(([0-9A-Fa-f]{1,4}:){2}(:[0-9A-Fa-f]{1,4}){1,5})|([0-9A-Fa-f]{1,4}:(:[0-9A-Fa-f]{1,4}){1,6})|(:(:[0-9A-Fa-f]{1,4}){1,7})|(([0-9A-Fa-f]{1,4}:){6}(\\d|[1-9]\\d|1\\d{2}|2[0-4]\\d|25[0-5])(\\.(\\d|[1-9]\\d|1\\d{2}|2[0-4]\\d|25[0-5])){3})|(([0-9A-Fa-f]{1,4}:){5}:(\\d|[1-9]\\d|1\\d{2}|2[0-4]\\d|25[0-5])(\\.(\\d|[1-9]\\d|1\\d{2}|2[0-4]\\d|25[0-5])){3})|(([0-9A-Fa-f]{1,4}:){4}(:[0-9A-Fa-f]{1,4}){0,1}:(\\d|[1-9]\\d|1\\d{2}|2[0-4]\\d|25[0-5])(\\.(\\d|[1-9]\\d|1\\d{2}|2[0-4]\\d|25[0-5])){3})|(([0-9A-Fa-f]{1,4}:){3}(:[0-9A-Fa-f]{1,4}){0,2}:(\\d|[1-9]\\d|1\\d{2}|2[0-4]\\d|25[0-5])(\\.(\\d|[1-9]\\d|1\\d{2}|2[0-4]\\d|25[0-5])){3})|(([0-9A-Fa-f]{1,4}:){2}(:[0-9A-Fa-f]{1,4}){0,3}:(\\d|[1-9]\\d|1\\d{2}|2[0-4]\\d|25[0-5])(\\.(\\d|[1-9]\\d|1\\d{2}|2[0-4]\\d|25[0-5])){3})|([0-9A-Fa-f]{1,4}:(:[0-9A-Fa-f]{1,4}){0,4}:(\\d|[1-9]\\d|1\\d{2}|2[0-4]\\d|25[0-5])(\\.(\\d|[1-9]\\d|1\\d{2}|2[0-4]\\d|25[0-5])){3})|(:(:[0-9A-Fa-f]{1,4}){0,5}:(\\d|[1-9]\\d|1\\d{2}|2[0-4]\\d|25[0-5])(\\.(\\d|[1-9]\\d|1\\d{2}|2[0-4]\\d|25[0-5])){3}))$')
        return True if domian_pattern.match(value) or ipv4_pattern.match(value) or ipv6_pattern.match(value) else False

    def getMethodParam(self):
        params_json = {}
        param_ = 0
        message = ""

        try:
            if request.method == "GET":
                params_json = request.args.to_dict()
            else:
                params_json = request.get_data()
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

    def getdocidbypath(self, ds_address, ds_port, access_token, ds_path, flag="test"):
        """根据路径名判断是否为文件夹"""
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        url = "{}:{}/api/efast/v1/file/getinfobypath".format(ds_address, ds_port)
        payload = {"namepath": ds_path}
        headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + access_token
        }
        try:
            response = requests.request("POST", url, headers=headers, data=json.dumps(payload), timeout=10,
                                        verify=False)
            resp_json = response.json()
            if response.status_code == 200:  #####获得docid 获得路径
                docid = resp_json["docid"]
                if resp_json["size"] != -1:
                    ret_code = CommonResponseStatus.SERVER_ERROR.value
                    obj['cause'] = "%s not a directory!" % ds_path
                    obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                    obj['message'] = "Get docid by ds_path Fail"
                    return ret_code, obj
                if flag == "test":
                    res = "Get docid by ds_path success "
                    obj["res"] = res
                    return ret_code, obj
                else:
                    obj["docid"] = docid
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

    def handleParamError(self, exc: ValidationError) -> str:
        ''' 对jsonschema校验的异常处理报错语句 '''
        errorMessage = exc.message
        paramName = ''  # 出错的字段
        if len(exc.absolute_path) > 0:
            paramName = exc.absolute_path[-1]
            # 如果是array类型，则paramName有可能是数组序号
            i = -1
            while isinstance(paramName, int):
                i -= 1
                try:
                    paramName = exc.absolute_path[i]
                except IndexError:
                    paramName = ''
                    break
            errorMessage = "{} {}".format(paramName, errorMessage)
        error_type = ''
        if len(exc.absolute_schema_path) > 0:
            error_type = exc.absolute_schema_path[-1]
        if error_type == 'required':
            paramName = ', '.join(set(exc.validator_value) - set(exc.instance.keys()))
            errorMessage = _l(" parameter: ") + paramName + _l(" is required!")
        elif error_type == "type":
            if exc.validator_value == 'string':
                errorMessage = _l(" parameter: ") + paramName + _l(" must be a string type!")
            elif exc.validator_value == "integer":
                errorMessage = _l(" parameter: ") + paramName + _l(" must be an int type!")
            elif exc.validator_value == "float":
                errorMessage = _l(" parameter: ") + paramName + _l(" must be a float type!")
            elif exc.validator_value == "array":
                errorMessage = _l(" parameter: ") + paramName + _l(" must be a list!")
            elif exc.validator_value == "object":
                errorMessage = _l(" parameter: ") + paramName + _l(" must be a dict!")
            elif exc.validator_value == "boolean":
                errorMessage = _l(" parameter: ") + paramName + _l(" must be a bool type!")
        elif error_type in ["minLength", 'minItems']:
            errorMessage = _l(" parameter: ") + paramName + _l(" length is at least ") + str(exc.validator_value) \
                           + _l("!")
            if len(exc.instance) == 0:
                errorMessage = _l(" parameter: ") + paramName + _l(" cannot be empty. ")
        elif error_type in ["maxLength", 'maxItems']:
            errorMessage = _l(" parameter: ") + paramName + _l(" length is up to ") + str(exc.validator_value) + _l("!")
        elif error_type == "pattern":
            errorMessage = _l(" parameter: ") + paramName + _l(self.GetErrorMessageByRegex(str(exc.validator_value)))
        elif error_type == "uniqueItems":
            errorMessage = _l(" parameter: ") + paramName + _l(" has duplicated items!")
        elif error_type == 'enum':
            errorMessage = _l(" parameter: ") + paramName + _l(" must be in ") + str(exc.validator_value)
        return errorMessage

    def GetErrorMessageByRegex(self, key: str):
        regexErrorMessage: dict[str, str] = {
            # 中英文、数字和键盘上的特殊字符
            RegularEnum.ENGLISH_CHINESE_AND_SPECIAL_SYMBOLS_ON_THE_KEYBOARD.value:
                _l(" must be Chinese and English, numbers and special symbols on the keyboard!"),
            # 十六进制的数字
            u'^[0-9a-f]+$':
                _l(" must be a hexadecimal number within the range of 0-9 or a-f!"),
            # 正整数
            '^[1-9][0-9]*$':
                _l(" must be int ")
        }
        if key in regexErrorMessage:
            return regexErrorMessage[key]
        return _l(" is invalid!")

    def random_string(self, n):
        passwd = ""
        num = string.ascii_letters + string.digits
        for _ in range(n):
            passwd += random.choice(num)
        return passwd

    def getHostUrl(self):
        hostUrl = request.host_url
        return hostUrl

    def check_statement_num(self, sql):
        """
        判断 sql 是否为单条语句
        """
        pattern_1 = r'\"(.*?)\"'
        pattern_2 = r'\'(.*?)\''

        sql = sql.strip()
        if sql[-1] == ';':
            sql = sql[:-1]
        semicolon_num = sql.count(';')
        matches = re.findall(pattern_1, sql)
        matches.extend(re.findall(pattern_2, sql))

        for match in matches:
            semicolon_num -= match.count(';')

        if semicolon_num > 0:
            return False
        return True


class RegularEnum(Enum):
    ENGLISH_CHINESE_AND_SPECIAL_SYMBOLS_ON_THE_KEYBOARD = u'^[=~!@#$&%^&*()_+`{}\-[\];:,.\\\?<>\'"|/~！@#￥%…&*（）—+。={ }|·【 】‘“’”：；、《》？，。\n/a-zA-Z0-9\u4e00-\u9fa5]+$'
    ENGLISH_CHINESE_AND_UNDERLINE = u'^[_a-zA-Z0-9\u4e00-\u9fa5]+$'
    ENGLISH_NUMBER_AND_UNDERLINE = u'^[_a-zA-Z0-9]+$'


commonutil = Commonutil()
