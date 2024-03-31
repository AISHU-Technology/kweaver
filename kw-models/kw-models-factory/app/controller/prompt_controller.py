import datetime
import time

from fastapi.responses import JSONResponse
from llmadapter.llms.llm_factory import llm_factory
from app.commons.errorcode.codes import *
from app.commons.snow_id import snow_id
from app.commons.snow_id import worker
from app.controller.model_controller import used_model_stream
from app.utils import llm_utils
from app.utils.param_verify_utils import *
from app.utils.reshape_utils import *
from app.dao.prompt_dao import prompt_dao
from app.dao.model_dao import model_dao
from app.utils.stand_log import StandLogger


# 获取prompt项目列表
async def source_prompt_item_endpoint(request, prompt_item_name, is_management):
    headers = request.headers
    content = prompt_source_item_verify(prompt_item_name, is_management)
    if content:
        StandLogger.error(content)
        return JSONResponse(status_code=400, content=content)
    try:
        item_id_list = []
        data = []
        id_name = {}
        is_management = True if is_management == "true" else False
        item_type_list = prompt_dao.get_all_from_prompt_item_list(is_management)
        if prompt_item_name == '':
            for item in item_type_list:
                if item["f_prompt_item_id"] in set(item_id_list):
                    continue
                item_id_list.append(item["f_prompt_item_id"])
                data_item = {
                    "prompt_item_id": item["f_prompt_item_id"],
                    "prompt_item_name": item["f_prompt_item_name"],
                    "prompt_item_types": [],
                    "create_time": item["f_create_time"].strftime('%Y-%m-%d %H:%M:%S'),
                    "create_by": item["f_create_by"],
                    "update_time": item["f_update_time"].strftime('%Y-%m-%d %H:%M:%S'),
                    "update_by": item["f_update_by"]
                }
                prompt_item_types = []
                for i in item_type_list:
                    if i["f_prompt_item_id"] == item["f_prompt_item_id"] and i["f_type_is_delete"] == 0:
                        prompt_item_types.append(i)
                for item_type in prompt_item_types:
                    data_item_type = {
                        "id": item_type["f_prompt_item_type_id"],
                        "name": item_type["f_prompt_item_type"]
                    }
                    data_item["prompt_item_types"].append(data_item_type)
                if data_item["create_by"] not in id_name:
                    id_name[data_item["create_by"]] = user(data_item["create_by"])
                if data_item["update_by"] not in id_name:
                    id_name[data_item["update_by"]] = user(data_item["update_by"])
                data_item["create_by"] = id_name[data_item["create_by"]]
                data_item["update_by"] = id_name[data_item["update_by"]]
                data.append(data_item)
        else:
            fuzzy_item_type_list = prompt_dao.get_prompt_item_list_by_fuzzy_query_distinct(prompt_item_name, is_management)
            for item in fuzzy_item_type_list:
                if item["f_prompt_item_id"] in set(item_id_list):
                    continue
                item_id_list.append(item["f_prompt_item_id"])
                data_item = {
                    "prompt_item_id": item["f_prompt_item_id"],
                    "prompt_item_name": item["f_prompt_item_name"],
                    "prompt_item_types": [],
                    "create_time": item["f_create_time"].strftime('%Y-%m-%d %H:%M:%S'),
                    "create_by": item["f_create_by"],
                    "update_time": item["f_update_time"].strftime('%Y-%m-%d %H:%M:%S'),
                    "update_by": item["f_update_by"]
                }
                prompt_item_types = []
                for i in item_type_list:
                    if i["f_prompt_item_id"] == item["f_prompt_item_id"] and i["f_type_is_delete"] == 0:
                        prompt_item_types.append(i)
                for item_type in prompt_item_types:
                    data_item_type = {
                        "id": item_type["f_prompt_item_type_id"],
                        "name": item_type["f_prompt_item_type"]
                    }
                    data_item["prompt_item_types"].append(data_item_type)
                if data_item["create_by"] not in id_name:
                    id_name[data_item["create_by"]] = user(data_item["create_by"])
                if data_item["update_by"] not in id_name:
                    id_name[data_item["update_by"]] = user(data_item["update_by"])
                data_item["create_by"] = id_name[data_item["create_by"]]
                data_item["update_by"] = id_name[data_item["update_by"]]
                data.append(data_item)
        res = {
            "res": {
                "total": len(list(set(item_id_list))),
                "searchTotal": len(data),
                "data": data
            }
        }
        return JSONResponse(status_code=200, content=res)
    except Exception as e:
        print(e)
        StandLogger.error(e.args)
        return JSONResponse(status_code=500, content=DataBaseError)


