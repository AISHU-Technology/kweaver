import { fromJS } from 'immutable';
import { CHANGE_ANY_DATA_LANG } from './actionType';

const changeAnyDataLang = anyDataLang => ({
  type: CHANGE_ANY_DATA_LANG,
  anyDataLang: fromJS(anyDataLang)
});

export { changeAnyDataLang };
