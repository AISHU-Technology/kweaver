import json
# import logging
import time

import func_timeout.exceptions
from fastapi import Request
from fastapi.responses import JSONResponse
from func_timeout import func_set_timeout
from llmadapter.llms.llm_factory import llm_factory
from llmadapter.schema import SystemMessage, HumanMessage, AIMessage

from app.commons.errorcode.errors import ModelError, LLMParamError, ModelTimeoutError
from app.dao.model_dao import model_dao


# logging.basicConfig(level=logging.DEBUG, format='%(asctime)s %(levelname)s: %(message)s')


# openai 类： 调用研究院
class OpenAIClient:
    def __init__(self, api_key, api_model, temperature, top_p, frequency_penalty,
                 presence_penalty, max_tokens, base_url):
        self.llm_type = "openai",
        self.api_type = "azure",
        self.api_version = "2023-03-15-preview",
        self.openai_api_base = base_url,
        self.openai_api_key = api_key,
        self.engine = api_model,
        self.temperature = temperature
        self.top_p = top_p
        self.frequency_penalty = frequency_penalty
        self.presence_penalty = presence_penalty
        self.max_tokens = max_tokens

    def openai_chat_completion(self, message):
        start = time.time()
        llm = llm_factory.create_llm(
            llm_type=self.llm_type[0],
            api_type=self.api_type[0],
            api_version=self.api_version[0],
            openai_api_base=self.openai_api_base[0],
            openai_api_key=self.openai_api_key[0],
            engine=self.engine[0],
            temperature=self.temperature,
            top_p=self.top_p,
            frequency_penalty=self.frequency_penalty,
            presence_penalty=self.presence_penalty,
            max_tokens=self.max_tokens, )
        res = llm.predict(message)
        result = {
            "res":
                {
                    "time": time.time() - start,
                    "token_len": llm.get_num_tokens(res),
                    "data": res
                }
        }
        return result


# 内置模型类
class InnerClient:
    def __init__(self, api_type, api_base, api_model,
                 temperature, top_p, frequency_penalty, presence_penalty, max_tokens):
        self.api_type = api_type,
        self.api_base = api_base
        self.api_model = api_model
        self.temperature = temperature
        self.top_p = top_p
        self.frequency_penalty = frequency_penalty
        self.presence_penalty = presence_penalty
        self.max_tokens = max_tokens

    def chat_completion(self, message):
        start = time.time()
        llm = llm_factory.create_llm(
            llm_type=self.api_type[0],
            openai_api_base=self.api_base,
            model=self.api_model,
            temperature=self.temperature,
            top_p=self.top_p,
            frequency_penalty=self.frequency_penalty,
            presence_penalty=self.presence_penalty,
            max_tokens=self.max_tokens,
            max_retries=30)
        res = llm.predict(message)
        end = time.time()
        result = {
            "res": {
                "time": end - start,
                "token_len": llm.get_num_tokens(res),
                "data": res
            }
        }
        return result


def prompt(ai_system, ai_user, ai_assistant, ai_history):
    messages = []
    mess_str = ''
    if ai_system.strip():
        messages.append(SystemMessage(content="{}".format(ai_system)))
        mess_str += ai_system
    if ai_user.strip():
        messages.append(SystemMessage(content="{}".format(ai_user)))
        mess_str += ai_user
    if ai_assistant.strip():
        messages.append(SystemMessage(content="{}".format(ai_assistant)))
        mess_str += ai_assistant
    if ai_history:
        if type(ai_history) is str:
            ai_history = json.loads(ai_history.replace("'", '"'))
        for cell in ai_history:
            if cell["role"] == "human" and cell["message"].strip():
                messages.append(HumanMessage(content="{}".format(cell["message"])))
                mess_str += cell["message"]
            elif cell["role"] == 'ai' and cell["message"].strip():
                messages.append(AIMessage(content="{}".format(cell["message"])))
                mess_str += cell["message"]
    print("---->message:", messages)
    return messages, mess_str


@func_set_timeout(40)
def inner_token_num(api_type, api_base, api_model, message, user_max_token, llm_max_token):
    llm = llm_factory.create_llm(
        llm_type=api_type,
        openai_api_base=api_base,
        model=api_model,
        max_tokens=300,
        max_retries=30)
    mess_token = llm.get_num_tokens(message)
    if user_max_token + mess_token >= llm_max_token - 50:
        print('user_max_token', user_max_token)
        print('mess_token', mess_token)
        print('llm_max_token', llm_max_token)

        return "token超出限制"