# 获取提示词列表信息
async def source_prompt_endpoint(request, prompt_item_id, prompt_item_type_id,
                                 page, size, prompt_name, order, rule, deploy, prompt_type, is_management):
    headers = request.headers
    error = await prompt_source_verify(prompt_item_id, prompt_item_type_id,
                                       page, size, prompt_name, order, rule, deploy, prompt_type)
    if error:
        StandLogger.error(error)
        return JSONResponse(status_code=400, content=error)
    try:
        order_list, rule_dict = key_value()
        if deploy == 'all' or not deploy:
            deploy = ''
        elif deploy == "yes":
            deploy = 1
        else:
            deploy = 0
        if prompt_type == 'all':
            prompt_type = ''
        # prompt_item_type_id_list = [cell["f_prompt_item_type_id"] for cell in prompt_dao.get_all_from_prompt_item_list()]
        # if prompt_item_type_id not in prompt_item_type_id_list and prompt_item_type_id:
        #     return JSONResponse(status_code=200, content={"res": {'total': 0, 'data': []}})
        prompts = prompt_dao.get_prompt_list(prompt_item_id, prompt_item_type_id,
                                             page, size, prompt_name, order, rule, deploy, prompt_type, is_management)
        data = []
        id_name = {}
        for prompt in prompts:
            data_prompt = {}
            data_prompt["prompt_item_id"] = prompt["f_prompt_item_id"]
            data_prompt["prompt_item_name"] = prompt["f_prompt_item_name"]
            data_prompt["prompt_item_type_id"] = prompt["f_prompt_item_type_id"]
            data_prompt["prompt_item_type"] = prompt["f_prompt_item_type"]
            data_prompt["prompt_id"] = prompt["f_prompt_id"]
            data_prompt["prompt_service_id"] = prompt["f_prompt_service_id"]
            data_prompt["prompt_name"] = prompt["f_prompt_name"]
            data_prompt["model_name"] = prompt.get("f_model_name", "")
            data_prompt["prompt_type"] = prompt["f_prompt_type"]
            data_prompt["prompt_desc"] = prompt["f_prompt_desc"]
            data_prompt["prompt_deploy"] = False if prompt["f_is_deploy"] == 0 else True
            data_prompt["icon"] = prompt["f_icon"]
            data_prompt["model_id"] = prompt["f_model_id"]
            data_prompt["model_series"] = prompt.get("f_model_series", "")
            data_prompt["create_by"] = prompt["f_create_by"]
            data_prompt["update_by"] = prompt["f_update_by"]
            if prompt["f_create_time"] == None:
                data_prompt["create_time"] = ""
            else:
                data_prompt["create_time"] = prompt["f_create_time"].strftime('%Y-%m-%d %H:%M:%S')
            if prompt["f_update_time"] == None:
                data_prompt["update_time"] = ""
            else:
                data_prompt["update_time"] = prompt["f_update_time"].strftime('%Y-%m-%d %H:%M:%S')
            if data_prompt["create_by"] not in id_name:
                id_name[data_prompt["create_by"]] = user(data_prompt["create_by"])
            if data_prompt["update_by"] not in id_name:
                id_name[data_prompt["update_by"]] = user(data_prompt["update_by"])
            data_prompt["create_by"] = id_name[data_prompt["create_by"]]
            data_prompt["update_by"] = id_name[data_prompt["update_by"]]
            data.append(data_prompt)
        res = {
            "res": {
                "total": len(prompts),
                "data": data
            }
        }
        return JSONResponse(status_code=200, content=res)
    except Exception as e:
        print(e)
        StandLogger.error(e.args)
        return JSONResponse(status_code=500, content=DataBaseError)


# 获取大模型列表接口
async def source_llm_prompt_endpoint(request, types):
    headers = request.headers
    error = prompt_llm_source_verify(types)
    if error:
        StandLogger.error(error)
        return JSONResponse(status_code=400, content=error)
    try:
        models = model_dao.get_model_by_types(types)
        data = []
        for model in models:
            data_model = {}
            model_series = model["f_model_series"]
            data_model["model"] = model["f_model"]
            data_model["model_id"] = model["f_model_id"]
            data_model["model_type"] = model["f_model_type"]
            data_model["model_name"] = model["f_model_name"]
            data_model["model_series"] = model_series
            data_model["model_config"] = json.loads(model["f_model_config"].replace("'", '"'))
            data_model["model_para"] = json.loads(model_dao.get_model_para_by_model(model["f_model"], model_series).replace("'", '"'))
            data.append(data_model)
        res = {
            "res": {
                "total": len(models),
                "data": data
            }
        }
        return JSONResponse(status_code=200, content=res)
    except Exception as e:
        print(e)
        StandLogger.error(e.args)
        return JSONResponse(status_code=500, content=DataBaseError)


# 获取提示词模板列表信息
async def template_source_prompt_endpoint(request, prompt_type, prompt_name):
    headers = request.headers
    error = prompt_template_verify(prompt_name, prompt_type)
    if error:
        StandLogger.error(error)
        return JSONResponse(status_code=400, content=error)
    try:
        templates = prompt_dao.get_prompt_template_list(prompt_type, prompt_name)
        data = []
        for template in templates:
            data_template = {
                "icon": template["f_icon"],
                "prompt_id": template["f_prompt_id"],
                "messages": template["f_messages"],
                "prompt_name": template["f_prompt_name"],
                "prompt_type": template["f_prompt_type"],
                "prompt_desc": template["f_prompt_desc"],
                "opening_remarks": template["f_opening_remarks"],
                "input": template["f_input"],
                "variables": json.loads(template["f_variables"])
            }
            data.append(data_template)
        res = {
            "res": {
                "total": len(data),
                "data": data
            }
        }
        return JSONResponse(status_code=200, content=res)
    except Exception as e:
        print(e)
        StandLogger.error(e.args)
        return JSONResponse(status_code=500, content=DataBaseError)


