// 包含n个reducer函数的模块
import { fromJS } from 'immutable';

import { CHANGE_ANY_DATA_LANG } from '@/reduxConfig/actionType';

const initialState = fromJS({
  anyDataLang: ''
});

const changeAnyDataLang = (state = initialState, action) => {
  switch (action.type) {
    case CHANGE_ANY_DATA_LANG:
      return state.set('anyDataLang', fromJS(action.anyDataLang));
    default:
      return state;
  }
};

export default changeAnyDataLang;
