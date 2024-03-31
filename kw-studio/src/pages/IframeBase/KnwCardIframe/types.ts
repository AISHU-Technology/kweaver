export type Options = {
  // KWeaver应用id, openApi密钥, 调接口必需参数
  appid: string;

  // 认知服务id, 调接口必需参数
  serviceId: string;

  // 根据 搜索关键字 获取知识卡片
  query?: string;

  // 显示语言, 优先级: props > url > KWeaver > window.navigator
  language?: 'zh-CN' | 'en-US' | 'zh-TW' | string;
};

export type Listener = {
  /**
   * 预览文档
   * @param node 实体信息
   */
  previewFn?: (node: Record<string, any>) => void;

  /**
   * 点击知识标签
   * @param node 实体信息
   */
  onViewDetails?: (node?: Record<string, any>) => void;
};