# 提示词查看
async def check_prompt_endpoint(request, prompt_id):
    headers = request.headers
    error = await check_prompt_verify(prompt_id)
    if error:
        StandLogger.error(error)
        return JSONResponse(status_code=200, content=error)
    try:
        prompt = prompt_dao.get_prompt_by_id(prompt_id)[0]
        model_id = prompt["f_model_id"]
        model_name = model_dao.get_model_name_by_id(prompt["f_model_id"]) if model_id else ""
        model_series = model_dao.get_model_series_by_id(prompt["f_model_id"]) if model_id else ""
        res = {
            "res": {
                "prompt_id": prompt["f_prompt_id"],
                "prompt_name": prompt["f_prompt_name"],
                "model_id": model_id,
                "model_name": model_name,
                "prompt_item_id": prompt["f_prompt_item_id"],
                "prompt_service_id": prompt["f_prompt_service_id"],
                "prompt_item_name": prompt_dao.get_prompt_item_name_by_id(prompt["f_prompt_item_id"]),
                "prompt_item_type_id": prompt["f_prompt_item_type_id"],
                "prompt_item_type": prompt_dao.get_prompt_item_type_by_type_id(prompt["f_prompt_item_type_id"]),
                "messages": prompt["f_messages"],
                "opening_remarks": prompt["f_opening_remarks"],
                "variables": json.loads(prompt["f_variables"]),
                "prompt_type": prompt["f_prompt_type"],
                "prompt_desc": prompt["f_prompt_desc"],
                "prompt_deploy": False if prompt["f_is_deploy"] == 0 else True,
                "model_series": model_series,
                "icon": prompt["f_icon"],
                "model_para": eval(prompt["f_model_para"])
            }
        }
        return JSONResponse(status_code=200, content=res)
    except Exception as e:
        print(e)
        StandLogger.error(e.args)
        return JSONResponse(status_code=500, content=DataBaseError)


# 提示词调用功能模块
async def used_prompt_endpoint(request, prompt_service_id, inputs, history_dia):
    headers = request.headers
    error = await used_prompt_id_verify(prompt_service_id)
    if error:
        return JSONResponse(status_code=500, content=error)
    info = prompt_dao.get_prompt_by_service_id(prompt_service_id)
    # info = await PromptList.filter(f_prompt_service_id=prompt_service_id)
    messages = info[0]["f_messages"]
    model_id = info[0]["f_model_id"]
    is_deploy = info[0]["f_is_deploy"]
    variables = json.loads(info[0]["f_variables"].replace("'", '"'))
    model_para = json.loads(info[0]["f_model_para"].replace("'", '"'))
    if type(inputs) is str and inputs != '':
        inputs = json.loads(inputs.replace("'", '"'))
    # error = await used_prompt_verify(variables, is_deploy, inputs, history_dia, model_id)
    # if error:
    #     StandLogger.error(error)
    #     return JSONResponse(status_code=500, content=error)
    try:
        if inputs:
            var = re.findall(r'\{\{(.*?)\}\}', messages)
            inputs_key = list(inputs.keys())
            for key in var:
                if key not in inputs_key:
                    inputs[f'{key}'] = ''
            messages = messages.replace("{{", "{").replace('}}', "}").format(**inputs)
        from app.controller.model_controller import used_model
        result = await used_model(
            llm_id=model_id,
            ai_system=messages,
            ai_user='',
            ai_assistant='',
            ai_history=history_dia,
            top_p=model_para['top_p'],
            temperature=model_para['temperature'],
            max_tokens=model_para['max_tokens'],
            frequency_penalty=model_para['frequency_penalty'],
            presence_penalty=model_para['presence_penalty']
        )
        return result
    except Exception as e:
        print(e)
        StandLogger.error(e.args)
        return JSONResponse(status_code=500, content=DataBaseError)


# 提示词运行
async def run_prompt_endpoint(request, model_para):
    if "inputs" not in model_para:
        model_para["inputs"] = {}
    if "messages" not in model_para:
        model_para["messages"] = ''
    if "variables" not in model_para:
        model_para["variables"] = []
    if "history_dia" not in model_para:
        model_para["history_dia"] = []
    error = await prompt_run_verify(model_para)
    if error:
        StandLogger.error(error[1])
        return JSONResponse(status_code=error[0], content=error[1])
    else:
        try:
            model_id = model_para["model_id"]
            history_dia = model_para["history_dia"]
            para = model_para["model_para"]
            if model_para['messages'] and model_para['messages'] != '':
                messages_var = re.findall(r'\{\{(.*?)\}\}', model_para["messages"])
                inputs = model_para["inputs"]
                inputs_key = list(inputs.keys())
                for key in messages_var:
                    if key not in inputs_key:
                        inputs[f'{key}'] = ''
                messages = model_para["messages"]
                for message_input, value in inputs.items():
                    messages = messages.replace("{{" + message_input + "}}", value)
            from app.controller.model_controller import used_model
            result = await used_model(
                llm_id=model_id,
                ai_system=model_para["messages"],
                ai_user='',
                ai_assistant='',
                ai_history=history_dia,
                top_p=para['top_p'],
                temperature=para['temperature'],
                max_tokens=para['max_tokens'],
                frequency_penalty=para['frequency_penalty'],
                presence_penalty=para['presence_penalty']
            )
            return result
        except Exception as e:
            StandLogger.error(e.args)
            return JSONResponse(status_code=500, content=DataBaseError)