def openai_token_num(openai_api_key, engine, user_max_token, llm_max_token, message, base_url):
    llm = llm_factory.create_llm(
        llm_type="openai",
        api_type="azure",
        api_version="2023-03-15-preview",
        openai_api_base=base_url,
        openai_api_key=openai_api_key,
        engine=engine,
        max_tokens=300)
    mess_token = llm.get_num_tokens(message)
    if user_max_token + mess_token >= llm_max_token - 50:
        print('user_max_token', user_max_token)
        print('mess_token', mess_token)
        print('llm_max_token', llm_max_token)

        return "token超出限制"


@func_set_timeout(40)
def model_llm(llm, messages):
    res = llm.chat_completion(messages)
    return res


# 内置模型 ending_point
async def inner_series(types, api_type, api_base, api_model,
                       ai_system='', ai_user='', ai_assistant='', ai_history='',
                       temperature=0.7, top_p=0.95, frequency_penalty=0, presence_penalty=0, max_tokens=300):
    # mess_str 为所有字符拼接长度
    messages, mess_str = prompt(ai_system, ai_user,
                                    ai_assistant, ai_history)
    info = model_dao.get_model_default_para_by_model(api_model)
    # 查询 模型的最大 token 长度
    llm_max_token = json.loads(info[0]["f_model_default_para"].replace("'", '"'))['max_tokens'][1]
    # 校验 token 有没有超出
    try:
        error = inner_token_num(api_type, api_base, api_model,
                                mess_str, max_tokens, llm_max_token)
        if error:
            return JSONResponse(status_code=400, content=ModelError)
    except Exception as e:
        print(e)
        return JSONResponse(status_code=500, content=LLMParamError)

    llm = InnerClient(api_type, api_base, api_model,
                      temperature, top_p, frequency_penalty, presence_penalty, max_tokens)
    if types == "chat":
        if messages:
            try:
                return model_llm(llm, messages)
            except func_timeout.exceptions.FunctionTimedOut:
                return JSONResponse(status_code=400, content=LLMParamError)
        else:
            return set_res
    else:
        if ai_system:
            try:
                return llm.chat_completion(ai_system)
            except func_timeout.exceptions.FunctionTimedOut:
                return JSONResponse(status_code=400, content=LLMParamError)
        else:
            return set_res


# openai模型 ending_point
@func_set_timeout(40)
def openai_series(types, api_key, api_model, ai_system, ai_history, ai_user, ai_assistant, base_url, top_p=0.95,
                  temperature=0.7, max_tokens=300, frequency_penalty=0, presence_penalty=0):
    try:
        # 获取所有输入信息的长度
        messages, mess_str = prompt(ai_system, ai_user, ai_assistant, ai_history)
        info = model_dao.get_model_default_para_by_model(api_model)
        # 查询 模型的最大 token 长度
        llm_max_token = json.loads(info[0]["f_model_default_para"].replace("'", '"'))['max_tokens'][1]
        # 校验 token 有没有超出
        try:
            error = openai_token_num(api_key, api_model, max_tokens, llm_max_token, mess_str, base_url)
            if error:
                return JSONResponse(status_code=400, content=ModelError)
        except Exception as e:
            print(e)
            return JSONResponse(status_code=500, content=LLMParamError)

        llm = OpenAIClient(api_key, api_model, temperature, top_p, frequency_penalty,
                           presence_penalty, max_tokens, base_url)
        if types == "chat":
            if messages:
                try:
                    return llm.openai_chat_completion(messages)
                except Exception as e:
                    print(e)
                    return JSONResponse(status_code=400, content=LLMParamError)
            else:
                return set_res
        else:
            if ai_system:
                return llm.openai_chat_completion(ai_system)
            else:
                return set_res
    except:
        return JSONResponse(status_code=500, content=ModelTimeoutError)


# openai 类
# class OpenAIClient:
#     def __init__(self, api_key, api_model,
#                  temperature, top_p, frequency_penalty, presence_penalty, max_tokens):
#         openai.api_type = "azure"
#         openai.api_base = "https://anydata-dev.openai.azure.com/"
#         openai.api_version = "2023-03-15-preview"
#         openai.api_key = api_key
#         self.model = api_model
#         self.temperature = temperature
#         self.top_p = top_p
#         self.frequency_penalty = frequency_penalty
#         self.presence_penalty = presence_penalty
#         self.max_tokens = max_tokens
#
#     async def chat(self, messages, stop=None):
#         response = openai.ChatCompletion.create(
#             messages=messages,
#             stop=stop,
#             engine=self.model,
#             temperature=self.temperature,
#             top_p=self.top_p,
#             frequency_penalty=self.frequency_penalty,
#             presence_penalty=self.presence_penalty,
#             max_tokens=self.max_tokens
#         )
#         return response.choices[0].message.content.strip()
#
#     async def completion(self, prompt, stop=None):
#         response = openai.Completion.create(
#             prompt=prompt,
#             stop=stop,
#             engine=self.model,
#             temperature=self.temperature,
#             top_p=self.top_p,
#             frequency_penalty=self.frequency_penalty,
#             presence_penalty=self.presence_penalty,
#             max_tokens=self.max_tokens
#         )
#         return response.choices[0].text.strip()


