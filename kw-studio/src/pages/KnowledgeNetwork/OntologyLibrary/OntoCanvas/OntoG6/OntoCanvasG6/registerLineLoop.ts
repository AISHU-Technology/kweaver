import _ from 'lodash';
import G6 from '@antv/g6';

import HELPER from '@/utils/helper';
import { fontSize, themeColor, edgeLineWidth } from './enums';
import { getIconCode } from '@/utils/antv6';

const registerLineLoop = (name: string) => {
  G6.registerEdge(name, {
    draw(cfg: any, group: any) {
      const black = '#000000';
      // const backColor = '#f8f8f8';
      const {
        color,
        curveOffset,
        offsetDiff,
        curveOffsetLeveL,
        startPoint,
        label,
        targetNode,
        sourceNode,
        endPoint,
        backColor
      } = cfg;
      const {
        labelFill = black,
        strokeColor = color || themeColor,
        lineWidth = edgeLineWidth,
        labelBackgroundColor = backColor,
        hasError,
        hasRelationDataFile,
        hasWarn
      } = cfg?._sourceData || {};

      const target = targetNode?.get('model');

      const nodeSize = target?._sourceData?.size || target?.size || 36;
      const { distance, dx } = { distance: curveOffset, dx: 12 };
      const R = nodeSize / 2;
      const dy = Math.sqrt(Math.max(R ** 2 - dx ** 2, 0));

      const RX = R * 2 * 0.5;
      const RY = R * 2 * 0.6;

      let path;
      if (cfg.isAdding) {
        const source = sourceNode?.get('model');
        const sourceSize = source?._sourceData?.size || source?.size || fontSize;
        const targetSize = target?._sourceData?.size || target?.size || fontSize;

        const _start = HELPER.getPositionBaseTwoPoint(startPoint, endPoint, sourceSize / 2);
        const _end = HELPER.getPositionBaseTwoPoint(endPoint, startPoint, targetSize / 2);

        path = [
          ['M', _start.x, _start.y],
          ['L', _end.x, _end.y]
        ];
      } else {
        path = [
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
      }

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
          lineWidth: Number(lineWidth) + 10
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
          lineWidth: Number(lineWidth) + 4
        }
      });
      group.addShape('path', {
        draggable: true,
        name: 'edge-line',
        attrs: {
          path,
          lineWidth: Number(lineWidth),
          lineDash: [0],
          strokeOpacity: 1,
          stroke: strokeColor,
          lineAppendWidth: 9,
          endArrow: cfg.isAdding
            ? {
                fill: strokeColor,
                path: 'M 2, 0 L 10, 4 L 10, -4 Z'
              }
            : {
                fill: strokeColor,
                path: 'M 0, 0 L 6, 10 L -3, 11 Z'
              }
        }
      });

      if (label) {
        const labels = _.filter(label.split('\n'), item => !!item);
        const calcWidth = Math.max(
          0,
          ..._.map(labels || [], item =>
            HELPER.getLengthFromString(item.length > 15 ? item.substring(0, 14) + '...' : item, fontSize)
          )
        );
        const calcHeight = fontSize * 1.4 * labels.length;

        const defaultWidth = 16;
        const positionX = startPoint?.x;
        const positionY = startPoint?.y - dy - nodeSize - curveOffsetLeveL * offsetDiff * 2;
        if (hasError?.length) {
          const errIconFontSize = 14;
          group.addShape('rect', {
            draggable: true,
            name: 'edge-label-background',
            attrs: {
              x: positionX - (calcWidth + defaultWidth + errIconFontSize) / 2,
              y: positionY - calcHeight + 3,
              width: calcWidth + defaultWidth + errIconFontSize,
              height: errIconFontSize,
              fill: HELPER.hexToRgba('#FFE5E7'),
              radius: [errIconFontSize / 2]
            }
          });
        } else {
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
        }
        group.addShape('text', {
          draggable: true,
          name: 'edge-label',
          attrs: {
            x: positionX,
            y: positionY,
            fontSize,
            text: label.length > 15 ? label.substring(0, 14) + '...' : label,
            fill: labelFill,
            textAlign: 'center',
            fontFamily: 'sans-serif'
          }
        });
      }

      if (hasError?.length) {
        const labels = _.filter(label?.split('\n'), item => !!item);
        const calcWidth = Math.max(
          0,
          ..._.map(labels || [], item =>
            HELPER.getLengthFromString(item.length > 15 ? item.substring(0, 14) + '...' : item, fontSize)
          )
        );
        const calcHeight = fontSize * 1.4 * labels.length;

        const defaultWidth = 16;
        const positionX = startPoint?.x;
        const positionY = startPoint?.y - dy - nodeSize - curveOffsetLeveL * offsetDiff * 2;

        const errIconFontSize = 14;
        if (!label) {
          group.addShape('rect', {
            draggable: true,
            name: 'edge-label-background',
            attrs: {
              x: positionX - (calcWidth + defaultWidth + errIconFontSize) / 2,
              y: positionY - calcHeight - errIconFontSize,
              width: calcWidth + defaultWidth + errIconFontSize,
              height: errIconFontSize,
              fill: HELPER.hexToRgba('#FFE5E7'),
              radius: [errIconFontSize / 2]
            }
          });
        }
        group.addShape('text', {
          name: 'error-icon',
          attrs: {
            x: positionX - (calcWidth + errIconFontSize / 2) / 2,
            y: positionY,
            fontFamily: 'iconfont',
            textAlign: 'center',
            text: getIconCode('graph-warning1'),
            fontSize: errIconFontSize,
            fill: 'rgba(255,0,0,1)'
          }
        });
      }

      if ((hasRelationDataFile || hasWarn) && !hasError?.length) {
        const labels = _.filter(label?.split('\n'), item => !!item);
        const calcWidth = Math.max(
          0,
          ..._.map(labels || [], item =>
            HELPER.getLengthFromString(item.length > 15 ? item.substring(0, 14) + '...' : item, fontSize)
          )
        );
        const calcHeight = fontSize * 1.4 * labels.length;

        const defaultWidth = 16;
        const positionX = startPoint?.x;
        const positionY = startPoint?.y - dy - nodeSize - curveOffsetLeveL * offsetDiff * 2;

        const errIconFontSize = 14;
        if (!label) {
          group.addShape('rect', {
            draggable: true,
            name: 'edge-label-background',
            attrs: {
              x: positionX - (calcWidth + defaultWidth + errIconFontSize) / 2,
              y: positionY - calcHeight - errIconFontSize,
              width: calcWidth + defaultWidth + errIconFontSize,
              height: errIconFontSize,
              fill: HELPER.hexToRgba(hasWarn ? '#FAAD14' : '#52c41a'),
              radius: [errIconFontSize / 2]
            }
          });
        }
        group.addShape('image', {
          name: 'node-pass-sign',
          draggable: true,
          attrs: {
            x: positionX + calcWidth / 2,
            y: positionY - calcHeight,
            img: hasWarn ? require('@/assets/images/warning.svg') : require('@/assets/images/duigou.svg'),
            width: 10,
            height: 10,
            cursor: 'pointer'
          }
        });
      }

      group.sort();
      return edgeMask;
    },
    setState(name, value, node: any) {
      const state = _.filter(node?._cfg?.states, item => item !== 'normal')[0];
      const item = node.getModel();
      const { lineWidth = edgeLineWidth, strokeColor } = item?._sourceData || {};

      const group: any = node.getContainer();
      const shapes = group?.get('children');

      let edgeMask: any = null;
      let edgeHalo: any = null;
      let edgeLine: any = null;
      let edgeLabel: any = null;
      let edgeLabelBackground: any = null;
      let edgeErrIcon: any = null;
      let nodePassSign: any = null;
      _.forEach(shapes, item => {
        if (item.cfg.name === 'edge-mask') edgeMask = item;
        if (item.cfg.name === 'edge-halo') edgeHalo = item;
        if (item.cfg.name === 'edge-line') edgeLine = item;
        if (item.cfg.name === 'edge-label') edgeLabel = item;
        if (item.cfg.name === 'edge-label-background') edgeLabelBackground = item;
        if (item.cfg.name === 'error-icon') edgeErrIcon = item;
        if (item.cfg.name === 'node-pass-sign') nodePassSign = item;
      });

      const maskLineWidth = Number(lineWidth) + 10;
      const maskLineAppendWidth = 9;
      const haloLineWidth = Number(lineWidth) + 4;
      const haloLineAppendWidth = 9;
      const lineLineWidth = Number(lineWidth);
      const lineLineAppendWidth = 9;

      switch (state) {
        case '_hover':
          edgeHalo && edgeHalo.attr({ strokeOpacity: 0.2, stroke: strokeColor });
          break;
        case '_active':
          edgeMask && edgeMask.attr({ lineWidth: maskLineWidth + 3, lineAppendWidth: maskLineAppendWidth + 3 });
          edgeHalo &&
            edgeHalo.attr({
              lineWidth: haloLineWidth + 3,
              lineAppendWidth: haloLineAppendWidth + 3,
              stroke: '#000000',
              strokeOpacity: 0.1
            });
          edgeLine && edgeLine.attr({ lineWidth: lineLineWidth + 1, lineAppendWidth: lineLineAppendWidth + 1 });
          break;
        case '_hide':
          edgeMask && edgeMask.attr({ strokeOpacity: 0 });
          edgeHalo && edgeHalo.attr({ strokeOpacity: 0, stroke: strokeColor });
          edgeLine && edgeLine.attr({ strokeOpacity: 0.1 });
          edgeLabel && edgeLabel.attr({ opacity: 0.1 });
          edgeLabelBackground && edgeLabelBackground.attr({ opacity: 0.1 });
          edgeErrIcon && edgeErrIcon.attr({ opacity: 0.1 });
          nodePassSign && nodePassSign.attr({ opacity: 0.1 });
          break;
        default:
          edgeMask && edgeMask.attr({ lineAppendWidth: 9, lineWidth: Number(lineWidth) + 10, strokeOpacity: 0 });
          edgeHalo &&
            edgeHalo.attr({
              lineAppendWidth: 9,
              lineWidth: Number(lineWidth) + 4,
              strokeOpacity: 0,
              stroke: strokeColor
            });
          edgeLine && edgeLine.attr({ lineWidth: Number(lineWidth), lineAppendWidth: 9, strokeOpacity: 1 });
          edgeLabel && edgeLabel.attr({ opacity: 1 });
          edgeLabelBackground && edgeLabelBackground.attr({ opacity: 1 });
          nodePassSign && nodePassSign.attr({ opacity: 1 });
          break;
      }
    }
  });
};

export const processLoopEdges = (edges: any, offsetDiff = 10) => {
  const loopOffset: any = {};
  _.forEach(edges, item => {
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
  });
};
export default registerLineLoop;