async def run_prompt_template_endpoint(request, model_para):
    if "inputs" not in model_para:
        model_para["inputs"] = {}
    if "history_dia" not in model_para:
        model_para["history_dia"] = []
    error = prompt_template_run_verify(model_para)
    if error:
        StandLogger.error(error[1])
        return JSONResponse(status_code=error[0], content=error[1])
    try:
        model_name = model_para["model_name"]
        prompt_id = model_para["prompt_id"]
        history_dia = model_para["history_dia"]
        para = model_para["model_para"]
        inputs = model_para["inputs"]
        model_id = model_dao.get_model_id_by_name(model_name)
        prompt = prompt_dao.get_prompt_by_id(prompt_id)
        messages = prompt[0]["f_messages"]

        if messages.startswith("{") and messages.endswith("}"):
            message_dict = eval(messages)
            new_message = ""
            for key, value in message_dict.items():
                if key == "base":
                    new_message += value
                else:
                    if inputs.get(key) is not None:
                        new_message += value.replace("{{", "{").replace('}}', "}").format(**{key: inputs[key]})
            messages = new_message
        elif messages != '':
            messages_var = re.findall(r'\{\{(.*?)\}\}', messages)
            inputs_key = list(inputs.keys())
            for key in messages_var:
                if key not in inputs_key:
                    inputs[f'{key}'] = ''
            for message_input, value in inputs.items():
                messages = messages.replace("{{" + message_input + "}}", value)

        info = model_dao.get_data_from_model_list_by_id(model_id)
        if info[0]["f_model_series"] in ['aishu-baichuan', 'aishu-Qwen']:
            config = json.loads(info[0]["f_model_config"].replace("'", '"'))
            messages, mess_str = llm_utils.prompt(messages, "", "", history_dia)
            llm = llm_factory.create_llm(
                llm_type=config["api_type"],
                openai_api_base=config['api_base'],
                model=config['api_model']
            )
            # context_size 先写死4096
            # context_size = llm.get_context_size()
            context_size = 4096 if info[0]["f_model_series"] == 'aishu-baichuan' else 8192
            prompt_tokens = llm.get_num_tokens(mess_str)
            if prompt_tokens + para['max_tokens'] > context_size - 50:
                return JSONResponse(status_code=500, content=ModelError)

        result = used_model_stream(
            request=request,
            llm_id=model_id,
            ai_system=messages,
            ai_user='',
            ai_assistant='',
            ai_history=history_dia,
            top_p=para['top_p'],
            temperature=para['temperature'],
            max_tokens=para['max_tokens'],
            frequency_penalty=para['frequency_penalty'],
            presence_penalty=para['presence_penalty']
        )
        return result
    except Exception as e:
        StandLogger.error(e.args)
        return JSONResponse(status_code=500, content=DataBaseError)


# 新建提示词项目
async def add_prompt_item_endpoint(userId, params):
    error = await item_add_verify(params)
    if error:
        StandLogger.error(error[1])
        return JSONResponse(status_code=error[0], content=error[1])
    else:
        try:
            f_id = worker.get_id()
            f_prompt_item_id = worker.get_id()
            f_prompt_item_type_id = worker.get_id()
            is_management = 1 if params.get("is_management", False) else 0
            try:
                prompt_dao.add_prompt_item(f_id, f_prompt_item_id, f_prompt_item_type_id, '默认分组',
                                           userId, userId, params['prompt_item_name'], is_management)
                return JSONResponse(status_code=200, content={"res": str(f_prompt_item_id)})
            except Exception as e:
                print(e)
                PromptItemAddError2['description'] = "提示词项目名称重复"
                PromptItemAddError2['detail'] = "prompt_item_name参数不符合规范"
                return JSONResponse(status_code=500, content=PromptItemAddError2)
        except Exception as e:
            StandLogger.error(e.args)
            return JSONResponse(status_code=500, content=DataBaseError)


# 编辑提示词项目
async def edit_prompt_item_endpoint(userId, model_para):
    error = await item_edit_verify(model_para)
    if error:
        StandLogger.error(error[1])
        return JSONResponse(status_code=error[0], content=error[1])
    else:
        try:
            prompt_dao.edit_prompt_item(model_para["prompt_item_id"], model_para["prompt_item_name"], userId)
            return JSONResponse(status_code=200, content={"res": True})
        except Exception as e:
            StandLogger.error(e.args)
            return JSONResponse(status_code=500, content=DataBaseError)


# 新建提示词分类
async def add_prompt_type_endpoint(userId, model_para):
    error = await type_add_verify(model_para)
    if error:
        StandLogger.error(error[1])
        return JSONResponse(status_code=error[0], content=error[1])
    else:
        try:
            f_prompt_item_type_id = snow_id()
            time.sleep(0.01)
            f_id = snow_id()
            item_name = prompt_dao.get_prompt_item_name_by_id(model_para["prompt_item_id"])
            is_management = 1 if model_para.get("is_management", False) else 0
            prompt_dao.add_prompt_item(f_id, model_para["prompt_item_id"], f_prompt_item_type_id,
                                       model_para["prompt_item_type"], userId, userId, item_name, is_management)
            return JSONResponse(status_code=200, content={"res": str(f_prompt_item_type_id)})
        except Exception as e:
            StandLogger.error(e.args)
            return JSONResponse(status_code=500, content=DataBaseError)


