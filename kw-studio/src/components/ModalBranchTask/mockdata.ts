const mockData = {
  res: {
    id: 1,
    name: '1',
    entity_num: 3,
    entity: [
      {
        entity_id: 1,
        colour: '#8BC34A',
        ds_name: '',
        dataType: '',
        data_source: '',
        ds_path: '',
        ds_id: '',
        extract_type: '',
        name: 'contract',
        source_table: [],
        source_type: 'automatic',
        properties: [
          ['name', 'string'],
          ['id', 'string'],
          ['number', 'string'],
          ['currency', 'string'],
          ['amount', 'string'],
          ['sign_date', 'string'],
          ['account_name', 'string'],
          ['bank', 'string'],
          ['bank_number', 'string'],
          ['tax_rate', 'string'],
          ['tax_amount', 'string'],
          ['amount_without_tax', 'string']
        ],
        file_type: '',
        task_id: '',
        properties_index: ['name', 'number', 'amount', 'sign_date', 'account_name', 'bank'],
        model: 'Contractmodel',
        ds_address: '',
        alias: '合同'
      },
      {
        entity_id: 2,
        colour: '#ED679F',
        ds_name: '',
        dataType: '',
        data_source: '',
        ds_path: '',
        ds_id: '',
        extract_type: '',
        name: 'company',
        source_table: [],
        source_type: 'automatic',
        properties: [['name', 'string']],
        file_type: '',
        task_id: '',
        properties_index: ['name'],
        model: 'Contractmodel',
        ds_address: '',
        alias: '公司或人'
      },
      {
        entity_id: 3,
        colour: '#E91F64',
        ds_name: '',
        dataType: '',
        data_source: '',
        ds_path: '',
        ds_id: '',
        extract_type: '',
        name: 'clause',
        source_table: [],
        source_type: 'automatic',
        properties: [
          ['name', 'string'],
          ['content', 'string']
        ],
        file_type: '',
        task_id: '',
        properties_index: ['name', 'content'],
        model: 'Contractmodel',
        ds_address: '',
        alias: '条款'
      }
    ],
    edge_num: 3,
    edge: [
      {
        edge_id: 1,
        colour: '#607D8B',
        ds_name: '',
        dataType: '',
        data_source: '',
        ds_path: '',
        ds_id: '',
        extract_type: '',
        name: 'contain',
        source_table: [],
        source_type: 'automatic',
        properties: [['name', 'string']],
        file_type: '',
        task_id: '',
        properties_index: ['name'],
        model: 'Contractmodel',
        relations: ['contract', 'contain', 'clause'],
        ds_address: '',
        alias: '包含'
      },
      {
        edge_id: 2,
        colour: '#9E9E9E',
        ds_name: '',
        dataType: '',
        data_source: '',
        ds_path: '',
        ds_id: '',
        extract_type: '',
        name: 'ownerSubject',
        source_table: [],
        source_type: 'automatic',
        properties: [['name', 'string']],
        file_type: '',
        task_id: '',
        properties_index: ['name'],
        model: 'Contractmodel',
        relations: ['contract', 'ownerSubject', 'company'],
        ds_address: '',
        alias: '我方主体'
      },
      {
        edge_id: 3,
        colour: '#0288D1',
        ds_name: '',
        dataType: '',
        data_source: '',
        ds_path: '',
        ds_id: '',
        extract_type: '',
        name: 'otherSubject',
        source_table: [],
        source_type: 'automatic',
        properties: [['name', 'string']],
        file_type: '',
        task_id: '',
        properties_index: ['name'],
        model: 'Contractmodel',
        relations: ['contract', 'otherSubject', 'company'],
        ds_address: '',
        alias: '对方主体'
      }
    ]
  }
};

const listData = {
  res: [
    { id: 1, name: '研发设计资料研发设计研发设计资料研发设计', entity_num: 3, edge_num: 1 },
    { id: 2, name: '人物及关系', entity_num: 3, edge_num: 1 },
    { id: 3, name: '哈哈哈', entity_num: 3, edge_num: 1 },
    { id: 4, name: '随意分组', entity_num: 3, edge_num: 1 },
    { id: 5, name: '研发设计资料研发设计研发设计资料研发设计', entity_num: 3, edge_num: 1 }
  ]
};
export { mockData, listData };
