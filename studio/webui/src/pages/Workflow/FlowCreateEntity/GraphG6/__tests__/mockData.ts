export const mockNodeTemplate = {
  color: '#000',
  dataType: '',
  data_source: '',
  ds_name: '',
  ds_path: '',
  extract_type: '',
  file_type: '',
  ds_id: '',
  model: '',
  task_id: '',
  source_type: 'manual',
  source_table: [],
  ds_address: '',
  properties: [['name', 'string']]
};

export const mockGraph = {
  nodes: [
    {
      ...mockNodeTemplate,
      uid: 'node_1',
      name: 'node_1',
      alias: '点类1'
    },
    {
      ...mockNodeTemplate,
      uid: 'node_2',
      name: 'node_2',
      alias: '点类2'
    }
  ],
  edges: [
    {
      ...mockNodeTemplate,
      uid: 'edge_1',
      name: '1_2_2',
      alias: '1_2_2',
      source: 'node_1',
      target: 'node_2',
      startId: 'node_1',
      endId: 'node_2',
      relations: ['node_1', '1_2_2', 'node_2']
    }
  ]
};

export const mockGroupList = [
  {
    id: 2,
    name: '自定义分组',
    entity: [],
    edge: [],
    entity_num: 0,
    edge_num: 0
  },
  {
    id: 1,
    name: 'ungrouped',
    isUngrouped: true,
    entity: [],
    edge: [],
    entity_num: 0,
    edge_num: 0
  }
];
