import React, { useRef, useState, useEffect } from 'react';
import _ from 'lodash';
import G6 from '@antv/g6';
import { Select } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

import { registerEdgeActivate, registerNodeActivate, tooltip } from '@/utils/antv6';

import { constructGraphData } from './assistant';
import { LAYOUT, LayoutKeyType } from './layoutSource';

import './style.less';

const GraphG6 = (props: any) => {
  const { graphData, onChangeData } = props;
  const graphContainer = useRef<HTMLDivElement>(null);
  const graph = useRef<any>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [layout, setLayout] = useState<LayoutKeyType>('gForce');
  const layoutRef = useRef<any>('gForce');

  useEffect(() => {
    drawGraph();
  }, []);

  useEffect(() => {
    graph.current.clear();
    layoutRef.current = layout;
    const data = constructGraphData(graphData, {
      nodesConfig: LAYOUT[layout].position,
      layoutType: LAYOUT[layout].option.type
    });
    graph?.current?.changeData(data);
    setTimeout(() => {
      graph.current?.updateLayout(LAYOUT[layout].option);
    });
  }, [layout]);

  useEffect(() => {
    const data = constructGraphData(graphData, {
      layoutType: 'gForce'
    });
    graph?.current?.changeData(data);
    graph.current?.updateLayout(LAYOUT[layout].option);
  }, [graphData]);

  const drawGraph = () => {
    registerEdgeActivate('activate-edge');
    registerNodeActivate('activate-node');
    graph.current = new G6.Graph({
      linkCenter: true,
      plugins: [tooltip()],
      container: graphContainer.current || '',
      modes: { default: ['drag-canvas', 'drag-node', 'zoom-canvas', 'activate-edge', 'activate-node'] },
      defaultNode: {
        type: 'circle',
        style: { cursor: 'pointer', stroke: 'white', lineWidth: 3 },
        labelCfg: { position: 'top', offset: 7, style: { fill: '#000' } }
      },
      defaultEdge: {
        size: 1,
        color: '#000',
        style: { cursor: 'pointer', lineAppendWidth: 20 },
        loopCfg: { cursor: 'pointer', position: 'top', dist: 100 },
        labelCfg: { cursor: 'pointer', autoRotate: true, refY: 7, style: { fill: '#000' } }
      }
    });

    graph.current?.get('canvas').set('localRefresh', false);
    graph.current?.render();

    graph.current.on('beforelayout', () => {
      setIsLoading(true);
    });
    graph.current.on('afterlayout', () => {
      const nodes = graph.current.getNodes();
      const edges = graph.current.getEdges();
      const graphLayout = graph.current.cfg.layout.type;

      const nodeKV: any = {};
      _.forEach(nodes, d => {
        const item = d.getModel();
        nodeKV[item.id] = item;
      });

      const newOption: any = { type: 'line' };
      _.forEach(edges, d => {
        const item = d.getModel();
        const source = item.source;
        const target = item.target;
        const nodeS = nodeKV?.[source] || {};
        const nodeT = nodeKV?.[target] || {};
        if (graphLayout === 'dagre') {
          if (item.type !== 'loop') {
            if (nodeS?.x === nodeT?.x || nodeS?.y === nodeT?.y) {
              newOption.type = 'line';
            } else {
              newOption.type = 'polyline';
            }
            d.update({ ...item, ...newOption });
          }
        } else {
          if (source === target) {
            newOption.type = 'loop';
            newOption.loopCfg = { position: 'top', dist: 50 };
          } else {
            newOption.type = 'line';
          }
          d.update({ ...item, ...newOption });
        }
      });
    });
    graph.current.on('afterlayout', () => {
      graph.current.fitView(40, { onlyOutOfViewPort: true, direction: 'y' });
      setTimeout(() => setIsLoading(false), 1000);
    });
    graph.current.on('afterlayout', () => {
      const layout = LAYOUT[layoutRef.current as LayoutKeyType];
      if (graph.current.cfg.layout.type === layout.option.type) {
        // 记录点位信息
        const prePosition = {};
        _.forEach(graph.current?.getNodes(), d => {
          const item = d.getModel();
          (prePosition as any)[item.id] = { fx: item.x, fy: item.y };
        });
        if (layout.option.type === 'dagre') {
          if (graph.current.cfg.layout.rankdir === 'LR') {
            LAYOUT.dagreLR.position = prePosition;
          }
          if (graph.current.cfg.layout.rankdir === 'TB') {
            LAYOUT.dagreLR.position = prePosition;
          }
        } else {
          LAYOUT[layoutRef.current as LayoutKeyType].position = prePosition;
        }
      }
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

  const onChangeLayout = (key: LayoutKeyType) => {
    setLayout(key);
  };

  return (
    <div className="graphG6Root">
      {isLoading && (
        <div className="loading">
          <LoadingOutlined style={{ fontSize: 30 }} />
        </div>
      )}
      <div className="graphHeader">
        <Select className="select" size="large" placeholder="切换布局" disabled={isLoading} onChange={onChangeLayout}>
          {_.map(Object.keys(LAYOUT), (key: LayoutKeyType) => {
            const item = LAYOUT[key];
            return <Select.Option key={key}>{item.name}</Select.Option>;
          })}
        </Select>
      </div>
      <div className="graphContainer" ref={graphContainer} id="graphDetail" />
    </div>
  );
};

export default GraphG6;
