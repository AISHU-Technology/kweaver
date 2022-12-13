// 实体列表数据

const entityMusterData = {
  nodes: [
    {
      alias: '正文',
      colour: '#607D8B',
      dataType: '',
      data_source: '',
      ds_address: '',
      ds_id: '',
      ds_name: '',
      ds_path: '',
      entity_id: 4,
      extract_type: '',
      file_type: '',
      model: 'Anysharedocumentmodel',
      name: 'text',
      nodeInfo: {
        attrSelect: ['name'],
        entity_type: { value: 'text', Type: 0 },
        otl_name: 'text',
        property_map: [{ entity_prop: { Type: 0, value: 'name' }, otl_prop: 'name' }]
      },
      properties: ['name', 'string'],
      properties_index: ['name'],
      source_table: [],
      source_type: 'automatic',
      task_id: ''
    },
    {
      Type: 1,
      alias: '条款',
      colour: '#019688',
      dataType: '',
      data_source: '',
      ds_address: '',
      ds_id: '',
      ds_name: '',
      ds_path: '',
      entity_id: 12,
      extract_type: '',
      file_type: '',
      model: 'Generalmodel',
      name: 'clause',
      nodeInfo: {
        otl_name: 'clause',
        property_map: [
          { entity_prop: { Type: 0, value: 'name' }, otl_prop: 'name' },
          { entity_prop: { Type: 0, value: 'content' }, otl_prop: 'content' }
        ],
        entity_type: { Type: 1, value: 'clause' },
        attrSelect: [
          { entity_prop: { Type: 2, value: 'name' }, otl_prop: 'name' },
          { entity_prop: { Type: 2, value: 'content' }, otl_prop: 'content' }
        ]
      },
      properties: [
        ['name', 'string'],
        ['content', 'string']
      ],
      properties_index: (2)[('name', 'content')],
      source_table: [],
      source_type: 'automatic',
      task_id: ''
    },
    {
      Type: 1,
      alias: '条款',
      colour: '#019688',
      dataType: '',
      data_source: '',
      ds_address: '',
      ds_id: '',
      ds_name: '',
      ds_path: '',
      entity_id: 12,
      extract_type: '',
      file_type: '',
      model: 'AImodel',
      name: 'clause',
      nodeInfo: {
        otl_name: 'clause',
        property_map: [
          { entity_prop: { Type: 0, value: 'name' }, otl_prop: 'name' },
          { entity_prop: { Type: 0, value: 'content' }, otl_prop: 'content' }
        ],
        entity_type: { Type: 1, value: 'clause' },
        attrSelect: [
          { entity_prop: { Type: 2, value: 'name' }, otl_prop: 'name' },
          { entity_prop: { Type: 2, value: 'content' }, otl_prop: 'content' }
        ]
      },
      properties: [
        ['name', 'string'],
        ['content', 'string']
      ],
      properties_index: (2)[('name', 'content')],
      source_table: [],
      source_type: 'automatic',
      task_id: ''
    },
    {
      Type: 0,
      alias: '条款',
      colour: '#019688',
      dataType: '',
      data_source: '',
      ds_address: '',
      ds_id: '',
      ds_name: '',
      ds_path: '',
      entity_id: 12,
      extract_type: '',
      file_type: '',
      model: 'Contractmodel',
      name: 'clause',
      nodeInfo: {
        otl_name: 'clause',
        property_map: [
          { entity_prop: { Type: 0, value: 'name' }, otl_prop: 'name' },
          { entity_prop: { Type: 0, value: 'content' }, otl_prop: 'content' }
        ],
        entity_type: { Type: 1, value: 'clause' },
        attrSelect: [
          { entity_prop: { Type: 2, value: 'name' }, otl_prop: 'name' },
          { entity_prop: { Type: 2, value: 'content' }, otl_prop: 'content' }
        ]
      },
      properties: [
        ['name', 'string'],
        ['content', 'string']
      ],
      properties_index: (2)[('name', 'content')],
      source_table: [],
      source_type: 'automatic',
      task_id: ''
    },
    {
      Type: 0,
      alias: '条款',
      colour: '#019688',
      dataType: '',
      data_source: '',
      ds_address: '',
      ds_id: '',
      ds_name: '',
      ds_path: '',
      entity_id: 12,
      extract_type: '',
      file_type: '',
      model: '',
      name: 'clause',
      nodeInfo: {
        otl_name: 'clause',
        property_map: [
          { entity_prop: { Type: 0, value: 'name' }, otl_prop: 'name' },
          { entity_prop: { Type: 0, value: 'content' }, otl_prop: 'content' }
        ],
        entity_type: { Type: 1, value: 'clause' },
        attrSelect: [
          { entity_prop: { Type: 2, value: 'name' }, otl_prop: 'name' },
          { entity_prop: { Type: 2, value: 'content' }, otl_prop: 'content' }
        ]
      },
      properties: [
        ['name', 'string'],
        ['content', 'string']
      ],
      properties_index: (2)[('name', 'content')],
      source_table: [],
      source_type: 'manual',
      task_id: ''
    },
    {
      Type: 0,
      alias: '测试',
      colour: '#019688',
      dataType: '',
      data_source: '',
      ds_address: '',
      ds_id: '',
      ds_name: '',
      ds_path: '',
      entity_id: 12,
      extract_type: '',
      file_type: '',
      model: '',
      name: 'clause',
      nodeInfo: {
        otl_name: 'clause',
        property_map: [
          { entity_prop: { Type: 0, value: 'name' }, otl_prop: 'name' },
          { entity_prop: { Type: 0, value: 'content' }, otl_prop: 'content' }
        ],
        entity_type: { Type: 1, value: 'clause' },
        attrSelect: [
          { entity_prop: { Type: 2, value: 'name' }, otl_prop: 'name' },
          { entity_prop: { Type: 2, value: 'content' }, otl_prop: 'content' }
        ]
      },
      properties: [
        ['name', 'string'],
        ['content', 'string']
      ],
      properties_index: (2)[('name', 'content')],
      source_table: [],
      source_type: 'automatic',
      task_id: ''
    }
  ]
};

