/**
 * 策略配置与测试
 */

import React, { useState, useEffect, useRef, useMemo, useReducer } from 'react';
import { Button, message } from 'antd';
import intl from 'react-intl-universal';
import _, { isEqual } from 'lodash';
import analysisService from '@/services/analysisService';
import serviceGraphDetail from '@/services/graphDetail';

import HOOKS from '@/hooks';
import { GRAPH_LAYOUT, GRAPH_LAYOUT_TREE_DIR, GRAPH_LAYOUT_DAGRE_DIR, GRAPH_LAYOUT_PATTERN } from '@/enums';
import { triggerEvent } from '@/utils/handleFunction';
import DragLine from '@/components/DragLine';
import TipModal, { tipModalFunc } from '@/components/TipModal';
import { ParamEditorRef, paramPolyfill, isSingleStatement } from '@/components/ParamCodeEditor';

import Canvas from '../Canvas';
import ParamsBox from './ParamsBox';
import { generateCanvasData, updatePosition, formatStatements } from '../assistant';
import { ERROR, DEFAULT_CANVAS } from '../enum';
import { ParamsList } from '../../types';
import './style.less';

// 引用分析画布的方法
import CustomSearchTool from '@/pages/KnowledgeNetwork/ExploreGraph/LeftSpace/CustomSearchTool';
import { getInitResState } from '@/pages/KnowledgeNetwork/ExploreGraph/LeftSpace/components/ResultPanel';
import { parseStatementResult } from '@/pages/KnowledgeNetwork/ExploreGraph/LeftSpace/components/ResultPanel/parse';
import { graphPolyfill } from '@/pages/KnowledgeNetwork/ExploreGraph/polyfill';
import { ConfigurationProps } from '../index';

type SearchConfig = {
  statements: string; // 图查询语句
  params: ParamsList; // 参数列表
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

const Configuration = (props: ConfigurationProps) => {
  const { basicData, testData, ontoData = objectCache, onChange, onPrev, onNext, setIsSaved } = props;
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
  const [classData, setClassData] = useState<any>({}); // 图谱本体信息

  const searParam = useMemo(() => {
    return { code: applyData.statements, parameters: applyData.params };
  }, [applyData]);

  // changed用于标记报错, edited用于标记活动状态, 它们除了初始化不同, 其他时候一同变更
  const [editorStatus, dispatchEditorStatus] = useReducer(reducer, { changed: false, edited: true });
  const dataCache = useRef({ value: '', params: [] as any[], valueChanged: false, paramsChanged: false });
  const [applyVisible, setApplyVisible] = useState(false); // 运行配置警告弹窗

  useEffect(() => {
    // 图谱类型选择为树图的时候要默认图谱类型为树图
    if (basicData.graphLayoutPattern === GRAPH_LAYOUT_PATTERN.TREE) {
      canvasRef.current.layoutConfig = {
        key: GRAPH_LAYOUT.TREE,
        default: GRAPH_LAYOUT_TREE_DIR.DEFAULT_CONFIG,
        [GRAPH_LAYOUT.TREE]: GRAPH_LAYOUT_TREE_DIR.DEFAULT_CONFIG
      };
    } else if (basicData.graphLayoutPattern === GRAPH_LAYOUT_PATTERN.COMMON) {
      canvasRef.current.layoutConfig = {
        key: GRAPH_LAYOUT.FORCE,
        default: GRAPH_LAYOUT_DAGRE_DIR.DEFAULT_CONFIG,
        [GRAPH_LAYOUT.FORCE]: GRAPH_LAYOUT_DAGRE_DIR.DEFAULT_CONFIG
      };
    }
  }, [basicData.graphLayoutPattern]);

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
      const {
        nodes = [],
        edges = [],
        layoutConfig = {},
        graphStyle,
        graphConfig
      } = JSON.parse(testData.canvas_body!) || {};
      result = { layoutConfig };
      const graphData = { nodes, edges };
      graphPolyfill(graphData);
      updateGraph({ type: 'graphData', data: graphData });
      if (graphStyle) updateGraph({ type: 'graphStyle', data: graphStyle });
      if (graphConfig) updateGraph({ type: 'graphConfig', data: graphConfig });
    } catch (error) {}
    return result;
  }, [testData?.canvas_body]);

  // 给画布添加图谱id信息
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

        // [bug 376742] 没有参数点击运行配置的时候，如果有报错，侧边栏不要变窄
        // if (trigger === 'apply' && !curConfigInfo.params?.length) {
        //   setTimeout(() => triggerEvent('resize'), 0);
        // }

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
    const { statements } = applyData;
    const { canvas_body, canvas_config } = generateCanvasData(canvasRef.current);
    onChange?.({ config_info: applyData, canvas_body, canvas_config });

    if (!statements) return;

    // 复原
    const editing = _.cloneDeep(applyData);
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
    setIsSaved(false);
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
    // setHeightThrottle(100);
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

  /**
   * 上一步
   */
  const handlePrev = () => {
    emitConfig();
    onPrev?.();
  };

  /**
   * 下一步
   */
  const handleNext = async () => {
    if (editorStatus.changed) {
      const isOk = await tipModalFunc({
        iconChange: true,
        title: intl.get('workflow.tooltip'),
        content: intl.get('analysisService.notEffectTip'),
        closable: false
      });
      if (!isOk) return;
    }
    emitConfig();
    onNext?.();
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
      //
      const { ErrorCode } = err.data;
      if (ErrorCode === 'Gateway.Common.NoDataPermissionError') {
        message.error('暂无图谱权限');
      }
    }
  };

  return (
    <div className="service-config-graphQuery-root kw-h-100">
      <div className="main-content kw-flex-column kw-h-100">
        <div style={{ position: 'relative', height }}>
          <ParamsBox
            className="kw-h-100"
            editor={editor}
            basicData={basicData}
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
            operation_type={basicData?.operation_type}
            canvasInstance={canvasRef.current}
            graphLayoutPattern={basicData?.graphLayoutPattern}
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
          <Button type="default" onClick={handlePrev}>
            {intl.get('global.previous')}
          </Button>
          <Button type="primary" onClick={handleNext}>
            {intl.get('global.next')}
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

export default Configuration;
