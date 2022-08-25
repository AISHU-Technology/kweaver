// 图谱
const mockGraph = [
  { kg_id: '1', kg_name: '图谱1', graph_db_name: '6546542zwf', step_num: 7 },
  { kg_id: '2', kg_name: '图谱2', graph_db_name: 'a65wfs65', step_num: 7 }
];

// 搜索结果
const mockRes = [
  {
    class: 'label',
    color: '#374047',
    name: '氧气',
    id: '#35:2',
    expand: true,
    analysis: true,
    hl: '氧气',
    alias: '标签',
    properties: [{ n: 'adlabel_kcid', v: '氧气', hl: '氧气' }]
  },
  {
    class: 'label',
    color: '#374047',
    name: '轨道',
    id: '#35:3',
    expand: true,
    analysis: false,
    hl: '轨道',
    alias: '标签',
    properties: [{ n: 'adlabel_kcid', v: '轨道', hl: '轨道' }]
  }
];

// 搜索用时
const mockTime = {
  time: '0.34s',
  count: '30'
};

// 点类
const mockClass = [
  { class: 'label', alias: '标签' },
  { class: 'document', alias: '文档' }
];

// 属性类型
const mockPro = [
  { p_name: 'STRING', p_type: 'STRING' },
  { p_name: 'INTEGER', p_type: 'INTEGER' },
  { p_name: 'BOOLEAN', p_type: 'BOOLEAN' },
  { p_name: 'DOUBLE', p_type: 'DOUBLE' },
  { p_name: 'FLOAT', p_type: 'FLOAT' },
  { p_name: 'DECIMAL', p_type: 'DECIMAL' },
  { p_name: 'DATETIME', p_type: 'DATETIME' },
  { p_name: 'DATE', p_type: 'DATE' }
];

// 筛选条件
const mockTags = [
  { pro: 'STRING', type: 'STRING', rangeType: '=', value: ['value'] },
  { pro: 'INTEGER', type: 'INTEGER', rangeType: '~', value: [1, 2] },
  { pro: 'BOOLEAN', type: 'BOOLEAN', rangeType: '=', value: ['True'] },
  { pro: 'DOUBLE', type: 'DOUBLE', rangeType: '>', value: [1.1, 2.2] },
  { pro: 'FLOAT', type: 'FLOAT', rangeType: '<', value: [1.1, 2.2] },
  { pro: 'DECIMAL', type: 'DECIMAL', rangeType: '=', value: [1.1, 2.2] },
  { pro: 'DATETIME', type: 'DATETIME', rangeType: '>', value: ['2022-01-21 10:00:06'] },
  { pro: 'DATE', type: 'DATE', rangeType: '<', value: ['2022-01-21 11:00:06'] }
];

// 进出边
const mockE = {
  inE: [
    { class: 'in1', color: '#448AFF', count: 1, alias: '进边1' },
    { class: 'in2', color: '#448AFF', count: 2, alias: '进边2' }
  ],
  outE: [
    { class: 'out1', color: '#019688', count: 1, alias: '出边1' },
    { class: 'out2', color: '#019688', count: 2, alias: '出边2' }
  ]
};

export { mockGraph, mockRes, mockTime, mockClass, mockPro, mockTags, mockE };
