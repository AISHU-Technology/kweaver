/**
 * UT需要用到的mock数据
 */

// 流程二数据源
const mockStep2Data = [
  {
    id: 1,
    dsname: '数据源1',
    dataType: 'unstructured',
    data_source: 'as7',
    ds_path: 'test/csv',
    extract_type: 'modelExtraction'
  },
  {
    id: 2,
    dsname: '数据源2',
    dataType: 'structured',
    data_source: 'mysql',
    ds_path: 'anydata',
    extract_type: 'standardExtraction'
  },
  {
    id: 3,
    dsname: '数据源3',
    dataType: 'structured',
    data_source: 'as7',
    ds_path: 'test/csv',
    extract_type: 'standardExtraction'
  }
];

// 流程三本体数据
const mockStep3Data = [
  {
    entity: [
      {
        name: 'mysql',
        ds_id: 2,
        data_source: 'mysql',
        ds_path: 'anydata',
        dataType: 'structured',
        file_type: '',
        extract_type: 'standardExtraction',
        source_type: 'automatic',
        source_table: ['mysql'],
        properties: [['name', 'string']]
      },
      {
        name: 'as文件',
        ds_id: 3,
        data_source: 'as7',
        dataType: 'structured',
        file_type: 'json',
        extract_type: 'standardExtraction',
        source_type: 'automatic',
        source_table: [['gns', 'file.json', 'path/file.json']],
        properties: [['name', 'string']]
      }
    ],
    edge: []
  }
];

// 流程四数据
const mockStep4Data = [
  {
    ds_name: '数据源1',
    ds_id: 1,
    data_source: 'as7',
    ds_path: 'test',
    file_source: 'gns',
    file_name: 'test',
    file_path: 'test/csv',
    file_type: 'dir',
    extract_type: 'modelExtraction',
    extract_model: 'AImodel',
    extract_rules: [
      {
        is_model: 'from_model',
        entity_type: 'person',
        property: {
          property_field: 'name',
          property_func: 'All'
        }
      }
    ]
  }
];

// 模型
const mockModels = {
  AImodel: '科技新闻模型',
  Anysharedocumentmodel: '文档知识模型',
  Contractmodel: '合同模型',
  Generalmodel: '百科知识模型',
  OperationMaintenanceModel: '软件文档知识模型'
};

// 文件夹预览
const mockDirPre = {
  count: 2,
  output: [
    { docid: 'gns1', name: '文件夹', type: 'dir' },
    { docid: 'gns2', name: '文件', type: 'file' }
  ]
};

// 文件预览或数据表预览
const mockFilePre = {
  viewtype: 'json',
  data: '纯文本'
};

// 数据表预览
const mockSheet = [['id'], ['1']];

// 模型预览
const mockModelPro = [
  ['Subject', 'Predicate', 'Object'],
  [
    { alias: '人', original_name: 'person' },
    { alias: '工作单位', original_name: 'work_on' },
    { alias: '公司', original_name: 'enterprise' }
  ]
];

// 数据表
const mockSheetList = { count: 2, output: ['sheet1', 'sheet2'] };

export {
  mockStep2Data,
  mockStep3Data,
  mockStep4Data,
  mockModels,
  mockDirPre,
  mockFilePre,
  mockSheet,
  mockModelPro,
  mockSheetList
};
