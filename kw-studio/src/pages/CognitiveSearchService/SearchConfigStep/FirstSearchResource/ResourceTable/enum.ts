/**
 * 资源类型对应icon
 */
export const SOURCE_TYPE_ICON: Record<string, string> = {
  kg: 'icon-color-zhishitupu11', // 知识图谱
  embbeding_model: 'icon-color-wenbenxiangliangjiansuomoxing', // 文本向量
  private_llm: 'icon-color-damoxing',
  openai: 'icon-color-damoxing'
};

/**
 * 资源类型对应背景色
 */
export const SOURCE_TYPE_ICON_COLOR: Record<string, string> = {
  kg: 'rgba(18,110,227,0.06)',
  embbeding_model: 'rgba(1,150,136,0.06)',
  private_llm: 'rgba(250,139,22,0.06)',
  openai: 'rgba(250,139,22,0.06)'
};

/**
 * icon外边框颜色
 */
export const SOURCE_TYPE_BORDER_COLOR: Record<string, string> = {
  kg: 'rgba(18,110,227,0.15)',
  embbeding_model: 'rgba(1,150,136,0.15)',
  private_llm: 'rgba(250,139,22,0.15)',
  openai: 'rgba(250,139,22,0.15)'
};

export const SOURCE_TYPE_NAME: Record<string, string> = {
  embbeding_model: '文本向量模型', // 文本向量
  private_llm: '大模型',
  openai: '大模型'
};
