import { fromJS } from 'immutable';

import { CHANGE_USERINFO } from '@/reduxConfig/actionType';

import { localStore } from '@/utils/handleFunction';

const initialState = fromJS({
  userInfo: localStore.get('userInfo') || {}
});
// 用户信息
const changeUserInfo = (state = initialState, action) => {
  switch (action.type) {
    case CHANGE_USERINFO:
      return state.set('userInfo', fromJS(action.userInfo));
    default:
      return state;
  }
};

export default changeUserInfo;
