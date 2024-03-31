import { KNOWLEDGE_GRAPH_CHANGE_STATUS } from '@/reduxConfig/actionType';
import { fromJS } from 'immutable';
import * as actionTypes from '../actionType';

const ad_onChangeGraphStatus = (payload: object) => ({
  type: KNOWLEDGE_GRAPH_CHANGE_STATUS,
  payload
});

export const changeReset = (data: any) => ({
  type: actionTypes.GRAPH_QA,
  data: fromJS(data)
});

export { ad_onChangeGraphStatus };