# # openai模型 ending_point
# async def openai_series(types,
#                         api_key, api_model,
#                         ai_system, ai_history, ai_user, ai_assistant,
#                         top_p=0.95,
#                         temperature=0.7,
#                         max_tokens=300,
#                         frequency_penalty=0,
#                         presence_penalty=0,
#                         ):
#     logging.info("--------------------------------->: openai_series-40秒计时：{}")
#     llm = OpenAIClient(api_key, api_model,
#                        temperature, top_p, frequency_penalty, presence_penalty, max_tokens)
#     if types == "chat":
#         logging.info("--------------------------------->: chat：{}")
#         message = [
#             {"role": "system", "content": "{}".format(ai_system)},
#             {"role": "user", "content": "{}".format(ai_user)},
#             {"role": "assistant", "content": "{}".format(ai_assistant)}
#         ]
#         if ai_history:
#             if type(ai_history) is str:
#                 ai_history = json.loads(ai_history.replace("'", '"'))
#             for cell in ai_history:
#                 if cell["role"] == "human":
#                     message.append({"role": "system", "content": "{}".format(cell["message"])})
#                 elif cell["role"] == 'ai':
#                     message.append({"role": "user", "content": "{}".format(cell["message"])})
#         logging.info("--------------------------------->: 这是messages：{}".format(message))
#         return await llm.chat(message)
#     else:
#         logging.info("--------------------------------->: completion：{}")
#         return await llm.completion(ai_system)

# 内置模型类
class InnerClientStream:
    def __init__(self, api_type, api_base, api_model,
                 temperature, top_p, frequency_penalty, presence_penalty, max_tokens):
        self.api_type = api_type,
        self.api_base = api_base
        self.api_model = api_model
        self.temperature = temperature
        self.top_p = top_p
        self.frequency_penalty = frequency_penalty
        self.presence_penalty = presence_penalty
        self.max_tokens = max_tokens

    def chat_completion_stream(self, request: Request, message, return_info):
        llm = llm_factory.create_llm(
            llm_type=self.api_type[0],
            openai_api_base=self.api_base,
            model=self.api_model,
            temperature=self.temperature,
            top_p=self.top_p,
            frequency_penalty=self.frequency_penalty,
            presence_penalty=self.presence_penalty,
            max_tokens=self.max_tokens, )
        import time
        start_time = time.time()
        token_len = 0
        for token in llm.stream_generator(message):
            # print(token)
            token_len += 1
            yield token
            import time
        end_time = time.time()
        if return_info:
            yield "--info--" + str(json.dumps({"time": str(end_time - start_time), "token_len": token_len}))
        yield "--end--"


# 内置模型 ending_point
@func_set_timeout(40)
def inner_series_stream(request: Request, types,
                        api_type, api_base, api_model,
                        ai_system='', ai_user='', ai_assistant='', ai_history='',
                        temperature=0.7,
                        top_p=0.95,
                        frequency_penalty=0,
                        presence_penalty=0,
                        max_tokens=300,
                        return_info=False):
    llm = InnerClientStream(api_type, api_base, api_model,
                            temperature, top_p, frequency_penalty, presence_penalty, max_tokens)
    if types == "chat":
        messages = [SystemMessage(content="{}".format(ai_system)),
                    HumanMessage(content="{}".format(ai_user)),
                    AIMessage(content="{}".format(ai_assistant))]
        if ai_history:
            if type(ai_history) is str:
                ai_history = json.loads(ai_history.replace("'", '"'))
            for cell in ai_history:
                if cell["role"] == "human":
                    messages.append(HumanMessage(content="{}".format(cell["message"])))
                elif cell["role"] == 'ai':
                    messages.append(AIMessage(content="{}".format(cell["message"])))
        print("---->message:", messages)
        return llm.chat_completion_stream(request, messages, return_info)
    else:
        return llm.chat_completion_stream(request, ai_system, return_info)


set_res = {
    "res": {
        "time": 0.406968355178833,
        "token_len": 18,
        "data": "Sorry, I need more information to help you. Please provide more details about your question."
    }
}
