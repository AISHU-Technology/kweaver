import React, { useState, useEffect, useRef, useMemo, useReducer } from 'react';
import { Button, message } from 'antd';
import intl from 'react-intl-universal';
import _, { isEqual } from 'lodash';
import analysisService from '@/services/analysisService';
import serviceGraphDetail from '@/services/graphDetail';

import HOOKS from '@/hooks';
import { GRAPH_LAYOUT } from '@/enums';
import { triggerEvent, getParam } from '@/utils/handleFunction';
import DragLine from '@/components/DragLine';
import TipModal, { tipModalFunc } from '@/components/TipModal';
import { ParamEditorRef, paramPolyfill, isSingleStatement } from '@/components/ParamCodeEditor';

import Canvas from '@/pages/CognitiveService/AnalysisServiceConfig/ConfigAndTest/Canvas';
import ParamsBox from '@/pages/CognitiveService/AnalysisServiceConfig/ConfigAndTest/GraphQuery/ParamsBox';
import {
  generateCanvasData,
  updatePosition,
  formatStatements
} from '@/pages/CognitiveService/AnalysisServiceConfig/ConfigAndTest/assistant';

import CustomSearchTool from '@/pages/KnowledgeNetwork/ExploreGraph/LeftSpace/CustomSearchTool';
import { getInitResState } from '@/pages/KnowledgeNetwork/ExploreGraph/LeftSpace/components/ResultPanel';
import { parseStatementResult } from '@/pages/KnowledgeNetwork/ExploreGraph/LeftSpace/components/ResultPanel/parse';
import { graphPolyfill } from '@/pages/KnowledgeNetwork/ExploreGraph/polyfill';
import { ERROR } from '@/pages/CognitiveService/AnalysisServiceConfig/ConfigAndTest/enum';

import './style.less';
import { DEFAULT_CONFIG, iframeConfig, DEFAULT_CANVAS } from './enums';
import IconFont from '@/components/IconFont';
import Format from '@/components/Format';

type SearchConfig = {
  statements: string; // 图查询语句
  params: any[]; // 参数列表
};

export type EditorStatus = {
  changed: boolean;
  edited: boolean;
};
const reducer = (state: EditorStatus, action: Partial<EditorStatus>) => ({ ...state, ...action });
const isParamsChanged = (data1: any[], data2: any[]) => {
  if (data1.length !== data2.length) return true;
  const keys = ['_id', 'param_type', 'options', 'entity_classes', 'name', 'example', 'alias', 'description'];
  const dataA = _.map(data1, d => _.pick(d, keys));
  const dataB = _.map(data2, d => _.pick(d, keys));
  return !_.isEqual(dataA, dataB);
};

const objectCache: any = {};

