import React, { useState, useEffect, useRef } from 'react';
import _ from 'lodash';
import G6 from '@antv/g6';
import classnames from 'classnames';
import { Select, Button } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

import { constructGraphData } from './assistant';

import './style.less';

const LAYOUT = {
  gForce: {
    type: 'gForce',
    minMovement: 0.9,
    nodeSpacing: 140,
    linkDistance: 400,
    nodeStrength: 2000,
    preventOverlap: true
  },
  concentric: {
    type: 'concentric',
    minNodeSpacing: 60,
    maxLevelDiff: 5,
    sortBy: 'mass',
    preventOverlap: true
  },
  circular: {
    type: 'circular',
    ordering: 'degree'
  },
  grid: {
    type: 'grid',
    begin: [20, 20],
    sortBy: 'color'
  },
  横图: {
    type: 'dagre',
    rankdir: 'LR',
    align: 'DL',
    nodesep: 20,
    ranksep: 50,
    controlPoints: true
  },
  竖图: {
    type: 'dagre',
    rankdir: 'TB',
    align: 'DL',
    nodesep: 20,
    ranksep: 50,
    controlPoints: true
  },
  comboForce: {
    type: 'comboForce',
    linkDistance: 100,
    nodeStrength: 100,
    edgeStrength: 0.1,
    nodeSpacing: 60,
    preventNodeOverlap: true,
    nodeCollideStrength: 1,
    comboSpacing: 100,
    preventComboOverlap: true,
    comboCollideStrength: 1
  }
};
const LAYOUT_KEYS = Object.keys(LAYOUT);

const GraphG6Layout = (props: any) => {
  const { className, graphData } = props;
  const graphContainer = useRef<HTMLDivElement>(null);
  const graph = useRef<any>(null);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    init(graphData);
  }, []);

  useEffect(() => {
    const data = constructGraphData(graphData);
    graph?.current?.changeData(data);
    setTimeout(() => {
      graph.current?.updateLayout(LAYOUT.gForce);
    });
  }, [graphData]);

  const init = (data: any) => {
    const width = graphContainer.current?.scrollWidth || 0;
    const height = graphContainer.current?.scrollHeight || 0;
    graph.current = new G6.Graph({
      width,
      height,
      linkCenter: true,
      container: graphContainer.current || '',
      modes: {
        default: ['drag-canvas', 'zoom-canvas', 'drag-node', 'drag-combo']
      },
      defaultNode: {
        type: 'circle',
        style: { cursor: 'pointer', stroke: 'white', lineWidth: 3 },
        labelCfg: { position: 'top', offset: 7, style: { fill: '#000' } }
      },
      defaultEdge: {
        size: 1,
        color: '#000',
        style: { cursor: 'pointer' },
        loopCfg: { cursor: 'pointer', position: 'top', dist: 100 },
        labelCfg: { cursor: 'pointer', autoRotate: true, refY: 7, style: { fill: '#000' } }
      }
    });

    // 关闭局部渲染，用于解决渲染阴影问题，但是对渲染性能有影响
    graph.current?.get('canvas').set('localRefresh', false);
    graph.current?.data(data);
    graph.current?.render();

    graph.current.on('beforelayout', () => {
      setIsLoading(true);
    });
    graph.current.on('afterlayout', () => {
      graph.current.fitView(40, { onlyOutOfViewPort: true, direction: 'y' });
      setTimeout(() => {
        setIsLoading(false);
      }, 1500);
    });
  };

  const switchGraphLayout = async (key: string) => {
    const layout = LAYOUT[key as keyof typeof LAYOUT];
    if (key === 'comboForce') {
      const combo_keys = _.keyBy(graphData.nodes, 'comboId');
      const combos = _.map(Object.keys(combo_keys), key => ({
        id: key,
        label: key
      }));
      const data = { ...constructGraphData(graphData), combos };
      graph.current?.changeData(data);
      graph.current?.updateLayout(layout);
    } else {
      graph.current?.updateLayout(layout);

      setTimeout(() => {
        const data = constructGraphData(graphData);
        graph?.current?.changeData(data);
      }, 1000);
    }
  };

  const onChange = (key: string) => {
    switchGraphLayout(key);
  };

  const getNodes = () => {
    const nodes = graph.current?.getNodes();
    const edges = graph.current?.getEdges();
  };

  return (
    <div className={classnames(className, 'graphG6Root')}>
      {isLoading && (
        <div className="loading">
          <LoadingOutlined style={{ fontSize: 30 }} />
        </div>
      )}
      <div className="graphHeader">
        <Select className="select" size="large" placeholder="切换布局" disabled={isLoading} onChange={onChange}>
          {_.map(LAYOUT_KEYS, key => (
            <Select.Option key={key}>{key}</Select.Option>
          ))}
        </Select>
        <Button disabled={isLoading} onClick={getNodes}>
          获取节点看看变化
        </Button>
      </div>
      <div className="graphContainer" ref={graphContainer} id="graphDetail"></div>
    </div>
  );
};

export default GraphG6Layout;
