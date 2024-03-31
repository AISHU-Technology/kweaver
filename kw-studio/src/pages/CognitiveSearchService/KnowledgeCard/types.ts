import React from 'react';

type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T;

/**
 * 基本数据
 */
export type CardState = {
  knwId: number;
  configType: 'card' | 'recommend' | string; // 知识卡片或推荐
  graphSources: any[]; // 图谱资源
  testOptions?: any; // 组件测试的排序、阈值参数
  selectedGraph?: Record<string, any>; // 选择的图谱
  savedData: SavedConfigs; // 已保存的配置
  configs: NodeConfigItem;
  externalModel?: any[];
};

/**
 * 更新字段
 */
export type UpdateAction = {
  key?: keyof CardState; // 更新的key, 批量更新不传
  merge?: boolean; // 开启: 使用merge方法递归合并更新, 默认开启; 关闭: 直接替换更新
  batch?: boolean; // 是否批量模式, 开启则同时更新多个key
  data: DeepPartial<CardState[keyof CardState]>;
};

export type CardContext = {
  state: CardState;
  dispatch: React.Dispatch<UpdateAction>;
};

/**
 * 配置面板数据
 */
export type NodeConfigItem = {
  sort: string[];
  node: Record<string, any>;
  activeID?: string;
  componentsCache: any[];
  components: any[];
};

/**
 * 保存的数据
 */
export type SavedConfigs = {
  kg_id: number;
  entity: string; // 实体类名
  components: (EntityInfoType & RelatedLabelType & RelatedDocumentType2)[];
}[];

/** 属性类型 */
export type Properties = {
  name: string;
  alias: string | number;
  type?: string;
  value?: string | number;
};

export type TitleObj = {
  'zh-CN': string;
  'zh-TW': string;
  'en-US': string;
};

/** 实体信息配置 */
export type EntityInfoType = {
  id?: string; // 前端渲染id, 保存时删掉
  error?: Record<string, any>; // 前端错误信息, 保存时删掉
  type: string;
  search_type: string;
  title: string;
  labelColor: 'inherit' | string; // inherit表示继承本体颜色, 自定义直接存rgba
  description: string;
  properties: Properties[];
  [key: string]: any;
};

type NeighborConfig = {
  direction: 'positive' | 'reverse' | 'bidirect';
  steps: number;
  final_step: boolean;
  filters: any[];
};

/** 相关词条类型 */
export type RelatedLabelType = {
  id?: string; // 前端渲染id, 保存时删掉
  error?: Record<string, any>; // 前端错误信息, 保存时删掉
  type: string;
  search_type: string;
  title: TitleObj;
  entities: string[]; // 终点实体类列表
  labelColor: 'inherit' | string; // inherit表示继承本体颜色, 自定义直接存rgba
  limit: number;
  search_config: NeighborConfig;
  [key: string]: any;
};

/** 相关文档类型1 */
export type RelatedDocumentType1 = {
  id?: string; // 前端渲染id, 保存时删掉
  error?: Record<string, any>; // 前端错误信息, 保存时删掉
  type: string;
  search_type: string;
  title: TitleObj;
  entity: string; // 终点实体类
  endNodeProperty1: string; // 终点实体类展示的属性值
  limit: number;
  search_config: NeighborConfig;
  [key: string]: any;
};

/** 相关文档类型2 */
export type RelatedDocumentType2 = RelatedDocumentType1 & {
  endNodeProperty2: string;
  imageUrl: string;
};
