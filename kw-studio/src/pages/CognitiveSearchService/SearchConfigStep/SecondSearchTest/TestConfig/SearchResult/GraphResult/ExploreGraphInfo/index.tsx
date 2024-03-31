import React, { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import _ from 'lodash';
import HOOKS from '@/hooks';
import { handelData, parseToGraph } from './util';

// 引用 认知服务-图分析服务配置的组件
import Canvas from '@/pages/CognitiveService/AnalysisServiceConfig/ConfigAndTest/Canvas';
import { DEFAULT_CANVAS } from './enum';
import { getParam } from '@/utils/handleFunction';

export interface ExploreGraphInfoProps {
  graphId: number;
  subgraph: any;
  basicData: any;
  advGaConfig: any;
  intent?: string; // 命中的意图
  isUpdate?: string; // 命中的意图
}

const ExploreGraphInfo = (props: ExploreGraphInfoProps) => {
  const { graphId, subgraph, basicData, advGaConfig, intent, isUpdate = true } = props;
  const canvasRef = useRef<Record<string, any>>(_.cloneDeep(DEFAULT_CANVAS)); // 图数据
  const forceUpdate = HOOKS.useForceUpdate();
  const toolBarShowRef = useRef<any>();
  const toolFeaturesRef = useRef<any>();
  const configMenuRef = useRef<any>();
  const [toolbarVisible, setToolbarVisible] = useState(false);

  useEffect(() => {
    if (basicData?.pc_configure_item && isUpdate) {
      const pcData = JSON.parse(basicData?.pc_configure_item);
      const handleByPKey: any = _.keyBy(pcData, 'key');
      if (handleByPKey?.toolbar?.visible) {
        onToolBar(handleByPKey?.toolbar?.children);
        setToolbarVisible(true);
      }

      onFeatures(handleByPKey?.features?.children);
      onRightConfig(handleByPKey);
    }
  }, []);

  useEffect(() => {
    renderGraph();
  }, [graphId, subgraph]);

  /**
   * 顶部工具栏显示
   */
  const onToolBar = (data: any) => {
    const allToolBarData = _.keyBy(data, 'key');
    const toolBarL = _.keyBy(allToolBarData?.canvas?.children, 'key');
    const search = _.keyBy(allToolBarData?.search?.children, 'key');
    const algorithm = _.keyBy(allToolBarData?.algorithm?.children, 'key');
    const handleDataObject = { toolBar: { ...toolBarL, algorithm }, search };
    toolBarShowRef.current = handleDataObject;
  };

  /**
   * 右键配置
   */
  const onRightConfig = (data: any) => {
    const subgraph = onHandleConfig(data?.subgraphRightClick?.children);
    const canvas = onHandleConfig(data?.canvasRightClick?.children);
    const edge = onHandleConfig(data?.edgeRightClick?.children);
    const click = onHandleConfig(data?.nodeRightClick?.children);
    const dblClick = onHandleConfig(data?.nodeDoubleClick?.children);
    configMenuRef.current = { canvas, edge, node: { click, dblClick }, subgraph };
  };

  /**
   * 右键配置相关数据格式整理
   */
  const onHandleConfig = (data: any) => {
    let result: any = {};
    _.map(_.cloneDeep(data), (item: any) => {
      result = { ...result, ..._.keyBy(item?.children, 'key') };
    });
    return result;
  };

  /**
   * 其他琐碎功能
   */
  const onFeatures = (data: any) => {
    const allFeatures = _.keyBy(data, 'key');
    toolFeaturesRef.current = allFeatures;
  };

  /**
   * 初始化的逻辑
   * @param id 服务id
   */
  const renderGraph = async () => {
    const { graph } = parseToGraph(subgraph);
    Object.assign(canvasRef.current.detail, { kg: { kg_id: graphId, knw_id: getParam('knw_id') } });
    let hasUpdate = false; // 是否已添加过数据
    if (!intent) {
      updateGraph({ type: 'graphData', data: graph });
      return;
    }
    // 默认样式使用命中意图的图分析配置
    const intentConfig = _.find(advGaConfig?.intent_binding, item => item?.intent_name === intent);
    const { canvas_body } = intentConfig || {};
    if (canvas_body) {
      const { layoutConfig = {}, graphStyle } = JSON.parse(canvas_body!) || {};
      if (graphStyle) {
        const { nodes, edges } = handelData({ ...graph, graphStyle });
        hasUpdate = true;
        updateGraph({ type: 'graphData', data: { nodes, edges } });
        updateGraph({ type: 'graphStyle', data: graphStyle });
      }
      if (layoutConfig) {
        updateGraph({ type: 'layoutConfig', data: layoutConfig });
      }
    }
    // 条件未匹配没能添加需添加数据
    if (!hasUpdate) updateGraph({ type: 'graphData', data: graph });
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
  };

  return (
    <div className={classNames('ExploreGraphInfo-root kw-h-100')}>
      <Canvas
        toolbarVisible={toolbarVisible}
        hideEmpty
        operation_type={'custom-search'}
        configOperate={toolBarShowRef?.current?.toolBar || {}}
        configFeatures={toolFeaturesRef.current}
        configMenu={configMenuRef.current}
        config={toolBarShowRef?.current?.search}
        canvasInstance={canvasRef.current}
        updateGraph={updateGraph}
      />
    </div>
  );
};

export default ExploreGraphInfo;
