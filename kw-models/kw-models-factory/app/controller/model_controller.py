import datetime

import func_timeout.exceptions
from fastapi.responses import JSONResponse, StreamingResponse

from app.commons.errorcode.codes import *
from app.commons.snow_id import worker
from app.utils.llm_utils import openai_series, inner_series
from app.utils.param_verify_utils import *
from app.utils.reshape_utils import *
from app.utils.verify_utils import llm_test
from app.utils.stand_log import StandLogger
from sse_starlette import EventSourceResponse


# 保存大模型数据
async def add_model(schema_para, userId):
    if llm_add_verify(schema_para):
        content = llm_add_verify(schema_para)
        StandLogger.error(content)
        return JSONResponse(status_code=400, content=content)
    else:
        try:
            model_configs = schema_para['model_config']
            if schema_para['model_series'] == 'openai':
                config = {
                    "api_key": model_configs['api_key'],
                    "api_model": model_configs['api_model'],
                    "api_base": model_configs['api_base']
                }
            else:
                config = {
                    "api_model": model_configs['api_model'],
                    "api_base": model_configs['api_base'],
                    "api_type": model_configs['api_type']
                }
            model_id = worker.get_id()
            model_dao.add_data_into_model_list(model_id, schema_para["model_series"], schema_para["model_type"],
                                               schema_para["model_name"], model_configs["api_model"],
                                               "/api/model-factory/v1/llm-used/{}".format(model_id), userId, userId,
                                               json.dumps(config))
            return JSONResponse(status_code=200, content={"res": True})
        except Exception as e:
            StandLogger.error(e.args)
            return JSONResponse(status_code=500, content=DataBaseError)


# 删除大模型
async def remove_model(model_id, user):
    try:
        ids_list = [ids["f_model_id"] for ids in model_dao.get_all_model_list()]
        if model_id['model_id'] not in ids_list:
            StandLogger.error(LLMRemoveError["detail"])
            return JSONResponse(status_code=400, content=LLMRemoveError)
        else:
            is_delete = model_dao.get_data_from_model_list_by_id(model_id["model_id"])
        if is_delete[0]["f_is_delete"] == 0:
            model_dao.change_model_delete_status(model_id["model_id"])
            return JSONResponse(status_code=200, content={"res": True})
        else:
            StandLogger.error(LLMRemoveError["detail"])
            return JSONResponse(status_code=400, content=LLMRemoveError)
    except Exception as e:
        StandLogger.error(e.args)
        return JSONResponse(status_code=500, content=DataBaseError)


# 测试大模型
async def test_model(model_config, user):
    if 'model_id' in model_config:
        try:
            ids_list = [ids["f_model_id"] for ids in model_dao.get_all_model_list()]
            if model_config['model_id'] not in ids_list:
                StandLogger.error(LLMTestError["detail"])
                return JSONResponse(status_code=400, content=LLMTestError)
            info = model_dao.get_data_from_model_list_by_id(model_config["model_id"])
            config_str = info[0]["f_model_config"]
            config = json.loads(config_str.replace("'", '"'))
            series = info[0]["f_model_series"]
        except Exception as e:
            StandLogger.error(e.args)
            print(e)
            return JSONResponse(status_code=200, content=DataBaseError)
    else:
        if llm_test_verify(model_config):
            content = llm_test_verify(model_config)
            StandLogger.error(content)
            return JSONResponse(status_code=400, content=content)
        series = model_config['model_series']
        config = model_config['model_config']
    try:
        res = llm_test(series, config)
        return res
    except func_timeout.exceptions.FunctionTimedOut as e:
        StandLogger.error(e.args)
        print(e)
        return JSONResponse(status_code=200, content={"res": {"status": False}})


