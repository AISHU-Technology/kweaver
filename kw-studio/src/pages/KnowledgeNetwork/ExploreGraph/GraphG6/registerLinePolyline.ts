import G6 from '@antv/g6';
import _ from 'lodash';

import HELPER from '@/utils/helper';
import { fontSize, themeColor, edgeLineWidth } from './enums';

// const lineDash = [6];
const registerLinePolyline = (name: string) => {
  G6.registerEdge(name, {
    draw(cfg: any, group: any) {
      const white = '#ffffff';
      const black = '#000000';
      const { style, label, startPoint, endPoint } = cfg;
      const {
        labelFill = black,
        strokeColor = 'rgba(214,214,214,1)',
        labelBackgroundColor = white
      } = cfg?._sourceData || {};

      const layer = cfg?.layer || 3;
      const direction = cfg?._direction || 'RL';
      const treeGroupStrokeColor = cfg.isGroup ? 'rgba(214,214,214,1)' : strokeColor;

      let turningPointX1 = 0;
      let turningPointY1 = 0;

      let turningPointX2 = 0;
      let turningPointY2 = 0;

      if (direction === 'LR') {
        const tem = (endPoint.x - startPoint.x) / 3;
        turningPointX1 = startPoint.x + tem;
        turningPointY1 = startPoint.y;
        turningPointX2 = startPoint.x + tem;
        turningPointY2 = endPoint.y;
      }
      if (direction === 'RL') {
        const tem = (endPoint.x - startPoint.x) / 3;
        turningPointX1 = startPoint.x + tem;
        turningPointY1 = startPoint.y;
        turningPointX2 = startPoint.x + tem;
        turningPointY2 = endPoint.y;
      }
      if (direction === 'TB') {
        const tem = (endPoint.y - startPoint.y) / 2;
        turningPointX1 = startPoint.x;
        turningPointY1 = startPoint.y + tem;
        turningPointX2 = endPoint.x;
        turningPointY2 = startPoint.y + tem;
      }
      if (direction === 'BT') {
        const tem = (endPoint.y - startPoint.y) / 2;
        turningPointX1 = startPoint.x;
        turningPointY1 = startPoint.y + tem;
        turningPointX2 = endPoint.x;
        turningPointY2 = startPoint.y + tem;
      }

      const path = [
        ['M', startPoint.x, startPoint.y],
        ['L', turningPointX1, turningPointY1],
        ['L', turningPointX2, turningPointY2],
        ['L', endPoint.x, endPoint.y]
      ];
      group.addShape('path', {
        name: 'edge-line',
        attrs: {
          path,
          lineWidth: 0.75,
          endArrow: style.endArrow,
          stroke: treeGroupStrokeColor
        }
      });
      group.addShape('path', {
        draggable: true,
        name: 'edge-halo',
        attrs: {
          path,
          opacity: 0,
          lineWidth: 5,
          fillOpacity: 0,
          cursor: 'pointer',
          lineAppendWidth: 9,
          stroke: treeGroupStrokeColor
        }
      });

      if (label && layer > 2) {
        const labels = _.filter(label.split('\n'), item => !!item);
        const calcWidth = Math.max(0, ..._.map(labels || [], item => HELPER.getLengthFromString(item, fontSize)));
        const calcHeight = fontSize * 1.4 * labels.length;

        const defaultWidth = 16;
        const backWidth = calcWidth + defaultWidth;
        group.addShape('rect', {
          draggable: true,
          name: 'edge-label-background',
          attrs: {
            x: (turningPointX2 + endPoint.x + 20) / 2 - backWidth / 2,
            y: endPoint.y - calcHeight / 2,
            width: backWidth,
            height: calcHeight,
            fill: labelBackgroundColor,
            stroke: labelBackgroundColor
          }
        });

        group.addShape('text', {
          draggable: true,
          name: 'edge-label',
          attrs: {
            x: (turningPointX2 + endPoint.x + 20) / 2,
            y: endPoint.y + (fontSize * labels.length) / 2,
            fontSize,
            text: label,
            fill: labelFill,
            textAlign: 'center',
            fontFamily: 'sans-serif'
          }
        });
      }

      const keyShape = group.addShape('path', {
        name: 'edge-mask',
        attrs: {
          path,
          opacity: 0,
          lineWidth: 5,
          fillOpacity: 0,
          cursor: 'pointer',
          lineAppendWidth: 9,
          stroke: treeGroupStrokeColor
        }
      });

      return keyShape;
    },
    setState(name: any, value: any, edge: any) {
      const state = edge?._cfg?.states?.[0];
      const item = edge.getModel();
      const { strokeColor = themeColor } = item?._sourceData || {};
      const treeGroupStrokeColor = item.isGroup ? 'rgba(214,214,214,1)' : strokeColor;

      const group: any = edge.getContainer();
      const shapes = group?.get('children');
      let edgeLine: any = null;
      let edgeHalo: any = null;
      _.forEach(shapes, item => {
        if (item.cfg.name === 'edge-line') edgeLine = item;
        if (item.cfg.name === 'edge-halo') edgeHalo = item;
      });

      // let index = 0;
      switch (state) {
        case '_hover':
          edgeHalo.attr({ opacity: 0.2 });
          // edgeLine.animate(
          //   () => {
          //     index++;
          //     if (index > 10000) index = 0;
          //     const res = { lineDash, lineDashOffset: -index };
          //     return res;
          //   },
          //   { repeat: true, duration: 30000 }
          // );
          break;
        default:
          edgeLine.stopAnimate();
          edgeLine.attr('lineDash', null);
          edgeHalo.attr({ stroke: treeGroupStrokeColor, opacity: 0 });
          break;
      }
    }
  });
};

export default registerLinePolyline;
