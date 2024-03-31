import React, { useState, useEffect, useRef, useContext, useReducer } from 'react';
import { Tabs } from 'antd';
import intl from 'react-intl-universal';
import IconFont from '@/components/IconFont';
import emptyImg from '@/assets/images/flow4Empty.svg';
import error from '@/assets/images/ImportError.svg';
import Sql from '@/pages/KnowledgeNetwork/DataSourceQuery/Content/Sql';
import _, { isEqual } from 'lodash';
import {
  DpapiDataContext,
  CHANGE_EDITOR_VALUE,
  CHANGE_KNDATA,
  CHANGE_EDITING_VALUE,
  SAVE_BTN_DISABLED
} from '../../dpapiData';

import './style.less';
import ParamsBox from './ParamsBox';
import { isSingleStatement, ParamEditorRef, paramPolyfill } from '@/components/ParamCodeEditor';
import { ParamsList } from '@/pages/CognitiveService/AnalysisServiceConfig/types';

export type EditorStatus = {
  changed: boolean;
  edited: boolean;
};
const myTest = false;

const SQLContent = (props: any) => {
  const { selectedData, testData, basicData } = props;
  const { isOpen, isDisabled, editInfo, onChangeDrawer, onChangeState, contentKey, pageAction } = props;
  const [parameters, setParameters] = useState<any>([]); // 参数列表
  const [codeError, setCodeError] = useState<any>(''); // 编辑器错误
  // const selectedData = JSON.parse(mockData);
  const dataError = false;
  const codeRef = useRef<any>();
  // @ts-ignore
  const { data, dispatch } = useContext(DpapiDataContext);
  const { sqlContent, sqlParams } = data.toJS();

  type SearchConfig = {
    statements: string; // 图查询语句
    params: ParamsList; // 参数列表
  };
  const editor = useRef<ParamEditorRef>(null);
  const [editingData, setEditingData] = useState<SearchConfig>({ statements: '', params: [] }); // 配置信息, 任意修改
  const ontoData = {
    edge: [],
    entity: []
  };
  const reducer = (state: EditorStatus, action: Partial<EditorStatus>) => ({ ...state, ...action });
  const isParamsChanged = (data1: any[], data2: any[]) => {
    if (data1.length !== data2.length) return true;
    const keys = ['_id', 'param_type', 'options', 'entity_classes', 'name', 'example', 'alias', 'description'];
    const dataA = _.map(data1, d => _.pick(d, keys));
    const dataB = _.map(data2, d => _.pick(d, keys));
    return !_.isEqual(dataA, dataB);
  };
  const [editorStatus, dispatchEditorStatus] = useReducer(reducer, { changed: false, edited: true });
  const dataCache = useRef({ value: '', params: [] as any[], valueChanged: false, paramsChanged: false });
  const [isEditParams, setIsEditParams] = useState(false);
  useEffect(() => {
    if (_.isEmpty(testData) || testData.action !== 'edit') return;
    // 初始化函数语句
    const info = testData.config_info || {};
    const { statements = '', params = [] } = info;
    const newParams = paramPolyfill(params);
    editor.current?.initMark(statements, newParams, {
      before: (insertData: any) => {
        dataCache.current = {
          value: insertData.value,
          params: _.cloneDeep(newParams),
          valueChanged: false,
          paramsChanged: false
        };
      }
    });
    editor.current?.clearSelection();
    setEditingData({ statements, params: newParams });
    dispatch({ type: CHANGE_EDITING_VALUE, data: { statements, params: newParams } });
  }, [testData]);
  /**
   * 点击应用配置
   */
  const onApply = async () => {
    // 点击运行
  };

  if (myTest) {
    // @ts-ignore
    window.x = () => {
      const editorData = editor.current?.getOriginData() || {};
    };
  }

  const syncDataCurrentState = () => {
    const editorData = editor.current?.getOriginData() || {};
    dispatch({ type: CHANGE_EDITOR_VALUE, data: editorData });
  };

  return (
    <div className="sql-content-wrapper">
      {contentKey === '' && pageAction === 'create' && (
        <div className="content-empty-wapper">
          <img src={dataError ? error : emptyImg} />
          <div>{dataError || intl.get('dpapiService.contentEmpty')}</div>
        </div>
      )}
      {(contentKey !== '' || pageAction !== 'create') && (
        <div className="content-sql-editor">
          <Tabs defaultActiveKey="editor">
            <Tabs.TabPane tab={intl.get('dpapiService.scriptEditing')} key="editor">
              <div style={{ position: 'relative', height: '100%' }}>
                <ParamsBox
                  className="kw-h-100"
                  editor={editor}
                  basicData={basicData}
                  paramsList={editingData.params || []}
                  ontology={ontoData}
                  editorStatus={editorStatus}
                  selectedData={selectedData}
                  onRun={onApply}
                  onValueChange={value => {
                    /*
                    onParamsChange后会触发 valueChange 此时应不阻止就会频繁覆盖影响最终值
                    */
                    if (isEditParams) {
                      setTimeout(() => {
                        setIsEditParams(false);
                      }, 30);
                      return;
                    }
                    setEditingData((pre: any) => {
                      const statements = editor.current?.getOriginData().statement;
                      const x = { ...pre, statements };
                      dispatch({ type: CHANGE_EDITING_VALUE, data: x });
                      dispatch({ type: SAVE_BTN_DISABLED, data: false });
                      return x;
                    });
                    // 函数语句和参数都还原时, 去除警告
                    const changed = !(value === dataCache.current.value && !dataCache.current.paramsChanged);
                    dataCache.current.valueChanged = value === dataCache.current.value;
                    const newStatus = { edited: true, changed };
                    !isEqual(editorStatus, newStatus) && dispatchEditorStatus(newStatus);
                    syncDataCurrentState();
                  }}
                  onParamChange={data => {
                    setIsEditParams(true);
                    setEditingData((pre: any) => {
                      const statements = editor.current?.getOriginData().statement;
                      const x = { ...pre, params: data, statements };
                      dispatch({ type: CHANGE_EDITING_VALUE, data: { ...x, statements } });
                      dispatch({ type: SAVE_BTN_DISABLED, data: false });
                      return x;
                    });
                    const paramsChanged = isParamsChanged(data, dataCache.current.params);
                    const changed = !(!paramsChanged && !dataCache.current.valueChanged);
                    dataCache.current.paramsChanged = paramsChanged;
                    const newStatus = { edited: true, changed };
                    !isEqual(editorStatus, newStatus) && dispatchEditorStatus(newStatus);
                    syncDataCurrentState();
                  }}
                />
              </div>
            </Tabs.TabPane>
            <Tabs.TabPane tab={intl.get('dpapiService.scriptDebugging')} key="debugger">
              <Sql
                selectedData={selectedData}
                fromDbapi={true}
                options={{ placeholder: `${intl.get('dpapiService.runSql')}` }}
              />
            </Tabs.TabPane>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default SQLContent;
