import { fromJS } from 'immutable';
import { CHANGE_ANY_DATA_LANG } from './actionType';

const changekwLang = kwLang => {
  return {
    type: CHANGE_ANY_DATA_LANG,
    kwLang: fromJS(kwLang)
  };
};

export { changekwLang };
