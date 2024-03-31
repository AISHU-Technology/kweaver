import { ANALYSIS_SERVICES } from '@/enums';

type ValueOf<T> = T[keyof T];

export type KnwItem = {
  id: number;
  color: string;
  knw_name: string;
  knw_description: string;
  intelligence_score: number;
  recent_calculate_time: string;
  creation_time: string;
  update_time: string;
};

export type BasicData = {
  id: string;
  name: string;
  description: string;
  knw_id: number;
  knw_name: string;
  kg_id: number;
  kg_name: string;
  operation_type: SearchType;
  access_method: AccessMethodType[]; // 访问方式
  permission: string; // 权限控制
  pc_configure_item: string; // PC配置
  action?: 'init' | 'change'; // 更新的动作标识
};

// 参数列表
export type ParamsList = {
  _id: string;
  param_type?: 'entity' | 'string' | string;
  options?: 'single' | 'multiple' | string;
  name: string; // 参数名
  example?: string; // 参数样例
  alias?: string; // 显示名
  description?: string; // 描述
  input?: string | string[]; // 搜索值, 前端使用
  position?: any[];
}[];

// 测试数据
export type TestData = {
  config_info: Record<string, any>; // 配置信息
  canvas_body: string; // 画布数据
  canvas_config: string; // 图布局方式
  action?: 'init' | 'change'; // 更新的动作标识
};

export type GraphItem = {
  id: number;
  kgconfid: number;
  name: string;
};

// 进入页面的动作行为
export type ActionType = 'create' | 'edit' | 'publish';

/**
 * 搜索方式
 */
export type SearchType = ValueOf<typeof ANALYSIS_SERVICES.SEARCH_TYPE>;

/**
 * 权限控制
 */
export type PermissionType = ValueOf<typeof ANALYSIS_SERVICES.PERMISSION>;

/**
 * 服务访问方式
 */
export type AccessMethodType = ValueOf<typeof ANALYSIS_SERVICES.ACCESS_METHOD>;
