import React, { memo, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import _ from 'lodash';
import G6, { type Graph } from '@antv/g6';
import { toolTipWorkFlow } from '@/utils/antv6';
import registerNodeCircle from '@/pages/KnowledgeNetwork/OntologyLibrary/OntoCanvas/OntoG6/OntoCanvasG6/registerNodeCircle';
import { constructGraphData } from './assistant';

export interface PreviewCanvasProps {
  graphData: { nodes: any[]; edges: any[] };
  center?: boolean;
}

const graphLayout = {
  linkCenter: true,
  modes: {
    default: ['drag-canvas', 'zoom-canvas', 'drag-node']
  },
  layout: {
    type: 'force',
    linkDistance: 150,
    nodeStrength: -80,
    edgeStrength: 1,
    collideStrength: 1,
    preventOverlap: true,
    alpha: 0.8,
    alphaDecay: 0.028,
    alphaMin: 0.01
  },
  defaultNode: {
    type: 'customCircle',
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
};

const PreviewCanvas = (props: PreviewCanvasProps, ref: any) => {
  const { graphData, center } = props;
  const graph = useRef<Graph>();
  const container = useRef<HTMLDivElement>();

  useImperativeHandle(ref, () => ({
    graph: graph.current
  }));

  useEffect(() => {
    drawGraph();
    const resize = () => {
      if (!graph.current || !container.current) return;
      graph.current.changeSize(container.current.clientWidth, container.current.clientHeight);
    };
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    const theEdges = _.map(graphData.edges, edge => {
      return edge._sourceData;
    });
    const theNodes = _.map(graphData.nodes, node => {
      return node._sourceData;
    });
    const newGraph = constructGraphData({ nodes: theNodes, edges: theEdges });
    graph.current?.changeData(newGraph);
    graph.current?.refresh();
  }, [graphData]);

  const drawGraph = () => {
    registerNodeCircle('customCircle');
    graph.current = new G6.Graph({
      plugins: [toolTipWorkFlow()],
      container: container.current || '',
      ...graphLayout
    });
    graph.current.get('canvas').set('localRefresh', false);
    graph.current.read({ nodes: [], edges: [] });
    graph.current.on('afterlayout', () => {
      if (!container.current || !center) return;
      const { x, y } = graph.current!.getGraphCenterPoint();
      const { clientWidth, clientHeight } = container.current;
      graph.current?.translate(clientWidth / 2 - x, clientHeight / 2 - y, true, {
        duration: 300
      });
    });
  };

  return <div ref={container as any} className="kw-w-100 kw-h-100"></div>;
};

export * from './assistant';
export default memo(forwardRef(PreviewCanvas));
