import React, { useState, useEffect, useRef } from 'react';
import { Tooltip } from 'antd';
import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import _ from 'lodash';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import G6 from '@antv/g6';
import HOOKS from '@/hooks';
import { registerIconNode } from '@/utils/antv6';
// import { registerToolTip } from '@/pages/KnowledgeNetwork/ExploreGraph/GraphG6/utils';
import './style.less';

const constructGraphData = (data: any): any => {
  const nodes = _.map(data?.nodes, (item: any) => {
    const { id, color, default_property, icon } = item;
    const label = default_property?.value || id;
    const node = {
      _sourceData: { ...item },
      id,
      icon,
      size: 30,
      label: label.length <= 15 ? label : `${label.slice(0, 15)}...`,
      style: { fill: color }
    };
    return node;
  });
  const edges = _.map(data?.edges, (item: any) => {
    const { id, color, relations, alias } = item;
    const source = item.source || relations?.[0];
    const target = item.target || relations?.[2];
    const isLoop = source === target; // 是否是 自闭环
    const label = alias || item?.class || item?.edge_class;
    const edge = {
      _sourceData: { ...item },
      id,
      label: label.length <= 15 ? label : `${label.slice(0, 15)}...`,
      color,
      source,
      target,
      loopCfg: isLoop ? { position: 'top', dist: 100 } : undefined,
      style: {
        lineAppendWidth: 14,
        endArrow: {
          fill: color,
          path: isLoop ? G6.Arrow.triangle(10, 12, 0) : G6.Arrow.triangle(10, 12, 25),
          d: isLoop ? 0 : 25
        }
      }
    };

    return edge;
  });
  G6.Util.processParallelEdges(edges, 30, 'quadratic', 'line', 'loop');
  return { nodes, edges };
};
const convertToPercentage = (rate: number) => {
  let percentage = Number(rate.toFixed(2)) * 100;
  if (percentage > 398) percentage = 400;
  return Number(percentage.toFixed(0));
};

const FREE_LAYOUT = {
  type: 'force',
  linkDistance: 150,
  nodeStrength: -80,
  edgeStrength: 1,
  collideStrength: 1,
  preventOverlap: true,
  alpha: 0.8,
  alphaDecay: 0.028,
  alphaMin: 0.01
};

const DAGRE_LAYOUT = {
  type: 'dagre',
  begin: [250, 60],
  rankdir: 'LR', // 可选，默认为图的中心
  align: 'DL', // 可选
  nodesep: 50, // 可选
  ranksep: 50 // 可选
};

export interface PreviewCanvasProps {
  graphData: { nodes: any[]; edges: any[] };
  layout: 'dagre' | 'free';
}

const PreviewCanvas = (props: PreviewCanvasProps) => {
  const { graphData, layout } = props;
  const graph = useRef<any>(null);
  const graphContainer = useRef<HTMLDivElement>(null);
  const containerSize = HOOKS.useSize(graphContainer);
  const [percentage, setPercentage] = useState<number>(100); // 画布缩放百分比

  useEffect(() => {
    drawGraph(layout);
  }, [layout]);

  useEffect(() => {
    if (!graphContainer.current) return;
    graph.current?.changeSize(graphContainer.current.clientWidth, graphContainer.current.clientHeight);
    setTimeout(() => {
      graph.current.fitView(0, { onlyOutOfViewPort: true, direction: 'y' });
    }, 0);
  }, [containerSize.width, containerSize.height]);

  useEffect(() => {
    const data = constructGraphData(graphData);
    graph?.current?.changeData(data);
  }, [graphData]);

  const drawGraph = (layout: PreviewCanvasProps['layout']) => {
    if (graph.current) graph.current.destroy();
    registerIconNode();
    graph.current = new G6.Graph({
      linkCenter: true,
      maxStep: 1000,
      container: graphContainer.current!,
      modes: {
        default: ['drag-canvas', 'drag-node', { type: 'zoom-canvas', minZoom: 0.24, maxZoom: 4.1, sensitivity: 1 }]
      },
      layout: layout === 'dagre' ? DAGRE_LAYOUT : FREE_LAYOUT,
      defaultNode: {
        type: 'icon-node',
        size: [30, 30],
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
    // registerToolTip(graph);
    graph.current?.get('canvas').set('localRefresh', false);
    graph.current?.render();
    graph.current.on('afterlayout', () => {
      graph.current.fitView(0, { onlyOutOfViewPort: true, direction: 'y' });
    });
    graph.current.on('wheelzoom', (aa: any) => {
      const zoom = graph.current.getZoom();
      setPercentage(convertToPercentage(zoom));
    });
  };

  const onZoomChange = (mark: string) => {
    const width = graphContainer.current?.clientWidth || 0;
    const height = graphContainer.current?.clientHeight || 0;
    if (mark === '100') {
      graph.current.zoomTo(1, { x: Math.floor(width / 2), y: Math.floor(height / 2) });
      setPercentage(100);
      return;
    }
    if (percentage >= 400 && percentage <= 25) return;
    if (mark === '+' && percentage < 400) {
      setPercentage(Math.min(percentage + 15, 400));
    }
    if (mark === '-' && percentage > 25) {
      setPercentage(Math.max(percentage - 15, 25));
    }
    const newRatio = mark === '+' ? 1.15 : 0.85;
    graph.current.zoom(newRatio, { x: Math.floor(width / 2), y: Math.floor(height / 2) });
  };

  return (
    <div className="sliced-preview-graph-root">
      <div className="top-tools kw-center">
        <div>
          <Tooltip title={intl.get('exploreGraph.zoomIn')}>
            <MinusOutlined
              className={classNames('kw-mr-4 kw-pointer', { disabled: percentage <= 25 })}
              style={{ fontSize: 18 }}
              onClick={() => onZoomChange('-')}
            />
          </Tooltip>
          <Tooltip title={intl.get('exploreGraph.resetZoom')}>
            <span className="kw-mr-4 kw-pointer" onClick={() => onZoomChange('100')}>{`${percentage}%`}</span>
          </Tooltip>
          <Tooltip title={intl.get('exploreGraph.zoomOut')}>
            <PlusOutlined
              className={classNames('kw-mr-4 kw-pointer', { disabled: percentage >= 400 })}
              style={{ fontSize: 18 }}
              onClick={() => onZoomChange('+')}
            />
          </Tooltip>
        </div>
      </div>
      <div className="container-div" ref={graphContainer} />
    </div>
  );
};
export default PreviewCanvas;
