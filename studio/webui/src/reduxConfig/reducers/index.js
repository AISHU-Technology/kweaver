import { combineReducers } from 'redux-immutable';

import changeAnyDataLang from './changeAnyDataLang';

import knowledgeGraph from './knowledgeGraph';

export default combineReducers({
  changeAnyDataLang,

  knowledgeGraph
});
