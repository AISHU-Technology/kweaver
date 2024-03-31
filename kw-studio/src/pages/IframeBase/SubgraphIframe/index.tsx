import React, { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import _ from 'lodash';
import HOOKS from '@/hooks';
import './style.less';

import { getParam } from '@/utils/handleFunction';

// 引用 认知服务-图分析服务配置的组件
import Canvas from '@/pages/CognitiveService/AnalysisServiceConfig/ConfigAndTest/Canvas';
import { parseToGraph } from '@/pages/CognitiveSearchService/SearchConfigStep/SecondSearchTest/TestConfig/SearchResult/GraphResult/ExploreGraphInfo/util';
import {
  DEFAULT_CANVAS,
  TOOLBAR,
  MENU
} from '@/pages/CognitiveSearchService/SearchConfigStep/SecondSearchTest/TestConfig/SearchResult/GraphResult/ExploreGraphInfo/enum';

const isExplore = () => getParam('explore')?.toLowerCase?.() === 'true';
const getFakerConfig = () => {
  if (isExplore()) return {};
  return {
    faker: true,
    graphConfig: { hasLegend: false, color: 'white', image: 'empty' }
  };
};

const SubgraphIframe = (props: any) => {
  const canvasRef = useRef<Record<string, any>>({
    configReady: true,
    ..._.cloneDeep(DEFAULT_CANVAS),
    ...getFakerConfig()
  }); // 图数据
  const forceUpdate = HOOKS.useForceUpdate();
  const [toolbarVisible] = useState(() => isExplore());
  const [graphData, setGraphData] = useState<any>({});
  const dataRef = useRef<any>(graphData);
  dataRef.current = graphData;

  const lister = (e: any) => {
    if (e.data?.key === 'KWeaver:graph:subgraph') {
      try {
        const { graph } = parseToGraph(e.data?.data);
        setGraphData(graph);
      } catch (error) {
        console.error(error);
      }
    }
  };

  useEffect(() => {
    init();
    window.addEventListener('message', lister);
    return () => window.removeEventListener('message', lister);
  }, []);

  useEffect(() => {
    if (!_.isEmpty(graphData) && canvasRef.current?.configReady) {
      updateGraph({ type: 'graphData', data: graphData });
    }
  }, [graphData]);

  /**
   * 初始化数据
   */
  const init = async () => {
    const kg_id = getParam('kg_id');
    Object.assign(canvasRef.current.detail, { kg: { kg_id } });
    if (!_.isEmpty(dataRef.current)) {
      updateGraph({ type: 'graphData', data: dataRef.current });
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
  };

  return (
    <div className={classNames('SubgraphIframe-root kw-h-100')}>
      <Canvas
        toolbarVisible={toolbarVisible}
        hideEmpty
        operation_type={'custom-search'}
        configOperate={TOOLBAR}
        configMenu={MENU}
        canvasInstance={canvasRef.current}
        updateGraph={updateGraph}
      />
    </div>
  );
};

export default SubgraphIframe;