# 编辑提示词分类
async def edit_prompt_type_endpoint(userId, model_para):
    error = await type_edit_verify(model_para)
    if error:
        StandLogger.error(error[1])
        return JSONResponse(status_code=error[0], content=error[1])
    else:
        try:
            prompt_dao.edit_prompt_item_type(model_para["prompt_item_type_id"], model_para["prompt_item_type"], userId)
            return JSONResponse(status_code=200, content={"res": True})
        except Exception as e:
            StandLogger.error(e.args)
            return JSONResponse(status_code=500, content=DataBaseError)


# 新增提示词
async def add_prompt_endpoint(userId, model_para):
    if "prompt_desc" not in model_para:
        model_para["prompt_desc"] = ''
    if "variables" not in model_para:
        model_para["variables"] = []
    if "opening_remarks" not in model_para:
        model_para["opening_remarks"] = ''
    if "model_id" not in model_para:
        model_para["model_id"] = ""
    if "model_para" not in model_para:
        model_para["model_para"] = {}
    error = await prompt_add_verify(model_para)
    if error:
        StandLogger.error(error[1])
        return JSONResponse(status_code=error[0], content=error[1])
    else:
        try:
            if len(model_para["model_para"]) != 0:
                model_para["model_para"]["temperature"] = round(model_para["model_para"]["temperature"], 2)
                model_para["model_para"]["top_p"] = round(model_para["model_para"]["top_p"], 2)
                model_para["model_para"]["presence_penalty"] = round(model_para["model_para"]["presence_penalty"], 2)
                model_para["model_para"]["frequency_penalty"] = round(model_para["model_para"]["frequency_penalty"], 2)
            idx = snow_id()
            time.sleep(0.01)
            prompt_service_id = snow_id()
            prompt_dao.add_prompt_to_prompt_list(idx, model_para["prompt_item_id"], model_para["prompt_item_type_id"],
                                                 model_para["prompt_type"], prompt_service_id,
                                                 model_para["prompt_name"], model_para["prompt_desc"],
                                                 model_para["icon"], json.dumps(model_para["variables"]),
                                                 model_para["model_id"], json.dumps(model_para["model_para"]),
                                                 model_para["opening_remarks"], userId, userId, model_para["messages"])
            return JSONResponse(status_code=200, content={"res": {"prompt_id": str(idx)}})
        except Exception as e:
            StandLogger.error(e.args)
            return JSONResponse(status_code=500, content=DataBaseError)


# 提示词名称编辑
async def name_edit_prompt_endpoint(userId, model_para):
    if "prompt_desc" not in model_para:
        model_para["prompt_desc"] = ''
    error = await prompt_name_verify(model_para)
    if error:
        StandLogger.error(error[1])
        return JSONResponse(status_code=error[0], content=error[1])
    else:
        try:
            # 获取原来的提示词分类id
            info = prompt_dao.get_prompt_by_id(model_para["prompt_id"])
            type_id = info[0]["f_prompt_item_type_id"]
            # 如果两次的分类ID不一样
            if model_para['prompt_item_type_id'] != type_id:
                # 去查询第二次分类的所有prompt名称
                info = prompt_dao.get_data_from_prompt_list_by_item_type_id(model_para['prompt_item_type_id'])
                prompt_name_in_new_type = [cell["f_prompt_name"] for cell in info]
                # 如果名称重复, 进入循环阶段，为名称加后缀，直到不重复
                if model_para['prompt_name'] in prompt_name_in_new_type:
                    num = 1
                    while True:
                        new_name = model_para['prompt_name'] + "_{}".format(num)
                        if new_name not in prompt_name_in_new_type:
                            break
                        num += 1
                    model_para['prompt_name'] = new_name
            prompt_dao.edit_name_in_prompt_list(model_para["prompt_id"], model_para["prompt_name"], model_para["model_id"],
                                        model_para["icon"], model_para["prompt_desc"], userId,
                                        model_para["prompt_item_id"], model_para["prompt_item_type_id"])
            return JSONResponse(status_code=200, content={"res": True})
        except Exception as e:
            StandLogger.error(e.args)
            return JSONResponse(status_code=500, content=DataBaseError)


# 提示词编辑
async def edit_prompt_endpoint(userId, model_para):
    if "variables" not in model_para:
        model_para["variables"] = []
    if "opening_remarks" not in model_para:
        model_para["opening_remarks"] = ''
    error = await prompt_edit_verify(model_para)
    if error:
        StandLogger.error(error[1])
        return JSONResponse(status_code=error[0], content=error[1])
    else:
        try:
            prompt_dao.edit_prompt_list(model_para["prompt_id"], model_para["model_id"],
                                        json.dumps(model_para["model_para"]), model_para["messages"],
                                        json.dumps(model_para["variables"]), model_para["opening_remarks"],
                                        userId)
            return JSONResponse(status_code=200, content={"res": True})
        except Exception as e:
            StandLogger.error(e.args)
            return JSONResponse(status_code=500, content=DataBaseError)


