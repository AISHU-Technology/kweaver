import { fromJS } from 'immutable';
import { UPLOAD_CHANGE_VISIBLE, UPLOAD_CHANGE_FILE, UPLOAD_CHANGE_STATUS } from '@/reduxConfig/actionType';

const onChangeUploadVisible = (payload: { visible: boolean }) => {
  return { type: UPLOAD_CHANGE_VISIBLE, payload: fromJS(payload) };
};

const onChangeModelData = (payload: { file: Blob; [key: string]: any }) => {
  return { type: UPLOAD_CHANGE_FILE, payload: fromJS(payload) };
};

const onChangeUploadStatus = (payload: { status: string }) => {
  return { type: UPLOAD_CHANGE_STATUS, payload: fromJS(payload) };
};

export { onChangeUploadVisible, onChangeModelData, onChangeUploadStatus };
