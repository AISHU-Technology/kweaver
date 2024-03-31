import React, { createContext, useReducer } from 'react';
import { fromJS } from 'immutable';
import { apiData, knData } from './mock';

// context
export const DpapiDataContext = createContext({});

// 相当于之前的 constants
export const CHANGE_SQLCONTENT = 'dbapi/CHANGE_SQLCONTENT';
export const CHANGE_SQLPARAMS = 'dbapi/CHANGE_SQLPARAMS';
export const CHANGE_RELATEPARAMS = 'dbapi/CHANGE_RELATEPARAMS';
export const CHANGE_DATASOURCEID = 'dbapi/CHANGE_DATASOURCEID';
export const CHANGE_BASICDATA = 'dbapi/CHANGE_BASICDATA';
export const CHANGE_KNDATA = 'dbapi/CHANGE_KNDATA';
export const CHANGE_SQLMODIFY = 'dbapi/CHANGE_SQLMODIFY';

// 重写后的
export const CHANGE_EDITOR_VALUE = 'dbapi/CHANGE_EDITOR_VALUE';
export const CHANGE_EDITING_VALUE = 'dbapi/CHANGE_EDITING_VALUE';

export const CHANGE_KN_USER_LIST_VALUE = 'dbapi/CHANGE_KN_USER_LIST_VALUE';
export const CHANGE_SELECTED_KN_USER_ID_VALUE = 'dbapi/CHANGE_SELECTED_KN_USER_ID_VALUE';
export const CHANGE_SELECTED_KN_USER_INFO_VALUE = 'dbapi/CHANGE_SELECTED_KN_USER_INFO_VALUE';

export const SAVE_BTN_DISABLED = 'SAVE_BTN_DISABLED'; // 发布页面是否点过保存
// reducer 纯函数
const reducer = (state: any, action: any) => {
  switch (action.type) {
    case CHANGE_SQLCONTENT:
      return state.set('sqlContent', action.data);
    case CHANGE_SQLMODIFY:
      return state.set('sqlModify', action.data);
    case CHANGE_SQLPARAMS:
      return state.set('sqlParams', action.data);
    case CHANGE_DATASOURCEID:
      return state.set('datasourceInfo', action.data);
    case CHANGE_BASICDATA:
      return state.set('basicData', action.data);
    case CHANGE_KNDATA:
      return state.set('knData', action.data);
    case CHANGE_RELATEPARAMS:
      return state.set('relateParam', action.data);
    case CHANGE_EDITOR_VALUE:
      return state.set('editorData', action.data);
    case CHANGE_EDITING_VALUE:
      return state.set('editingData', action.data);
    case CHANGE_KN_USER_LIST_VALUE:
      return state.set('knUserList', action.data);
    case CHANGE_SELECTED_KN_USER_ID_VALUE:
      return state.set('selectedKnUserId', action.data);
    case CHANGE_SELECTED_KN_USER_INFO_VALUE:
      return state.set('selectedKnUserInfo', action.data);
    case SAVE_BTN_DISABLED:
      return state.set('hasSaved', action.data);
    default:
      return state;
  }
};

// Provider 组件
export const DataWrapper = (props: any) => {
  // useReducer 的第二个参数中传入初始值
  const [data, dispatch] = useReducer(
    reducer,
    fromJS({
      sqlContent: [],
      sqlParams: [],
      basicData: {},
      datasourceInfo: [],
      knData,
      sqlModify: [],
      relateParam: [],
      editorData: {},
      knUserList: [],
      selectedKnUserId: null,
      selectedKnUserInfo: null,
      hasSaved: false
    })
  );
  return <DpapiDataContext.Provider value={{ data, dispatch }}>{props.children}</DpapiDataContext.Provider>;
};
