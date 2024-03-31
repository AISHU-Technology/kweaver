export const parameters = [
  {
    name: 'id',
    example: 1,
    alias: 'aaa',
    description: '描述1',
    position: [1, 5, 10]
  },
  {
    name: 'name',
    example: 'name1',
    alias: 'bbb',
    description: '描述2',
    position: [2, 5, 10]
  }
];

export const functionInfo = {
  id: 2,
  name: 'function1',
  language: 'nGQL',
  code: 'lookup on v1 yield vertex as v;',
  description: 'description',
  knowledge_network_id: 1,
  parameters: [
    {
      name: 'id',
      example: 'lookup',
      alias: 'aa',
      description: '描述1',
      position: [1, 5, 10]
    },
    {
      name: 'name',
      example: 'vertex',
      description: '描述2',
      alias: 'bb',
      position: [2, 5, 10]
    }
  ],
  create_time: '2023-01-01 11:11:11',
  create_user: 'alex',
  create_email: 'alex@aishu.cn',
  update_time: '2023-01-01 11:11:11',
  update_user: 'alex',
  update_email: 'alex@aishu.cn'
};

export const functionLists = [
  {
    id: '2',
    name: 'function1',
    language: 'nGQL',
    description: 'description',
    knowledge_network_id: 1,
    create_time: '2023-01-01 11:11:11',
    create_user: 'abc',
    create_email: 'abc@aishu.cn',
    update_time: '2023-01-01 11:11:11',
    update_user: 'abc',
    update_email: 'abc@aishu.cn'
  }
];
