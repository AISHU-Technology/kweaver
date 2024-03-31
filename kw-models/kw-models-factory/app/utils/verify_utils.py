from fastapi.responses import JSONResponse
from func_timeout import func_set_timeout
from llmadapter.llms.llm_factory import llm_factory
from llmadapter.schema import AIMessage


@func_set_timeout(19)
def llm_test(series, config):
    message = [AIMessage(content="你是")]
    prompt = "你是"
    if series == 'openai':
        llm = llm_factory.create_llm(llm_type="openai",
                                     api_type="azure",
                                     api_version="2023-03-15-preview",
                                     openai_api_base=config['api_base'],
                                     openai_api_key=config['api_key'],
                                     engine=config['api_model'],
                                     temperature=0.2,
                                     max_tokens=400)
    else:
        try:
            llm = llm_factory.create_llm(llm_type=config['api_type'],
                                         openai_api_base=config['api_base'],
                                         model=config['api_model'],
                                         temperature=0.2, max_tokens=4, max_retries=1)
        except Exception as e:
            print(e)
            return JSONResponse(status_code=200, content={"res": {"status": False}})
    # 区分openai和其他模型
    if series == 'openai':
        try:
            try:
                llm.predict(message)
                return JSONResponse(status_code=200, content={"res": {"status": True, "model_type": "chat"}})

            except Exception as e:
                print(e)
                llm.predict(prompt)
                return JSONResponse(status_code=200, content={"res": {"status": True, "model_type": "completion"}})
        except Exception as e:
            print(e)
            return JSONResponse(status_code=200, content={"res": {"status": False}})

    else:
        try:
            try:
                llm.predict(message)
                return JSONResponse(status_code=200, content={"res": {"status": True, "model_type": "chat"}})
            except Exception as e:
                print(e)
                llm.predict(prompt)
                return JSONResponse(status_code=200, content={"res": {"status": True, "model_type": "completion"}})
        except Exception as e:
            print(e)
            return JSONResponse(status_code=200, content={"res": {"status": False}})
