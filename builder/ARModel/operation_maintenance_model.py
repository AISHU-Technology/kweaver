# -*- coding: utf-8 -*-
import configparser
import json
import re
import requests
from dao.otl_dao import otl_dao
from configparser import ConfigParser
from third_party_service.anyshare.token import asToken
from utils.log_info import Logger
from ARModel.ParserProcess.docx_parser import docx_parse


class OperationMaintenanceModel(object):
    def __init__(self, as7_json, version, config_path, ds_id):
        self.__as7_json = as7_json
        self.__ds_auth = as7_json["ds_auth"]
        self.__ds_address = as7_json["ds_address"]
        self.__ds_port = as7_json["ds_port"]
        self.__ds_id = as7_json["id"]
        self.__version = version
        self.flag = ['basename', 'extension', 'created_at',  'created_by',  'modified_at',  'modified_by',  'content',
                    'parent_path',  'size',  'tags', 'version']
        self.config_path = config_path
        self.Config = configparser.ConfigParser()
        self.Config.read(self.config_path, "utf-8")
        self.__ds_id = ds_id
        
    # 获取AS文件内容
    def get_content_bydocid(self, docid):
        text_json = {}
        # docid = docid[0]
        code, res = otl_dao.getinfofromas(self.__as7_json, self.flag, docid, self.__version)
        if code == 200:
            text_json["gns"] = docid
            text_json["name"] = res.get("basename", "") + res.get("extension", "")
            text_json["docClassify"] = ""
            text_json["docFormat"] = res.get("extension", "")
            path = res.get("parent_path", " / / /").split("/")[3:]
            text_json["docPath"] = "/".join(path) + "/" + text_json["name"]
            text_json["docSize"] = res.get("size", "")
            text_json["docCreatedTime"] = res.get("created_at", "")
            text_json["docUpdatedTime"] = res.get("modified_at", "")
            
            text_json["docLabel"] = res.get("tags", "")
            text_json["docLink"] = self.get_as_link(docid)
            text_json["docAuthor"] = res.get("created_by", "")
            text_json["docVersion"] = res.get("version", "")
            text_json["content"] = res.get("content", "")
            if text_json["content"].strip():
                text_json["docTitle"] = [line.strip() for line in text_json["content"].split("\n") if line.strip()][0]
            else:
                text_json["docTitle"] = text_json["name"]
            text_json["ds_id"] = self.__ds_id
        return text_json

    # 根据文档的 authrequest 读取文档
    def get_file_content_by_url(self, authrequest):
        Logger.log_info("authrequest: {}".format(authrequest))
        one_headers = {}
        for i in authrequest[2:]:
            one_headers[i[:i.index(":")].strip()] = i[i.index(":") + 1:].strip()
        response = requests.request(authrequest[0], authrequest[1], headers=one_headers, verify=False, timeout=5)
        return response
    
    # 获取文档的 authrequest
    def get_authrequest(self, gns, name):
        Logger.log_info("get_authrequest gns: {}".format(gns))
        try:
            print('开始获取AS token', __file__, 'get_authrequest')
            ret_token, token_id = asToken.get_token(self.__ds_auth)
            headers = {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer {}'.format(token_id)
            }
            if "http" in self.__ds_address:
                url = self.__ds_address + ":" + str(self.__ds_port) + self.Config['url_path'].get('fileDownloadPath')
                ds_address = self.__ds_address.replace("https://", "")
            else:
                url = "https://" + self.__ds_address + ":" + str(self.__ds_port) + self.Config['url_path'].get(
                    'fileDownloadPath')
            payload = json.dumps(
                {"docid": gns, "rev": "", "authtype": "", "reqhost": ds_address, "usehttps": False,
                 "savename": name})
            response = requests.request("POST", url, headers=headers, data=payload, verify=False)
            res = json.loads(response.text)
            return res["authrequest"]
        except Exception as e:
            Logger.log_error("get authrequest error: {}".format(repr(e)))
    
    # 获取文档的实名共享链接
    def get_as_link(self, gns):
        as_id = ""
        link = ""
        try:
            address = self.__ds_address.replace("https://", "").replace("http://", "")
            post_url = "https://{}/api/shared-link/v1/document/realname".format(address)
            get_url = "https://{}/api/shared-link/v1/document/file/{}?type=realname".format(address, gns.replace("/", "%2F"))
            # get_url = "https://10.240.0.133/api/shared-link/v1/document/file/gns%3A%2F%2FD15B4AC09E534D779A481AEF4CF30575%2F61EE3BC88AD64DD1889110F96A904176%2F7FBD870308564B08AF0DC77E3FC89094?type=realname"
            payload = {"item": {
                "id": gns,
                "type": "file"}}
            print('开始获取AS token', __file__, 'get_as_link')
            ret_token, token_id = asToken.get_token(self.__ds_auth)
            headers = {'Content-Type': 'application/json',
                       'Authorization': 'Bearer {}'.format(token_id)}
            resp1 = requests.request("GET", get_url, headers=headers, timeout=30, verify=False)
            if resp1.status_code == 200:
                as_id = resp1.json()[0].get("id", "")
                link = "https://{}/link/{}".format(address, str(as_id))
            return link
        except Exception as e:
            Logger.log_error("get Link error: {}".format(repr(e)))
                
            try:
                response = requests.request("POST", post_url, headers=headers, json=payload, timeout=30, verify=False)
                resp = response.json()
                if response.status_code != 201:
                    Logger.log_error("获取文档的实名共享链接问题：201{}".format(resp.get("cause", "")))
                as_id = resp.get("id", "")
            
                link = "https://{}/link/{}".format(address, str(as_id))
            except Exception as e:
                Logger.log_error("post获取文档的实名共享链接问题：{}".format(repr(e)))
                return link

    def get_spos(self, doc_id):
        if isinstance(doc_id, list):
            doc_id = doc_id[0]
        # with open("./doc_id.txt", "a", encoding="utf-8") as f:
        #     f.write(str(doc_id) + "\n")
        docx_info = self.get_content_bydocid(doc_id)
        if docx_info.get("docFormat", "") != ".docx":
            return []
        name = docx_info.get("name", "")
        doc_url = self.get_authrequest(gns=doc_id, name=name)
        spos = docx_parse.get_elements(doc_url, docx_info)
        # for spo in spos:
        #     with open("./res.txt", "a", encoding="utf-8") as f:
        #         f.write(str(spo) + "\n")
        return spos
    
    def write2mongodb(self, db, graph_mongo_Name, spos):
        if len(spos) == 0:
            return
        # _dict = {
        #     "matchVersion": {"s_pro": "gns", "o_pro": "name"},
        #     "labelIs": {"s_pro": "gns", "o_pro": "name"},
        #     "docComponentIs": {"s_pro": "gns", "o_pro": "docComponentId"},
        #     "documentIs": {"s_pro": "name", "o_pro": "gns"},
        #     "versionIS": {"s_pro": "name", "o_pro": "name"},
        #     "upgradeVersionIs": {"s_pro": "name", "o_pro": "name"},
        #     "quote": {"s_pro": "docComponentId", "o_pro": "gns"},
        #     "childChapter": {"s_pro": "docComponentId", "o_pro": "docComponentId"},
        #     "docComponentText": {"s_pro": "docComponentId", "o_pro": "docComponentId"},
        #     "docComponentQuote": {"s_pro": "docComponentId", "o_pro": "docComponentId"},
        # }
        for item in spos:
            # 实体
            if "subject" in item:
                db[graph_mongo_Name + "_" + item.get("subject")].insert_one(item.get("property"))
            # 边
            else:
                # if len(item) != 3:
                #     continue
                # con = {}
                # s_pro = _dict.get(item[1]).get("s_pro")
                # o_pro = _dict.get(item[1]).get("o_pro")
                # con["s"] = item[0]
                # con["p"] = item[1]
                # con["o"] = item[2]
                # con["s_pro"] = {s_pro: item[0]}
                # con["p_pro"] = {"name": item[1]}
                # con["o_pro"] = {o_pro: item[2]}
                con = {}
                con["s"] = item.get("s_pro", {}).get("name", "")
                con["p"] = item.get("predicate", "")
                con["o"] = item.get("o_pro", {}).get("name", "")
                con["s_pro"] = item.get("s_pro")
                con["p_pro"] = {"name": item.get("predicate")}
                con["o_pro"] = item.get("o_pro")
                
                db_name = item.get("predicate", "")
                flag = db[graph_mongo_Name + "_" + db_name].find_one(con)
                if not flag:
                    db[graph_mongo_Name + "_" + db_name].insert_one(con)
        Logger.log_error("AR model  spo write mongo finished! ")
        
        
        
    
    
    




