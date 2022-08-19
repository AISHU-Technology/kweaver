import json

import requests
from config import config
from utils.CommonUtil import commonutil
from utils.Gview import Gview
from utils.common_response_status import CommonResponseStatus


class ManagerUtils(object):
    def __init__(self):
        self.add_resource_url = "http://" + config.manager_ip + ":6800/api/manager/v1/resource"
        self.add_permission_url = "http://" + config.manager_ip + ":6800/api/manager/v1/builder_add"
        self.get_list_url = "http://" + config.manager_ip + ":6800/api/manager/v1/builder"
        self.get_auth_kg_id_list_url = "http://" + config.manager_ip + ":6800/api/manager/v1/engine"
        self.create_permission_url = "http://" + config.manager_ip + ":6800/api/manager/v1/resource/create"
        self.operate_permission_url = "http://" + config.manager_ip + ":6800/api/manager/v1/resource/operate"
        self.delete_graph_url = "http://" + config.manager_ip + ":6800/api/manager/v1/builder/graph"
        self.ds_change_url = "http://" + config.manager_ip + ":6800/api/manager/v1/builder/graph"
        self.delete_knw_url = "http://" + config.manager_ip + ":6800/api/manager/v1/builder/knowledge/net/delete"
        self.headers = {"info": "kg-builder"}
        # 此处先保证和engine一样的逻辑处理
        self.engine_headers = {"info": "kg-engine"}

    # 查看创建资源权限
    def create_resource(self, uuid, resourceType):
        try:
            permission_url = self.create_permission_url
            payload = {"uuid": uuid, "resourceType": resourceType}
            resp = requests.get(permission_url, headers=self.headers, params=payload)
            status = resp.status_code
            if status != 200:
                resp = resp.json()
                return {"cause": resp["Description"],
                        "code": resp["ErrorCode"],
                        "message": resp["ErrorDetails"]}, status
            # 200， 没权限
            resp = resp.json()
            flag = resp["res"]
            if not flag:
                return {"cause": "No permission to create graph",
                        "code": CommonResponseStatus.PERMISSION_ERROR.value,
                        "message": "Permission error"}, CommonResponseStatus.PERMISSION_DENIED.value
            # 200, 有权限
            return "success", status
        except Exception as e:
            err = repr(e)
            return {"cause": err,
                    "code": CommonResponseStatus.REQUEST_ERROR.value,
                    "message": "Permission error"}, CommonResponseStatus.SERVER_ERROR.value

    # 增加资源权限
    def add_resource(self, kg_id, type, uuid):
        try:
            # 调用manager接口增加资源
            data = {"kg_id": kg_id, "type": type, "uuid": uuid}
            resp = requests.post(url=self.add_resource_url, headers=self.headers, data=json.dumps(data))
            status = resp.status_code
            if status != 200:
                resource_resp = resp.json()
                return {"cause": resource_resp["Description"],
                        "code": resource_resp["ErrorCode"],
                        "message": resource_resp["ErrorDetails"]}, status

            resource_resp = resp.json()
            flag = resource_resp["res"]
            if not flag:
                return {"cause": "No permission to add resource",
                        "code": CommonResponseStatus.PERMISSION_ERROR.value,
                        "message": "Permission error"}, CommonResponseStatus.PERMISSION_DENIED.value
            return "success", status
        except Exception as e:
            err = repr(e)
            return {"cause": err,
                    "code": CommonResponseStatus.REQUEST_ERROR.value,
                    "message": "Permission error"}, CommonResponseStatus.SERVER_ERROR.value

    # 增加默认权限
    def add_permission(self, kg_id, type, uuid):
        try:
            data = {"kg_id": kg_id, "type": type, "uuid": uuid}
            resp = requests.post(url=self.add_permission_url, headers=self.headers, data=json.dumps(data))
            status = resp.status_code
            if status != 200:
                resp = resp.json()
                return {"cause": resp["Description"],
                        "code": resp["ErrorCode"],
                        "message": resp["ErrorDetails"]}, status

            resp = resp.json()
            flag = resp["res"]
            if not flag:
                return {"cause": "No permission to add permission",
                        "code": CommonResponseStatus.PERMISSION_ERROR.value,
                        "message": "Permission error"}, CommonResponseStatus.PERMISSION_DENIED.value
            return "success", status
        except Exception as e:
            err = repr(e)
            return {"cause": err,
                    "code": CommonResponseStatus.REQUEST_ERROR.value,
                    "message": "add graph fail"}, CommonResponseStatus.SERVER_ERROR.value

    # 获取可看的本体、数据、图谱列表
    def get_otlDsList(self, uuid, type):
        try:
            # 调用manager接口获取数据源列表和属性
            url = self.get_list_url
            payload = {"uuid": uuid, "type": str(type)}
            resp = requests.get(url, headers=self.headers, params=payload)
            status = resp.status_code
            if status != 200:
                resp = resp.json()
                return {"cause": resp["Cause"],
                        "code": resp["Code"],
                        "message": resp["Message"], "solution": "Please check permissions"}, status
            res_list = resp.json().get("res", [])
            return res_list, status
        except Exception as e:
            err = repr(e)
            return {"cause": err,
                    "code": CommonResponseStatus.REQUEST_ERROR.value,
                    "message": "connection error, permission view failed",
                    "solution": "please check manager server"}, CommonResponseStatus.SERVER_ERROR.value

    def get_auth_kg_id_list(self, uuid):
        """
        此接口返回用户uuid可见的所有图谱信息
        :param uuid: 用户唯一标识符
        :return:  用户可见图谱列表
        """
        try:
            # 拼接url
            url =self.get_auth_kg_id_list_url + "?uuid=" + uuid

            resp = requests.get(url, headers=self.engine_headers)
            status = resp.status_code
            if status != 200:
                resp = resp.json()
                return {"cause": resp["Cause"],
                        "code": resp["Code"],
                        "message": resp["Message"], "solution": "Please check permissions"}, status
            # 没有问题的情况下，返回用户可见的图谱列表。
            rest_list = resp.json().get("res", [])
            return rest_list, status
        except Exception as e:
            err = repr(e)
            return {"cause": err,
                    "code": CommonResponseStatus.REQUEST_ERROR.value,
                    "message": "connection error, permission view failed",
                    "solution": "please check manager server"}, CommonResponseStatus.SERVER_ERROR.value

    # 操作权限
    def operate_permission(self, uuid, kg_id, type, action, is_engine=False):
        noAuthority = []
        try:
            for id in kg_id:
                url = self.operate_permission_url
                payload = {"uuid": uuid, "kg_id": str(id), "type": str(type), "action": action}
                # 此接口进行处理，如果时engine请求方调用的时候，将头改掉即可。
                # 注意：默认是使用builder的请求头发起请求
                if is_engine:
                    resp = requests.get(url, headers=self.engine_headers, params=payload)
                else:
                    resp = requests.get(url, headers=self.headers, params=payload)
                status = resp.status_code
                if status != 200:
                    resp = resp.json()
                    return {"cause": resp["Description"],
                            "code": resp["ErrorCode"],
                            "message": resp["ErrorDetails"]}, status
                resp = resp.json()
                flag = resp["res"]
                if not flag:
                    noAuthority.append(id)

            if len(noAuthority) > 0:
                return {"cause": "No permission to operate %s" % (", ".join(map(str, noAuthority))),
                        "code": CommonResponseStatus.PERMISSION_ERROR.value,
                        "message": "Permission error"}, CommonResponseStatus.PERMISSION_DENIED.value
            return "success", 200
        except Exception as e:
            err = repr(e)
            return {"cause": err,
                    "code": CommonResponseStatus.REQUEST_ERROR.value,
                    "message": "connection error, permission view failed"}, CommonResponseStatus.SERVER_ERROR.value

    # 请求manager图谱删除
    def graph_delete(self, graphids):
        try:
            url = self.delete_graph_url
            data = {"ids": graphids}
            resp = requests.delete(url, json=data, headers=self.headers)
            status = resp.status_code
            if status != 200:
                return {"cause": "request error",
                        "code": CommonResponseStatus.REQUEST_ERROR.value,
                        "message": "connection error, permission view failed",
                        "solution": "Please check permissions"}, CommonResponseStatus.SERVER_ERROR.value
            resp = resp.json()
            flag = resp["res"]
            return flag, 200
        except Exception as e:
            err = repr(e)
            return {"cause": err,
                    "code": CommonResponseStatus.REQUEST_ERROR.value,
                    "message": "connection error, permission view failed",
                    "solution": "Please check manager server"}, CommonResponseStatus.SERVER_ERROR.value

    # 图谱编辑过程中数据源数目变化
    def ds_changed(self, graphid, dsids, uuid):
        try:
            url = self.ds_change_url
            data = {"ids": int(graphid), "old_data_source": dsids, "uuid": uuid}
            # print("data: ", data)
            # print(self.headers)
            resp = requests.put(url, headers=self.headers, json=data)
            # print("response:  ", resp.content)
            status = resp.status_code
            if status != 200:
                return {"cause": "request error",
                        "code": CommonResponseStatus.REQUEST_ERROR.value,
                        "message": "connection error, permission view failed"}, CommonResponseStatus.SERVER_ERROR.value
            resp = resp.json()
            flag = resp["res"]
            return flag, 200
        except Exception as e:
            err = repr(e)
            return {"cause": err,
                    "code": CommonResponseStatus.REQUEST_ERROR.value,
                    "message": "connection error, permission view failed"}, CommonResponseStatus.SERVER_ERROR.value

    # 创建知识网络
    def create_knw_resource(self, uuid, resourceType):
        try:
            permission_url = self.create_permission_url
            print(permission_url)
            payload = {"uuid": uuid, "resourceType": resourceType}
            resp = requests.get(permission_url, headers=self.headers, params=payload)
            status = resp.status_code
            if status != 200:
                resp = resp.json()
                return {"ErrorCode": resp["ErrorCode"],
                        "Description": resp["Description"],
                        "Solution": resp["Solution"],
                        "ErrorDetails": resp["ErrorDetails"],
                        "ErrorLink": ""}, status
            # 200， 没权限
            resp = resp.json()
            flag = resp["res"]
            if not flag:
                return {"ErrorCode": "Builder.third_party_service.managerUtils.ManagerUtils.create_knw_resource.NoPermissionError",
                        "Description": "please change your permission!",
                        "Solution": "please change your permission!",
                        "ErrorDetails": "insert error",
                        "ErrorLink": ""}, CommonResponseStatus.PERMISSION_DENIED.value
            # 200, 有权限
            return "success", status
        except Exception as e:
            err = repr(e)
            return {
                       "ErrorCode": "Builder.third_party_service.managerUtils.ManagerUtils.create_knw_resource.RequestError",
                       "Description": err,
                       "Solution": "request processing failed",
                       "ErrorDetails": err,
                       "ErrorLink": ""}, CommonResponseStatus.SERVER_ERROR.value

    # 删除知识网络权限
    def knw_delete(self, knw_id):
        try:
            url = self.delete_knw_url
            data = {"ids": [int(knw_id)]}
            resp = requests.post(url, headers=self.headers, data=json.dumps(data))
            status = resp.status_code
            if status != 200:
                resp = resp.json()
                return {"ErrorCode": resp["ErrorCode"],
                        "Description": resp["Description"],
                        "Solution": resp["Solution"],
                        "ErrorDetails": resp["ErrorDetails"],
                        "ErrorLink": ""}, CommonResponseStatus.SERVER_ERROR.value
            resp = resp.json()
            flag = resp["res"]
            return flag, 200
        except Exception as e:
            err = repr(e)
            return {"ErrorCode": "Builder.third_party_service.managerUtils.ManagerUtils.knw_delete.RequestError",
                    "Description": err,
                    "Solution": "request processing failed",
                    "ErrorDetails": err,
                    "ErrorLink": ""}, CommonResponseStatus.SERVER_ERROR.value


managerutils = ManagerUtils()
