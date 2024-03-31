import * as actionTypes from '../actionType';
import { fromJS } from 'immutable';

const defaultState = fromJS({
  isReset: false
});

export default (state = defaultState, action: any) => {
  switch (action.type) {
    case actionTypes.GRAPH_QA:
      return state.set('isReset', action.data);
    default:
      return state;
  }
};
