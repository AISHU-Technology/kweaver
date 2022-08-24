import { combineReducers } from 'redux-immutable';

import changeUserInfo from './changeUserInfo';
import changeAnyDataLang from './changeAnyDataLang';

import knowledgeGraph from './knowledgeGraph';

export default combineReducers({
  changeUserInfo,
  changeAnyDataLang,

  knowledgeGraph
});