const edgesMusterData = {
  edges: [
    {
      Type: 0,
      alias: '123_2_123',
      colour: '#3A4673',
      dataType: '',
      data_source: '',
      ds_address: '',
      ds_id: '',
      ds_name: '',
      ds_path: undefined,
      edgeInfo: {
        otl_name: '123_2_123',
        property_map: [
          { entity_prop: { Type: 0, value: 'name' }, otl_prop: 'name' },
          { entity_prop: { Type: 0, value: 'content' }, otl_prop: 'content' }
        ],
        entity_type: { Type: 1, value: 'clause' },
        attrSelect: [
          { entity_prop: { Type: 2, value: 'name' }, otl_prop: 'name' },
          { entity_prop: { Type: 2, value: 'content' }, otl_prop: 'content' }
        ]
      },
      edge_id: 1,
      extract_type: '',
      file_type: '',
      model: '',
      moreFile: {},
      name: '123_2_123',
      properties: [Array(2)],
      properties_index: ['name'],
      relations: ['123', '123_2_123', '123'],
      source_table: [],
      source_type: 'manual',
      task_id: ''
    },
    {
      Type: 1,
      alias: '123_2_123',
      colour: '#3A4673',
      dataType: '',
      data_source: '',
      ds_address: '',
      ds_id: '',
      ds_name: '',
      ds_path: undefined,
      edgeInfo: {
        otl_name: '123_2_123',
        property_map: [
          { entity_prop: { Type: 0, value: 'name' }, otl_prop: 'name' },
          { entity_prop: { Type: 0, value: 'content' }, otl_prop: 'content' }
        ],
        entity_type: { Type: 1, value: 'clause' },
        attrSelect: [
          { entity_prop: { Type: 2, value: 'name' }, otl_prop: 'name' },
          { entity_prop: { Type: 2, value: 'content' }, otl_prop: 'content' }
        ]
      },
      edge_id: 1,
      extract_type: '',
      file_type: '',
      model: '',
      moreFile: {},
      name: '123_2_123',
      properties: [Array(2)],
      properties_index: ['name'],
      relations: ['123', '123_2_123', '123'],
      source_table: [],
      source_type: 'automatic',
      task_id: ''
    },
    {
      Type: 0,
      alias: '123_2_123',
      colour: '#3A4673',
      dataType: '',
      data_source: '',
      ds_address: '',
      ds_id: '',
      ds_name: '',
      ds_path: undefined,
      edgeInfo: {
        otl_name: '123_2_123',
        property_map: [
          { entity_prop: { Type: 0, value: 'name' }, otl_prop: 'name' },
          { entity_prop: { Type: 0, value: 'content' }, otl_prop: 'content' }
        ],
        entity_type: { Type: 1, value: 'clause' },
        attrSelect: [
          { entity_prop: { Type: 2, value: 'name' }, otl_prop: 'name' },
          { entity_prop: { Type: 2, value: 'content' }, otl_prop: 'content' }
        ]
      },
      edge_id: 1,
      extract_type: '',
      file_type: '',
      model: 'Contractmodel',
      moreFile: {},
      name: '123_2_123',
      properties: [Array(2)],
      properties_index: ['name'],
      relations: ['123', '123_2_123', '123'],
      source_table: [],
      source_type: '',
      task_id: ''
    },
    {
      Type: 0,
      alias: '123_2_123',
      colour: '#3A4673',
      dataType: '',
      data_source: '',
      ds_address: '',
      ds_id: '',
      ds_name: '',
      ds_path: undefined,
      edgeInfo: {
        otl_name: '123_2_123',
        property_map: [
          { entity_prop: { Type: 0, value: 'name' }, otl_prop: 'name' },
          { entity_prop: { Type: 0, value: 'content' }, otl_prop: 'content' }
        ],
        entity_type: { Type: 1, value: 'clause' },
        attrSelect: [
          { entity_prop: { Type: 2, value: 'name' }, otl_prop: 'name' },
          { entity_prop: { Type: 2, value: 'content' }, otl_prop: 'content' }
        ]
      },
      edge_id: 1,
      extract_type: '',
      file_type: '',
      model: 'Generalmodel',
      moreFile: {},
      name: '123_2_123',
      properties: [Array(2)],
      properties_index: ['name'],
      relations: ['123', '123_2_123', '123'],
      source_table: [],
      source_type: 'manual',
      task_id: ''
    },
    {
      Type: 0,
      alias: '123_2_123',
      colour: '#3A4673',
      dataType: '',
      data_source: '',
      ds_address: '',
      ds_id: '',
      ds_name: '',
      ds_path: undefined,
      edgeInfo: {
        otl_name: '123_2_123',
        property_map: [
          { entity_prop: { Type: 0, value: 'name' }, otl_prop: 'name' },
          { entity_prop: { Type: 0, value: 'content' }, otl_prop: 'content' }
        ],
        entity_type: { Type: 1, value: 'clause' },
        attrSelect: [
          { entity_prop: { Type: 2, value: 'name' }, otl_prop: 'name' },
          { entity_prop: { Type: 2, value: 'content' }, otl_prop: 'content' }
        ]
      },
      edge_id: 1,
      extract_type: '',
      file_type: '',
      model: 'Anysharedocumentmodel',
      moreFile: {},
      name: '123_2_123',
      properties: [Array(2)],
      properties_index: ['name'],
      relations: ['123', '123_2_123', '123'],
      source_table: [],
      source_type: 'manual',
      task_id: ''
    },
    {
      Type: 0,
      alias: '123_2_123',
      colour: '#3A4673',
      dataType: '',
      data_source: '',
      ds_address: '',
      ds_id: '',
      ds_name: '',
      ds_path: undefined,
      edgeInfo: {
        otl_name: '123_2_123',
        property_map: [
          { entity_prop: { Type: 0, value: 'name' }, otl_prop: 'name' },
          { entity_prop: { Type: 0, value: 'content' }, otl_prop: 'content' }
        ],
        entity_type: { Type: 1, value: 'clause' },
        attrSelect: [
          { entity_prop: { Type: 2, value: 'name' }, otl_prop: 'name' },
          { entity_prop: { Type: 2, value: 'content' }, otl_prop: 'content' }
        ]
      },
      edge_id: 1,
      extract_type: '',
      file_type: '',
      model: 'AImodel',
      moreFile: {
        begin_class_prop: { value: '', Type: undefined },
        end_class_prop: { value: '', Type: undefined },
        equation: '',
        equation_begin: '',
        equation_end: '',
        relation_begin_pro: { value: '', Type: undefined },
        relation_end_pro: { value: '', Type: 0 }
      },
      name: '123_2_123',
      properties: [Array(2)],
      properties_index: ['name'],
      relations: ['123', '123_2_123', '123'],
      source_table: [],
      source_type: '',
      task_id: ''
    }
  ]
};

export { entityMusterData, edgesMusterData };
