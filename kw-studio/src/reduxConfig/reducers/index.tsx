import { combineReducers } from 'redux-immutable';

import changekwLang from './changekwLang';

import knowledgeGraph from './knowledgeGraph';

import sqlQueryHistory from './sqlQueryHistory';

import uploadFile from './uploadFile';

import graphQA from './graphQA';

export default combineReducers({
  changekwLang,
  knowledgeGraph,
  sqlQueryHistory,
  graphQA,
  uploadFile
});
