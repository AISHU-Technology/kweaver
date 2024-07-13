import { Markup } from '@antv/x6';
import { register } from '@antv/x6-react-shape';
import X6EntityNodeComponent from '../X6EntityNode';
import X6DataFileNodeComponent from '../X6DataFileNode';
import X6RelationNodeComponent from '../X6RelationNode';
import X6RelationStartEndNodeComponent from '../X6RelationStartEndNode';
import X6ModelNodeComponent from '../X6ModelNode';
import X6ModelDirFileNodeComponent from '../X6ModelDirFileNode';
import {
  KwFileDirPortRight,
  KwFileDirPortRightPosition,
  KwHeaderEndPointPortLeft,
  KwHeaderPortLeftPosition,
  KwHeaderPortRightPosition,
  KwHeaderStartPointPortRight,
  KwRowEndPointPortLeft,
  KwRowEndPointPortRight,
  KwRowPortLeftPosition,
  KwRowPortRightPosition,
  KwRowStartEndPortLeftPosition,
  KwRowStartPointPortLeft,
  KwRowStartPointPortRight,
  KwX6DataFileNode,
  KwX6DataFileNodeWidth,
  KwX6EntityNode,
  KwX6EntityNodeWidth,
  KwX6ModelDirFileNode,
  KwX6ModelNode,
  KwX6RelationEndNode,
  KwX6RelationNode,
  KwX6RelationNodeWidth,
  KwX6RelationStartEndNodeWidth,
  KwX6RelationStartNode
} from './constants';

/**
 * 注册X6用到的所有类型的节点
 */
const registerX6Node = () => {
  const startPointPortStyle = {
    fo: {
      width: 10,
      height: 10,
      x: -5,
      y: -5,
      magnet: true
    }
  };

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
    className: 'kw-x6-end-point-port'
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
    className: 'kw-x6-end-point-port'
  };

  register({
    shape: KwX6EntityNode,
    width: KwX6EntityNodeWidth,
    component: X6EntityNodeComponent,
    portMarkup: [Markup.getForeignObjectMarkup()],
    ports: {
      groups: {
        [KwRowStartPointPortRight]: {
          attrs: {
            ...startPointPortStyle
          },
          position: KwRowPortRightPosition
        }
      }
    }
  });

  register({
    shape: KwX6RelationNode,
    width: KwX6RelationNodeWidth,
    component: X6RelationNodeComponent,
    effect: ['data'],
    portMarkup: [Markup.getForeignObjectMarkup()],
    // @ts-ignore
    ports: {
      groups: {
        [KwRowStartPointPortLeft]: {
          attrs: {
            ...startPointPortStyle
          },
          position: KwRowPortLeftPosition
        },
        [KwRowEndPointPortLeft]: {
          markup: [endPointPortMarkup],
          position: KwRowPortLeftPosition
        },
        [KwRowStartPointPortRight]: {
          attrs: {
            ...startPointPortStyle
          },
          position: KwRowPortRightPosition
        },
        [KwRowEndPointPortRight]: {
          markup: [endPointPortMarkup],
          position: KwRowPortRightPosition
        },
        [KwHeaderStartPointPortRight]: {
          attrs: {
            ...startPointPortStyle
          },
          position: KwHeaderPortRightPosition
        }
      }
    }
  });

  register({
    shape: KwX6RelationStartNode,
    width: KwX6RelationStartEndNodeWidth,
    component: X6RelationStartEndNodeComponent,
    portMarkup: [Markup.getForeignObjectMarkup()],
    ports: {
      groups: {
        [KwRowStartPointPortLeft]: {
          attrs: {
            ...startPointPortStyle
          },
          position: KwRowStartEndPortLeftPosition
        }
      }
    }
  });

  register({
    shape: KwX6RelationEndNode,
    width: KwX6RelationStartEndNodeWidth,
    component: X6RelationStartEndNodeComponent,
    portMarkup: [Markup.getForeignObjectMarkup()],
    // @ts-ignore
    ports: {
      groups: {
        [KwRowStartPointPortLeft]: {
          attrs: {
            ...startPointPortStyle
          },
          position: KwRowStartEndPortLeftPosition
        },
        [KwRowEndPointPortLeft]: {
          markup: [endPointPortMarkup],
          position: KwRowStartEndPortLeftPosition
        }
      }
    }
  });

  register({
    shape: KwX6DataFileNode,
    width: KwX6DataFileNodeWidth,
    component: X6DataFileNodeComponent,
    effect: ['data'],
    portMarkup: [Markup.getForeignObjectMarkup()],
    // @ts-ignore
    ports: {
      groups: {
        [KwRowStartPointPortLeft]: {
          attrs: {
            ...startPointPortStyle
          },
          position: KwRowPortLeftPosition
        },
        [KwRowEndPointPortLeft]: {
          markup: [endPointPortMarkup],
          position: KwRowPortLeftPosition
        },
        [KwRowStartPointPortRight]: {
          attrs: {
            ...startPointPortStyle
          },
          position: KwRowPortRightPosition
        },
        [KwRowEndPointPortRight]: {
          markup: [endPointPortMarkup],
          position: KwRowPortRightPosition
        },
        [KwHeaderEndPointPortLeft]: {
          markup: [endPointPortMarkup],
          position: KwHeaderPortLeftPosition
        }
      }
    }
  });

  register({
    shape: KwX6ModelNode,
    width: 300,
    component: X6ModelNodeComponent,
    // @ts-ignore
    ports: {
      groups: {
        [KwHeaderEndPointPortLeft]: {
          markup: [modelPointPortMarkup],
          position: KwHeaderPortLeftPosition
        }
      }
    }
  });

  register({
    shape: KwX6ModelDirFileNode,
    width: KwX6EntityNodeWidth,
    component: X6ModelDirFileNodeComponent,
    effect: ['data'],
    // @ts-ignore
    ports: {
      groups: {
        [KwFileDirPortRight]: {
          markup: [endPointPortMarkup],
          position: KwFileDirPortRightPosition
        }
      }
    }
  });
};

export default registerX6Node;
