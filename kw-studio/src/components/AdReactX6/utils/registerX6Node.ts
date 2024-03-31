import { Graph, Markup } from '@antv/x6';
import { register } from '@antv/x6-react-shape';
import X6EntityNodeComponent from '../X6EntityNode/X6EntityNode';
import X6DataFileNodeComponent from '../X6DataFileNode/X6DataFileNode';
import X6RelationNodeComponent from '../X6RelationNode/X6RelationNode';
import X6RelationStartEndNodeComponent from '../X6RelationStartEndNode/X6RelationStartEndNode';
import X6ModelNodeComponent from '../X6ModelNode/X6ModelNode';
import X6ModelDirFileNodeComponent from '../X6ModelDirFileNode/X6ModelDirFileNode';
import {
  AdFileDirPortRight,
  AdFileDirPortRightPosition,
  AdHeaderEndPointPortLeft,
  AdHeaderEndPointPortRight,
  AdHeaderPortLeftPosition,
  AdHeaderPortRightPosition,
  AdHeaderStartPointPortRight,
  AdRowEndPointPortLeft,
  AdRowEndPointPortRight,
  AdRowPortLeftPosition,
  AdRowPortRightPosition,
  AdRowStartEndPortLeftPosition,
  AdRowStartEndPortRightPosition,
  AdRowStartPointPortLeft,
  AdRowStartPointPortRight,
  AdX6DataFileNode,
  AdX6DataFileNodeWidth,
  AdX6EntityNode,
  AdX6EntityNodeWidth,
  AdX6ModelDirFileNode,
  AdX6ModelNode,
  AdX6RelationEndNode,
  AdX6RelationNode,
  AdX6RelationNodeWidth,
  AdX6RelationStartEndNodeWidth,
  AdX6RelationStartNode
} from './constants';

/**
 * 注册X6用到的所有类型的节点
 */
const registerX6Node = () => {
  // Round starting point connection pile style
  const startPointPortStyle = {
    fo: {
      width: 10,
      height: 10,
      x: -5,
      y: -5,
      magnet: true
    }
  };

  // markup of circular terminal connecting piles
  const endPointPortMarkup = {
    tagName: 'circle',
    selector: 'circle',
    attrs: {
      r: 4,
      strokeWidth: 1,
      fill: '#fff',
      stroke: '#BFBFBF',
      magnet: true
    },
    className: 'kw-x6-end-point-port' // End point connection pile class name
  };

  const modelPointPortMarkup = {
    tagName: 'circle',
    selector: 'circle',
    attrs: {
      r: 0,
      strokeWidth: 1,
      fill: '#fff',
      stroke: '#BFBFBF',
      magnet: true
    },
    className: 'kw-x6-end-point-port' // End point connection pile class name
  };

  // Register entity node
  register({
    shape: AdX6EntityNode,
    width: AdX6EntityNodeWidth,
    component: X6EntityNodeComponent,
    portMarkup: [Markup.getForeignObjectMarkup()],
    // Configure node connection stubs
    ports: {
      // Two types of nodes connecting piles，Configure in groups
      groups: {
        // circle anchor point
        [AdRowStartPointPortRight]: {
          attrs: {
            ...startPointPortStyle
          },
          position: AdRowPortRightPosition
        }
      }
    }
  });

  // Register relationship class node
  register({
    shape: AdX6RelationNode,
    width: AdX6RelationNodeWidth,
    component: X6RelationNodeComponent,
    effect: ['data'],
    portMarkup: [Markup.getForeignObjectMarkup()],
    // Configure node connection stubs
    // @ts-ignore
    ports: {
      groups: {
        [AdRowStartPointPortLeft]: {
          attrs: {
            ...startPointPortStyle
          },
          position: AdRowPortLeftPosition
        },
        [AdRowEndPointPortLeft]: {
          markup: [endPointPortMarkup],
          position: AdRowPortLeftPosition
        },
        [AdRowStartPointPortRight]: {
          attrs: {
            ...startPointPortStyle
          },
          position: AdRowPortRightPosition
        },
        [AdRowEndPointPortRight]: {
          markup: [endPointPortMarkup],
          position: AdRowPortRightPosition
        },
        [AdHeaderStartPointPortRight]: {
          attrs: {
            ...startPointPortStyle
          },
          position: AdHeaderPortRightPosition
        }
      }
    }
  });

  // Register the starting node of the relationship class
  register({
    shape: AdX6RelationStartNode,
    width: AdX6RelationStartEndNodeWidth,
    component: X6RelationStartEndNodeComponent,
    portMarkup: [Markup.getForeignObjectMarkup()],
    // Configure node connection stubs
    ports: {
      // Two types of nodes connecting piles，Configure in groups
      groups: {
        // circle anchor point
        [AdRowStartPointPortLeft]: {
          attrs: {
            ...startPointPortStyle
          },
          position: AdRowStartEndPortLeftPosition
        }
      }
    }
  });

  // Register the end node of the relationship class
  register({
    shape: AdX6RelationEndNode,
    width: AdX6RelationStartEndNodeWidth,
    component: X6RelationStartEndNodeComponent,
    portMarkup: [Markup.getForeignObjectMarkup()],
    // Configure node connection stubs
    // @ts-ignore
    ports: {
      // Two types of nodes connecting piles，Configure in groups
      groups: {
        // circle anchor point
        [AdRowStartPointPortLeft]: {
          attrs: {
            ...startPointPortStyle
          },
          position: AdRowStartEndPortLeftPosition
        },
        [AdRowEndPointPortLeft]: {
          markup: [endPointPortMarkup],
          position: AdRowStartEndPortLeftPosition
        }
      }
    }
  });

  // Register data file node
  register({
    shape: AdX6DataFileNode,
    width: AdX6DataFileNodeWidth,
    component: X6DataFileNodeComponent,
    effect: ['data'],
    portMarkup: [Markup.getForeignObjectMarkup()],
    // Configure node connection stubs
    // @ts-ignore
    ports: {
      // Two types of nodes connecting piles，Configure in groups
      groups: {
        // circle anchor point
        [AdRowStartPointPortLeft]: {
          attrs: {
            ...startPointPortStyle
          },
          position: AdRowPortLeftPosition
        },
        [AdRowEndPointPortLeft]: {
          markup: [endPointPortMarkup],
          position: AdRowPortLeftPosition
        },
        [AdRowStartPointPortRight]: {
          attrs: {
            ...startPointPortStyle
          },
          position: AdRowPortRightPosition
        },
        [AdRowEndPointPortRight]: {
          markup: [endPointPortMarkup],
          position: AdRowPortRightPosition
        },
        [AdHeaderEndPointPortLeft]: {
          markup: [endPointPortMarkup],
          position: AdHeaderPortLeftPosition
        }
      }
    }
  });

  // Register model node
  register({
    shape: AdX6ModelNode,
    width: 300,
    component: X6ModelNodeComponent,
    // @ts-ignore
    ports: {
      groups: {
        [AdHeaderEndPointPortLeft]: {
          markup: [modelPointPortMarkup],
          position: AdHeaderPortLeftPosition
        }
      }
    }
  });

  // Register model files/folder nodes
  register({
    shape: AdX6ModelDirFileNode,
    width: AdX6EntityNodeWidth,
    component: X6ModelDirFileNodeComponent,
    effect: ['data'],
    // @ts-ignore
    ports: {
      groups: {
        [AdFileDirPortRight]: {
          markup: [endPointPortMarkup],
          position: AdFileDirPortRightPosition
        }
      }
    }
  });
};

export default registerX6Node;
