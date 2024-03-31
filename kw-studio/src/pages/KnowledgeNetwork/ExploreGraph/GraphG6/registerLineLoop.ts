import _ from 'lodash';
import G6 from '@antv/g6';

import HELPER from '@/utils/helper';
import { fontSize, themeColor, edgeLineWidth } from './enums';

let index = 0;
const lineDash = [6];
const registerLineLoop = (name: string) => {
  G6.registerEdge(name, {
    draw(cfg: any, group: any) {
      const white = '#fff';
      const black = '#000000';
      const { curveOffset, offsetDiff, curveOffsetLeveL, startPoint, label, targetNode } = cfg;
      const {
        labelFill = black,
        strokeColor = themeColor,
        lineWidth = edgeLineWidth,
        labelBackgroundColor = white
      } = cfg?._sourceData || {};

      const layer = cfg?.layer || 3;
      const target = targetNode?.get('model');

      const nodeSize = target?._sourceData?.size || target?.size || 36;
      const { distance, dx } = { distance: curveOffset, dx: 12 };
      const R = nodeSize / 2;
      const dy = Math.sqrt(Math.max(R ** 2 - dx ** 2, 0));

      const RX = R * 2 * 0.5;
      const RY = R * 2 * 0.6;

      const path = [
        ['M', startPoint.x - dx, startPoint.y - dy],
        [
          'A',
          RX + distance, // rx
          RY + distance, // ry
          0, // x-axis-rotation
          1, // large-arc-flag
          1, // sweep-flag
          startPoint.x + dx,
          startPoint.y - dy
        ]
      ];

      const edgeMask = group.addShape('path', {
        zIndex: 100,
        draggable: true,
        name: 'edge-mask',
        attrs: {
          path,
          cursor: 'pointer',
          strokeOpacity: 0,
          stroke: strokeColor,
          lineAppendWidth: 9,
          lineWidth: lineWidth + 10
        }
      });
      group.addShape('path', {
        draggable: true,
        name: 'edge-halo',
        attrs: {
          path,
          strokeOpacity: 0,
          stroke: strokeColor,
          lineAppendWidth: 9,
          lineWidth: lineWidth + 10
        }
      });
      group.addShape('path', {
        draggable: true,
        name: 'edge-line',
        attrs: {
          path,
          lineWidth,
          lineDash: [0],
          strokeOpacity: 1,
          stroke: strokeColor,
          lineAppendWidth: 9,
          endArrow: {
            fill: strokeColor,
            path: 'M 0, 0 L 6, 10 L -3, 11 Z'
          }
        }
      });

      if (label && layer > 2) {
        const labels = _.filter(label.split('\n'), item => !!item);
        const calcWidth = Math.max(0, ..._.map(labels || [], item => HELPER.getLengthFromString(item, fontSize)));
        const calcHeight = fontSize * 1.4 * labels.length;

        const defaultWidth = 16;
        const positionX = startPoint?.x;
        const positionY = startPoint?.y - dy - nodeSize - curveOffsetLeveL * offsetDiff * 2;
        group.addShape('rect', {
          draggable: true,
          name: 'edge-label-background',
          attrs: {
            x: positionX - (calcWidth + defaultWidth) / 2,
            y: positionY - calcHeight + 3,
            width: calcWidth + defaultWidth,
            height: calcHeight,
            fill: labelBackgroundColor,
            stroke: labelBackgroundColor
          }
        });
        group.addShape('text', {
          draggable: true,
          name: 'edge-label',
          attrs: {
            x: positionX,
            y: positionY,
            fontSize,
            text: label,
            fill: labelFill,
            textAlign: 'center',
            fontFamily: 'sans-serif'
          }
        });
      }

      group.sort();
      return edgeMask;
    },
    setState(name, value, node: any) {
      const state = _.filter(node?._cfg?.states, item => item !== 'normal')[0];
      const item = node.getModel();
      const white = '#ffffff';
      const gray = 'rgba(223,223,223, 1)';
      const { strokeColor = themeColor, labelBackgroundColor = white } = item?._sourceData || {};

      const group: any = node.getContainer();
      const shapes = group?.get('children');

      let edgeHalo: any = null;
      let edgeLine: any = null;
      let edgeLabel: any = null;
      let edgeLabelBackground: any = null;
      _.forEach(shapes, item => {
        if (item.cfg.name === 'edge-halo') edgeHalo = item;
        if (item.cfg.name === 'edge-line') edgeLine = item;
        if (item.cfg.name === 'edge-label') edgeLabel = item;
        if (item.cfg.name === 'edge-label-background') edgeLabelBackground = item;
      });

      switch (state) {
        case '_shallow':
          edgeLine.attr({ opacity: 0.05 });
          edgeLabel && edgeLabel.attr({ opacity: 0.05 });
          edgeLabelBackground && edgeLabelBackground.attr({ opacity: 0.05 });
          break;
        case '_running':
          edgeLine.animate(
            () => {
              index++;
              if (index > 1000) index = 0;
              return { lineDash, lineDashOffset: -index };
            },
            { repeat: true, duration: 3000 }
          );
          break;
        case '_hover':
          edgeHalo.attr({ strokeOpacity: 0.2 });
          // edgeLine.animate(
          //   () => {
          //     index++;
          //     if (index > 1000) index = 0;
          //     return { lineDash, lineDashOffset: -index };
          //   },
          //   { repeat: true, duration: 3000 }
          // );
          break;
        case 'selected':
          // edgeLine.attr({ lineDash: [6] });
          edgeHalo.attr({ stroke: gray, strokeOpacity: 1 });
          edgeLabelBackground && edgeLabelBackground.attr({ fill: gray, stroke: gray });
          break;
        case '_focus':
          edgeHalo.attr({ stroke: gray, strokeOpacity: 1 });
          break;
        default:
          edgeHalo.attr({ stroke: strokeColor, strokeOpacity: 0 });
          edgeLine.attr({ opacity: 1, lineDash: [0] });
          edgeLabel && edgeLabel.attr({ opacity: 1 });
          if (edgeLabelBackground) {
            edgeLabelBackground.attr({ opacity: 1, fill: labelBackgroundColor, stroke: labelBackgroundColor });
          }
          edgeLine.stopAnimate();
          edgeLine.attr('lineDash', null);
          break;
      }
    }
  });
};

export const processLoopEdges = (edges: any, offsetDiff = 10) => {
  const loopOffset: any = {};
  return _.map(edges, item => {
    if (item.source === item.target) {
      const _id = `${item.source}_${item.target}`;
      if (loopOffset[_id]) {
        const curveOffset = loopOffset[_id] + 1;
        loopOffset[_id] = curveOffset;
        item.offsetDiff = offsetDiff;
        item.curveOffsetLeveL = curveOffset;
        item.curveOffset = curveOffset * offsetDiff;
      } else {
        const curveOffset = 1;
        loopOffset[_id] = curveOffset;
        item.offsetDiff = offsetDiff;
        item.curveOffsetLeveL = curveOffset;
        item.curveOffset = curveOffset * offsetDiff;
      }
    }
    return item;
  });
};
export default registerLineLoop;
