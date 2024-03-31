import intl from 'react-intl-universal';
import _ from 'lodash';
import { EntityInfoType, RelatedLabelType, RelatedDocumentType1, RelatedDocumentType2 } from './types';

const ENTITY_INFO = 'entity_info' as const; // 实体信息
const RELATED_LABEL = 'related_label'; // 相关词条
const RELATED_DOCUMENT_1 = 'related_document_1'; // 相关文档1
const RELATED_DOCUMENT_2 = 'related_document_2'; // 相关文档2
const SEARCH_TYPE = {
  entityInfo: 'entity_info',
  neighbors: 'neighbors'
};

// 这里使用了国际化
const LABEL = {
  [ENTITY_INFO]: 'knowledgeCard.baseInfo',
  [RELATED_LABEL]: 'knowledgeCard.labelName',
  [RELATED_DOCUMENT_1]: 'knowledgeCard.iconDocs',
  [RELATED_DOCUMENT_2]: 'knowledgeCard.imgDocs'
};

/** 实体信息默认配置 */
export const ENTITY_INFO_DEFAULT: EntityInfoType = {
  type: ENTITY_INFO,
  search_type: SEARCH_TYPE.entityInfo,
  disabled: true,
  title: '',
  labelColor: 'inherit',
  description: '',
  properties: [{ name: '', alias: '', type: '' }]
};

/** 相关词条默认配置 */
const RELATED_LABEL_DEFAULT: RelatedLabelType = {
  type: RELATED_LABEL,
  search_type: SEARCH_TYPE.neighbors,
  title: {
    'zh-CN': '标题',
    'zh-TW': '',
    'en-US': ''
  },
  entities: [],
  labelColor: 'inherit',
  limit: 10,
  search_config: {
    direction: 'positive',
    steps: 1,
    final_step: false,
    filters: []
  }
};

/** 相关文档默认配置1 */
const RELATED_DOCUMENT_1_DEFAULT: RelatedDocumentType1 = {
  type: RELATED_DOCUMENT_1,
  search_type: SEARCH_TYPE.neighbors,
  title: {
    'zh-CN': '标题',
    'zh-TW': '',
    'en-US': ''
  },
  entity: '',
  endNodeProperty1: '',
  limit: 5,
  search_config: {
    direction: 'positive',
    steps: 1,
    final_step: false,
    filters: []
  }
};

/** 相关文档默认配置2 */
const RELATED_DOCUMENT_2_DEFAULT: RelatedDocumentType2 = {
  type: RELATED_DOCUMENT_2,
  search_type: SEARCH_TYPE.neighbors,
  title: {
    'zh-CN': '标题',
    'zh-TW': '',
    'en-US': ''
  },
  entity: '',
  endNodeProperty1: '',
  endNodeProperty2: '',
  imageUrl: '',
  limit: 5,
  search_config: {
    direction: 'positive',
    steps: 1,
    final_step: false,
    filters: []
  }
};

const KEY_VALUE = {
  [ENTITY_INFO]: ENTITY_INFO_DEFAULT,
  [RELATED_LABEL]: RELATED_LABEL_DEFAULT,
  [RELATED_DOCUMENT_1]: RELATED_DOCUMENT_1_DEFAULT,
  [RELATED_DOCUMENT_2]: RELATED_DOCUMENT_2_DEFAULT
} as const;

const getLabel = () => _.cloneDeep(LABEL);
const getKeyValueList = () => _.cloneDeep(KEY_VALUE);
const getDefaultConfig = (type: 'card' | 'recommend' | string, configs?: any) => {
  if (type === 'recommend') {
    const relatedLabel = { ...RELATED_LABEL_DEFAULT, ...(configs || {}) };
    return {
      activeID: '',
      sort: ['default0'],
      componentsCache: [{ id: 'default0', ...relatedLabel }],
      components: _.cloneDeep([{ id: 'default0', ...relatedLabel }])
    };
  }
  const entityInfo = { ...ENTITY_INFO_DEFAULT, ...(configs || {}) };
  return {
    activeID: '',
    sort: ['default0'],
    componentsCache: [{ id: 'default0', ...entityInfo }],
    components: _.cloneDeep([{ id: 'default0', ...entityInfo }])
  };
};

/**
 * 空白引导
 */
const getEmptyTip = (type: 'card' | 'recommend' | string) => {
  return type === 'card'
    ? [
        intl.get('knowledgeCard.cardEmpty1'),
        intl.get('knowledgeCard.cardEmpty2'),
        intl.get('knowledgeCard.cardEmpty3'),
        intl.get('knowledgeCard.cardEmpty4')
      ]
    : [
        intl.get('knowledgeCard.cardEmpty1'),
        intl.get('knowledgeCard.recommendEmpty2'),
        intl.get('knowledgeCard.recommendEmpty3'),
        intl.get('knowledgeCard.cardEmpty4')
      ];
};

const KNOWLEDGE_CARD = {
  ENTITY_INFO,
  RELATED_LABEL,
  RELATED_DOCUMENT_1,
  RELATED_DOCUMENT_2,

  getLabel,
  getKeyValueList,
  getDefaultConfig,
  getEmptyTip
};

export default KNOWLEDGE_CARD;
