/**
 * 路径查询策略配置与测试
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Button, message } from 'antd';
import { DoubleLeftOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import _ from 'lodash';
import classNames from 'classnames';
import analysisService from '@/services/analysisService';
import HOOKS from '@/hooks';
import { GRAPH_LAYOUT, GRAPH_LAYOUT_TREE_DIR, GRAPH_LAYOUT_DAGRE_DIR, GRAPH_LAYOUT_PATTERN } from '@/enums';
import { triggerEvent, getParam } from '@/utils/handleFunction';

import Format from '@/components/Format';
import Canvas from '../Canvas';
import { generateCanvasData } from '../assistant';
import { CLOSE_WIDTH, ERROR, DEFAULT_CANVAS } from '../enum';
import backgroundPoint from '@/assets/images/background_point.png';

// 引用分析画布的方法
import { ConfigurationProps } from '../index';
import PathConfig from '../ConfigPanel/PathConfig';
import PathSearchTool from '@/pages/CognitiveService/ServiceSearchTool/PathSearchTool';
import {
  getInitResState,
  parseCommonResult
} from '@/pages/KnowledgeNetwork/ExploreGraph/LeftSpace/components/ResultPanel';

import './style.less';
const MAX_WIDTH = 440; // 侧边宽度
const PathConfiguration = (props: ConfigurationProps) => {
  const { basicData, testData, step, ontoData, onChange, onPrev, onNext, isChange, setIsSaved } = props;
  const canvasRef = useRef<Record<string, any>>({ ..._.cloneDeep(DEFAULT_CANVAS), configReady: true }); // 图数据
  const forceUpdate = HOOKS.useForceUpdate();
  const [isOpenLeft, setIsOpenLeft] = useState(true); // 是否展开左侧配置面板
  const [openLeftKey, setOpenLeftKey] = useState('');
  const [width, setWidth] = useState(MAX_WIDTH); // 左侧配置面板宽度
  const [searchToolVisible, setSearchToolVisible] = useState(true); // 搜索工具栏是否展开
  const [isEdit, setIsEdit] = useState(false); // 编辑状态标识
  const [editingData, setEditingData] = useState<{
    start_tags: any;
    end_tags: any;
    filters?: any[];
    checkedRules?: any[];
    params?: any[];
  }>({
    start_tags: [],
    end_tags: [],
    filters: []
  }); // 配置信息, 任意修改
  const [applyData, setApplyData] = useState<{ start_tags: any; end_tags: any; filters?: any[]; checkedRules?: any[] }>(
    {
      start_tags: [],
      end_tags: [],
      filters: []
    }
  ); // 应用到画布的数据, 点击配置后固化
  const [results, setResults] = useState(() => getInitResState()); // 搜索结果面板数据
  const [configError, setConfigError] = useState<{ end_tags?: boolean; start_tags?: boolean }>({});
  const [closeInfo, setIsCloseInfo] = useState<boolean>(false);

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

  useEffect(() => {
    // if (!_.includes(['create', 'import'], action)) return;
    setEditingData({ start_tags: [], end_tags: [], filters: [] });
  }, [basicData?.kg_id]);

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
    setIsCloseInfo(false);

    // 搜索时关闭弹窗和结果
    if (type === 'exploring' && data.isExploring) {
      onToolVisible(false);
      setIsCloseInfo(true);
    }
  };

  // 取出保存的画布数据
  const { sourceData, layoutConfig } = useMemo(() => {
    let result: any = { sourceData: { nodes: [], edges: [] }, layoutConfig: {} };
    try {
      const {
        nodes = [],
        edges = [],
        layoutConfig = {},
        graphStyle,
        graphConfig
      } = JSON.parse(testData.canvas_body!) || {};
      result = { layoutConfig };
      updateGraph({ type: 'graphData', data: { nodes, edges } });
      if (graphStyle) updateGraph({ type: 'graphStyle', data: graphStyle });
      if (graphConfig) updateGraph({ type: 'graphConfig', data: graphConfig });
    } catch (error) {
      //
    }
    return result;
  }, [testData?.canvas_body]);

  // 给画布添加图谱id信息
  useEffect(() => {
    Object.assign(canvasRef.current.detail, {
      kg: {
        kg_id: basicData.kg_id,
        knw_id: basicData.knw_id,
        service_id: basicData.id,
        operation_type: basicData.operation_type
      }
    });
  }, [basicData.kg_id]);

  useEffect(() => {
    updateGraph({ type: 'width', data: width });
  }, [width]);

  // 初始化\重置 配置信息
  useEffect(() => {
    // 我在这里做了更改---传入图谱kg_id为-1时，不调快速接口
    // if (_.isEmpty(testData) || testData.action !== 'init' || !basicData?.kg_id) return;
    if (_.isEmpty(testData) || testData.action !== 'init') return;
    const info = testData.config_info || {};
    const { start_tags, end_tags, filters = [] } = info;

    if (testData.canvas_body) {
      const { rules } = JSON.parse(testData.canvas_body!) || {};
      onChangeConfig({ start_tags, end_tags, filters: rules?.rules });
    } else {
      onChangeConfig({ start_tags, end_tags });
    }

    setApplyData({ start_tags, end_tags, filters });

    // 重置画布
    const nodes = canvasRef.current.graph?.current?.getNodes();
    if (!testData.canvas_body && nodes?.length) {
      clearCanvas();
    }
    if (!_.isEmpty(layoutConfig)) {
      canvasRef.current.layoutConfig = layoutConfig;
    }
  }, [testData]);

  // 结果弹窗fixed定位问题, 强制隐藏
  useEffect(() => {
    updateGraph({ type: 'forceHideResultModal', data: step !== 1 });
    if (step === 1) {
      const tags = _.map(ontoData?.entity, item => item?.name);
      if (testData?.action === 'init' && getParam('action') === 'create') {
        // if (testData?.action === 'init' && ['create', 'import'].includes(getParam('action')) && isChange) {

        onChangeConfig({ start_tags: tags, end_tags: tags }, false);
      } // 默认选择全部属性
      if (getParam('action') === 'import' && isChange) {
        onChangeConfig({ start_tags: tags, end_tags: tags }, true);
      }
      setApplyData({ ...applyData, start_tags: tags, end_tags: tags });
    }
  }, [step]);

  /**
   * 发起搜索请求
   * @param info 搜索的配置
   * @param trigger 触发方式
   * @param action 搜索方式
   */
  const getResult = async (info: any, action?: 'add' | 'cover' | string) => {
    try {
      const body = {
        knw_id: String(basicData.knw_id),
        kg_id: String(basicData.kg_id),
        operation_type: basicData.operation_type,
        config_info: info
      };

      updateGraph({ type: 'exploring', data: { isExploring: true } });
      const { res } = await analysisService.analysisServiceTest(body);
      updateGraph({ type: 'exploring', data: { isExploring: false } });
      const { graph, paths } = parseCommonResult(res);

      if (!res || !graph?.nodes?.length) {
        switch (true) {
          case ['add', 'cover'].includes(action!):
            message.warning(intl.get('analysisService.queryNullErr'));
            break;
          default:
            message.warning(intl.get('exploreGraph.noSearch'));
        }
        return;
      }
      if (res) {
        updateGraph({ type: 'add', data: { nodes: [], edges: [], length: 0 } });

        setResults({
          visible: true,
          data: paths,
          originData: { res },
          params: body
        } as any);
        updateGraph({
          type: 'add',
          data: { nodes: graph?.nodes, edges: graph.edges, length: graph?.nodes?.length + graph?.edges?.length, action }
        });
        // 树布局无法触发layout回调直接关闭loading
        if (canvasRef.current.layoutConfig?.key === GRAPH_LAYOUT.TREE) {
          updateGraph({ type: 'exploring', data: { isExploring: false } });
        }
      }
    } catch (err) {
      updateGraph({ type: 'exploring', data: { isExploring: false } });
      const { ErrorCode, Description, ErrorDetails } = err?.response || err || {};
      if (ERROR[ErrorCode]) {
        return message.error(intl.get(ERROR[ErrorCode]));
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
   * 左侧面板展开收起
   */
  const onLeftExpand = (isOpen: boolean) => {
    setIsOpenLeft(isOpen);
    setWidth(isOpen ? MAX_WIDTH : CLOSE_WIDTH);
    setTimeout(() => triggerEvent('resize'), 0);
  };

  /**
   * 更新配置到父组件, 并复原实际应用的配置
   * 编辑器实时更新的代价太大, 所以只在步骤切换时更新
   */
  const emitConfig = () => {
    const { canvas_body, canvas_config } = generateCanvasData(canvasRef.current, { rules: editingData?.filters });
    onChange?.({ config_info: applyData, canvas_body, canvas_config });
  };

  /**
   * 点击应用配置
   */
  const onApply = async () => {
    const filters = getCheckedRules(editingData?.filters);
    const { start_tags, end_tags } = _.cloneDeep(editingData);
    const entity = _.map(ontoData?.entity, item => item?.name);
    const sTages = _.filter(start_tags, e => _.includes(entity, e));
    const eTages = _.filter(end_tags, e => _.includes(entity, e));
    setApplyData({ start_tags: sTages, end_tags: eTages, filters });
    if (_.isEmpty(sTages) || _.isEmpty(eTages)) {
      setConfigError({ start_tags: _.isEmpty(sTages), end_tags: _.isEmpty(eTages) });
      return;
    }

    onToolVisible(true);
    setIsEdit(false);
    clearCanvas(false);
    setIsSaved(false);
    // [bug 376742] 没有参数点击运行配置的时候，如果有报错，侧边栏不要变窄
    setWidth(CLOSE_WIDTH);
    setIsOpenLeft(false);
    setTimeout(() => triggerEvent('resize'), 0);
  };

  /** 获取勾选的规则 */
  const getCheckedRules = (rules: any) => {
    const checkedFilters = _.filter(rules, item => item?.checked);

    const filters = _.map(checkedFilters, item => {
      const e_filters = _.map(item?.searchRules?.e_filters, filter => {
        const { type, edge_class, relation } = filter;
        const property_filters = _.map(filter?.property_filters, f => {
          const { name, operation, op_value, custom_param, type, time_param } = f;
          return { name, operation, op_value, custom_param, type, time_param };
        });
        return { relation, edge_class, type, property_filters };
      });

      return { e_filters };
    });

    return filters;
  };

  // 修改配置
  const onChangeConfig = (
    data: { start_tags?: any; end_tags?: any; filters?: any; checkedRules?: any },
    edit = true
  ) => {
    if (!_.isEmpty(data?.start_tags)) setConfigError({ start_tags: false });
    if (!_.isEmpty(data?.end_tags)) setConfigError({ end_tags: false });
    setIsEdit(edit);
    setEditingData(pre => {
      return { ...pre, ...data };
    });
  };

  /**
   * 搜索
   */
  const onSearch = (data: any[], action?: string) => {
    getResult(data, action);
  };

  /**
   * 上一步
   */
  const handlePrev = () => {
    if (configError?.start_tags || configError?.end_tags) return;
    emitConfig();
    onPrev?.();
  };

  /**
   * 下一步
   */
  const handleNext = () => {
    if (configError?.start_tags || configError?.end_tags) return;
    emitConfig();
    onNext?.();
  };

  const onChangeOpenLeftKey = (key: string) => {
    setOpenLeftKey(key);
  };

  const onToolVisible = (visible: boolean) => {
    onChangeOpenLeftKey('');
    setSearchToolVisible(visible);
  };

  return (
    <div className="service-config-paths-root kw-h-100">
      <div className="kw-flex kw-h-100">
        <div className={classNames('config-box', isOpenLeft ? 'open' : 'close')} style={{ width }}>
          <div className={'sub-title kw-space-between'}>
            <Format.Title className="t-word">{intl.get('analysisService.configTitle')}</Format.Title>
            <div className="open-icon-mask kw-pointer" onClick={() => onLeftExpand(!isOpenLeft)}>
              <DoubleLeftOutlined rotate={isOpenLeft ? 0 : 180} />
            </div>
          </div>

          <div className="scroll-wrap">
            <PathConfig
              configError={configError}
              basicData={basicData}
              editingData={editingData}
              isEdit={isEdit}
              ontoData={ontoData}
              onChangeConfig={onChangeConfig}
            />
          </div>
          <div className="apply-button">
            <Button type="primary" onClick={onApply} disabled={!isEdit}>
              {intl.get('cognitiveService.neighbors.applyConfig')}
            </Button>
          </div>
        </div>

        <div className="canvas-box" style={{ background: `url(${backgroundPoint})` }}>
          {((!!applyData?.start_tags?.length && !!applyData?.end_tags?.length) || results.visible) && step === 1 && (
            <PathSearchTool
              isQuickSearch={true}
              onChangeOpenLeftKey={onChangeOpenLeftKey}
              serviceType={basicData?.operation_type}
              canvasInstance={canvasRef.current}
              visible={searchToolVisible}
              data={applyData}
              outerResults={results}
              ontoData={ontoData}
              onSearch={onSearch}
              onVisibleChange={(v: any) => onToolVisible(v)}
              onCloseResult={() => setResults(getInitResState())}
            />
          )}

          <Canvas
            closeInfo={closeInfo}
            openLeftKey={openLeftKey}
            toolbarVisible
            operation_type={'paths'}
            graphLayoutPattern={basicData.graphLayoutPattern}
            canvasInstance={canvasRef.current}
            leftOffset={width}
            updateGraph={updateGraph}
            onSearchToolChange={key => {
              if (key) {
                onToolVisible(false);
                setResults(getInitResState());
              }
            }}
          />

          <div className="footer-box">
            <Button type="default" onClick={handlePrev}>
              {intl.get('global.previous')}
            </Button>
            <Button type="primary" onClick={handleNext}>
              {intl.get('global.next')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PathConfiguration;
