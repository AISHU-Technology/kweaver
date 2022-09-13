# -*-coding:utf-8-*-
# @Time    : 2020/10/17 17:41
# @Author  : Lowe.li
# @Email   : Lowe.li@aishu.cn
import re

class streamline_params_check():
    allparam=["graph_name","graph_step","graph_process","graph_status"]
    ruledict={}
    ruledict["graph_step"]=["graph_baseInfo","graph_ds","graph_otl","graph_InfoExt","graph_KMap","graph_KMerge"]
    ruledict["graph_status"]=["edit","finish"]
    INVALID=-1
    VALID=0
    def __init__(self):
        process_dic={}
        process_dic["graph_baseInfo"]=["graph_Name","graph_des","graphDBAddress","graph_DBName"]
        process_dic["graph_ds"] = ["dsname","datatype","data_source","ds_address","ds_port","ds_password","ds_path","ds_user","extract_type","in_use"]
        process_dic["graph_otl"] = ["ontologyname",]
        process_dic["graph_InfoExt"] = []
        process_dic["graph_KMap"] = []
        process_dic["graph_KMerge"] = []
    def all_params_check(self,params_json):
        inexistence=[]
        illegual=[]
        empty=[]
        # message=""
        # ret_status = self.VALID
        for param in self.allparam:
            if param not in params_json:
                inexistence.append(param)
                # ret_status = self.INVALID
            else :
                value = params_json[param]
                if param == "graph_name":####校验合法性
                    if not isinstance(value, str):
                        # message += param + " must be  str ; "
                        illegual.append(param)
                        # ret_status = self.INVALID
                    else:
                        if len(value )> 50 or not re.search(u'^[_a-zA-Z0-9\u4e00-\u9fa5]+$', value):
                            # message += param + " must < 50 ; and it is must be consisted of letter ,number and underline ; "
                            illegual.append(param)
                            # ret_status = self.INVALID
                        if not value == ''.join(value.split()) or value == "":  # 所有参数值 校验是否包含空格或为空
                            empty.append(param)
                            # ret_status = self.INVALID
                if param in self.ruledict:
                    if value not in self.ruledict[param]:
                        # message += param + " must be in " + str(self.ruledict[param]) + ";"
                        illegual.append(param)
        #         if param == "graph_process":
        #
        #         graph_step = params_json["graph_step"]
        #         if graph_step == "graph_baseInfo":
        #
        #         elif graph_step == "graph_ds":
        #
        #         elif graph_step == "graph_otl":
        #
        # elif graph_step == "graph_InfoExt":
        #
        # elif graph_step == "graph_KMap":
        #
        # elif graph_step == "graph_KMerge":