const ConfigGraphQuery = (props: any) => {
  const { graphData, currentIntention, onSaveGraph, onCancel } = props;
  const editor = useRef<ParamEditorRef>(null);
  const canvasRef = useRef<Record<string, any>>({ ..._.cloneDeep(DEFAULT_CANVAS), configReady: true }); // 图数据
  const forceUpdate = HOOKS.useForceUpdate();
  const [height, setHeight] = useState(() => (window.innerHeight - 160) * 0.618); // 上方面板高度
  const setHeightThrottle = _.throttle(w => {
    setHeight(w);
    triggerEvent('resize'); // 更改编辑区域高度时触发resize事件重置画布宽高
  }, 100);
  const [searchToolVisible, setSearchToolVisible] = useState(true); // 搜索工具栏是否展开
  const [editingData, setEditingData] = useState<SearchConfig>({ statements: '', params: [] }); // 配置信息, 任意修改
  const [applyData, setApplyData] = useState<SearchConfig>({ statements: '', params: [] }); // 应用到画布的数据, 点击配置后固化
  const [results, setResults] = useState(() => getInitResState()); // 搜索结果面板数据
  const [ontoData, setClassData] = useState<any>({}); // 图谱本体信息
  // engine、builder字段转换
  const searParam = useMemo(() => {
    return { code: applyData.statements, parameters: applyData.params };
  }, [applyData]);
  // changed用于标记报错, edited用于标记活动状态, 它们除了初始化不同, 其他时候一同变更
  const [editorStatus, dispatchEditorStatus] = useReducer(reducer, { changed: false, edited: true });
  const dataCache = useRef({ value: '', params: [] as any[], valueChanged: false, paramsChanged: false });
  const [applyVisible, setApplyVisible] = useState(false); // 运行配置警告弹窗

  // testData
  const [testData, setTestData] = useState<any>({}); // 测试数据
  const [basicData, setBasicData] = useState<any>({}); // 基本信息

  useEffect(() => {
    // if (!graphData?.service_id) return;
    init(graphData?.service_id);
  }, [graphData]);

  useEffect(() => {
    if (currentIntention?.graph_info?.statements) {
      const { graph_info, canvas_body } = currentIntention || {};
      const params = _.map(graph_info?.params, item => {
        return item?.options === null ? _.omit(item, 'options') : item;
      });
      const { knw_name, knw_id } = getParam(['knw_name', 'knw_id']);
      setBasicData({
        ...DEFAULT_CONFIG,
        knw_id: parseInt(knw_id),
        knw_name: knw_name || '',
        id: 0,
        kg_id: currentIntention?.kg_id || 0,
        action: 'init'
      });
      setTestData({ ...DEFAULT_CONFIG, config_info: { ...graph_info, params }, canvas_body, action: 'init' } as any);
    }
  }, [currentIntention?.graph_info?.statements]);

  // 给画布添加图谱id信息
  useEffect(() => {
    if (!basicData.kg_id) return;
    Object.assign(canvasRef.current.detail, {
      kg: {
        kg_id: basicData.kg_id,
        knw_id: basicData.knw_id,
        service_id: basicData.id,
        operation_type: basicData.operation_type
      }
    });
    getClassData();
  }, [basicData.kg_id]);

  const init = async (service_id: any) => {
    const { knw_name, knw_id } = getParam(['knw_name', 'knw_id']);
    setBasicData({
      ...DEFAULT_CONFIG,
      knw_id: parseInt(knw_id),
      knw_name: knw_name || '',
      id: service_id || 0,
      kg_id: currentIntention?.kg_id || 0,
      action: 'init'
    });
    setTestData({ ...DEFAULT_CONFIG, action: 'init' } as any);
    if (!service_id) return;
    try {
      const res = await analysisService.analysisServiceGet(service_id);
      if (res?.res) {
        const { config_info, canvas_config, canvas_body, ...info } = res?.res;
        setBasicData((pre: any) => ({ ...pre, ...info, knw_id: Number(info.knw_id), kg_id: Number(info.kg_id) }));
        setTestData({ config_info, canvas_config, canvas_body, action: 'init' });
      }
    } catch (err) {
      const { Description, ErrorCode } = err?.data || err || {};
      Description && message.error(Description);
    }
  };

  /**
   * 更新图数据
   * @param item
   */
  const updateGraph = (item: any) => {
    const { type = '', data = {} } = item;

    if (!type) return;
    if (type === 'selected') {
      data.nodes = _.filter(data?.nodes, item => item._cfg.id !== 'groupTreeNodeTemp');
      data.time = new Date().valueOf();
    }
    if (type === 'layoutConfig') {
      data.default = data[data?.key] || {};
    }
    if (type === 'isLoading' && !data) {
      updateGraph({ type: 'exploring', data: { isExploring: false } });
    }
    canvasRef.current[type] = data;
    forceUpdate();

    // 搜索时关闭弹窗和结果
    if (type === 'exploring' && data.isExploring) {
      setSearchToolVisible(false);
    }
  };

  // 取出保存的画布数据
  const { layoutConfig } = useMemo(() => {
    let result: any = { layoutConfig: {} };
    try {
      const { layoutConfig = {}, graphStyle, graphConfig } = JSON.parse(testData.canvas_body!) || {};
      result = { layoutConfig };

      if (graphStyle) updateGraph({ type: 'graphStyle', data: graphStyle });
      if (graphConfig) updateGraph({ type: 'graphConfig', data: graphConfig });
    } catch (error) {}
    return result;
  }, [testData?.canvas_body]);

  // 初始化\重置 配置信息
  useEffect(() => {
    if (_.isEmpty(testData) || testData.action !== 'init') return;

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
    setApplyData({ statements, params: newParams });

    // 重置画布
    const nodes = canvasRef.current.graph?.current?.getNodes();
    if (!testData.canvas_body && nodes?.length) {
      clearCanvas();
    }
    if (!_.isEmpty(layoutConfig)) {
      canvasRef.current.layoutConfig = layoutConfig;
    }
  }, [testData]);

  /**
   * 发起搜索请求
   * @param info 搜索的配置
   * @param action 搜索方式
   */
  const getResult = async (info?: SearchConfig, action?: 'add' | 'cover' | string) => {
    try {
      const curConfigInfo = info || applyData;
      const statements = formatStatements(curConfigInfo.statements, curConfigInfo.params);
      const body = {
        knw_id: String(basicData.knw_id),
        kg_id: String(basicData.kg_id),
        operation_type: basicData.operation_type,
        config_info: { statements }
      };
      updateGraph({ type: 'exploring', data: { isExploring: true } });
      const { res } = await analysisService.analysisServiceTest(body);
      if (res) {
        updateGraph({ type: 'add', data: { nodes: [], edges: [], length: 0 } });
        const { result, graph } = parseStatementResult(res);
        const hasTexts = _.some(result, d => d.data?.texts?.length);
        if (!graph.nodes.length && !hasTexts) {
          switch (true) {
            case ['add', 'cover'].includes(action!):
              message.warning(intl.get('analysisService.queryNullErr'));
              break;
            default:
              message.warning(intl.get('exploreGraph.noSearch'));
          }
          updateGraph({ type: 'exploring', data: { isExploring: false } });
          return;
        }

        updateGraph?.({
          type: 'add',
          data: { ...graph, length: graph.nodes.length + graph.edges.length, action }
        });
        setResults({
          visible: true,
          data: result,
          originData: res,
          checkable: false,
          params: body
        });
        // 树布局无法触发layout回调直接关闭loading,
        // 只返回text直接关闭
        if (canvasRef.current.layoutConfig?.key === GRAPH_LAYOUT.TREE || (!graph.nodes.length && hasTexts)) {
          updateGraph({ type: 'exploring', data: { isExploring: false } });
        }
      }
    } catch (err) {
      updateGraph({ type: 'exploring', data: { isExploring: false } });
      const { ErrorCode, Description, ErrorDetails } = err?.response || err || {};
      if (ERROR[ErrorCode]) {
        return message.error(intl.get(ERROR[ErrorCode]));
      }
      // 格式错误
      if (['Cognitive.SyntaxErr', 'Cognitive.SemanticErr'].includes(ErrorCode)) {
        return message.error(ErrorDetails[0]?.detail || Description);
      }
      Description && message.error(Description);
    }
  };

  /**
   * 清空画布
   * @param isClearStack 是否清空栈
   */
  const clearCanvas = (isClearStack = true) => {
    const nodes = canvasRef.current.graph.current.getNodes();
    const edges = canvasRef.current.graph.current.getEdges();
    if (nodes.length) {
      updateGraph({ type: 'delete', data: { nodes, edges, length: nodes.length + edges.length } });
    }
    updateGraph({ type: 'graphData', data: { nodes: [], edges: [] } });
    updateGraph({ type: 'selected', data: {} });
    updateGraph({ type: 'forceCloseLeftDrawer', data: +new Date() });
    setResults(getInitResState());

    if (isClearStack) {
      setTimeout(() => updateGraph({ type: 'stack', data: { redoStack: [], undoStack: [] } }), 100);
    }
  };

  /**
   * 拉伸列表
   */
  const onHeightDrag = (xOffset: number, yOffset: number) => {
    const y = height + yOffset;
    const max = window.innerHeight - 260;
    const min = 100;
    const curHeight = y > max ? max : y < min ? min : y;
    setHeightThrottle(curHeight);
  };

  /**
   * 左侧面板展开收起
   */
  const onExpand = () => {
    const max = window.innerHeight - 260;
    const min = 100;
    setHeight(height > window.innerHeight / 2 ? min : max);
    setTimeout(() => triggerEvent('resize'), 0);
  };

  /**
   * 更新配置到父组件, 并复原实际应用的配置
   * 编辑器实时更新的代价太大, 所以只在步骤切换时更新
   */
  const emitConfig = () => {
    const { statement, params, value } = editor.current?.getOriginData() || {};
    const newParams = updatePosition(editingData.params, params, ontoData?.entity);
    const saveP = _.map(newParams, item => {
      return item?.options === null ? _.omit(item, 'options') : item;
    });
    const newInfo = { statements: statement, params: saveP };
    const { canvas_body, canvas_config } = generateCanvasData(canvasRef.current);
    const name = basicData?.name || '图分析名字';

    if (!newInfo.statements) return message.error(intl.get('cognitiveSearch.qaAdvConfig.queryNotNull'));
    onSaveGraph?.({ config_info: { ...newInfo, name }, canvas_body, canvas_config });
    // 复原
    const editing = _.cloneDeep(newInfo);
    editor.current?.initMark(editing.statements, editing.params);
    setEditingData(editing);
  };

  /**
   * 点击应用配置
   */
  const onApply = async () => {
    const editorData = editor.current?.getOriginData() || {};
    const { statement, params } = editorData;
    if (!isSingleStatement(statement)) return message.error(intl.get('function.onlySingle'));

    // 无参数询问, 不要用tipModalFunc, 这个函数使用了Promise, 后续有settimeout会导致弹窗卡顿
    if (statement && !params.length) {
      setApplyVisible(true);
      return;
    }
    onConfirmApply(editorData);
  };

  /**
   * 确认应用
   */
  const onConfirmApply = (editorData?: any) => {
    applyVisible && setApplyVisible(false);
    const { statement, params, value } = editorData || editor.current?.getOriginData() || {};
    const newParams = updatePosition(editingData.params, params, ontoData?.entity);
    const newInfo = { statements: statement, params: newParams };
    setEditingData(newInfo);
    setApplyData({ ..._.cloneDeep(newInfo) });
    dataCache.current = {
      value,
      params: _.cloneDeep(newParams),
      valueChanged: false,
      paramsChanged: false
    };
    editor.current?.clearSelection();
    statement && setSearchToolVisible(true);
    clearCanvas(false);
    dispatchEditorStatus({ changed: false, edited: false });
    if (statement && !newParams.length) {
      getResult(newInfo);
    }

    setHeight(100);
    setTimeout(() => {
      triggerEvent('resize');
    }, 0);
  };

  /**
   * 搜索
   */
  const onSearch = (params: any[], action?: 'add' | 'cover' | string) => {
    getResult({ ...applyData, params }, action);
  };

  /** 获取本体信息 */
  const getClassData = async () => {
    const id: any = basicData?.kg_id; // 图谱id
    if (parseInt(id) <= 0 || Number.isNaN(parseInt(id))) return;

    try {
      const resultOnto = await serviceGraphDetail.graphGetInfoOnto({ graph_id: id });
      const entityData = resultOnto?.res;
      setClassData(entityData);
    } catch (err) {
      const { ErrorCode, Description } = err.data;
      Description && message.error(Description);
    }
  };

  return (
    <div className="configGraphQueryRoot">
      <div className="kw-space-between kw-border-b kw-pl-6 kw-pr-6" style={{ height: 52 }}>
        <span>
          <Format.Title>{intl.get('cognitiveSearch.qaAdvConfig.queryConfigTitle')}</Format.Title>
        </span>
        <IconFont className="kw-pointer" type="icon-guanbiquxiao" onClick={onCancel} />
      </div>
      <div className="main-content kw-flex-column">
        <div style={{ position: 'relative', height }}>
          <ParamsBox
            className="kw-h-100"
            editor={editor}
            basicData={basicData as any}
            paramsList={editingData.params || []}
            ontology={ontoData}
            editorStatus={editorStatus}
            onRun={onApply}
            onFocus={() => setHeightThrottle((window.innerHeight - 160) * 0.618)}
            onValueChange={value => {
              // 函数语句和参数都还原时, 去除警告
              const changed = !(value === dataCache.current.value && !dataCache.current.paramsChanged);
              dataCache.current.valueChanged = value === dataCache.current.value;
              const newStatus = { edited: true, changed };
              !isEqual(editorStatus, newStatus) && dispatchEditorStatus(newStatus);
            }}
            onParamChange={data => {
              setEditingData(pre => ({ ...pre, params: data }));
              const paramsChanged = isParamsChanged(data, dataCache.current.params);
              const changed = !(!paramsChanged && !dataCache.current.valueChanged);
              dataCache.current.paramsChanged = paramsChanged;
              const newStatus = { edited: true, changed };
              !isEqual(editorStatus, newStatus) && dispatchEditorStatus(newStatus);
            }}
          />
          <div className="collapse-icon" onClick={onExpand} />
        </div>

        <DragLine className="width-drag-line" style={{ top: height - 5 }} onChange={onHeightDrag} />

        <div className="canvas-box">
          {!!(applyData.params?.length || results.visible) && (
            <CustomSearchTool
              canvasInstance={canvasRef.current}
              visible={searchToolVisible}
              data={searParam}
              outerResults={results}
              triggerHeight={height}
              onSearch={onSearch}
              onVisibleChange={v => setSearchToolVisible(v)}
              onCloseResult={() => setResults(getInitResState())}
            />
          )}

          <Canvas
            toolbarVisible
            operation_type={'custom-search'}
            configMenu={{
              canvas: iframeConfig?.canvasRightClick?.options?.basic?.options || {},
              node: {
                click: {
                  ...(iframeConfig?.nodeRightClick?.options?.basic?.options || {}),
                  ...(iframeConfig?.nodeRightClick?.options?.extensions?.options || {})
                },
                dblClick: _.merge(
                  iframeConfig?.nodeDoubleClick?.options?.basic?.options || {},
                  _.pickBy(iframeConfig?.toolbar?.options?.search?.options, value => value.type === 'custom')
                )
              },
              edge: iframeConfig?.edgeRightClick?.options?.basic?.options || {},
              subgraph: iframeConfig?.subgraphRightClick?.options?.basic?.options || {}
            }}
            config={iframeConfig?.toolbar?.options?.search?.options || {}}
            configOperate={iframeConfig?.toolbar?.options?.canvas?.options || {}}
            configFeatures={iframeConfig?.features?.options || {}}
            // hideEmpty
            canvasInstance={canvasRef.current}
            leftOffset={0}
            updateGraph={updateGraph}
            onSearchToolChange={key => {
              if (key) {
                setSearchToolVisible(false);
                setResults(getInitResState());
              }
            }}
          />
        </div>

        <div className="footer-box">
          <Button type="default" onClick={onCancel}>
            {intl.get('global.cancel')}
          </Button>
          <Button type="primary" onClick={() => emitConfig()}>
            {intl.get('global.save')}
          </Button>
        </div>

        <TipModal
          title={intl.get('analysisService.applyTitle')}
          content={intl.get('analysisService.applyTip')}
          open={applyVisible}
          onOk={() => onConfirmApply()}
          onCancel={() => setApplyVisible(false)}
        />
      </div>
    </div>
  );
};
export default ConfigGraphQuery;
