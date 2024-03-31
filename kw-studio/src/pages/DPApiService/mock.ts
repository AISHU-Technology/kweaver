export const apiData = {
  code: 200,
  message: '操作成功',
  data: {
    id: '1x2bfs',
    name: '测试API',
    parameters: [
      {
        alias: 'test',
        description: '',
        name: 'test',
        param_type: 'string',
        position: [
          {
            example: 'eid',
            pos: [5, 16, 19]
          }
        ]
      }
    ],
    sqlText: [
      {
        label: '1',
        value: 'select water_3m as water3m,\n        water_om as water6m'
      },
      {
        label: '2',
        value: 'test2test2test2test2test2test2'
      }
    ],
    note: '描述信息',
    path: '/api/test/v1',
    datasourceId: 'tsafdfds',
    status: '已发布'
  }
};

export const knData = {
  color: '#126EE3',
  creation_time: '2023-09-08 14:33:59',
  creator_id: 'f4f8643e-4b0c-11ee-aacd-7efece726009',
  creator_name: 'conftest_KnowledgeUser_token_dispaly',
  final_operator: '984aea9e-4d1f-11ee-a634-7efece726009',
  group_column: 1,
  id: 17,
  identify_id: 'b15381c0-4e11-11ee-9723-ea7b9fb59278',
  intelligence_score: '-1.00',
  knw_description: '',
  knw_name: 'knw_nebula_OpenAPI_1694154840',
  operator_name: 'test',
  to_be_uploaded: 0,
  update_time: '2023-09-15 10:44:40',
  __codes: [
    'KN_ADD_DS',
    'KN_ADD_FUNCTION',
    'KN_ADD_KG',
    'KN_ADD_LEXICON',
    'KN_ADD_MODEL',
    'KN_ADD_OTL',
    'KN_ADD_SERVICE',
    'KN_DELETE',
    'KN_EDIT',
    'KN_EDIT_PERMISSION',
    'KN_VIEW'
  ],
  __isCreator: 0
};