# 提示词管理中编辑提示词接口
async def edit_template_prompt_endpoint(userId, params):
    if "variables" not in params:
        params["variables"] = []
    if "opening_remarks" not in params:
        params["opening_remarks"] = ''
    if "prompt_desc" not in params:
        params["prompt_desc"] = ''
    error = await prompt_template_edit_verify(params)
    if error:
        StandLogger.error(error[1])
        return JSONResponse(status_code=error[0], content=error[1])
    try:
        # 获取原来的提示词分类id
        info = prompt_dao.get_prompt_by_id(params["prompt_id"])
        type_id = info[0]["f_prompt_item_type_id"]

        # 如果两次的分类ID一样
        if params['prompt_item_type_id'] == type_id:
            prompt_name_list = [ids["f_prompt_name"] for ids in
                                prompt_dao.get_data_from_prompt_list_by_item_type_id(info[0]["f_prompt_item_type_id"])]
            if params["prompt_name"] in prompt_name_list and params["prompt_name"] != info[0]["f_prompt_name"]:
                PromptNameEditError2['description'] = "参数错误"
                PromptNameEditError2['detail'] = "提示词名称重复"
                StandLogger.error(PromptNameEditError2)
                return JSONResponse(status_code=500, content=PromptNameEditError2)
        else:
            # 去查询第二次分类的所有prompt名称
            info = prompt_dao.get_data_from_prompt_list_by_item_type_id(params['prompt_item_type_id'])
            prompt_name_in_new_type = [cell["f_prompt_name"] for cell in info]
            # 如果名称重复, 进入循环阶段，为名称加后缀，直到不重复
            if params['prompt_name'] in prompt_name_in_new_type:
                num = 1
                while True:
                    new_name = params['prompt_name'] + "_{}".format(num)
                    if new_name not in prompt_name_in_new_type:
                        break
                    num += 1
                params['prompt_name'] = new_name
        prompt_dao.edit_template_prompt_list(params["prompt_id"], params["prompt_name"], params["messages"],
                                             json.dumps(params["variables"]), params["opening_remarks"],
                                             params["icon"], params["prompt_desc"], params["prompt_item_type_id"],
                                             params["prompt_item_id"])
        return JSONResponse(status_code=200, content={"res": True})
    except Exception as e:
        StandLogger.error(e.args)
        return JSONResponse(status_code=500, content=DataBaseError)


# 提示词发布
async def deploy_prompt_endpoint(userId, model_para):
    error = await prompt_deploy_verify(model_para)
    if error:
        StandLogger.error(error[1])
        return JSONResponse(status_code=error[0], content=error[1])
    else:
        try:
            info = prompt_dao.get_prompt_by_id(model_para["prompt_id"])
            service_id = info[0]["f_prompt_service_id"]
            prompt_dao.deploy_prompt(model_para["prompt_id"], service_id)
            return JSONResponse(status_code=200, content={"res": True})
        except Exception as e:
            StandLogger.error(e.args)
            return JSONResponse(status_code=500, content=DataBaseError)


# 提示词取消发布
async def undeploy_prompt_endpoint(userId, model_para):
    error = await prompt_undeploy_verify(model_para)
    if error:
        StandLogger.error(error[1])
        return JSONResponse(status_code=error[0], content=error[1])
    else:
        try:
            prompt_dao.undeploy_prompt(model_para['prompt_id'])
            return JSONResponse(status_code=200, content={"res": True})
        except Exception as e:
            StandLogger.error(e.args)
            return JSONResponse(status_code=500, content=DataBaseError)


# 填充提示词
async def completion_prompt_endpoint(userId, prompt_id, inputs):
    if type(inputs) is str:
        inputs = json.loads(inputs.replace("'", '"'))
    error = await completion_prompt_verify(prompt_id, inputs)
    if error:
        StandLogger.error(error)
        return JSONResponse(status_code=400, content=error)
    else:
        try:
            info = prompt_dao.get_prompt_by_id(prompt_id)
            messages = info[0]["f_messages"]
            messages = messages.replace("{{", "{").replace('}}', "}").format(**inputs)
            return JSONResponse(status_code=200, content=messages)
        except Exception as e:
            StandLogger.error(e.args)
            return JSONResponse(status_code=500, content=DataBaseError)


