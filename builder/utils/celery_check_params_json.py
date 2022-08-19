# -*-coding:utf-8-*-
# @Time    : 2020/10/17 17:41
# @Author  : Lowe.li
# @Email   : Lowe.li@aishu.cn
class celery_check_params(object):
    VALID = 0
    INVALID = -1
    otl_paramdic={}
    otl_paramdic["builde_onto_task"] = ("ontology_id", "file_list","postfix","ds_id",)
    otl_paramdic["gettaskinfo"] = ("page", "size", "ontology_id", "used_task",)
    otl_paramdic["deletetask"] = ("task_list",)
    otl_paramdic["get_task_files"] = ("task_id", "page", "size",)
    otl_paramdic["deletealltask"] = ("ontology_id",)
    otl_paramdic["copy_otl"] = ("ontology_id",)
    rule_dict={}
    rule_dict["postfix"] = ["csv", "json",""]


    def valid_params_check(self, flag, params_json):
        print(params_json)
        message = ""
        ret_status = self.VALID
        inexistence = []  ###没有的参数 应该存在却不存在的参数
        illegual = []  #####不合法的参数 类型 长度
        empty = []  #####传入的参数值为空
        duplicate = []  ####entity edge 的name是否重复
        params = list(self.otl_paramdic[flag])
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

                    elif param == "ontology_id":
                        if flag != "deletealltask":
                            if type(value) != int:
                                message += param + " must be int "
                                illegual.append(param)
                                ret_status = self.INVALID
                            else:
                                if value < 1:
                                    message += param + "`s value must more than one "
                                    illegual.append(param)
                                    ret_status = self.INVALID
                        else:
                            if type(value) != str:
                                message += param + " must be str "
                                illegual.append(param)
                                ret_status = self.INVALID
                            else:
                                if value == "":
                                    message += param + " isn`t a valid parameter "
                                    illegual.append(param)
                                    ret_status = self.INVALID
                                else:
                                    if not value.isdigit():
                                        message += param + " isn`t a valid parameter"
                                        illegual.append(param)
                                        ret_status = self.INVALID
                                    else:
                                        if int(value) < 1:
                                            message += param + "`s value must more than one "
                                            illegual.append(param)
                                            ret_status = self.INVALID


                    elif param == "file_list":
                        if type(value) !=list:
                            message += param + " must be list "
                            illegual.append(param)
                            ret_status = self.INVALID
                        else:
                            if len(value)<1:
                                message += param + "`s length must more than zero "
                                illegual.append(param)
                                ret_status = self.INVALID
                    elif param == "ds_id" :
                        if type(value) != int:
                            message += param + " must be int "
                            illegual.append(param)
                            ret_status = self.INVALID
                        else:
                            if value < 1:
                                message += param + "`s value must more than one "
                                illegual.append(param)
                                ret_status = self.INVALID
                    elif param == "task_id":
                        if type(value) != str:
                            message += param + " must be string "
                            illegual.append(param)
                            ret_status = self.INVALID
                        else:
                            if not value.isdigit():
                                message += param + " isn`t a valid parameter "
                                illegual.append(param)
                                ret_status = self.INVALID
                            else:
                                if int(value) < 1:
                                    message += param + "`s value must more than one "
                                    illegual.append(param)
                                    ret_status = self.INVALID
                    elif param == "page" or param == "size" :
                        if flag == "gettaskinfo":
                            if not type(value) == int:
                                message += param + " must be int "
                                illegual.append(param)
                                ret_status = self.INVALID
                            else:
                                if value < 1:
                                    message += param + "`s value must more than one "
                                    illegual.append(param)
                                    ret_status = self.INVALID
                        elif flag == "get_task_files":
                            if type(value) != str:
                                message += param + " must be string "
                                illegual.append(param)
                                ret_status = self.INVALID
                            else:
                                if not value.isdigit():
                                    message += param + " isn`t a valid parameter "
                                    illegual.append(param)
                                    ret_status = self.INVALID
                                else:
                                    if int(value) < 1:
                                        message += param + "`s value must more than one "
                                        illegual.append(param)
                                        ret_status = self.INVALID


                    elif param == "used_task" or param == "task_list":
                        if type(value) != list:
                            message += param + " must be  list ; "
                            illegual.append(param)
                            ret_status = self.INVALID
                        else:
                            error = []
                            if len(value) != 0:
                                for i in value:
                                    if not type(i)==int:
                                        error.append(str(i))
                                    else:
                                        if int(i)<1:
                                            error.append(str(i))
                            else:
                                if param == "task_list":
                                    message += param + "`s length can`t be zero"
                                    illegual.append(param)
                                    ret_status = self.INVALID
                            if error:
                                err = ",".join(error)
                                message += param + "has some error : " + err + " isn`t a valid parameter"
                                illegual.append(param)
                                ret_status = self.INVALID
        illegual = set(illegual)
        inexistence = set(inexistence)
        empty = set(empty)
        duplicate = set(duplicate)
        if illegual:
            ret_status = self.INVALID
        if inexistence:
            message += "These parameters :" + ",".join(inexistence) + " are inexistence ; "
            ret_status = self.INVALID
        if empty:
            message += "These parameters :" + ",".join(empty) + "  are exist but empty or have blankspace :"
            ret_status = self.INVALID
        if duplicate:
            message += "These parameters :" + ",".join(duplicate) + "  are exist but name is reduplicative :"
            ret_status = self.INVALID
        message += "\n"
        return ret_status, message


celery_check_params=celery_check_params()




