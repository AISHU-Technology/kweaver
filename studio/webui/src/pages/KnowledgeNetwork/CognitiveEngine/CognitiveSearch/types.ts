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
  nodeScope: string[]; // 点类搜索范围
  nodeRes: string[]; // 点类搜索结果
  edgeScope: string[]; // 边类搜索范围
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
}

// 测试数据
export interface TTestConfigData {
  kg_ids: string;
  conf_content: TConfigContent;
}
