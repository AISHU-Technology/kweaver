import React, { useState, useEffect, useRef } from 'react';
import { Divider } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import G6 from '@antv/g6';
import { tooltip } from '@/utils/antv6';
import { constructGraphData } from './assistant';

import './style.less';
let timer: any = null;
const Subgraph = (props: { graphData: any }) => {
  const { graphData } = props;
  const [isLoading, setIsLoading] = useState(false);
  const graphContainer = useRef<HTMLDivElement>(null);
  const graph = useRef<any>(null);

  useEffect(() => {
    drawGraph();
    return () => {
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const data = constructGraphData(graphData);
    graph?.current?.changeData(data);
  }, [graphData]);

  const drawGraph = () => {
    graph.current = new G6.Graph({
      linkCenter: true,
      container: graphContainer.current || '',
      modes: {
        default: [
          'drag-canvas',
          'zoom-canvas',
          'drag-node',
          {
            type: 'tooltip',
            formatText: model => {
              return model.name as string;
            },
            offset: 20
          },
          {
            type: 'edge-tooltip',
            formatText: model => {
              return model.name as string;
            },
            offset: 20
          }
        ]
      },
      layout: {
        type: 'force',
        linkDistance: 200, // 可选，边长
        nodeStrength: -100, // 可选
        edgeStrength: 1, // 可选
        collideStrength: 1, // 可选
        preventOverlap: true,
        alpha: 0.8, // 可选
        alphaDecay: 0.028, // 可选
        alphaMin: 0.01 // 可选
      },
      defaultNode: {
        type: 'circle',
        size: [40, 40],
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

    graph.current?.get('canvas').set('localRefresh', false);
    graph.current?.render();

    graph.current.on('beforelayout', () => {
      setIsLoading(true);
      timer = setTimeout(() => setIsLoading(false), 500);
    });
    graph.current.on('afterlayout', () => {
      graph.current.fitView(40, { onlyOutOfViewPort: true, direction: 'y' });
      // timer = setTimeout(() => setIsLoading(false), 100);
    });
  };

  return (
    <div className="childGraphRoot">
      {isLoading && (
        <div className="loading">
          <LoadingOutlined style={{ fontSize: 30 }} />
        </div>
      )}
      {!isLoading && (
        <div className="topNumber">
          {intl.get('global.entityClass')}：
          <span className="ad-c-primary ad-mr-1">{graphData?.entity_num || graphData?.entity?.length || 0}</span>
          {intl.get('global.ge')}
          <Divider type="vertical" />
          {intl.get('global.relationClass')}：
          <span className="ad-c-primary ad-mr-1">{graphData?.edge_num || graphData?.edge?.length || 0}</span>
          {intl.get('global.ge')}
        </div>
      )}
      <div className="childGraphContainer" ref={graphContainer} id="childGraphDetail" />
    </div>
  );
};
export default Subgraph;
