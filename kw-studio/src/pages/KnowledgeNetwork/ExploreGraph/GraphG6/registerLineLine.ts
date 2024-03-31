import _ from 'lodash';
import G6 from '@antv/g6';

import HELPER from '@/utils/helper';
import { fontSize, themeColor, edgeLineWidth } from './enums';

let index = 0;
const lineDash = [6];
const registerLineLine = (name: string) => {
  G6.registerEdge(name, {
    draw(cfg: any, group: any) {
      const white = '#ffffff';
      const black = '#000000';
      const { startPoint, endPoint, sourceNode, targetNode, label } = cfg;
      const {
        labelFill = black,
        strokeColor = themeColor,
        lineWidth = edgeLineWidth,
        labelBackgroundColor = white
      } = cfg?._sourceData || {};

      const layer = cfg?.layer || 3;
      const source = sourceNode?.get('model');
      const target = targetNode?.get('model');
      const sourceSize = source?._sourceData?.size || source?.size || fontSize;
      const targetSize = target?._sourceData?.size || target?.size || fontSize;

      const _start = HELPER.getPositionBaseTwoPoint(startPoint, endPoint, sourceSize / 2);
      const _end = HELPER.getPositionBaseTwoPoint(endPoint, startPoint, targetSize / 2);

      const path = [
        ['M', _start.x, _start.y],
        ['L', _end.x, _end.y]
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
            path: 'M 2, 0 L 12, 5 L 12, -5 Z'
          }
        }
      });

      if (label && layer > 2) {
        const labels = _.filter(label.split('\n'), item => !!item);
        const calcWidth = Math.max(0, ..._.map(labels || [], item => HELPER.getLengthFromString(item, fontSize)));
        const calcHeight = fontSize * 1.4 * labels.length;

        const degree = Math.atan((endPoint.y - startPoint.y) / (endPoint.x - startPoint.x));
        const centerPoint = { x: (endPoint.x + startPoint.x) / 2, y: (endPoint.y + startPoint.y) / 2 };

        const defaultWidth = 16;
        const backgroundX = -(calcWidth + defaultWidth) / 2;
        const backgroundY = -calcHeight / 2;
        const edgeLabelBackground = group.addShape('rect', {
          draggable: true,
          name: 'edge-label-background',
          attrs: {
            x: backgroundX,
            y: backgroundY + calcHeight / 2 - lineWidth / 2,
            width: calcWidth + defaultWidth,
            height: lineWidth,
            fill: labelBackgroundColor,
            stroke: labelBackgroundColor
          }
        });
        edgeLabelBackground.rotate(degree);
        edgeLabelBackground.translate(centerPoint.x, centerPoint.y);

        const labelY = (fontSize * labels.length) / 2;
        const edgeLabel = group.addShape('text', {
          draggable: true,
          name: 'edge-label',
          attrs: {
            x: 0,
            y: labelY,
            fontSize,
            text: label,
            fill: labelFill,
            textAlign: 'center',
            fontFamily: 'sans-serif'
          }
        });
        edgeLabel.rotate(degree);
        edgeLabel.translate(centerPoint.x, centerPoint.y);
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
          break;
        case 'selected':
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

export default registerLineLine;
