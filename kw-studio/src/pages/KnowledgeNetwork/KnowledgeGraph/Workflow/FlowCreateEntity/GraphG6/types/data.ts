import { GraphGroupItem } from './items';

// 图数据
export type GraphData = {
  nodes: Record<string, any>[];
  edges: Record<string, any>[];
};

// 本体信息
export type InitOntoData = {
  ontology_id: number;
  used_task: any[];
  ontology_name: string;
  ontology_des: string;
};

// 框选数据
export type BrushData = GraphData & {
  targetGroup?: GraphGroupItem; // 目标分组
  highlight?: string[]; // 指定高亮, 不指定则默认全部高亮
  notRedraw?: boolean; // 仅更新数据, 不触发画布绘制
};
