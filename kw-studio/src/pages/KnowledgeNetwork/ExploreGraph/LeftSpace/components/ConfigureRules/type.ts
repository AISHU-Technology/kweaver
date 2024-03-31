export type TypeConfigureRules = {
  visible: boolean;
  selectedItem?: any;
  filterType?: TYPEFILTER; // 设置点还是边的规则 v_filter e_filter 不传默认设置点和边
  ruleList: any; // 规则列表
  editRule?: any; // 编辑规则的内容
  ontoData: any; // 图谱点类和边类数据
  onCancel: () => void;
  onOk: (data: any) => void; // 点击确定
};

export type VFilter = {
  id: string; // 前端生成，方便更新操作
  tag: string; // 实体类
  error?: boolean; // 配置有误
  type: string; // 过滤规则属性之间的关系 满足全部，满足任意、不满足全部 不满足任意
  relation: string; // 与上一个组之间的关系
  dataSource: { alias: string; name: string; color: string; x?: any; y?: any }; // 本体类的信息
  selfProperties: any[]; // 该类的属性列表
  property_filters?: PropertyFilter[]; // 配置的筛选规则
};

export type EFilter = {
  id: string; // 前端生成，方便更新操作
  edge_class: string; // 边类
  error?: boolean; // 配置有误
  type: string; // 过滤规则属性之间的关系 满足全部，满足任意、不满足全部 不满足任意
  relation: string; // 与上一个组之间的关系
  dataSource: { alias: string; name: string; color: string; x?: any; y?: any }; // 本体类的信息
  selfProperties: any[]; // 该类的属性列表
  property_filters?: PropertyFilter[]; // 配置的筛选规则
};

export type PropertyFilter = {
  proId: string; // 前端生成，方便更新操作
  name: string; // 属性名
  property_type: string; // 属性类型
  operation: string; // 比较运算符
  op_value?: string; // 比较值
};

export type TYPEFILTER = 'v_filters' | 'e_filters';
