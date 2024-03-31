// 单个分组数据
export type GraphGroupItem = {
  id: number;
  name: string;
  isUngrouped?: boolean;
  entity_num: number;
  edge_num: number;
  entity: Record<string, any>[];
  edge: Record<string, any>[];
};

// 属性 (release-2.0.1.6版本新定义, 仅前端转换, 后端仍是二维数组[["属性名", "属性类型", "属性显示名"], ...])
export type PropertyItem = {
  name: string;
  type: string;
  alias: string;
  checked: boolean;
};

// 属性 (release-2.0.1.8)
export interface AttributeItem {
  attrName: string;
  attrDisplayName: string;
  attrType: string;
  attrIndex: boolean;
  attrVector: boolean;
  attrMerge: boolean;
  attrSynonyms: string[];
  attrDescribe: string;
  error?: Record<string, string>;
}
