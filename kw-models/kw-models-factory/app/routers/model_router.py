# 只放接口
from typing import Optional

from fastapi import APIRouter, Header, Body

from app.controller.model_controller import *

router01 = APIRouter()


@router01.get("/health/ready", include_in_schema=False)
async def health_ready():
    # await base_conf()
    # await prompt_template()
    # await model_param()
    return {"res": 0}


@router01.get("/health/alive", include_in_schema=False)
async def health_alive():
    # await base_conf()
    # await prompt_template()
    # await model_param()
    return {"res": 0}


def get_user_id(request: Request):
    userId = ""
    headers = request.headers
    if headers.get("userId"):
        userId = headers.get("userId")
    return userId


# 保存数据接口
@router01.post("/llm-add")
async def add_llm(request: Request, model_para: dict = Body(...)):
    userId = get_user_id(request)
    return await add_model(model_para, userId)


# 大模型删除接口
@router01.post("/llm-remove")
async def remove_llm(model_id: dict = Body(...), user: Optional[str] = Header(None)):
    return await remove_model(model_id, user)


# 大模型测试接口
@router01.post("/llm-test")
async def test_llm_(model_config: dict = Body(...), user: Optional[str] = Header(None)):
    return await test_model(model_config, user)


# 大模型重命名接口
@router01.post("/llm-edit")
async def edit_llm(request: Request, model_para: dict = Body(...)):
    userId = get_user_id(request)
    return await edit_model(model_para, userId)


# 获取大模型列表接口
@router01.get("/llm-source")
async def source_llm(request: Request, page, size, order='desc', rule='update_time', series='', name=''):
    userId = get_user_id(request)
    return await source_model(userId, page, size, name, order, series, rule)


@router01.post("/llm-used/{llm_id}")
async def used_post(
        request: Request,
        llm_id,
        ai_user: str = Body(default=''), ai_system: str = Body(default=''),
        ai_history: list = Body(default=''), ai_assistant: str = Body(default=''),
        top_p: float = Body(default=0.9), temperature: float = Body(default=0.9),
        max_tokens: float = Body(default=512), frequency_penalty: float = Body(default=0.1),
        presence_penalty: float = Body(default=0.1)):
    return await used_model(llm_id, ai_system, ai_user, ai_assistant, ai_history, top_p, temperature,
                            max_tokens, presence_penalty, frequency_penalty)


# 查看大模型接口
@router01.get("/llm-check")
async def check_llm_(model_id, user: Optional[str] = Header(None)):
    return await check_model(model_id, user)


# 新增大模型获取参数接口
@router01.get("/llm-param")
async def param_llm(user: Optional[str] = Header(None)):
    return await param_model(user)


# 获取api文档接口
@router01.get("/llm-api-doc")
async def api_doc_llm(request: Request, llm_id):
    return await api_doc_model(llm_id)
