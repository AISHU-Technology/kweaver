import _ from 'lodash';

// 分词模板
const custom_template = ['樱桃', '车厘子', '菠萝', '凤梨', '黄梨', '西安', '长安', '镐京'];
export const SYNONYM_CUSTOM = _.map(custom_template, (item: any, index: any) => {
  return { words: item, id: index };
});

// 实体链接模板
export const SYNONYM_ENTITY_LINK = [
  {
    words: '樱桃',
    vid: '1f645c4c30c409ad39b803852af93eea',
    ent_name: 'fruit',
    graph_id: 1,
    id: 1
  },
  {
    words: '车厘子',
    vid: '1f645c4c30c409ad39b803852af93eea',
    ent_name: 'fruit',
    graph_id: 1,
    id: 2
  },
  {
    words: '菠萝',
    vid: '42f3ceb077df7d238b5ce274dc50c776',
    ent_name: 'fruit',
    graph_id: 1,
    id: 3
  },
  {
    words: '凤梨',
    vid: '42f3ceb077df7d238b5ce274dc50c776',
    ent_name: 'fruit',
    graph_id: 1,
    id: 4
  },
  {
    words: '黄梨',
    vid: '42f3ceb077df7d238b5ce274dc50c776',
    ent_name: 'fruit',
    graph_id: 1,
    id: 5
  },
  {
    words: '西安',
    vid: '9c108c3f332e479f82d4f7e2617b9471',
    ent_name: 'city',
    graph_id: 2,
    id: 6
  },
  {
    words: '长安',
    vid: '9c108c3f332e479f82d4f7e2617b9471',
    ent_name: 'city',
    graph_id: 2,
    id: 7
  },
  {
    words: '镐京',
    vid: '9c108c3f332e479f82d4f7e2617b9471',
    ent_name: 'city',
    graph_id: 2,
    id: 8
  }
];

// 近义词模板
export const SYNONYM_STD = [
  {
    synonym: '樱桃',
    std_name: '樱桃',
    std_property: 'name',
    ent_name: 'fruit',
    graph_id: 1,
    id: 1
  },
  {
    synonym: '车厘子',
    std_name: '樱桃',
    std_property: 'name',
    ent_name: 'fruit',
    graph_id: 1,
    id: 2
  },
  {
    synonym: '菠萝',
    std_name: '菠萝',
    std_property: 'name',
    ent_name: 'fruit',
    graph_id: 1,
    id: 3
  },
  {
    synonym: '凤梨',
    std_name: '菠萝',
    std_property: 'name',
    ent_name: 'fruit',
    graph_id: 1,
    id: 4
  },
  {
    synonym: '黄梨',
    std_name: '菠萝',
    std_property: 'name',
    ent_name: 'fruit',
    graph_id: 1,
    id: 5
  },
  {
    synonym: '西安',
    std_name: '西安',
    std_property: 'name',
    ent_name: 'city',
    graph_id: 2,
    id: 6
  },
  {
    synonym: '长安',
    std_name: '西安',
    std_property: 'name',
    ent_name: 'city',
    graph_id: 2,
    id: 7
  },
  {
    synonym: '镐京',
    std_name: '西安',
    std_property: 'name',
    ent_name: 'city',
    graph_id: 2,
    id: 8
  }
];

export const columnsData = (value: any) => {
  if (!value) return [];
  return Object.keys(value?.[0]);
};
