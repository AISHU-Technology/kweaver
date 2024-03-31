import intl from 'react-intl-universal';
/**
 * 大模型类型
 */
export const MODEL_TYPE: Record<string, string> = {
  openai: 'OpenAI',
  private_llm: '私有化大模型',
  embbeding_model: '文本向量检索模型'
};

export const MODEL_TYPE_TRANSLATE: Record<string, string> = {
  openai: 'OpenAI',
  private_llm: intl.get('cognitiveSearch.privateLLM'),
};
