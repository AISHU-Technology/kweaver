export const knData = {
  id: 2,
  color: 'one',
  knw_name: 'test',
  knw_description: '描述',
  intelligence_score: 1,
  recent_calculate_time: '235432',
  creation_time: '13423',
  update_time: '124324',
  __codes: ['KN_ADD_SERVICE']
};

/**
 * 表格数据
 */
export const tableDataZero = [
  {
    id: '2dfg3435435436',
    status: 0,
    name: '标题',
    operation_type: 'custom-search',
    creater: '984aea9e-4d1f-11ee-a634-7efece726009',
    creater_name: 'test',
    create_time: 12432423,
    editor: '984aea9e-4d1f-11ee-a634-7efece726009',
    editor_name: 'test@aishu.cn',
    edit_time: 12432543,
    access_method: ['restAPI'],
    document: 'api document',
    description: '这是个描述',
    kg_name: [],
    kg_id: '4',
    auto_wire: false
  }
];

export const tableDataOne = [
  {
    id: '2dfg3435435436',
    status: 1,
    name: '标题',
    operation_type: 'custom-search',
    creater: '984aea9e-4d1f-11ee-a634-7efece726009',
    creater_name: 'test',
    create_time: 12432423,
    editor: '984aea9e-4d1f-11ee-a634-7efece726009',
    editor_name: 'test@aishu.cn',
    edit_time: 12432543,
    access_method: ['restAPI'],
    document: 'api document',
    description: '这是个描述',
    kg_name: [],
    kg_id: '4',
    auto_wire: false
  }
];

export const tableDataTwo = [
  {
    id: '2dfg3435435436',
    status: 2,
    name: '标题',
    operation_type: 'custom-search',
    creater: '984aea9e-4d1f-11ee-a634-7efece726009',
    creater_name: 'test',
    create_time: 12432423,
    editor: '984aea9e-4d1f-11ee-a634-7efece726009',
    editor_name: 'test@aishu.cn',
    edit_time: 12432543,
    access_method: ['restAPI'],
    document: 'api document',
    description: '这是个描述',
    kg_name: [],
    kg_id: '4',
    auto_wire: false
  }
];

export const kgNames = [
  {
    kg_name: 'lala',
    kg_id: '2'
  }
];

export const INIT_STATE = {
  loading: false, // 搜索加载中
  query: '', // 搜索关键字
  page: 1, // 当前页码
  count: 0, // 总数
  order_type: 'desc', // 时间排序方式
  order_field: 'edit_time', // 排序规则
  status: -1, // 状态过滤条件
  kg_id: '-1'
};

export const thTitle: Record<number, string> = {
  0: '服务名称',
  1: '查询方式',
  2: '文档说明',
  3: '描述',
  4: '状态',
  5: '关联图谱名称',
  6: '创建人',
  7: '创建时间',
  8: '最终操作人',
  9: '最终操作时间',
  10: '操作'
};
