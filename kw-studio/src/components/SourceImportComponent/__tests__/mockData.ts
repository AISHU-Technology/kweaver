import { DS_TYPE, DS_SOURCE, EXTRACT_MODELS, EXTRACT_TYPE } from '@/enums';

// 模型
export const mockModels = {
  AImodel: '科技新闻模型',
  Anysharedocumentmodel: '文档知识模型'
};

// 数据源
export const mockDs = Array.from({ length: 3 }, (_, index) => {
  const id = index + 1;
  return {
    id,
    dataType: index === 2 ? DS_TYPE.UNSTRUCTURED : DS_TYPE.STRUCTURED,
    data_source: Object.values(DS_SOURCE)[index],
    ds_path: `数据源根路径${id}`,
    dsname: `数据源名称${id}`,
    extract_type: index === 2 ? EXTRACT_TYPE.STANDARD : EXTRACT_TYPE.MODEL,
    extract_model: index === 2 ? EXTRACT_MODELS.asDoc : undefined,
    queue: 'queue',
    host: '',
    json_schema: ''
  };
});

// 抽取列表
export const mockSources = Array.from({ length: 3 }, (_, index) => {
  const id: number = index + 1;
  return {
    selfId: `extract${id}`,
    ds_name: `数据源名${id}`,
    ds_id: id,
    data_source: Object.values(DS_SOURCE)[index],
    ds_path: `数据源根路径${id}`,
    file_source: `文件标识${id}`,
    file_name: `文件名称${id}`,
    file_path: `文件路径${id}`,
    file_type: index === 2 ? 'dir' : '',
    extract_type: index === 2 ? EXTRACT_TYPE.STANDARD : EXTRACT_TYPE.MODEL,
    extract_model: index === 2 ? EXTRACT_MODELS.asDoc : undefined,
    extract_rules: [
      {
        is_model: index === 2 ? 'from_model' : 'not_model',
        entity_type: 'test',
        property: {
          property_field: 'name',
          column_name: 'name',
          property_func: 'All'
        }
      }
    ]
  };
});

// 预览表格
export const mockTable = Array.from({ length: 3 }, (_, index) => {
  return {
    key: `key${index}`,
    name: `name${index}`,
    columns: [`col${index}`]
  };
});

// 合同模型示例
export const mockModelGraph = {
  entity_list: [
    ['contract', '合同'],
    ['company', '公司或人'],
    ['clause', '条款']
  ],
  entity_main_table_dict: [
    { entity: 'contract', main_table: [] },
    { entity: 'company', main_table: [] },
    { entity: 'clause', main_table: [] }
  ],
  entity_property_dict: [
    {
      entity: 'contract',
      property: [
        ['name', 'string'],
        ['id', 'string']
      ],
      property_index: ['name']
    },
    { entity: 'company', property: [['name', 'string']], property_index: ['name'] },
    {
      entity: 'clause',
      property: [
        ['name', 'string'],
        ['content', 'string']
      ],
      property_index: ['name', 'content']
    }
  ],
  entity_relation_set: [
    [
      ['contract', '合同'],
      ['contain', '包含'],
      ['clause', '条款']
    ],
    [
      ['contract', '合同'],
      ['ownerSubject', '我方主体'],
      ['company', '公司或人']
    ],
    [
      ['contract', '合同'],
      ['otherSubject', '对方主体'],
      ['company', '公司或人']
    ]
  ],
  extract_type: 'modelExtraction',
  model: 'Contractmodel',
  relation_main_table_dict: [],
  relation_property_dict: [
    { edge: 'contain', property: [['name', 'string']], property_index: ['name'] },
    { edge: 'ownerSubject', property: [['name', 'string']], property_index: ['name'] },
    { edge: 'otherSubject', property: [['name', 'string']], property_index: ['name'] }
  ]
};
