import _ from 'lodash';
import G6 from '@antv/g6';

import HELPER from '@/utils/helper';
import { fontSize, themeColor, edgeLineWidth } from './enums';
import { getIconCode } from '@/utils/antv6';

const getPolyEdgeControlPoint = (p1: any, p2: any, d: number) => {
  const pm = {
    x: (p2.x + p1.x) / 2,
    y: (p2.y + p1.y) / 2
  };
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const c = Math.sqrt(dx ** 2 + dy ** 2);
  const y = pm.y - (dx * d) / c || 0;
  const x = pm.x + (dy * d) / c || 0;
  return {
    x,
    y
  };
};

const registerLineQuadratic = (name: string) => {
  G6.registerEdge(name, {
    draw(cfg: any, group: any) {
      const black = '#000000';
      // const backColor = '#f8f8f8';
      const { color, curveOffset, startPoint, endPoint, sourceNode, targetNode, label, backColor } = cfg;
      const {
        labelFill = black,
        strokeColor = color || themeColor,
        lineWidth = edgeLineWidth,
        labelBackgroundColor = backColor,
        hasError,
        hasRelationDataFile,
        hasWarn
      } = cfg?._sourceData || {};

      const source = sourceNode?.get('model');
      const target = targetNode?.get('model');
      const sourceSize = source?._sourceData?.size || source.size;
      const targetSize = target?._sourceData?.size || target.size;

      const _start = HELPER.getPositionBaseTwoPoint(startPoint, endPoint, sourceSize / 2);
      const _end = HELPER.getPositionBaseTwoPoint(endPoint, startPoint, targetSize / 2);
      const controlPoints = getPolyEdgeControlPoint(startPoint, endPoint, curveOffset);

      const path = [
        ['M', _start.x === 0 ? startPoint.x : _start.x, _start.x === 0 ? startPoint.y : _start.y],
        ['Q', controlPoints.x, controlPoints.y, _end.x === 0 ? endPoint.x : _end.x, _end.x === 0 ? endPoint.y : _end.y]
      ];

      const endArrow =
        _start?.x === 0 || _end?.x === 0 ? {} : { endArrow: { fill: strokeColor, path: 'M 2, 0 L 10, 4 L 10, -4 Z' } };
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
          lineWidth: Number(lineWidth) + 10
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
          ...endArrow
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

        const degree = Math.atan((endPoint.y - startPoint.y) / (endPoint.x - startPoint.x));
        let centerPoint = { x: (endPoint.x + startPoint.x) / 2, y: (endPoint.y + startPoint.y) / 2 };
        centerPoint = { x: (controlPoints.x + centerPoint.x) / 2, y: (controlPoints.y + centerPoint.y) / 2 };

        const defaultWidth = 16;
        const backgroundX = -(calcWidth + defaultWidth) / 2;
        const backgroundY = -calcHeight / 2;
        let edgeLabelBackground;
        if (hasError?.length) {
          const errIconFontSize = 14;
          edgeLabelBackground = group.addShape('rect', {
            draggable: true,
            name: 'edge-label-background',
            attrs: {
              x: backgroundX - errIconFontSize,
              y: backgroundY,
              width: calcWidth + defaultWidth + errIconFontSize,
              height: calcHeight,
              fill: HELPER.hexToRgba('#FFE5E7'),
              radius: [calcHeight / 2]
            }
          });
          edgeLabelBackground.rotate(degree);
          edgeLabelBackground.translate(centerPoint.x, centerPoint.y);
        } else {
          edgeLabelBackground = group.addShape('rect', {
            draggable: true,
            name: 'edge-label-background',
            attrs: {
              x: backgroundX,
              y: backgroundY,
              width: calcWidth + defaultWidth,
              height: calcHeight,
              fill: labelBackgroundColor,
              stroke: labelBackgroundColor
            }
          });
          edgeLabelBackground.rotate(degree);
          edgeLabelBackground.translate(centerPoint.x, centerPoint.y);
        }

        const labelY = (fontSize * labels.length) / 2;
        const edgeLabel = group.addShape('text', {
          draggable: true,
          name: 'edge-label',
          attrs: {
            x: 0,
            y: labelY,
            fontSize,
            text: label.length > 15 ? label.substring(0, 14) + '...' : label,
            fill: labelFill,
            textAlign: 'center',
            fontFamily: 'sans-serif'
          }
        });
        edgeLabel.rotate(degree);
        edgeLabel.translate(centerPoint.x, centerPoint.y);
      }

      if (hasError?.length) {
        const labels = _.filter(label?.split('\n'), item => !!item);
        const calcWidth = Math.max(
          0,
          ..._.map(labels || [], item =>
            HELPER.getLengthFromString(item.length > 15 ? item.substring(0, 14) + '...' : item, fontSize)
          )
        );

        const defaultWidth = 16;
        const labelY = (fontSize * labels.length) / 2;
        const degree = Math.atan((endPoint.y - startPoint.y) / (endPoint.x - startPoint.x));
        let centerPoint = { x: (endPoint.x + startPoint.x) / 2, y: (endPoint.y + startPoint.y) / 2 };
        centerPoint = { x: (controlPoints.x + centerPoint.x) / 2, y: (controlPoints.y + centerPoint.y) / 2 };

        const errIconFontSize = 14;
        if (!label) {
          const edgeLabelBackground = group.addShape('rect', {
            draggable: true,
            name: 'edge-label-background',
            attrs: {
              x: -(calcWidth + defaultWidth) * 1.5,
              y: -errIconFontSize,
              width: calcWidth + defaultWidth + errIconFontSize,
              height: errIconFontSize,
              fill: HELPER.hexToRgba('#FFE5E7'),
              radius: [errIconFontSize / 2]
            }
          });
          edgeLabelBackground.rotate(degree);
          edgeLabelBackground.translate(centerPoint.x, centerPoint.y);
        }
        const edgeErrIcon = group.addShape('text', {
          name: 'error-icon',
          attrs: {
            x: -(calcWidth + defaultWidth) / 2,
            y: labelY,
            fontFamily: 'iconfont',
            textAlign: 'center',
            text: getIconCode('graph-warning1'),
            fontSize: errIconFontSize,
            fill: 'rgba(255,0,0,1)'
          }
        });
        edgeErrIcon.rotate(degree);
        edgeErrIcon.translate(centerPoint.x, centerPoint.y);
      }

      if ((hasRelationDataFile || hasWarn) && !hasError?.length) {
        const labels = _.filter(label?.split('\n'), item => !!item);
        const calcWidth = Math.max(
          0,
          ..._.map(labels || [], item =>
            HELPER.getLengthFromString(item.length > 15 ? item.substring(0, 14) + '...' : item, fontSize)
          )
        );

        const defaultWidth = 16;
        const labelY = (fontSize * labels.length) / 2;
        const degree = Math.atan((endPoint.y - startPoint.y) / (endPoint.x - startPoint.x));
        let centerPoint = { x: (endPoint.x + startPoint.x) / 2, y: (endPoint.y + startPoint.y) / 2 };
        centerPoint = { x: (controlPoints.x + centerPoint.x) / 2, y: (controlPoints.y + centerPoint.y) / 2 };

        const errIconFontSize = 14;
        if (!label) {
          const edgeLabelBackground = group.addShape('rect', {
            draggable: true,
            name: 'edge-label-background',
            attrs: {
              x: -(calcWidth + defaultWidth) * 1.5,
              y: -errIconFontSize,
              width: calcWidth + defaultWidth + errIconFontSize,
              height: errIconFontSize,
              fill: HELPER.hexToRgba(hasWarn ? '#FAAD14' : '#52c41a'),
              radius: [errIconFontSize / 2]
            }
          });
          edgeLabelBackground.rotate(degree);
          edgeLabelBackground.translate(centerPoint.x, centerPoint.y);
        }
        const edgeErrIcon = group.addShape('image', {
          name: 'node-pass-sign',
          draggable: true,
          attrs: {
            x: calcWidth / 2,
            y: -(labelY + fontSize / 2),
            img: hasWarn ? require('@/assets/images/warning.svg') : require('@/assets/images/duigou.svg'),
            width: 10,
            height: 10,
            cursor: 'pointer'
          }
        });
        edgeErrIcon.rotate(degree);
        edgeErrIcon.translate(centerPoint.x, centerPoint.y);
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

export default registerLineQuadratic;
