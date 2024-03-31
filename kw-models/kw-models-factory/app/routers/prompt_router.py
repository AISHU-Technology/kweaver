from fastapi import APIRouter, Body, Request, Response

from app.controller.prompt_controller import *

router02 = APIRouter()


# 获取提示词项目列表信息接口
@router02.get('/prompt-item-source')
async def source_prompt_item(request: Request, prompt_item_name='', is_management="false"):
    return await source_prompt_item_endpoint(request, prompt_item_name, is_management)


# 获取提示词列表信息接口
@router02.get('/prompt-source')
async def source_prompt(
        request: Request,
        page, size,
        prompt_item_id='',
        prompt_item_type_id='', prompt_name='',
        order='desc', rule='update_time', deploy='all', prompt_type='all', is_management=False):
    return await source_prompt_endpoint(
        request,
        prompt_item_id, prompt_item_type_id,
        page, size, prompt_name, order, rule, deploy, prompt_type, is_management)


# 获取大模型列表接口
@router02.get('/prompt-llm-source')
async def source_llm_prompt(request: Request, types=''):
    return await source_llm_prompt_endpoint(request, types)


# 获取提示词模板列表信息接口
@router02.get('/prompt-template-source')
async def template_source_prompt(request: Request, prompt_type='', prompt_name=''):
    return await template_source_prompt_endpoint(request, prompt_type, prompt_name)


# 提示词查看接口
@router02.get('/prompt/{prompt_id}')
async def check_prompt(request: Request, prompt_id):
    return await check_prompt_endpoint(request, prompt_id)


# 提示词调用接口
@router02.post("/prompt/{service_id}/used")
async def res(
        request: Request,
        service_id,
        inputs=Body(default=''),
        history_dia=Body(default='')):
    return await used_prompt_endpoint(request, service_id, inputs, history_dia)


def get_user_id(request: Request):
    userId = ""
    headers = request.headers
    if headers.get("userId"):
        userId = headers.get("userId")
    return userId


# 新建提示词项目接口
@router02.post("/prompt-item-add")
async def add_prompt_item(request: Request, params: dict = Body(...)):
    userId = get_user_id(request)
    return await add_prompt_item_endpoint(userId, params)


# 编辑提示词项目接口
@router02.post("/prompt-item-edit")
async def edit_prompt_item(request: Request, model_para: dict = Body(...)):
    userId = get_user_id(request)
    return await edit_prompt_item_endpoint(userId, model_para)


# 新建提示词分类接口
@router02.post("/prompt-type-add")
async def add_prompt_type(request: Request, model_para: dict = Body(...)):
    userId = get_user_id(request)
    return await add_prompt_type_endpoint(userId, model_para)


# 编辑提示词分类接口
@router02.post("/prompt-type-edit")
async def edit_prompt_type(request: Request, model_para: dict = Body(...)):
    userId = get_user_id(request)
    return await edit_prompt_type_endpoint(userId, model_para)


# 新增提示词接口
@router02.post("/prompt-add")
async def add_prompt(request: Request, model_para: dict = Body(...)):
    userId = get_user_id(request)
    return await add_prompt_endpoint(userId, model_para)


# 编辑提示词名称接口
@router02.post("/prompt-name-edit")
async def name_edit_prompt(request: Request, model_para: dict = Body(...)):
    userId = get_user_id(request)
    return await name_edit_prompt_endpoint(userId, model_para)


# 编辑提示词接口
@router02.post("/prompt-edit")
async def edit_prompt(request: Request, model_para: dict = Body(...)):
    userId = get_user_id(request)
    return await edit_prompt_endpoint(userId, model_para)


# 提示词管理中编辑提示词接口
@router02.post("/prompt-template-edit")
async def edit_prompt(request: Request, params: dict = Body(...)):
    userId = get_user_id(request)
    return await edit_template_prompt_endpoint(userId, params)


# 提示词发布接口
@router02.post("/prompt-deploy")
async def deploy_prompt(request: Request, model_para: dict = Body(...)):
    userId = get_user_id(request)
    return await deploy_prompt_endpoint(userId, model_para)


# 提示词取消发布接口
@router02.post("/prompt-undeploy")
async def undeploy_prompt(request: Request, model_para: dict = Body(...)):
    userId = get_user_id(request)
    return await undeploy_prompt_endpoint(userId, model_para)


# 提示词运行接口
@router02.post("/prompt-run")
async def run_prompt(request: Request, model_para: dict = Body(...)):
    userId = get_user_id(request)
    return await run_prompt_endpoint(userId, model_para)


# 提示词模板运行接口
@router02.post("/prompt-template-run")
async def run_prompt_template(request: Request, model_para: dict = Body(...)):
    return await run_prompt_template_endpoint(request, model_para)


# 填充提示词open接口
@router02.get('/open/prompt_completion/{prompt_id}')
async def completion_prompt(request: Request, prompt_id, inputs=''):
    userId = get_user_id(request)
    return await completion_prompt_endpoint(userId, prompt_id, inputs)


# 代码查看接口
@router02.get('/prompt-code')
async def code_prompt(request: Request, model_id, prompt_id=''):
    userId = get_user_id(request)
    return await code_prompt_endpoint(userId, model_id, prompt_id)


# 获取api文档接口
@router02.get("/prompt-api-doc")
async def api_doc_prompt(request: Request, service_id):
    return await api_doc_prompt_endpoint(service_id)


# 流式返回接口
@router02.post("/prompt-run-stream")
async def run_prompt_stream(request: Request, response: Response, params: dict = Body(...)):
    userId = get_user_id(request)
    response.headers["Content-Type"] = "text/event-stream"
    response.headers["Cache-Control"] = "no-cache"
    return await run_prompt_endpoint_stream(userId, params)


# 删除接口
@router02.post("/delete-prompt")
async def delete_prompt(request: Request, delete_id: dict = Body(...)):
    userId = get_user_id(request)
    return await delete_prompt_endpoint(userId, delete_id)


# 获取服务id接口
@router02.get("/get-id")
async def get_id(request: Request):
    userId = get_user_id(request)
    return await get_id_endpoint(userId)


# 提示词移动接口
@router02.post("/prompt/move")
async def move_prompt(request: Request, move_param: dict = Body(...)):
    userId = get_user_id(request)
    return await move_prompt_endpoint(userId, move_param)


# 提示词批量创建接口
@router02.post("/prompt/batch_add")
async def batch_add_prompt(request: Request, model_para: list = Body(...)):
    userId = get_user_id(request)
    return await batch_add_prompt_endpoint(userId, model_para)
