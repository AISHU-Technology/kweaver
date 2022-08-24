import { fromJS } from 'immutable';

import { KNOWLEDGE_GRAPH_CHANGE_STATUS } from '@/reduxConfig/actionType';
import { ActionType } from './types';

const INIT_DATA = fromJS({
  ad_graphStatus: ''
});

const ACTION_TYPE_TO_PROCESSOR = {};
(ACTION_TYPE_TO_PROCESSOR as any)[KNOWLEDGE_GRAPH_CHANGE_STATUS] = (
  state: typeof INIT_DATA & { set: Function },
  payload: { ad_graphStatus: string }
) => {
  const { ad_graphStatus } = payload;
  return state.set('ad_graphStatus', fromJS(ad_graphStatus));
};

export default (state: object = INIT_DATA, action: ActionType) => {
  const { type, payload } = action;
  const proc: any = ACTION_TYPE_TO_PROCESSOR[type as keyof typeof ACTION_TYPE_TO_PROCESSOR];
  if (proc) {
    return proc(state, payload);
  }
  return state;
};
