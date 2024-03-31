import { fromJS } from 'immutable';

import { UPLOAD_CHANGE_VISIBLE, UPLOAD_CHANGE_FILE, UPLOAD_CHANGE_STATUS } from '@/reduxConfig/actionType';
import { ActionType } from './types';

export const PENDING = 'pending';
export const UPLOADING = 'uploading';
export const SUCCESS = 'success';
export const FAIL = 'fail';

const INIT_DATA = fromJS({
  visible: false,
  modelData: {},
  status: PENDING
});

const ACTION_TYPE_TO_PROCESSOR: any = {};
ACTION_TYPE_TO_PROCESSOR[UPLOAD_CHANGE_FILE] = (state: typeof INIT_DATA & { set: Function }, payload: any) => {
  const modelData = payload.get('modelData');
  return state.set('visible', fromJS(true)).set('modelData', fromJS(modelData));
};
ACTION_TYPE_TO_PROCESSOR[UPLOAD_CHANGE_STATUS] = (state: typeof INIT_DATA & { set: Function }, payload: any) => {
  const status = payload.get('status');
  return state.set('status', fromJS(status));
};
ACTION_TYPE_TO_PROCESSOR[UPLOAD_CHANGE_VISIBLE] = (state: typeof INIT_DATA & { set: Function }, payload: any) => {
  const visible = payload.get('visible');
  return state.set('visible', fromJS(visible));
};

export default (state: object = INIT_DATA, action: ActionType) => {
  const { type, payload } = action;
  const proc: any = ACTION_TYPE_TO_PROCESSOR[type as keyof typeof ACTION_TYPE_TO_PROCESSOR];
  if (proc) {
    return proc(state, payload);
  }
  return state;
};