# 重命名大模型
async def edit_model(model_para, userId):
    if llm_edit_verify(model_para):
        content = llm_edit_verify(model_para)
        StandLogger.error(content)
        return JSONResponse(status_code=400, content=content)
    else:
        try:
            ids_list = [ids["f_model_id"] for ids in model_dao.get_all_model_list()]
            if model_para['model_id'] not in ids_list:
                StandLogger.error(LLMEdit2Error["detail"])
                return JSONResponse(status_code=400, content=LLMEdit2Error)
            else:
                info = model_dao.get_data_from_model_list_by_id(model_para["model_id"])
                config = info[0]["f_model_config"]
                config_pa = model_para['model_config']
                if json.loads(config.replace("'", '"')) != config_pa:
                    StandLogger.error(LLMEdit3Error["detail"])
                    return JSONResponse(status_code=400, content=LLMEdit3Error)
                elif model_para['model_series'] != info[0]["f_model_series"]:
                    StandLogger.error(LLMEdit3Error["detail"])
                    return JSONResponse(status_code=400, content=LLMEdit3Error)
                else:
                    model_name_list = [ids["f_model_name"] for ids in model_dao.get_all_model_list()]
                    old_name = info[0]["f_model_name"]
                    re_name = model_para['model_name']
                    if re_name not in model_name_list or re_name == old_name:
                        model_dao.rename_model(model_para["model_id"], re_name, userId)
                        res_json = {"res": True}
                        return JSONResponse(status_code=200, content=res_json)
                    else:
                        StandLogger.error(LLMEdit4Error["detail"])
                        return JSONResponse(status_code=500, content=LLMEdit4Error)
        except Exception as e:
            StandLogger.error(e.args)
            print(e)
            return JSONResponse(status_code=500, content=DataBaseError)


# 获取大模型列表函数
async def source_model(userId, page, size, name, order, series, rule):
    name = name.strip()
    if llm_source_verify(order, page, size, rule, series, name):
        error = llm_source_verify(order, page, size, rule, series, name)
        StandLogger.error(error)
        return JSONResponse(status_code=400, content=error)
    else:
        try:
            if series == "all":
                result = model_dao.get_data_from_model_list_by_name_fuzzy(name, page, size, order, rule)
            else:
                result = model_dao.get_data_from_model_list_by_name_fuzzy_and_series(name, series, page, size, order,
                                                                                     rule)
            total = len(result)
            result = reshape_source(result, total)
            return JSONResponse(status_code=200, content=result)
        except Exception as e:
            StandLogger.error(e.args)
            return JSONResponse(status_code=500, content=DataBaseError)


# 调用大模型函数
async def used_model(llm_id, ai_system, ai_user, ai_assistant, ai_history, top_p=0.8,
                     temperature=0.9,
                     max_tokens=512,
                     frequency_penalty=0.1,
                     presence_penalty=0.1):
    ids_list = [ids["f_model_id"] for ids in model_dao.get_all_model_list()]
    if llm_id not in ids_list:
        StandLogger.error(LLMUsedError["detail"])
        return JSONResponse(status_code=400, content=LLMUsedError)
    info = model_dao.get_data_from_model_list_by_id(llm_id)
    if info[0]["f_model_series"] == 'openai':
        try:
            types = info[0]["f_model_type"]
            config = json.loads(info[0]["f_model_config"].replace("'", '"'))
            result = await openai_series(
                types=types,
                api_key=config['api_key'],
                api_model=config['api_model'],
                ai_system=ai_system,
                ai_user=ai_user,
                ai_assistant=ai_assistant,
                base_url=config['api_base'],
                ai_history=ai_history,
                top_p=top_p,
                temperature=temperature,
                max_tokens=max_tokens,
                frequency_penalty=frequency_penalty,
                presence_penalty=presence_penalty
            )
            return result
        except Exception as e:
            StandLogger.error(e.args)
            return JSONResponse(status_code=500, content=LLMParamError)
    if info[0]["f_model_series"] in ['aishu-baichuan', 'aishu-Qwen']:
        types = info[0]["f_model_type"]
        config = json.loads(info[0]["f_model_config"].replace("'", '"'))
        result = await inner_series(
            types=types,
            api_type=config['api_type'],
            api_base=config['api_base'],
            api_model=config['api_model'],
            ai_system=ai_system,
            ai_user=ai_user,
            ai_assistant=ai_assistant,
            ai_history=ai_history,
            top_p=top_p,
            temperature=temperature,
            max_tokens=max_tokens,
            frequency_penalty=frequency_penalty,
            presence_penalty=presence_penalty
        )
        return result


