export const mockGraphSources = Array.from({ length: 2 }, (v, i) => ({
  kg_id: i + 1,
  description: i + 1 + 'description',
  kg_name: i + 1 + '图谱'
}));

export const mockOnto = {
  kg_id: 1,
  kg_name: '1图谱',
  entity: [
    {
      alias: '实体1',
      color: '#faad14',
      default_tag: 'name',
      name: 'node1',
      properties: [
        {
          name: 'name',
          alias: 'name',
          type: 'string'
        }
      ]
    },
    {
      alias: '实体2',
      color: '#faad14',
      default_tag: 'name',
      name: 'node2',
      properties: [
        {
          name: 'name',
          alias: 'name',
          type: 'string'
        }
      ]
    }
  ],
  edge: [
    {
      alias: '关系',
      name: '1_2_3',
      color: 'rgba(123,186,160,1)',
      relation: ['node1', '1_2_3', 'node1'],
      properties: [
        {
          name: 'name',
          alias: 'name',
          type: 'string'
        }
      ]
    }
  ]
};

import KNOWLEDGE_CARD from '../enums';
const { ENTITY_INFO, RELATED_LABEL, RELATED_DOCUMENT_1, RELATED_DOCUMENT_2, getKeyValueList } = KNOWLEDGE_CARD;
const KNOWLEDGE_CARD_KEY_VALUE: any = getKeyValueList();

export const mockEntityInfo = {
  ...KNOWLEDGE_CARD_KEY_VALUE[ENTITY_INFO],
  title: 'name',
  properties: [{ name: 'name', alias: 'name', type: 'string' }]
};

export const mockRelatedLabel = {
  ...KNOWLEDGE_CARD_KEY_VALUE[RELATED_LABEL],
  title: {
    'zh-CN': '相关词条',
    'zh-TW': '',
    'en-US': ''
  }
};
export const mockRelatedDoc1 = {
  ...KNOWLEDGE_CARD_KEY_VALUE[RELATED_DOCUMENT_1],
  title: {
    'zh-CN': '相关文档',
    'zh-TW': '',
    'en-US': ''
  }
};

export const mockRelatedDoc2 = {
  ...KNOWLEDGE_CARD_KEY_VALUE[RELATED_DOCUMENT_2],
  title: {
    'zh-CN': '相关文档',
    'zh-TW': '',
    'en-US': ''
  }
};