# 查看代码
async def code_prompt_endpoint(userId, model_id, prompt_id):
    error = await prompt_code_verify(model_id, prompt_id)
    if error:
        StandLogger.error(error)
        return JSONResponse(status_code=400, content=error)
    try:
        if len(prompt_id.replace(' ', '')) == 0:
            result_model = model_dao.get_data_from_model_list_by_id(model_id)
            result = {
                "res": {
                    "model_series": result_model[0]["f_model_series"],
                    "model_type": result_model[0]["f_model_type"],
                    "model_config": json.loads((result_model[0]["f_model_config"]).replace("'", '"')),
                    "prompt_deploy_url": ""
                }
            }
            return JSONResponse(status_code=200, content=result)
        else:
            result_prompt = prompt_dao.get_prompt_by_id(prompt_id)
            result_model = model_dao.get_data_from_model_list_by_id(model_id)
            result = {
                "res": {
                    "model_series": result_model[0]["f_model_series"],
                    "model_type": result_model[0]["f_model_type"],
                    "model_config": json.loads((result_model[0]["f_model_config"]).replace("'", '"')),
                    "prompt_deploy_url": ""
                }
            }
            if result_prompt[0]["f_is_deploy"] == 1:
                result["res"]["prompt_deploy_url"] = result_prompt[0]["f_prompt_deploy_url"]
            return JSONResponse(status_code=200, content=result)
    except Exception as e:
        StandLogger.error(e.args)
        print(e)
        return JSONResponse(status_code=500, content=DataBaseError)


# 获取api文档接口
async def api_doc_prompt_endpoint(prompt_service_id):
    from app.commons.restful_api import get_prompt_restful_api_document
    info = prompt_dao.get_prompt_by_service_id(prompt_service_id)
    prompt = info[0]["f_messages"]
    var = json.loads(info[0]["f_variables"].replace("'", '"'))
    if var:
        var = [cell['var_name'] for cell in var]
        var_dict = dict()
        for cell in var:
            var_dict[cell] = ''
    else:
        var_dict = ''
    res = get_prompt_restful_api_document(prompt_service_id, var_dict, prompt)
    return JSONResponse(status_code=200, content={'res': res})


async def run_prompt_endpoint_stream(request, model_para):
    if "inputs" not in model_para:
        model_para["inputs"] = {}
    if "history_dia" not in model_para:
        model_para["history_dia"] = []
    if "variables" not in model_para:
        model_para["variables"] = []
    error = await prompt_run_verify(model_para)
    if error:
        StandLogger.error(error[1])
        return JSONResponse(status_code=error[0], content=error[1])
    else:
        try:
            messages_var = re.findall(r'\{\{(.*?)\}\}', model_para["messages"])
            inputs = model_para["inputs"]
            inputs_key = list(inputs.keys())
            for key in messages_var:
                if key not in inputs_key:
                    inputs[f'{key}'] = ''
            model_id = model_para["model_id"]
            history_dia = model_para["history_dia"]
            para = model_para["model_para"]
            try:
                messages = model_para["messages"]
                for message_input, value in inputs.items():
                    messages = messages.replace("{{" + message_input + "}}", value)
            except Exception as e:
                StandLogger.error(e.args)
                PromptTemplateRunError1["description"] = "messages解析错误"
                PromptTemplateRunError1["detail"] = "messages解析错误"
                return JSONResponse(status_code=500, content=PromptTemplateRunError1)

            info = model_dao.get_data_from_model_list_by_id(model_id)
            if info[0]["f_model_series"] in ['aishu-baichuan', 'aishu-Qwen']:
                config = json.loads(info[0]["f_model_config"].replace("'", '"'))
                messages, mess_str = llm_utils.prompt(messages, "", "", history_dia)
                llm = llm_factory.create_llm(
                    llm_type=config["api_type"],
                    openai_api_base=config['api_base'],
                    model=config['api_model']
                )
                # context_size 先写死4096
                # context_size = llm.get_context_size()
                context_size = 4096 if info[0]["f_model_series"] == 'aishu-baichuan' else 8192
                prompt_tokens = llm.get_num_tokens(mess_str)
                if prompt_tokens + para['max_tokens'] > context_size - 50:
                    return JSONResponse(status_code=500, content=ModelError)

            result = used_model_stream(
                request=request,
                llm_id=model_id,
                ai_system=messages,
                ai_user='',
                ai_assistant='',
                ai_history=history_dia,
                top_p=para['top_p'],
                temperature=para['temperature'],
                max_tokens=para['max_tokens'],
                frequency_penalty=para['frequency_penalty'],
                presence_penalty=para['presence_penalty'],
                return_info=True
            )
            return result
        except Exception as e:
            StandLogger.error(e.args)
            return JSONResponse(status_code=500, content=DataBaseError)


# 删除功能函数
async def delete_prompt_endpoint(userId, delete_id):
    error = await prompt_delete_verify(delete_id)
    if error:
        StandLogger.error(error[1])
        return JSONResponse(status_code=error[0], content=error[1])
    else:
        try:
            if "prompt_id" in delete_id:
                prompt_dao.delete_from_prompt_list_by_prompt_id(delete_id["prompt_id"])
                return JSONResponse(status_code=200, content={"res": True})
            elif "type_id" in delete_id:
                prompt_dao.delete_from_prompt_list_by_type_id(delete_id["type_id"])
                info = prompt_dao.get_data_from_prompt_item_list_by_type_id(delete_id["type_id"])
                info_is_end = prompt_dao.get_prompt_item_type_by_item_id(info[0]["f_prompt_item_id"])
                if len(info) == 1:
                    item_name = info[0]["f_prompt_item_name"]
                    item_id = info[0]["f_prompt_item_id"]
                    create_by = info[0]["f_create_by"]
                    create_time = info[0]["f_create_time"]
                prompt_dao.delete_from_prompt_item_list_by_type_id(delete_id["type_id"])
                if len(info) == 1:
                    if len(info_is_end) == 1:

                        prompt_dao.add_prompt_item(snow_id(), item_id, '', '',
                                                   create_by, userId, item_name)
                return JSONResponse(status_code=200, content={"res": True})
            elif "item_id" in delete_id:
                prompt_dao.delete_from_prompt_list_by_item_id(delete_id["item_id"])
                prompt_dao.delete_from_prompt_item_list_by_item_id(delete_id["item_id"])
                return JSONResponse(status_code=200, content={"res": True})
        except Exception as e:
            StandLogger.error(e.args)
            return JSONResponse(status_code=500, content=DataBaseError)


