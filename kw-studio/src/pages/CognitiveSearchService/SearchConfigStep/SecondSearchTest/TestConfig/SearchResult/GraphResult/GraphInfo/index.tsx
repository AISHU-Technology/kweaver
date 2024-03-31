import React, { useRef, useState, useEffect } from 'react';
import _ from 'lodash';
import cs from 'classnames';
import G6 from '@antv/g6';
import { message } from 'antd';
import { LoadingOutlined, MinusOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import IconFont from '@/components/IconFont';
import HOOKS from '@/hooks';
import IconPreRender from '@/components/IconPreRender';
import { registerIconNode } from '@/utils/antv6';
import { registerToolTip } from './tooltip';
import { constructGraphData } from './assistant';
import backgroundPoint from '@/assets/images/background_point.png';
import './style.less';

import { parseToGraph } from '../ExploreGraphInfo/util';

let timer: any = null;

const GraphInfo = (props: any) => {
  const { isVisiblePreview = false, subgraph } = props;
  const graphContainer = useRef<HTMLDivElement>(null);
  const graph = useRef<any>(null);
  const cacheItem = useRef<any>({});
  const forceUpdate = HOOKS.useForceUpdate();

  const [isLoading, setIsLoading] = useState(true);
  const [graphData, setGraphData] = useState<any>([]);
  const [handleGraphData, setHandleGraphData] = useState<any>({ nodes: [], edges: [] });
  const [graphCount, setGraphCount] = useState({ totalNum: 0, expandedNum: 0 });
  const [currentIndex, setCurrentIndex] = useState(1);
  const [operationDisabled, setOperationDisabled] = useState(false);
  const [paths, setPaths] = useState<any[]>([]);

  useEffect(() => {
    getData();
    return () => {
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!_.isEmpty(graphData)) {
      // // 初始化
      drawGraph();
      if (isVisiblePreview) {
        registerToolTip(graph);
      }
      showMore();
    }
  }, [graphData]);

  useEffect(() => {
    if (handleGraphData?.nodes?.length) {
      // 加载更多
      const data = constructGraphData(handleGraphData);
      graph.current?.changeData(data);
      setTimeout(() => {
        graph.current.render();
      }, 100);
    }
  }, [handleGraphData]);

  const getData = async () => {
    try {
      setIsLoading(true);
      const { graph, paths } = parseToGraph(subgraph);
      paths && setPaths(paths);
      const totalNum = paths?.length || 1;
      const expandedNum = totalNum > 10 ? 10 : totalNum;
      setGraphCount({ ...graphCount, totalNum, expandedNum });
      setGraphData(graph);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      const { type, response } = error as any;
      if (type === 'message') message.error(response?.Description || '');
    }
  };

  const showMore = () => {
    if (operationDisabled) {
      return false;
    }
    // const newData = _.cloneDeep(graphData);
    // let handleData = [];
    // let expandedNum;
    // if (graphCount.totalNum < currentIndex * 10) {
    //   handleData = newData.splice(0, graphCount.totalNum);
    //   expandedNum = graphCount.totalNum;
    //   setOperationDisabled(true);
    // } else {
    //   handleData = newData.splice(0, currentIndex * 10);
    //   setCurrentIndex(currentIndex + 1);
    //   expandedNum = currentIndex * 10;
    // }
    // setGraphCount({ ...graphCount, expandedNum });
    // setHandleGraphData(handleData);
    const newData = _.cloneDeep(graphData);
    if (paths.length <= 10) {
      setOperationDisabled(true);
      return setHandleGraphData(newData);
    }
    const expandedPaths = paths.splice(0, currentIndex * 10);
    const pathsMap = { nodesMap: {}, edgesMap: {} };
    _.forEach(expandedPaths, path => {
      Object.assign(pathsMap.nodesMap, _.keyBy(path.nodes, 'id'));
      Object.assign(pathsMap.edgesMap, _.keyBy(path.edges, 'id'));
    });
    const handleData = { nodes: _.values(pathsMap.nodesMap), edges: _.values(pathsMap.edgesMap) };
    let expandedNum = currentIndex * 10;
    if (graphCount.totalNum < currentIndex * 10) {
      expandedNum = graphCount.totalNum;
      setOperationDisabled(true);
    }
    setCurrentIndex(currentIndex + 1);
    setGraphCount({ ...graphCount, expandedNum });
    setHandleGraphData(handleData);
  };

  const drawGraph = () => {
    registerIconNode();
    graph.current = new G6.Graph({
      linkCenter: true,
      container: graphContainer.current || '',
      width: graphContainer.current?.offsetWidth,
      height: graphContainer.current?.offsetHeight,
      modes: { default: ['drag-canvas', 'zoom-canvas', 'drag-node'] },
      layout: {
        type: 'dagre',
        rankdir: 'LR',
        align: 'DL',
        nodesep: 20
      },
      defaultNode: {
        type: 'icon-node',
        style: { cursor: 'pointer', stroke: 'white', lineWidth: 3 },
        labelCfg: { position: 'top', offset: 7, style: { fill: '#000' } }
      },
      defaultEdge: {
        size: 1,
        color: '#000',
        style: { cursor: 'pointer', lineAppendWidth: 30 },
        loopCfg: { cursor: 'pointer', position: 'top', dist: 100 },
        labelCfg: { cursor: 'pointer', autoRotate: true, refY: 7, style: { fill: '#000' } }
      }
    });

    graph.current.get('canvas').set('localRefresh', false);

    graph.current.on('beforelayout', () => {
      setIsLoading(true);
    });
    graph.current.on('afterlayout', () => {
      graph.current.fitView(20, { onlyOutOfViewPort: true, direction: 'y' });
      timer = setTimeout(() => setIsLoading(false), 300);
    });
  };

  /**
   * 放大-缩小-自适应
   * @param type auto-自适应 small-缩小 large-放大
   */
  const onChangeZoom = (type: string) => {
    if (type === 'auto') {
      graph?.current?.fitView(0);
      const zoom = graph?.current?.getZoom();
      onChangeData(zoom);
    }
    if (type === '+') {
      // const toRatio = Math.min(zoom + 0.05, 4);
      const toRatio = Math.min(graph?.current?.getZoom() + 0.05, 4);
      graph?.current?.zoomTo(toRatio);
      graph?.current?.fitCenter();
      onChangeData(toRatio);
    }
    if (type === '-') {
      // const toRatio = Math.max(zoom - 0.05, 0.05);
      const toRatio = Math.max(graph?.current?.getZoom() - 0.05, 0.05);
      graph?.current.zoomTo(toRatio);
      graph?.current?.fitCenter();
      onChangeData(toRatio);
    }
  };

  /**
   * 更新放大/缩小倍数
   */
  const onChangeData = (data: number) => {
    cacheItem.current.zoom = data;
    forceUpdate();
  };

  return (
    <div
      className="graph-info-subgraph-modal-root"
      style={{ background: `url(${backgroundPoint})`, backgroundPosition: '0 -5px' }}
    >
      {isVisiblePreview && (
        <div className="operation-wrapper">
          <div className="kw-flex">
            <div className="kw-mr-2">
              <span>{intl.get('cognitiveSearch.total')}：</span>
              <span className="kw-c-primary">{graphCount.expandedNum}</span>/<span>{graphCount.totalNum}</span>
            </div>
            <div className={cs('kw-pointer', operationDisabled ? 'cursor-disable' : 'kw-c-primary')} onClick={showMore}>
              {intl.get('cognitiveSearch.showMore')}
            </div>
          </div>
        </div>
      )}
      <div className={cs('graphInfo-wrapper', { 'graphInfo-wrapper-preview': isVisiblePreview })}>
        <IconPreRender />
        {isLoading && (
          <div className="loading">
            <LoadingOutlined style={{ fontSize: 30 }} />
          </div>
        )}
        <div className="graphContainer" ref={graphContainer} id="graphDetail" />
        <div className="kw-flex graph-operate-icon">
          <div
            className="icon-box kw-mb-2 kw-pointer"
            onClick={() => onChangeZoom('auto')}
            title={intl.get('canvas.fitView')}
          >
            <IconFont type="icon-fenxi" className="icon-img" />
          </div>
          <div className="add-reduce-box">
            <div
              className="kw-pointer add-box"
              onClick={() => onChangeZoom('+')}
              title={intl.get('exploreGraph.zoomOut')}
            >
              <IconFont type="icon-Add" className="icon-img" />
            </div>
            <div className="kw-pointer" onClick={() => onChangeZoom('-')} title={intl.get('exploreGraph.zoomIn')}>
              <MinusOutlined className="icon-img" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GraphInfo;
