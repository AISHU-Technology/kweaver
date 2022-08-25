// 可配置的图谱列表
const mockGraphList = {
  res: [
    { kg_id: 1, kg_name: '图谱1' },
    { kg_id: 2, kg_name: '图谱2' }
  ]
};

// 搜索结果
const mockResult = {
  number: 1,
  time: 0.01,
  res: {
    search: [
      {
        analysis: true,
        color: 'red',
        tag: 'tag',
        id: '1',
        kg_id: 1,
        name: '案例',
        properties: { create_time: '2022-06-24 14:42:20', ds_id: '22' },
        score: 9.8,
        search_path: {
          edges: [
            {
              color: 'red',
              from_id: '1',
              name: '1-2',
              tag: 'e-tag',
              to_id: '2'
            },
            {
              color: 'red',
              from_id: '2',
              name: '2-3',
              tag: 'e-tag',
              to_id: '3'
            }
          ],
          vertexes: [
            {
              color: 'red',
              id: '1',
              name: '案例',
              tag: 'tag'
            },
            {
              color: 'red',
              id: '2',
              name: '案例2',
              tag: 'tag2'
            },
            {
              color: 'red',
              id: '3',
              name: '案例3',
              tag: 'tag2'
            }
          ]
        }
      }
    ]
  }
};

// 图谱数据
const mockGraphData = {
  res: {
    count: 1,
    df: [
      {
        edge: [
          {
            alias: 'AA',
            colour: '#00BDD4',
            name: 'AA',
            relations: ['A', 'AA', 'B']
          },
          {
            alias: 'AA',
            colour: '#F44336',
            name: 'AA',
            relations: ['A', 'AA', 'C']
          },
          {
            alias: 'BC',
            colour: '#ED679F',
            name: 'BC',
            relations: ['B', 'BC', 'C']
          }
        ],
        entity: [
          {
            alias: 'A',
            colour: '#374047',
            name: 'A'
          },
          {
            alias: 'B',
            colour: '#019688',
            name: 'B'
          },
          {
            alias: 'C',
            colour: '#FF9800',
            name: 'C'
          }
        ]
      }
    ]
  }
};

// 配置列表
const mockConfigList = {
  res: [
    {
      kg_name: '图谱1',
      kg_id: 1,
      adv_conf: [
        { conf_id: 1, conf_name: '配置1' },
        { conf_id: 2, conf_name: '配置2' },
        { conf_id: 3, conf_name: '配置3' },
        { conf_id: 4, conf_name: '配置4' },
        { conf_id: 5, conf_name: '配置5' },
        { conf_id: 6, conf_name: '配置6' }
      ]
    },
    { kg_name: '图谱2', kg_id: 2, adv_conf: [{ conf_id: 7, conf_name: '配置7' }] }
  ],
  count: 2
};

// 编辑配置
const mockEditData = {
  res: {
    conf_id: 1,
    conf_name: '配置1',
    kg_name: '图谱1',
    kg_id: 1,
    conf_content: {
      max_depth: 2,
      search_range: {
        vertexes: { open: ['A', 'B'] },
        edges: { open: ['AA'] }
      },
      display_range: { vertexes: { open: ['A'] } }
    }
  }
};

export { mockGraphList, mockResult, mockGraphData, mockConfigList, mockEditData };
