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

export type NodeEdgePropertiesType = {
  name: string; // 属性名
  description: string; // 属性描述
  alias: string; // 显示名
  data_type: string; // 属性值数据类型
  synonym: string; // 同义词 用|来分隔
};

export type NodeApiDataType = {
  entity_id: number; // id
  name: string; // 实体类名
  description: string; // 实体类描述
  alias: string; // 别名
  synonym: string; // 实体类名同义词 用|来分隔
  default_tag: string; // 默认显示属性
  properties_index: string[]; // 需要创建全文索引的属性
  primary_key: string[]; // 融合属性
  vector_generation: string[]; // 向量
  properties: NodeEdgePropertiesType[]; // 属性列表
  x: number; // x坐标
  y: number; // y坐标
  icon: string; // 图标
  shape: string; // 形状
  size: string; // 大小
  fill_color: string; // 填充颜色
  stroke_color: string; // 描边颜色
  text_color: string; // 文字颜色
  text_position: string; // 文字位置
  text_width: number; // 文字宽度
  text_type: string; // 文字自适应或固定 可选值：adaptive(自适应)、stable(固定) 仅形状为矩形时可选adaptive
  source_type: string; // 实体类来源: automatic: 从数据源预测或者模型本体 manual: 手绘
  index_main_switch: boolean; // 索引总开关
  index_default_switch: boolean; // 索引默认开关
  // 模型名:
  // AImodel: 科技新闻模型
  // Anysharedocumentmodel: 文档知识模型
  // Contractmodel:合同模型
  // Generalmodel: 百科知识模型
  // OperationMaintenanceModel: 软件文档知识模型
  // 仅模型类本体有值
  model: string;
  task_id: string; // 导入的本体的任务id
  icon_color: string; // icon的填充色
};

export type EdgeApiDataType = {
  edge_id: number; // id
  name: string; // 边类名
  description: string; // 关系类描述
  alias: string; // 别名
  synonym: string; // 边类名同义词
  properties_index: string[]; // 需要创建全文索引的属性
  default_tag: string; // 默认显示属性。若没有属性则可为空。
  properties: NodeEdgePropertiesType[]; // 属性列表
  relations: string[]; // [起点实体类名, 边名, 终点实体类名]
  colour: string; // 颜色
  shape: string; // 形状 可选值：直线、曲线
  width: string; // 粗细
  source_type: string; // automatic: 模型本体（不支持从数据源预测）manual: 手绘
  index_main_switch: boolean; // 索引总开关
  index_default_switch: boolean; // 索引默认开关
  // 模型名:
  // AImodel: 科技新闻模型
  // Anysharedocumentmodel: 文档知识模型
  // Contractmodel:合同模型
  // Generalmodel: 百科知识模型
  // OperationMaintenanceModel: 软件文档知识模型
  // 仅模型类本体有值
  model: string;
};
export type OntoApiDataType = {
  ontology_name: string; // 本体名
  ontology_des?: string; // 本体描述
  domain?: string[]; // 本体所属领域
  knw_id: number; // 知识网络id
  entity: NodeApiDataType[]; // 实体类信息
  edge: EdgeApiDataType[]; // 关系类信息
  temp_save?: boolean; // True: 保存为草稿 False（默认）: 正式保存
  used_task: number[];
  copy_from?: number;
  canvas: Record<string, any>;
};
