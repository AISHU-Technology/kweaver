import { fromJS } from 'immutable';
import { CHANGE_ANY_DATA_LANG, CHANGE_USERINFO } from './actionType';

const changeAnyDataLang = anyDataLang => ({
  type: CHANGE_ANY_DATA_LANG,
  anyDataLang: fromJS(anyDataLang)
});

// 用户信息
const changeUserInfo = userInfo => ({
  type: CHANGE_USERINFO,
  userInfo: fromJS(userInfo)
});

export { changeAnyDataLang, changeUserInfo };
