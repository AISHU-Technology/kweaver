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
