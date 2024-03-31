// 包含n个reducer函数的模块
import { fromJS } from 'immutable';

import { CHANGE_ANY_DATA_LANG } from '@/reduxConfig/actionType';

const initialState = fromJS({
  kwLang: ''
});

const changekwLang = (state = initialState, action) => {
  switch (action.type) {
    case CHANGE_ANY_DATA_LANG:
      return state.set('kwLang', fromJS(action.kwLang));
    default:
      return state;
  }
};

export default changekwLang;
