// 图数据
export interface TGraphData {
  nodes?: any[]; // 点类
  edges?: any[]; // 边类
  mapping?: Map<any, any>; // 映射关系
  nodeLen?: number; // 点计数
  edgeLen?: number; // 边计数(边名去重后的)
}

// 配置数据
export interface TConfigData {
  nodeScope: string[]; // 点类搜索起点
  nodeRes: string[]; // 点类搜索结果
  edgeScope: string[]; // 边类搜索范围
  nodeAllScope?: string[]; // 点类搜索范围
}

// 配置数据
export interface TConfigContent {
  max_depth: number;
  search_range: {
    vertexes: { open: string[] };
    edges: { open: string[] };
  };
  display_range: {
    vertexes: { open: string[] };
  };
  sort_rules: TSortRule;
}

// 测试数据
export interface TTestConfigData {
  kg_ids: string;
  conf_content: TConfigContent;
}

// 权重规则配置
export interface TSortRule {
  lucene_weight: number;
  depth_weight: number;
}
