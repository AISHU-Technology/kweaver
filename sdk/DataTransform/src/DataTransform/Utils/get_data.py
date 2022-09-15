import requests
from requests.auth import HTTPBasicAuth
import json
import configparser
import pandas as pd
from datasets import Dataset

config = configparser.ConfigParser()
config.read("./asapi.conf")
postfixdic = {}
postfixdic["excel"] = ["xlsx", "xls", "xlsm", "xlsb", "xltx", "xltm", "xml", "xlam", "xla", "xlw", "xlr"]

postfixdic["json"] = ["json"]
postfixdic["csv"] = ["csv"]


class Get_AS_DATA(object):
    def __init__(self, host, port, path, postfix):
        self.host = host
        self.port = port
        self.path = path
        self.postfix = postfix
    
    def get_client_id(self):
        """
        通过AS的API获取客户端凭证Client_id,Client_secret(用以获取AS的token)
        """
        url = "http://{}:9080/clients".format(self.host.split("//")[-1])
        payload = {
            "client_name": "test",
            "grant_types": [
                "client_credentials"
            ],
            "response_types": [
                "token"
            ],
            "scope": "all"
        }
        data = json.dumps(payload)
        response = requests.post(url=url, data=data, verify=False, timeout=10)
        if response.status_code == 201:
            rs_json = response.json()
            client_id = rs_json["client_id"]
            client_secret = rs_json["client_secret"]
            return client_id, client_secret
    
    def get_acc_token(self, client_id, client_secret):
        """
        client_id：客户端凭证id
        client_secret：客户端凭证secret
        return AS的token
        """
        url_gettoken = "{}:{}/oauth2/token".format(self.host, self.port)
        payload = {"grant_type": "client_credentials",
                   "scope": "all"}
        response = requests.post(url_gettoken, auth=HTTPBasicAuth(client_id, client_secret), data=payload, verify=False)
        if response.status_code == 200:
            acc_token = response.json()["access_token"]
            return acc_token
    
    def filter_file(self, docid, acc_token, postfix):
        """
        以文件尾缀为规则，展开文件夹，获取需要的文件类型
        docid：AS的文件gensid
        acc_token：AS的token
        postfix：用户需要的文件类型（文件尾缀）
        """
        ret_code = 200
        obj = {}
        port = str(self.port)
        dirlist = config.get("as7", "dirlist")
        dirlist_url = self.host + ':' + port + dirlist
        dirlist_payload = {"docid": docid}
        dirlist_headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + acc_token,
            'Content-Type': 'text/plain'
        }
        dirlist_response = requests.request("POST", dirlist_url, headers=dirlist_headers, timeout=10,
                                            data=json.dumps(dirlist_payload), verify=False)
        # print("otldao filter_by_postfix dirlist_response {0}".format(dirlist_response))
        resp_json2 = dirlist_response.json()
        # print(resp_json2)
        # print("resp_json2")
        # print(resp_json2)
        # print("dirlist_response.status_code")
        # print(dirlist_response.status_code)
        if dirlist_response.status_code == 200:
            # print("files")
            files = resp_json2["files"]
            dirs = resp_json2["dirs"]
            resp_json2["newfiles"] = []
            resp_json2["newdirs"] = []
            for dir in dirs:
                newdir = {}
                newdir["docid"] = dir["docid"]
                newdir["type"] = "dir"
                resp_json2["newdirs"].append(newdir)
            postfix = postfix.lower()
            
            for file in files:
                filename = file["name"]
                file_type = filename.split(".")[-1]
                # print(filename)
                try:
                    if postfix == "all":
                        newfile = {}
                        newfile["docid"] = file["docid"]
                        newfile["type"] = "file"
                        resp_json2["newfiles"].append(newfile)
                    else:
                        if file_type.lower() in postfixdic[postfix]:
                            newfile = {}
                            newfile["docid"] = file["docid"]
                            newfile["type"] = "file"
                            resp_json2["newfiles"].append(newfile)
                except Exception as e:
                    ret_code = 500
                    obj['cause'] = "Con`t support this type of file"
                    obj['message'] = " Show by postfix False "
                    return ret_code, obj
            
            resp_json2.pop("files")
            resp_json2.pop("dirs")
            dirs = resp_json2["newdirs"]
            files = resp_json2["newfiles"]
            dirs.extend(files)
            # print(dirs)
            count = len(dirs)
            res = {}
            res["output"] = dirs
            res["count"] = count
            obj["res"] = res
            return ret_code, obj
        else:
            ret_code = 500
            obj['cause'] = resp_json2['cause']
            obj['message'] = " Show by postfix False "
            return ret_code, obj
    
    def get_table_list(self, file_list, acc_token, table_list, postfix):
        """
        以递归的方式展开文件夹获取文件
        file_list：入口文件夹list
        acc_token：AS的token
        postfix：文件类型
        """
        ret_code = 200
        new_file_list = []
        for file in file_list:
            if file["type"] == "dir":
                docid = file["docid"]
                ret_code, ret_message = self.filter_file(docid, acc_token, postfix)
                # print("otl_service get_table_list ret_message{0}".format(ret_message))
                if ret_code == 500:
                    return ret_code, ret_message
                output = ret_message["res"]["output"]
                for newfile in output:
                    if newfile["type"] == "file":
                        # path = self.convertpath (newfile["docid"],  acc_token)
                        table_list.append(newfile["docid"])
                    if newfile["type"] == "dir":
                        new_file_list.append(newfile)
            else:
                # path = self.convertpath(file["docid"], acc_token)
                table_list.append(file["docid"])
        if len(new_file_list) == 0:
            return ret_code, table_list
        return self.get_table_list(new_file_list, acc_token, table_list, postfix)
    
    def convertpath(self, docid, acc_token):
        """
        通过anyshare文件的gensid获取路径
        docid：anyshare的文件gensid
        acc_token：anyshare的token
        """
        port = str(self.port)
        headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + acc_token,
            'Content-Type': 'text/plain'
        }
        params = {"docid": docid}
        convert = config.get("as7", "convertpath")
        r = requests.post(self.host + ':' + port + convert,
                          data=json.dumps(params), headers=headers,
                          verify=False, timeout=(10, 20))
        resp_json2 = r.json()
        if r.status_code == 200:
            path = resp_json2["namepath"]
            return path
    
    def get_text(self, gensid, acc_token):
        """
        根据anyshare的gensid获取文件内容
        gensid：anyshare的gensid
        acc_token：anyshare的token


        """
        ret_code = 200
        res = []
        
        res_dict = {}
        ## ["docid"],["name"], ["path"]
        lastid = gensid.split("/")[-1]
        es_url = "{}:{}/api/ecoindex/v1/index/{}/content".format(self.host, self.port, lastid)
        headers = {
            'Content-Type': 'application/json',
            "authorization": "Bearer {}".format(acc_token)
        }
        response = requests.request("GET", url=es_url, headers=headers, timeout=5, verify=False)
        if response.status_code != 200 or "content" not in response.json():
            return response.status_code, response.json()
        res_json = response.json()
        content = res_json["content"]
        # res_dict["gnsid"] = gens[0]
        # res_dict["path"] = gens[2]
        # res_dict["file_name"] = gens[1]
        # res_dict["content"] = content
        # res.append(res_dict)
        return gensid, content
    
    def get_gens_list(self, acc_token):
        ## 展开 文件夹、文件
        table_list = []
        ret_table, newtable_list = self.get_table_list(self.path, acc_token, table_list, self.postfix)
        return newtable_list

# if __name__ == '__main__':
#     host = "https://10.240.0.133"
#     port = "443"
#     postfix = "csv"
#     file_list = [{"type":"dir","docid":"gns://D15B4AC09E534D779A481AEF4CF30575/F7E7ECEBED2944769619DE4A69095015/647C411747554A709D97818218AF7552"}]
#     AS = Get_AS_DATA(host,port,file_list,postfix)
#     ## 动态注册
#     client_id,client_secret = AS.get_client_id()
#     ## 获取token
#     acc_token = AS.get_acc_token(client_id,client_secret)
#     ## 展开 文件夹、文件
#     table_list = []
#     ret_table, newtable_list = AS.get_table_list(file_list, acc_token, table_list,postfix)
#     if ret_table == 200:
#         ret_code, res_dict = AS.get_text(newtable_list,acc_token)
#         df = pd.DataFrame(res_dict)
#         dataset = Dataset.from_pandas(df)
#         print(dataset)
#         print(dataset["gnsid"])
#         print(dataset["content"])
