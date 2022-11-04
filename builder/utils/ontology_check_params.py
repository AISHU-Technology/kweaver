# -*-coding:utf-8-*-
import re
import json
from .CommonUtil import commonutil
from config import config as Config
import os
class Otl_check_params(object):
    VALID = 0
    INVALID = -1
    postfixdic = {}
    postfixdic["excel"] = ["xlsx", "xls", "xlsm", "xlsb", "xltx", "xltm", "xml", "xlam", "xla", "xlw", "xlr"]

    postfixdic["json"] = ["json"]
    postfixdic["csv"] = ["csv"]
    postfixdic["ppt"] = ["pptx","ppt"]
    postfixdic["pdf"] = ["pdf"]
    postfixdic["doc"] = ["doc","docx"]
    postfixdic["txt"] = ["txt"]
    # 某些参数只有固定值

    rule_dict = {}
    rule_dict["dataType"] = ["structured", "unstructured"]
    rule_dict["extract_type"] = ["standardExtraction", "modelExtraction","labelExtraction"]
    rule_dict["data_source"] = ["mysql", "hive", "as","as7", "rabbitmq"]
    rule_dict["model"] = ["AImodel", "Generalmodel","Anysharedocumentmodel", "Contractmodel", "OperationMaintenanceModel"]
    rule_dict["postfix"]=["csv","json","all"]
    rule_dict["step"] = ["Otl", "Ext"]
    rule_dict["flag"] = ["nextstep","save"]
    # 定义接口的参数
    otl_paramdic={}
    params={}
    param_dic = {}
    ####数据表显示 as/mysql 不同
    otl_paramdic["get_table"]=("ds_id","data_source","postfix",)
    #####按需返回
    otl_paramdic["show_by_postfix"]=("docid","postfix","ds_id",)
    #####本体预览
    otl_paramdic["preview_ontology"] = ("ontologyname",)
    #####数据预览
    otl_paramdic["preview_data"] = ("ds_id","name","data_source",)
    #####算法预测 as/mysql 不同
    otl_paramdic["predict_ontology"] = ("ds_id","data_source","file_list","extract_type","postfix")
    ####本体保存
    otl_paramdic["ontology_save"] = ("ontology_name", "ontology_des")
    otl_paramdic["update_otl_name"] = ("ontology_name", "ontology_des")
    otl_paramdic["update_otl_info"] = ( "entity", "edge", "used_task", "flag")
    ####获取模型
    otl_paramdic["modelspo"] = ("model",)
    ####获取模型本体
    otl_paramdic["getmodelotl"] = ("model","file_list",)
    ######戰平文件夾
    otl_paramdic["flatfile"] = ("ds_id", "postfix","file",)
    param_dic["extract_type"] = ["standardExtraction", "modelExtraction","labelExtraction","",]
    param_dic["file_type"]=["csv","json","","all",]
    param_dic["dataType"] = ["structured", "unstructured","",]
    param_dic["source_type"]=[ "automatic","manual",]
    param_dic["model"] = ["AImodel", "Generalmodel","Anysharedocumentmodel","Contractmodel", "OperationMaintenanceModel", ""]
    param_dic["data_source"] = ["mysql", "hive", "as","","as7", "rabbitmq"]
    params["entity"]=["name","alias","properties","colour","source_type","ds_name","source_table","file_type","dataType","extract_type","model","ds_id","data_source","ds_path","properties_index","task_id","entity_id"]
    params["edge"]=["name","alias","colour","ds_name", "dataType","extract_type","model","file_type", "properties","source_table","source_type","relations","properties_index","task_id","ds_id","edge_id"]
    propertytype=["boolean", "float", "double", "string", "decimal", "datetime","date","integer",]
    ####边和点的校验
    def entity_edge_check(self, flag, params_json):
        ret_status=self.VALID
        inexistence=[]
        message=flag+" "
        illegual=[]
        empty=[]
        logic_mirror=[]

        newparams=self.params[flag]
        for param in newparams:
            if param not in params_json:
                inexistence.append(param)
                ret_status = self.INVALID
            else:
                value = params_json[param]
                if  value is None:####如果傳入的參數是none
                    message += param + "is None type ;"
                    illegual.append(param)
                    ret_status = self.INVALID
                else:
                    if param == "name":
                        if not type(value)==str:
                            message += param + " must be  str ; "
                            illegual.append(param)
                            ret_status = self.INVALID

                        else:
                            message += value + " has some error : "
                            if len(value) > 50 or not re.search(u'^[_a-zA-Z0-9]+$', value):
                                message += param + " must <= 50 ; and it is must be consisted of letter ,number and underline ; "
                                illegual.append(param)
                                ret_status = self.INVALID
                            if not value == ''.join(value.split()) or value == "":  # 所有参数值 校验是否包含空格或为空
                                empty.append(param)
                                ret_status = self.INVALID

                    elif param == "alias":
                        if not type(value)==str:
                            message += param + " must be  str ; "
                            illegual.append(param)
                            ret_status = self.INVALID

                        else:
                            message += value + " has some error : "
                            if len(value) > 50 or not re.search(u'^[\s\u4e00-\u9fa5_a-zA-Z0-9]+$', value):
                                message += param + " must <= 50 ; and it must be consisted of letter ,number and underline ; "
                                illegual.append(param)
                                ret_status = self.INVALID
                                ###  需求146695 别名不可为空
                            if not value == ''.join(value.split()) or value == "":  # 所有参数值 校验是否包含空格或为空
                                empty.append(param)
                                ret_status = self.INVALID



                    elif param == "properties_index":
                        if not isinstance(value, list):
                            message += param + " must be  list ; "
                            illegual.append(param)
                            ret_status = self.INVALID

                    elif param=="colour":
                        if not isinstance(value, str):
                            message += param + " must be  str ; "
                            illegual.append(param)
                            ret_status = self.INVALID
                        else:
                            if not re.search(u'^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$', value):
                                message += param + " is not illegal ; "
                                illegual.append(param)
                                ret_status = self.INVALID
                            if not value == ''.join(value.split()) or value == "":  # 所有参数值 校验是否包含空格或为空
                                empty.append(param)
                                ret_status = self.INVALID

                    elif param in self.param_dic:
                        if value not in self.param_dic[param]:
                            message += param + " must be in " + str(self.param_dic[param]) + ";"
                            illegual.append(param)
                            ret_status = self.INVALID

                        # else:
                        #     if len(value )> 100 or not re.search(u'^[_a-zA-Z0-9\u4e00-\u9fa5]+$', value):
                        #         message += param + " must < 100 ; and it is must be consisted of letter ,number and underline "
                        #         illegual.append(param)
                        #         ret_status = self.INVALID
                        #     if not value == ''.join(value.split()) or value == "":  # 所有参数值 校验是否包含空格或为空
                        #         empty.append(param)
                        #         ret_status = self.INVALID
                    elif param=="relations":
                        if not isinstance(value, list):
                            message += param + " must be  list ; "
                            illegual.append(param)
                            ret_status = self.INVALID
                        else:
                            if len(value)==3:
                                for one in value :
                                    if len(one )> 50 or not re.search(u'^[_a-zA-Z0-9\u4e00-\u9fa5]+$', one):
                                        message += param + " must <= 50 ; and it is must be consisted of letter ,number and underline ; "
                                        illegual.append(param)
                                        ret_status = self.INVALID
                            else:
                                message += param + " is not illegual ; "
                                illegual.append(param)
                                ret_status = self.INVALID
                    elif param == "properties":
                        # if flag=="edge":
                        #     if not isinstance(value, list):
                        #         message += param + " must be  list ; "
                        #         illegual.append(param)
                        #         ret_status = self.INVALID
                        #     else:

                                ####校验property是否含有name属性
                        #         if len(value) ==1 :
                        #             # for one in value:
                        #             if value[0][0]!="name":
                        #                 message +=param+ " must have name ; "
                        #             else:
                        #                 if value[0][1]!="string":
                        #                     message += param + " name must be string ; "
                        #         else:
                        #             message += param + " must have only one property:name ;"
                        #             illegual.append(param)
                        #             ret_status = self.INVALID
                        # if flag == "entity":
                        if not isinstance(value, list):
                            message += param + " must be  list ; "
                            illegual.append(param)
                            ret_status = self.INVALID
                        else:
                            s=0
                            propertyname=[]
                            ####校验property是否含有name属性
                            if len(value) >=1 :
                                for one in value:
                                    if one[0] not in  propertyname:
                                        propertyname.append(one[0])
                                    else :
                                        message+=param+" : "+one[0]+" is dupulicated ; "
                                        illegual.append(one[0])
                                        ret_status = self.INVALID
                                    if one[0]=="name":
                                        s=1
                                        if one[1]!="string":
                                            message += param + " name must be string ; "
                                            illegual.append(param)
                                            ret_status = self.INVALID

                                    if len(one[0] )> 50 or not re.search(u'^[_a-zA-Z0-9\u4e00-\u9fa5]+$', one[0]):
                                        message += param + " must <= 50 ; and it is must be consisted of letter ,number and underline ; "
                                        illegual.append(param)
                                        ret_status = self.INVALID
                                    else :
                                        if one[1] not in self.propertytype:
                                            message += param + " type is illegal ; "
                                            illegual.append(param)
                                            ret_status = self.INVALID


                                if s==0:
                                    message +=param+ " must have name ; "
                                    illegual.append(param)
                                    ret_status = self.INVALID
                            else:
                                message += param + " must have  one property:name ; "
                                illegual.append(param)
                                ret_status = self.INVALID
                    elif param=="ds_name":
                        if not isinstance(value, str):
                            message += param + " must be  str ; "
                            illegual.append(param)
                            ret_status = self.INVALID
                        else:
                            if len(value)!=0:

                                if len(value )> 50 or not re.search(u'^[_a-zA-Z0-9\u4e00-\u9fa5]+$', value):
                                    message += param + " must <= 50 ; and it is must be consisted of letter ,number and underline ; "
                                    illegual.append(param)
                                    ret_status = self.INVALID
                    elif param == "source_table":
                        if not isinstance(value, list):
                            message += param + " must be  list ;"
                            illegual.append(param)
                            ret_status = self.INVALID
                    elif param == "ds_id" or param == "task_id":
                        if not isinstance(value,str):
                            message += param + " must be  str ; "
                            illegual.append(param)
                            ret_status = self.INVALID
                        else:
                            if value!="":
                                try:
                                    value = int(value)
                                    if value < 0:
                                        message += param + " must be >0 ; "
                                        illegual.append(param)
                                        ret_status = self.INVALID
                                except Exception:
                                    message += param + " must be number; "
                                    illegual.append(param)
                                    ret_status = self.INVALID
                    elif param == "entity_id" or param == "edge_id":
                        if not isinstance(value,int):
                            message += param + " must be  int ; "
                            illegual.append(param)
                            ret_status = self.INVALID
                        else :
                            if value <= 0:
                                message += param + " must  more than 0 ; "
                                illegual.append(param)
                                ret_status = self.INVALID
                    else:
                        if not isinstance(value, str):
                            message += param + " must be  str ; "
                            illegual.append(param)
                            ret_status = self.INVALID


                            # if not value == ''.join(value.split()) or value == "":  # 所有参数值 校验是否包含空格或为空
                            #     empty.append(param)
                            #     ret_status = self.INVALID

                    # if param=="name":
                    #     if not isinstance(value, str):
                    #         message += param + " must be  str ; "
                    #         illegual.append(param)
                    #         ret_status = self.INVALID
                    #     else:
                    #         if len(value )> 100 or not re.search(u'^[_a-zA-Z0-9\u4e00-\u9fa5]+$', value):
                    #             message += param + " must < 100 ; and it is must be consisted of letter ,number and underline "
                    #             illegual.append(param)
                    #             ret_status = self.INVALID
                    #         if not value == ''.join(value.split()) or value == "":  # 所有参数值 校验是否包含空格或为空
                    #             empty.append(param)
                    #             ret_status = self.INVALID




        inexistence = set(inexistence)
        illegual = set(illegual)
        empty = set(empty)
        # logic_mirror = set(logic_mirror)
        if inexistence:
            message += "These parameters :"+",".join(inexistence) +" are inexistence ; "
            ret_status=self.INVALID
        if empty:
            message += "These parameters :"+",".join(empty) +"  are exist but empty or have blankspace:"
            ret_status = self.INVALID
        if illegual:
            # message += "These parameters :" + ",".join(illegual) + " are illegual ; "
            ret_status = self.INVALID
        if logic_mirror:
            message += "These parameters :" + ",".join(logic_mirror) + "   has logic mirror :"
            ret_status = self.INVALID


        return ret_status ,message

    def entity_relation_check(self,params_json):
        ret_status = self.VALID
        message=""
        illegal=[]
        if len(params_json["entity"])==0:
            if len(params_json["edge"])!=0:
                message +=  " if entity is empty ,edge must be empty "
                illegal.append("edge")
                ret_status = self.INVALID

        else:

            if len(params_json["edge"]) != 0:
                names = []
                for one in params_json["entity"]:
                    names.append(one["name"])
                print(names)
                for ones  in params_json["edge"]:
                    relation=ones["relations"]

                    if relation[0]  not in names or relation[2]  not in names:
                        message += " relation`s entity not in entitylist  "
                        illegal.append("edge")
                        ret_status = self.INVALID
                    if relation[1]!= ones["name"]:
                        message += " Edge class`s name is not match relation   "
                        illegal.append("edge")
                        ret_status = self.INVALID


        if illegal:
            ret_status = self.INVALID
        return ret_status,message

    # def edge_entity_logic_check(self,params_json):
    #     ret_status=self.VALID
    #     message=""
    #     value = params_json["name"]
    #
    #     message += value + " has some error : "
    #     if params_json["source_type"] == "manual":
    #         if params_json["source"] != "":
    #             message += "when source_type is manual source must be  none ; "
    #             ret_status = self.INVALID
    #         else:
    #             if params_json["file_type"] != "":
    #                 message += "when source is none , file_type must be  none ; "
    #                 ret_status = self.INVALID
    #
    #         if params_json["ds_name"] != "":
    #             message += "when source_type is  manual,ds_name must be  none ; "
    #             ret_status = self.INVALID
    #         if params_json["dataType"] != "":
    #             message += "when source_type is  manual,dataType must be  none ; "
    #             ret_status = self.INVALID
    #         else :
    #             if params_json["extract_type"] != "":
    #                 message += "when dataType is  none ,extract_type must be  none ; "
    #                 ret_status = self.INVALID
    #             else:
    #                 if params_json["model"] != "":
    #                     message += "when extract_type is  none ,model must be  none ; "
    #                     ret_status = self.INVALID
    #
    #     elif params_json["source_type"] == "automatic":
    #         if params_json["ds_name"] == "":
    #             message += "when source_type is  automatic,ds_name cannot be  none ; "
    #             ret_status = self.INVALID
    #         if params_json["source"] == "":
    #             message += "when source_type is  automatic, source_type can not be none ; "
    #             ret_status = self.INVALID
    #         elif "gns://" in params_json["source"]:
    #             if params_json["file_type"]=="":
    #                 message += "when source is  docid, file_type cannot be none ; "
    #                 ret_status = self.INVALID
    #             if  params_json["dataType"]=="":
    #                 message += "when source is  docid, dataType cannot be none ; "
    #                 ret_status = self.INVALID
    #             elif params_json["dataType"]=="unstructured":
    #                 if params_json["extract_type"] != "model":
    #                     message += "when dataType is unstructured, extract_type must be model ; "
    #                     ret_status = self.INVALID
    #                 else:
    #                     if params_json["model"] == "":
    #                         message += "when extract_type is model, modelname cannot be none ; "
    #                         ret_status = self.INVALID
    #             else:
    #                 if params_json["extract_type"] != "standard":
    #                     message += "when dataType is structured, extract_type must be standard ; "
    #                     ret_status = self.INVALID
    #                 else:
    #                     if params_json["model"] != "":
    #                         message += "when extract_type is standard, modelname must be none ; "
    #                         ret_status = self.INVALID
    #
    #         else:
    #             if params_json["file_type"]!="":
    #                 message += "when source is  table, file_type must be none ; "
    #                 ret_status = self.INVALID
    #             elif params_json["dataType"]!="structured":
    #                 message += "when source is  table, dataType must be structured ; "
    #                 ret_status = self.INVALID
    #             else:
    #                 if params_json["extract_type"] != "standard":
    #                     message += "when dataType is structured, extract_type must be standard ; "
    #                     ret_status = self.INVALID
    #                 else:
    #                     if params_json["model"] != "":
    #                         message += "when extract_type is standard, modelname must be none ; "
    #                         ret_status = self.INVALID
    #
    #     else:
    #         if params_json["ds_name"] == "":
    #             message += "when source_type is  import ,ds_name cannot be  none ;  "
    #             ret_status = self.INVALID
    #         if params_json["source"] == "":
    #             if params_json["file_type"] != "":
    #                 message += "when source is none , file_type must be  none ; "
    #                 ret_status = self.INVALID
    #         elif "gns://" in params_json["source"]:
    #             if params_json["file_type"] == "":
    #                 message += "when source is  docid, file_type cannot be none ; "
    #                 ret_status = self.INVALID
    #             if params_json["dataType"] == "":
    #                 message += "when source is  docid, dataType cannot be none ; "
    #                 ret_status = self.INVALID
    #             elif params_json["dataType"] == "unstructured":
    #                 if params_json["extract_type"] != "model":
    #                     message += "when dataType is unstructured, extract_type must be model ; "
    #                     ret_status = self.INVALID
    #                 else:
    #                     if params_json["model"] == "":
    #                         message += "when extract_type is model, modelname cannot be none ; "
    #                         ret_status = self.INVALID
    #             else:
    #                 if params_json["extract_type"] != "standard":
    #                     message += "when dataType is structured, extract_type must be standard ; "
    #                     ret_status = self.INVALID
    #                 else:
    #                     if params_json["model"] != "":
    #                         message += "when extract_type is standard, modelname must be none ; "
    #                         ret_status = self.INVALID
    #
    #
    #
    #         else:
    #
    #             if params_json["file_type"] != "":
    #
    #                 message += "when source is  table, file_type must be none ; "
    #
    #                 ret_status = self.INVALID
    #
    #             elif params_json["dataType"] != "structured":
    #
    #                 message += "when source is  table, dataType must be structured ; "
    #
    #                 ret_status = self.INVALID
    #
    #             else:
    #
    #                 if params_json["extract_type"] != "standard":
    #
    #                     message += "when dataType is structured, extract_type must be standard ; "
    #
    #                     ret_status = self.INVALID
    #
    #                 else:
    #
    #                     if params_json["model"] != "":
    #                         message += "when extract_type is standard, modelname must be none ; "
    #
    #                         ret_status = self.INVALID
    #
    #
    #     return ret_status,message

    ####合法校验
    def valid_params_check(self,flag,params_json):
        print(params_json)
        message=""
        edge=1
        entity=1
        ret_status=self.VALID
        inexistence=[]###没有的参数 应该存在却不存在的参数
        illegual=[]#####不合法的参数 类型 长度
        empty=[]#####传入的参数值为空
        duplicate=[]####entity edge 的name是否重复
        params = list(self.otl_paramdic[flag])
        if flag =="get_table"or flag =="predict_ontology":
            if "data_source" in params_json:
                datasource=params_json["data_source"]
                if datasource not in ["as","as7" ]:
                    if "postfix" in params:
                        params.remove("postfix")
                    if "page" in params:
                        params.remove("page")
                    if "size" in params:
                        params.remove("size")
            else:
                inexistence.append("data_source")
                ret_status = self.INVALID
        if flag =="predict_ontology":
            if "extract_type" in params_json:
                if params_json["extract_type"]!="labelExtraction" :
                    if "step" in params:
                        params.remove("step")
            else:
                inexistence.append("extract_type")
                ret_status = self.INVALID
        for param in params:

            if param not in params_json:
                inexistence.append(param)
                ret_status = self.INVALID
            else:
                value=params_json[param]
                if  value is None:####如果傳入的參數是none
                    message += param + "is None type ;"
                    illegual.append(param)
                    ret_status = self.INVALID
                else:
                    if param in self.rule_dict:
                        if value not in self.rule_dict[param]:
                            message+=param+" must be in "+str(self.rule_dict[param])+";"
                            illegual.append(param)
                            ret_status = self.INVALID
                        else:
                            if param=="extract_type" and value=="labelExtraction":
                                if "datasource" not in inexistence or "datasource" not in illegual:
                                    if params_json["data_source"] not in ["as","as7"]:
                                        message += "if extract_type is labelExtraction,datasource must be  as "
                                        illegual.append(param)
                                        ret_status = self.INVALID
                            if flag=="predict_ontology" and  param=="extract_type" :
                                if value not in ["standardExtraction","labelExtraction"]:
                                    message += "extract_type can not be  "+value
                                    illegual.append(param)
                                    ret_status = self.INVALID

                    # elif param=="entity" or param=="edge":
                    #     if not isinstance(value, list):
                    #         message += param + "must be  list ; "
                    #         illegual.append(param)
                    #         ret_status = self.INVALID
                    #     else:
                    #         try:
                    #             name=[]
                    #             for one in value:
                    #                 n=one["name"]
                    #                 if n not in name:
                    #                     name.append(n)
                    #                 else:
                    #                     duplicate.append(param)
                    #         except:
                    #             illegual.append(param)
                    #             ret_status = self.INVALID
                    elif param=="file":
                        params_file=["docid","name","type"]
                        for file_p in params_file:
                            if file_p not in value:
                                inexistence.append(param)
                                ret_status = self.INVALID
                            else:
                                file_v=value[file_p]
                                if file_p=="docid":
                                    if not isinstance(file_v,str):
                                        message += file_p + " must be  str ; "
                                        illegual.append(file_p)
                                        ret_status = self.INVALID
                                    else:
                                        if "gns://" not in file_v:
                                            message += file_p + " must be  docid ; "
                                            illegual.append(file_p)
                                            ret_status = self.INVALID
                                elif file_p=="name":
                                    if not isinstance(file_v, str):
                                        message += file_p + " must be  str ; "
                                        illegual.append(file_p)
                                        ret_status = self.INVALID

                                elif file_p=="type":
                                    if file_v!="dir":
                                        message += file_p + " must be  dir ; "
                                        illegual.append(file_p)
                                        ret_status = self.INVALID

                    elif param == "used_task":
                        if not isinstance(value, list):
                            message += param + " must be  list ; "
                            illegual.append(param)
                            ret_status = self.INVALID
                        else:
                            error=[]
                            if len(value)!=0:
                                for i in value:
                                    if not isinstance(i,int):
                                        error.append(i)
                            if error:
                                err = ",".join(error)
                                message += param + "has some error : "+err+" isn`t a valid parameter"
                                illegual.append(param)
                                ret_status = self.INVALID

                    elif param == "ontology_id":

                        if not isinstance(value, str):
                            message += param + " must be string "
                            illegual.append(param)
                            ret_status = self.INVALID
                        else:
                            if flag == "ontology_save":
                                if value!="":
                                    if "new" in value:
                                        otl_id = value.split("new")[1]
                                        if not otl_id.isdigit():
                                            message += param + " isn`t a valid parameter "
                                            illegual.append(param)
                                            ret_status = self.INVALID
                                        else:
                                            otl_id = int(otl_id)
                                            if otl_id < 1:
                                                message += param + " must be >=1 ; "
                                                illegual.append(param)
                                                ret_status = self.INVALID
                                    else :
                                        message += param + " isn`t a valid parameter "
                                        illegual.append(param)
                                        ret_status = self.INVALID

                            elif flag == "update_otl_name" or flag == "update_otl_info":
                                try:
                                    value=int(value)
                                    if value < 1:
                                        message += param + " must be >=1 ; "
                                        illegual.append(param)
                                        ret_status = self.INVALID
                                except Exception:
                                    message += param + " must be  number ; "
                                    illegual.append(param)
                                    ret_status = self.INVALID


                    elif param=="ds_port" or param=="ds_id":

                        if not isinstance(value, str):
                            message += param + " must be  str ; "
                            illegual.append(param)
                            ret_status = self.INVALID
                        else :
                            try:
                                value = int(value)
                                # if param == "page" or param == "size":
                                #
                                #     if  value < 1:
                                #         message += param + " must be >1 ; "
                                #         illegual.append(param)
                                #         ret_status = self.INVALID
                                if param == "ds_id":
                                    if  value < 0:
                                        message += param + " must be >0 ; "
                                        illegual.append(param)
                                        ret_status = self.INVALID
                                if param=="ds_port":
                                    if value > 65535 or value < 1:
                                        message += param + " must be in 1~65535 ; "
                                        illegual.append(param)
                                        ret_status = self.INVALID
                            except Exception:
                                message += param + " must be  number ; "
                                illegual.append(param)
                                ret_status = self.INVALID
                    elif  param=="file_list":
                        if not isinstance(value, list):
                            message += param + " must be  list ; "
                            illegual.append(param)
                            ret_status = self.INVALID
                        else:
                            # if len(value)==0:
                            #     # message += param + "`s content must be  dict ; "
                            #     empty.append(param)
                            #     ret_status = self.INVALID
                            # else:
                            if "data_source" not in illegual and "data_source" not in inexistence:
                                if flag=="getmodelotl":
                                    if len(value)!=0:
                                        for one in value:
                                            if not isinstance(one,list):
                                                message += "as file_list  is not illegal "
                                                illegual.append(param)
                                                ret_status = self.INVALID
                                            # if "gns://" not in one:
                                            #     message += "docid is not illegal "
                                            #     illegual.append(param)
                                            #     ret_status = self.INVALID

                                    # if params_json["data_source"] == "as":
                                    #     if len(value)!=0:
                                    #         if not isinstance(value[0], dict):
                                    #             message += param + "`s content must be  dict ; "
                                    #             illegual.append(param)
                                    #             ret_status = self.INVALID
                                elif params_json["data_source"] == "as" or params_json["data_source"] == "as7":
                                    if len(value) == 0:
                                        # message += param + "`s content must be  dict ; "
                                        empty.append(param)
                                        ret_status = self.INVALID
                                    else:
                                        if "extract_type" not in illegual and "extract_type" not in inexistence:
                                            if params_json["extract_type"] == "labelExtraction":
                                                if len(value)>1:
                                                    message += param + "`s size must be  only one ; "
                                                    illegual.append(param)
                                                    ret_status = self.INVALID
                                        for one in value:
                                            if not isinstance(one,dict):
                                                message += "as file_list  is not illegal "
                                                illegual.append(param)
                                                ret_status = self.INVALID
                                                # if "gns://" not in one:
                                                #     message += "docid is not illegal "
                                                #     illegual.append(param)
                                                #     ret_status = self.INVALID



                    elif param == "entity" or  param == "edge":

                        if not isinstance(value,list):
                            message += param + " must be  list ; "
                            illegual.append(param)
                            ret_status = self.INVALID
                        else:
                            if param =="edge" and len(value)==0:
                                edge=0
                            elif param =="entity" and len(value)==0:
                                if "flag" not in illegual and"flag" not in inexistence:
                                    if params_json["flag"] == "nextstep":
                                        illegual.append(param)
                                        ret_status = self.INVALID
                                        message += param + "can not empty"
                            else:
                                if len(value):
                                    ret_statuslist = []
                                    for one in value:
                                        ret_status, message1 = self.entity_edge_check(param, one)
                                        ret_statuslist.append(ret_status)
                                        if ret_status==self.INVALID:
                                            illegual.append(param)
                                            ret_status = self.INVALID
                                            message+=message1
                                        # else:
                                        #     ret,message2=self.edge_entity_logic_check(one)
                                        #     if ret==self.INVALID:
                                        #         message += message2
                                        # if ret_status == self.INVALID:
                                        #     message += param + ":" + "( " + message + " )"
                                        # if one["name"] not in names:
                                        #     names.append(param)
                                    if self.INVALID in ret_statuslist:
                                        illegual.append(param)
                                        ret_status = self.INVALID
                                else:
                                    # message += param + " is not illegal ; "
                                    if params_json["data_source"] != "rabbitmq":
                                        empty.append(param)
                                        ret_status = self.INVALID


                    elif param == "ds_address":
                        if not isinstance(value, str):
                            message += param + " must be  str ; "
                            illegual.append(param)
                            ret_status = self.INVALID
                        else:
                            if flag !="show_by_postfix":
                                if "data_source" not in illegual and "data_source" not in inexistence:
                                    if params_json["data_source"] == "as" or params_json["data_source"] == "as7":
                                        if "https://" in value or "http://" in value:
                                            value = value.split("://")[-1]
                                            if not commonutil.is_valid_domain(value):
                                                message += param + " is not illegal ; "
                                                illegual.append(param)
                                                ret_status = self.INVALID
                                        else:
                                            message += param + " is not illegal ; "
                                            illegual.append(param)
                                            ret_status = self.INVALID
                                    else:
                                        if not commonutil.is_valid_domain(value):
                                            illegual.append(param)
                                            message += param + " is not illegal ; "
                                            ret_status = self.INVALID
                            else:
                                if "https://" in value or "http://" in value:
                                    value = value.split("://")[-1]
                                    if not commonutil.is_valid_domain(value):
                                        message += param + " is not illegal ; "
                                        illegual.append(param)
                                        ret_status = self.INVALID
                                else:
                                    message += param + " is not illegal ; "
                                    illegual.append(param)
                                    ret_status = self.INVALID

                    elif param == "ontology_des":
                        if not isinstance(value, str):
                            message += param + " must be str ; "
                            illegual.append(param)
                            ret_status = self.INVALID
                        else:
                            # if len(value) > 50 or not re.search(u'^[_a-zA-Z0-9\u4e00-\u9fa5]+$', value):
                            #     message += " parameters: " + k + " Length over 50 or Characters are not _, Chinese, English！"
                            #     ret_status = self.INVALID
                            if value != "":
                                if len(value) > 150 or not re.search(u'^[=~!@#$&%^&*()_+`{}\-[\];:,.\\\?<>\'"|/~！@#￥%…&*（）—+。={ }|【 】‘“’”：；、《》？，。\n/a-zA-Z0-9\u4e00-\u9fa5]+$', value):
                                    message += param + " must <= 150 ,and conclude letter number and special characters"
                                    illegual.append(param)
                                    ret_status = self.INVALID
                    #####
                    elif param =="model":
                        if not isinstance(value, str):
                            message += param + " must be str ; "
                            illegual.append(param)
                            ret_status = self.INVALID
                        else :
                            modeldir = Config.modeldir
                            files = os.listdir(modeldir)
                            if value not in files:
                                message += param + " must in  "+"".join(files)
                                illegual.append(param)
                                ret_status = self.INVALID

                    elif param=="ontology_name":
                        if not isinstance(value, str):
                            message += param + " must be str ; "
                            illegual.append(param)
                            ret_status = self.INVALID
                        else:
                            if not value == ''.join(value.split()) or value == "":  # 所有参数值 校验是否包含空格或为空
                                empty.append(param)
                                ret_status = self.INVALID
                            else:
                                if len(value) > 50 or not re.search(u'^[_a-zA-Z0-9\u4e00-\u9fa5]+$', value):
                                    message += param + " must <= 50 ; and it is must be consisted of letter ,number and underline "
                                    illegual.append(param)
                                    ret_status = self.INVALID

                    elif param=="name":
                        if not isinstance(value, str):
                            message += param + " must be str ; "
                            illegual.append(param)
                            ret_status = self.INVALID
                        else:
                            if value == "":  # 所有参数值 校验是否包含空格或为空
                                if params_json["data_source"] != "rabbitmq":
                                    empty.append(param)
                                    ret_status = self.INVALID
                            else:
                                if "data_source" not in illegual and "data_source" not in inexistence:
                                    # if params_json["data_source"] == "as":
                                    #     if len(value)!=0:
                                    #         if not isinstance(value[0], dict):
                                    #             message += param + "`s content must be  dict ; "
                                    #             illegual.append(param)
                                    #             ret_status = self.INVALID
                                    if params_json["data_source"] == "as" or params_json["data_source"] == "as7":
                                        if "gns://" not in value:
                                            message += "docid is not illegal "
                                            illegual.append(param)
                                            ret_status = self.INVALID



                    else:
                        if not isinstance(value, str):
                            message += param + " must be str ; "
                            illegual.append(param)
                            ret_status = self.INVALID
                        if  not value == ''.join(value.split()) or value == "":  # 所有参数值 校验是否包含空格或为空
                            empty.append(param)
                            ret_status = self.INVALID
        allname = []
        allname_alias = []
        allrelation = []
        if "entity" in params and  "edge" in params:
            if "entity" not in inexistence and "edge" not in inexistence:
                if "entity" not in illegual and "edge" not in illegual:
                    if edge!=0 :
                        edgevalue = params_json["edge"]
                        for one in edgevalue:
                            allrelation.append(str(one["relations"]))
                    if entity!=0:
                        entityvalue=params_json["entity"]
                        for one in entityvalue:
                            allname.append(one["name"])
                            if one["alias"] != "":
                                allname_alias.append(one["alias"])
            if len(allname)!=len(set(allname)):
                print("allnAME")
                message+="class name can't repeated !"
                ret_status = self.INVALID
            if len(allname_alias)!=len(set(allname_alias)):
                print("allnAME")
                message+="alias name can't repeated !"
                ret_status = self.INVALID
            if len(allrelation)!=len(set(allrelation)):
                message+="relationships between the same entities can't have the same name !"
                ret_status = self.INVALID


        # if "name" in params and "postfix" in params:
        #     if  "name" not in inexistence and "postfix" not in inexistence:
        #         file_type = params_json["name"].split(".")[-1]
        #         postfix=params_json["postfix"]
        #         if file_type not in self.postfixdic[postfix]:
        #             message += "name not match postfix"
        #             illegual.append("name")
        #             illegual.append("postfix")
        #             ret_status = self.INVALID
        # if "file_list" in params and "postfix" in params:
        #     if "file_list" not in inexistence and "postfix" not in inexistence:
        #         postfix = params_json["postfix"]
        #         if len(params_json["file_list"])!=0:
        #             for one in params_json["file_list"]:
        #                 file_type= one.split(".")[-1]
        #                     if file_type not in self.postfixdic[postfix]:
        #                         message +=one["name"]+ " not match postfix"
        #                         illegual.append("file_list")
        #                         illegual.append("postfix")
        #                         ret_status = self.INVALID







            # else:
            #     if not isinstance(params_json[param], str):
            #         illegual.append(param)
            #         ret_status = self.INVALID
            #     else:
            #         if len(params_json[param])>150:
            #             illegual.append(param)
            #             ret_status = self.INVALID
        # params_check={}
        illegual=set(illegual)
        inexistence=set(inexistence)
        empty=set(empty)
        duplicate=set(duplicate)
        # params_check["illegual"]=set(illegual)
        # params_check["inexistence"] = set(inexistence)
        # params_check["empty"] = set(empty)
        if illegual:
            ret_status=self.INVALID
        if inexistence:
            message += "These parameters :"+",".join(inexistence) +" are inexistence ; "
            ret_status = self.INVALID
        if empty:
            message += "These parameters :"+",".join(empty) +"  are exist but empty or have blankspace :"
            ret_status = self.INVALID
        if duplicate:
            message += "These parameters :"+",".join(duplicate) +"  are exist but name is reduplicative :"
            ret_status = self.INVALID
        message += "\n"
        return ret_status,message








    #####逻辑校验
    # def logic_params_check(self, flag):
    #     if flag == "gettable_params":

    # lzg add
    def getAllParOnto(self, params_json):
        ret_status = 0
        message = ""
        onto_getall_params = ["page", "size", "order"]
        message_dict = {"request_error": [], "no_request": [], "request_illegal": [], "no_rule": []}
        for pa in onto_getall_params:
            if pa not in params_json.keys():
                message_dict["no_request"].append(pa)
                ret_status = self.INVALID
        for k in params_json.keys():
            if k in onto_getall_params:
                value = params_json[k]
                if k == "page":
                    if value == "-1":
                        continue
                    else:
                        if not value.isdigit() or value == "0":
                            message += " parameters: " + k + " must be int, and more than zero!"
                            ret_status = self.INVALID

                elif k == "order":
                    if value not in ["ascend", "descend"]:
                        message += " parameters: " + k + " must be ascend or descend!"
                        ret_status = self.INVALID


                elif not value.isdigit() or value == "0":
                    message += " parameters: " + k + " must be int, and more than zero!"
                    ret_status = self.INVALID
            else:
                # 注释 api 如果传入错误请求参数，要校验
                if k != "timestamp":
                    message_dict["request_error"].append(k)
                    ret_status = self.INVALID

        if len(message_dict["request_error"]) > 0:
            message += " parameters:  %s  error!" % ",".join(message_dict["request_error"])
        if len(message_dict["no_request"]) > 0:
            message += " parameters: %s can not be empty !" % ",".join(message_dict["no_request"])
        if len(message_dict["request_illegal"]) > 0:
            message += " parameters: %s illegal!" % ",".join(message_dict["request_illegal"])
        if len(message_dict["no_rule"]) > 0:
            message += " parameters: %s no rule!" % ",".join(message_dict["no_rule"])
        if message == "":
            message = "unknown error!"
        return ret_status, message

    def otlDelPar(self, params_json):
        ret_status = self.VALID
        message = ""
        # 定义参数
        # required = ["graph_name", "graph_step", "graph_process", "graph_status"]
        required = ["otlids"]
        # 请求参数
        values = params_json
        # 请求的参数不在定义的参数中
        unnecessaryParameters = []
        for k in values:
            if not k in required:
                unnecessaryParameters.append(k)
        dsids = params_json.get("otlids", None)
        # 请求的参数缺少必须的参数
        MissingParameters = []
        if dsids == None:
            for k in required:
                if not k in values:
                    MissingParameters.append(k)
        if len(unnecessaryParameters) > 0:
            message += "parameters:  %s  are not required!" % ",".join(unnecessaryParameters)
            ret_status = self.INVALID
        if len(MissingParameters) > 0:
            message += "parameters:  %s  are Missing!" % ",".join(MissingParameters)
            ret_status = self.INVALID
        # 校验顺序一 先校验参数是否缺少或者多的
        if len(unnecessaryParameters) > 0 or len(MissingParameters) > 0:
            return ret_status, message
        print(type(dsids))
        if type(dsids).__name__ != "list":
            message += "The parameter otlids type must be list!"
            ret_status = self.INVALID
            return ret_status, message
        if len(dsids) == 0:
            message += "The parameter otlids cannot be empty!"
            ret_status = self.INVALID
            return ret_status, message
        flag_digit = True
        for id1 in dsids:
            if type(id1).__name__ != "int":
            # if not isinstance(id1, int):
                flag_digit = False
                break

        if not flag_digit:
            message = "The parameter list element  must be int"
            ret_status = self.INVALID
            return ret_status, message

        return ret_status, message
    # def otlDelPar(self,params_json):
    #     ret_status = 0
    #     message = ""
    #     otl_del_params = ["otlnames"]
    #     message_dict = {"request_error": [], "no_request": [], "request_illegal": [], "no_rule": []}
    #     if not isinstance(params_json, dict):
    #         message = "parameters must be json"
    #         ret_status = self.INVALID
    #         return ret_status, message
    #     # 缺少参数
    #     for pa in otl_del_params:
    #         if pa not in params_json.keys():
    #             message_dict["no_request"].append(pa)
    #             ret_status = self.INVALID
    #     for k in params_json.keys():
    #         if k in otl_del_params:
    #             value = params_json[k]
    #             ret_st, params, delmessage = self.parmchecklist(k, value)
    #             if ret_st != 0:
    #                 message_dict["request_illegal"].append(k)
    #                 ret_status = self.INVALID
    #
    #         else:
    #             # 注释 api 如果传入错误请求参数，要校验
    #             if k != "timestamp":
    #                 message_dict["request_error"].append(k)
    #                 ret_status = self.INVALID
    #     # 参数多余，错误的参数
    #     if len(message_dict["request_error"]) > 0:
    #         message += " parameters:  %s  error!" % ",".join(message_dict["request_error"])
    #     # 缺少参数
    #     if len(message_dict["no_request"]) > 0:
    #         message += " parameters: %s can not be empty and cannot contain spaces!" % ",".join(
    #             message_dict["no_request"])
    #     # 参数值错误
    #     if len(message_dict["request_illegal"]) > 0:
    #         message += " parameters: %s illegal!" % ",".join(message_dict["request_illegal"])
    #     # 不符合规则
    #     if len(message_dict["no_rule"]) > 0:
    #         message += " parameters: %s no rule!" % ",".join(message_dict["no_rule"])
    #     if message == "":
    #         message = "unknown error!"
    #     return ret_status, message
    def parmchecklist(self, param, value):
        ret_status = 0
        message = ""
        flag_digit = True
        try:
            ids = value
            if type(ids).__name__ == "list":
                if len(ids) > 0:
                    for id1 in ids:
                        if not isinstance(id1, str):
                            flag_digit = False
                        else:
                            id1 = str(id1)
                            # if not isinstance(id1,int):
                            if len(id1) > 50 or not re.search(u'^[_a-zA-Z0-9\u4e00-\u9fa5]+$', id1):
                                message += "  The parameter list element Length over 50 or Characters are not _, Chinese, English！"
                                ret_status = self.INVALID

                            # if not id1 == ''.join(id1.split()) or id1 == "":
                            #         flag_digit = False

                    if flag_digit:
                        return ret_status, ids, message
                    else:
                        ret_status = -1
                        message = "The parameter list element  must be str"
                        return ret_status, param, message

                else:
                    ret_status = -1
                    message = "The parameter list cannot be empty"
                    return ret_status, param, message
            else:
                 ret_status = -1
                 message = "The parameter type must be list！"
                 return ret_status, param, message
        except Exception as e:
            err = repr(e)
            ret_status = -1
            message = err
            return ret_status, param, message

    def otlgetbynamePar(self, params_json):
        ret_status = 0
        message = ""
        otl_getbyname_params = ["page", "size", "otlname", "order" , "otl_status"]
        message_dict = {"request_error": [], "no_request": [], "request_illegal": [], "no_rule": []}
        # if not isinstance(params_json, dict):
        #     message = "parameters must json"
        #     ret_status = self.INVALID
        #     return ret_status, message
        # 缺少参数
        for pa in otl_getbyname_params:
            if pa not in params_json.keys():
                message_dict["no_request"].append(pa)
                ret_status = self.INVALID
        for k in params_json.keys():
            if k in otl_getbyname_params:
                value = params_json[k]
                if k == "page" or k == "size":
                    if not value.isdigit() or value == "0":
                        message += " parameters: " + k + " must be int, and more than zero"
                        ret_status = self.INVALID
                elif k == "order":
                    if value not in ["ascend", "descend"]:
                        message += " parameters: " + k + " must be ascend or descend!"
                        ret_status = self.INVALID
                elif k == "otlname":
                    if not isinstance(value, str):
                        message += " parameters: " + k + " must be str！"
                        ret_status = self.INVALID
                elif k == "otl_status":
                    if value not in ["all","running","pending","available"]:
                        message += " parameters: " + k + " must in [ all , running , pending , available ]"
                        ret_status = self.INVALID
                    # else:
                    #     if len(value) > 50 or not re.search(u'^[_a-zA-Z0-9\u4e00-\u9fa5]+$', value):
                    #         message += " parameters: " + k + " Length over 50 or Characters are not _, Chinese, English！"
                    #         ret_status = self.INVALID
            else:
                # 注释 api 如果传入错误请求参数，要校验
                if k != "timestamp":
                    message_dict["request_error"].append(k)
                    ret_status = self.INVALID
        # 参数多余，错误的参数
        if len(message_dict["request_error"]) > 0:
            message += " parameters:  %s  error!" % ",".join(message_dict["request_error"])
        # 缺少参数
        if len(message_dict["no_request"]) > 0:
            message += " parameters: %s can not be empty and cannot contain spaces!" % ",".join(
                message_dict["no_request"])
        # 参数值错误
        if len(message_dict["request_illegal"]) > 0:
            message += " parameters: %s illegal!" % ",".join(message_dict["request_illegal"])
        # 不符合规则
        if len(message_dict["no_rule"]) > 0:
            message += " parameters: %s no rule!" % ",".join(message_dict["no_rule"])
        if message == "":
            message = "unknown error!"
        return ret_status, message
    def otlUpdatePar(self, params_json):
        ret_status = 0
        message = ""
        otl_getbyname_params = ["ontology_name", "entity", "edge", "ontology_des"]
        message_dict = {"request_error": [], "no_request": [], "request_illegal": [], "no_rule": []}
        # 缺少参数
        for pa in otl_getbyname_params:
            if pa not in params_json.keys():
                message_dict["no_request"].append(pa)
                ret_status = self.INVALID
        for k in params_json.keys():
            if k in otl_getbyname_params:
                params_json[k]
            else:
                # 注释 api 如果传入错误请求参数，要校验
                if k != "timestamp":
                    message_dict["request_error"].append(k)
                    ret_status = self.INVALID
        # 参数多余，错误的参数
        if len(message_dict["request_error"]) > 0:
            message += " parameters:  %s  error!" % ",".join(message_dict["request_error"])
        # 缺少参数
        if len(message_dict["no_request"]) > 0:
            message += " parameters: %s can not be empty and cannot contain spaces!" % ",".join(
                message_dict["no_request"])
        # 参数值错误
        if len(message_dict["request_illegal"]) > 0:
            message += " parameters: %s illegal!" % ",".join(message_dict["request_illegal"])
        # 不符合规则
        if len(message_dict["no_rule"]) > 0:
            message += " parameters: %s no rule!" % ",".join(message_dict["no_rule"])
        if message == "":
            message = "unknown error!"
        return ret_status, message






otl_check_params=Otl_check_params()