# 大模型信息查看接口
async def check_model(model_id, user):
    idx_list = [idx["f_model_id"] for idx in model_dao.get_all_model_list()]
    if model_id not in idx_list:
        StandLogger.error(LLMCheckError["detail"])
        return JSONResponse(status_code=400, content=LLMCheckError)
    try:
        result = reshape_check(model_dao.get_data_from_model_list_by_id(model_id))
        return JSONResponse(status_code=200, content=result)
    except Exception as e:
        StandLogger.error(e.args)
        return JSONResponse(status_code=500, content=DataBaseError)


# 新增大模型参数获取接口
async def param_model(user):
    try:
        info = model_dao.get_all_data_from_model_series()
        result = await reshape_param(info)
        return JSONResponse(status_code=200, content=result)
    except Exception as e:
        StandLogger.error(e.args)
        return JSONResponse(status_code=500, content=DataBaseError)


async def api_doc_model(llm_id):
    from app.commons.restful_api import get_model_restful_api_document
    return JSONResponse(status_code=200, content={"res": get_model_restful_api_document(llm_id)})


# 调用大模型函数
from fastapi import Request


def used_model_stream(request: Request, llm_id, ai_system, ai_user, ai_assistant, ai_history, top_p=0.8,
                            temperature=0.9, max_tokens=512, frequency_penalty=0.1, presence_penalty=0.1, return_info=False):
    ids_list = [ids["f_model_id"] for ids in model_dao.get_all_model_list()]
    if llm_id not in ids_list:
        StandLogger.error(LLMUsedError["detail"])
        return JSONResponse(status_code=400, content=LLMUsedError)
    info = model_dao.get_data_from_model_list_by_id(llm_id)
    if info[0]["f_model_series"] == 'openai':
        try:
            types = info[0]["f_model_type"]
            config = json.loads(info[0]["f_model_config"].replace("'", '"'))
            result = openai_series(
                types=types,
                api_key=config['api_key'],
                api_model=config['api_model'],
                ai_system=ai_system,
                ai_user=ai_user,
                ai_assistant=ai_assistant,
                base_url=config['api_base'],
                ai_history=ai_history,
                top_p=top_p,
                temperature=temperature,
                max_tokens=max_tokens,
                frequency_penalty=frequency_penalty,
                presence_penalty=presence_penalty
            )
            return result
        except func_timeout.exceptions.FunctionTimedOut as e:
            StandLogger.error(e.args)
            return JSONResponse(status_code=500, content=LLMParamError)
    if info[0]["f_model_series"] in ['aishu-baichuan', 'aishu-Qwen']:
        try:
            types = info[0]["f_model_type"]
            config = json.loads(info[0]["f_model_config"].replace("'", '"'))
            from app.utils.llm_utils import inner_series_stream
            result = inner_series_stream(
                request=request,
                types=types,
                api_type=config['api_type'],
                api_base=config['api_base'],
                api_model=config['api_model'],
                ai_system=ai_system,
                ai_user=ai_user,
                ai_assistant=ai_assistant,
                ai_history=ai_history,
                top_p=top_p,
                temperature=temperature,
                max_tokens=max_tokens,
                frequency_penalty=frequency_penalty,
                presence_penalty=presence_penalty,
                return_info=return_info
            )
            return EventSourceResponse(result)

        except func_timeout.exceptions.FunctionTimedOut as e:
            StandLogger.error(e.args)
            print(e)
            return JSONResponse(status_code=500, content=LLMParamError)
