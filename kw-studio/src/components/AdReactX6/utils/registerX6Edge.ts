import { Graph, Markup } from '@antv/x6';
import {
  AdX6CurveConnector,
  AdX6ModelEdge,
  AdX6Edge,
  AdX6EdgeNoArrow,
  AdX6MindMapConnector,
  AdX6MindMapEdge
} from './constants';

/**
 * 注册X6用到的所有类型的边
 */
const registerX6Edges = () => {
  Graph.registerEdge(
    AdX6EdgeNoArrow,
    {
      inherit: 'edge',
      connector: {
        name: AdX6CurveConnector
      },
      attrs: {
        line: {
          stroke: '#C2C8D5',
          strokeWidth: 1,
          targetMarker: null
        }
      }
    },
    true
  );

  Graph.registerEdge(
    AdX6Edge,
    {
      inherit: 'edge',
      connector: {
        name: 'smooth'
      },
      attrs: {
        line: {
          stroke: '#C2C8D5',
          strokeWidth: 1,
          targetMarker: {
            name: 'block',
            size: 6
          }
        }
      }
    },
    true
  );

  Graph.registerEdge(
    AdX6ModelEdge,
    {
      inherit: 'edge',
      connector: { name: AdX6CurveConnector },
      attrs: {
        line: {
          stroke: '#C2C8D5',
          strokeWidth: 1,
          targetMarker: {
            name: 'block',
            size: 6
          }
        }
      }
    },
    true
  );

  Graph.registerEdge(
    AdX6MindMapEdge,
    {
      inherit: 'edge',
      connector: {
        name: AdX6MindMapConnector
      },
      attrs: {
        line: {
          targetMarker: null,
          stroke: '#C2C8D5',
          strokeWidth: 1
        }
      },
      zIndex: 0
    },
    true
  );
};

export default registerX6Edges;
