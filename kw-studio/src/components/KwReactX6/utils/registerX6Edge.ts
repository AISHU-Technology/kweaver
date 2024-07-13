import { Graph } from '@antv/x6';
import {
  KwX6CurveConnector,
  KwX6ModelEdge,
  KwX6Edge,
  KwX6EdgeNoArrow,
  KwX6MindMapConnector,
  KwX6MindMapEdge
} from './constants';

/**
 * 注册X6用到的所有类型的边
 */
const registerX6Edges = () => {
  Graph.registerEdge(
    KwX6EdgeNoArrow,
    {
      inherit: 'edge',
      connector: {
        name: KwX6CurveConnector
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
    KwX6Edge,
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
    KwX6ModelEdge,
    {
      inherit: 'edge',
      connector: { name: KwX6CurveConnector },
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
    KwX6MindMapEdge,
    {
      inherit: 'edge',
      connector: {
        name: KwX6MindMapConnector
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