# 获取id模块
async def get_id_endpoint(userId):
    return {"res": str(snow_id())}


# 提示词移动
async def move_prompt_endpoint(userId, move_param):
    error = await prompt_move_verify(move_param)
    if error:
        StandLogger.error(error[1])
        return JSONResponse(status_code=error[0], content=error[1])
    try:
        prompt_id = move_param['prompt_id']
        new_item_id = move_param['prompt_item_id']
        new_type_id = move_param['prompt_item_type_id']
        # 获取原来的 ID 和 name
        info = prompt_dao.get_prompt_by_id(prompt_id)
        old_type_id = info[0]["f_prompt_item_type_id"]
        old_name = info[0]["f_prompt_name"]
        # 对重名的进行改名
        if new_type_id != old_type_id:
            info = prompt_dao.get_data_from_prompt_list_by_item_type_id(new_type_id)
            prompt_name_in_new_type = [cell["f_prompt_name"] for cell in info]
            if old_name in prompt_name_in_new_type:
                num = 1
                while True:
                    new_name = old_name + "_{}".format(num)
                    if new_name not in prompt_name_in_new_type:
                        break
                    num += 1
                old_name = new_name
        # 写数据
        prompt_dao.move_prompt(prompt_id, old_name, new_type_id, new_item_id, userId)
        return JSONResponse(status_code=200, content={"res": True})
    except Exception as e:
        StandLogger.error(e.args)
        return JSONResponse(status_code=500, content=DataBaseError)


async def batch_add_prompt_endpoint(userId, params_list):
    error = await batch_add_prompt_endpoint_verify(params_list)
    if error:
        StandLogger.error(error[1])
        return JSONResponse(status_code=error[0], content=error[1])
    try:
        res = []
        for params in params_list:
            prompt_item_name = params["prompt_item_name"]
            prompt_item_type_name = params["prompt_item_type_name"]
            prompt_item = prompt_dao.check_item_and_item_type_by_name(prompt_item_name, prompt_item_type_name)
            if len(prompt_item) == 0:
                items = prompt_dao.check_item_by_name(prompt_item_name)
                if len(items) > 0:
                    prompt_item_id = items[0]["f_prompt_item_id"]
                else:
                    prompt_item_id = worker.get_id()
                f_id = worker.get_id()
                prompt_item_type_id = worker.get_id()
                prompt_dao.add_prompt_item(f_id, prompt_item_id, prompt_item_type_id, prompt_item_type_name,
                                           userId, userId, params['prompt_item_name'], 1)
            else:
                prompt_item_id = prompt_item[0]["f_prompt_item_id"]
                prompt_item_type_id = prompt_item[0]["f_prompt_item_type_id"]
            prompt_name_id_dict = {prompt["f_prompt_name"]: prompt["f_prompt_id"] for prompt in
                                   prompt_dao.get_data_from_prompt_list_by_item_type_id(prompt_item_type_id)}

            prompt_id_list = {}
            insert_values = []
            for prompt in params["prompt_list"]:
                prompt_name = prompt["prompt_name"]
                if prompt_name in prompt_name_id_dict.keys():
                    prompt_id = prompt_name_id_dict[prompt_name]
                    prompt_dao.edit_template_prompt_list(prompt_id, prompt_name, prompt["messages"],
                                                         json.dumps(prompt.get("variables", [])),
                                                         prompt.get("opening_remarks", ""),
                                                         prompt["icon"], prompt.get("prompt_desc", ""),
                                                         prompt_item_type_id, prompt_item_id)
                else:
                    prompt_id = snow_id()
                    time.sleep(0.01)
                    prompt_service_id = snow_id()
                    insert_values.append([prompt_id, prompt_item_id, prompt_item_type_id, prompt["prompt_type"],
                                          prompt_service_id, prompt_name, prompt.get("prompt_desc", ""),
                                          prompt["icon"], json.dumps(prompt.get("variables", [])),
                                          prompt.get("model_id", ""), json.dumps(prompt.get("model_para", {})),
                                          prompt.get("opening_remarks", ""), userId, userId, prompt["messages"],
                                          datetime.datetime.today(), datetime.datetime.today()])
                prompt_id_list[prompt_name] = prompt_id
            if len(insert_values) > 0:
                prompt_dao.add_prompt_batch(insert_values)
            res.append({"prompt_item_name": prompt_item_name,
                        "prompt_item_type_name": prompt_item_type_name,
                        "prompt_list": prompt_id_list})
        return JSONResponse(status_code=200, content={"res": res})
    except Exception as e:
        StandLogger.error(e.args)
        return JSONResponse(status_code=500, content=DataBaseError)
