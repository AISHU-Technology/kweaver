import React from 'react';

export type Options = {
  // KWeaver应用id, openApi密钥, 调接口必需参数
  appid: string;

  // 认知服务id, 调接口必需参数
  serviceId: string;

  // 根据gns获取文档的关联知识标签
  gns?: string;

  // 配置名称???
  configName?: string;

  // 显示语言, 优先级: props > url > KWeaver > window.navigator
  language?: 'zh-CN' | 'en-US' | 'zh-TW' | string;

  // 标题占位
  title?: string;

  /** 上面的参数iframe、乾坤通用, 下面的参数仅支持乾坤 */

  // 乾坤注入的参数???
  systemInfo?: any;

  // 最外层 div 样式
  style?: React.CSSProperties;
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

  /**
   * 关闭导航条
   */
  onCloseDetails?: () => void;

  /**
   * 点赞/喜欢
   */
  onLike?: () => void;

  /**
   * 踩/不喜欢
   */
  onDislike?: () => void;
};
