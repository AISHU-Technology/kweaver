import intl from 'react-intl-universal';
export const modelPrompt: Record<any, any> = {
  openai: {
    intent_prompt: {
      promptTemplate:
        "请根据用户问题query，判断用户最可能的搜索意图。\n用户问题：{{query}}。\n搜索意图：{{intent_map}}。\n给出该问题最可能的意图名称，用列表返回,意图不明确时，返回['不明确']。返回范围严格按照搜索意图中包含的。",
      tip: intl.get('cognitiveSearch.qaAdvConfig.openAi.intentTip'),
      variables: [
        { id: '1', var_name: 'query' },
        { id: '2', var_name: 'intent_map' }
      ]
    },
    entity_prompt: {
      promptTemplate:
        '请你根据用户描述识别用户指定类型的实体。\n请根据用户问题，抽取出其中指定类型的实体，并以json格式返回，key为实体类型，value为实体内容；没有抽取出指定类型实体时，返回None。\n用户问题：{{query}}。\n实体类型：{{entity_info}}。',
      tip: intl.get('cognitiveSearch.qaAdvConfig.openAi.entityTip'),
      variables: [
        { id: '1', var_name: 'query' },
        { id: '2', var_name: 'entity_info' }
      ]
    }
  },
  private_llm: {
    intent_prompt: {
      promptTemplate:
        '你是一个AI助手，帮助用户解决问题。\n现在请根据用户问题query，判断用户最可能的搜索意图，并以列表返回，返回的意图范围严格要求从搜索意图中选择，意图不明确时返回[]。\n用户问题为：{{query}}。\n搜索意图为：{{intent_map}}。',
      tip: intl.get('cognitiveSearch.qaAdvConfig.LLModel.intentTip'),
      variables: [
        { id: '1', var_name: 'query' },
        { id: '2', var_name: 'intent_map' }
      ]
    },
    entity_prompt: {
      promptTemplate:
        '你是一个AI助手，帮助用户解决问题。\n现在请根据用户query和给定的实体类型范围，提取出query其中的实体，并以json格式返回，如：{"person": "小明"}。\n用户问题：{{query}}。\n实体类型：{{entity_info}}。',
      tip: intl.get('cognitiveSearch.qaAdvConfig.LLModel.entityTip'),
      variables: [
        { id: '1', var_name: 'query' },
        { id: '2', var_name: 'entity_info' }
      ]
    }
  }
};
