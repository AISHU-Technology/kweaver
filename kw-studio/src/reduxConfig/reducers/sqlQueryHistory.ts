import { fromJS } from 'immutable';

import { SQL_SEARCH_HISTORY } from '@/reduxConfig/actionType';

import { ActionType } from './types';

const INIT_DATA = fromJS({
  sqlHistory: {}
});

const ACTION_TYPE_TO_PROCESSOR = {};
(ACTION_TYPE_TO_PROCESSOR as any)[SQL_SEARCH_HISTORY] = (
  state: typeof INIT_DATA & { set: Function },
  payload: { sqlHistory: object }
) => {
  const { sqlHistory } = payload;
  return state.set('sqlHistory', fromJS(sqlHistory));
};

export default (state: object = INIT_DATA, action: ActionType) => {
  const { type, payload } = action;
  const proc: any = ACTION_TYPE_TO_PROCESSOR[type as keyof typeof ACTION_TYPE_TO_PROCESSOR];
  if (proc) {
    return proc(state, payload);
  }
  return state;
};
