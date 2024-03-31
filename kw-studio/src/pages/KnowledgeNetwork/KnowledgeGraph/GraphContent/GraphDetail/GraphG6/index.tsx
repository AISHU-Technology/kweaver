import React, { useRef, useState, useEffect } from 'react';
import _ from 'lodash';
import G6 from '@antv/g6';
import { LoadingOutlined } from '@ant-design/icons';

import IconPreRender from '@/components/IconPreRender';

import { registerEdgeActivate, registerNodeActivate, tooltip, registerIconNode } from '@/utils/antv6';
import { constructGraphData } from '../assistant';
import Tools from './Tools';

import './style.less';

let timer: any = null;
const GraphG6 = (props: any) => {
  const { graphData, onChangeData } = props;
  const graphContainer = useRef<HTMLDivElement>(null);
  const graph = useRef<any>(null);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    drawGraph();

    return () => {
      clearTimeout(timer);
    };
  }, []);
  useEffect(() => {
    const data = constructGraphData(graphData);
    graph.current?.changeData(data);
    setTimeout(() => {
      graph.current.paint();
    }, 100);
  }, [graphData]);

  const drawGraph = () => {
    registerEdgeActivate('activate-edge');
    registerNodeActivate('activate-node');
    registerIconNode();
    graph.current = new G6.Graph({
      linkCenter: true,
      plugins: [tooltip()],
      container: graphContainer.current || '',
      modes: { default: ['drag-canvas', 'zoom-canvas', 'drag-node', 'activate-edge', 'activate-node'] },
      layout: {
        type: 'gForce',
        minMovement: 0.6,
        nodeSpacing: 140,
        linkDistance: 400,
        nodeStrength: 2000,
        preventOverlap: true,
        coulombDisScale: 0.008
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
    graph.current.render();

    graph.current.on('beforelayout', () => {
      setIsLoading(true);
    });
    graph.current.on('afterlayout', () => {
      graph.current.fitView(40, { onlyOutOfViewPort: true, direction: 'y' });
      timer = setTimeout(() => setIsLoading(false), 300);
    });
    graph.current.on('node:click', (data: any) => {
      const item = data?.item?.getModel();
      onChangeData({ type: 'entity', data: item?._sourceData });
    });
    graph.current.on('edge:click', (data: any) => {
      const item = data?.item?.getModel();
      onChangeData({ type: 'edge', data: item?._sourceData });
    });
    graph.current.on('canvas:click', (data: any) => {
      onChangeData({});
    });
  };

  return (
    <div className="detail-graphG6Root">
      <IconPreRender />

      {isLoading && (
        <div className="loading">
          <LoadingOutlined style={{ fontSize: 30 }} />
        </div>
      )}
      <Tools graph={graph} />
      <div className="graphContainer" ref={graphContainer} id="graphDetail" />
    </div>
  );
};

export default GraphG6;
