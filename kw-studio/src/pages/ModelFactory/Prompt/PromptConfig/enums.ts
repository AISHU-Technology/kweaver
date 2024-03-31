export const CODE_TEMPLATE = {
  openai: `from llmadapter.llms.llm_factory import llm_factory

api_model='{{model_config.api_model}}'
api_key='your key'
   
llm_factory.create_llm(
    "openai",
    api_type="azure",
    api_version="2023-03-15-preview",
    openai_api_key=api_key,
    engine=api_model,
    temperature={{model_para.temperature}},
    top_p={{model_para.top_p}},
    frequency_penalty = {{model_para.frequency_penalty}},
    presence_penalty= {{model_para.presence_penalty}},
    max_tokens={{model_para.max_tokens}}
)`,
  'aishu-baichuan': `from llmadapter.llms.llm_factory import llm_factory
 
api_type='{{model_config.api_type}}'
api_base='{{model_config.api_base}}'
api_model='{{model_config.api_model}}'
   
llm_factory.create_llm(
    api_type,
    openai_api_base=api_base,
    model=api_model,
    temperature={{model_para.temperature}},
    top_p={{model_para.top_p}},
    frequency_penalty = {{model_para.frequency_penalty}},
    presence_penalty= {{model_para.presence_penalty}},
    max_tokens={{model_para.max_tokens}}
)`
};
