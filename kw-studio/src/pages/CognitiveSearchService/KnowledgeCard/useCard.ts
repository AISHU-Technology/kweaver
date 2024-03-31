import { createContext, useContext } from 'react';
import _ from 'lodash';
import { CardState, UpdateAction, CardContext } from './types';
// import KNOWLEDGE_CARD from './enums';
// const { ENTITY_INFO, RELATED_LABEL, RELATED_DOCUMENT_1, RELATED_DOCUMENT_2, getKeyValueList } = KNOWLEDGE_CARD;
// const KNOWLEDGE_CARD_KEY_VALUE: any = getKeyValueList();

export const initState: CardState = {
  knwId: 0,
  configType: 'card',
  graphSources: [],
  externalModel: [],
  testOptions: {},
  selectedGraph: {},
  savedData: [],
  configs: {
    sort: [],
    node: {},
    activeID: '',
    componentsCache: [], // components的原始备份, 用于判断内容变更
    components: [
      // { id: '1', type: ENTITY_INFO, ...KNOWLEDGE_CARD_KEY_VALUE[ENTITY_INFO] },
      // { id: '2', type: RELATED_LABEL, ...KNOWLEDGE_CARD_KEY_VALUE[RELATED_LABEL] },
      // { id: '3', type: RELATED_DOCUMENT_1, ...KNOWLEDGE_CARD_KEY_VALUE[RELATED_DOCUMENT_1] },
      // { id: '4', type: RELATED_DOCUMENT_2, ...KNOWLEDGE_CARD_KEY_VALUE[RELATED_DOCUMENT_2] }
    ]
  }
};
export const cardReduce = (state: CardState, action: UpdateAction) => {
  const updateData = action.batch
    ? (action.data as Partial<CardState>)
    : action.key
    ? { [action.key]: action.data }
    : {};

  if (typeof action.merge === 'boolean' && !action.merge) {
    return { ...state, ...updateData };
  }

  return _.mergeWith({ ...state }, updateData, (objValue, srcValue) => {
    if (_.isArray(objValue) || JSON.stringify(srcValue) === '{}') {
      return srcValue;
    }
  });
};
const store = createContext({ state: _.cloneDeep(initState), dispatch: (() => {}) as CardContext['dispatch'] });
export const CardProvider = store.Provider;
export const useCard = () => {
  return useContext(store) as CardContext;
};
