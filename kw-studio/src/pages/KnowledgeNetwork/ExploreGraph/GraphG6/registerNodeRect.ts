import _ from 'lodash';
import G6 from '@antv/g6';

import HELPER from '@/utils/helper';
import { getIconCode } from '@/utils/antv6';

import { height, padding, iconSize, themeColor, fontFamily } from './enums';

const iconRatio = 0.55;
const getLabelValues = (labels?: any[], limit?: number) => {
  if (!labels) return '';
  const checkedLabel = _.filter(labels, l => l?.isChecked);
  return _.map(checkedLabel, l => HELPER.stringEllipsis(l.value, limit || 15))?.join('\n');
};

const getLabelPosition = ({ half, size, hasIcon, labelSize, labelWidth, labelLength }: any) => {
  const offset = 5;
  return {
    top: { x: 0, y: -half - offset },
    bottom: { x: 0, y: half + size / 2 + 3 + (labelLength - 1) * labelSize },
    left: { x: -labelWidth / 2 - size / 2 - offset, y: labelSize / 2 + 2 + (labelLength - 1) * (labelSize / 2) },
    right: { x: labelWidth / 2 + size / 2 + offset, y: labelSize / 2 + 2 + (labelLength - 1) * (labelSize / 2) },
    center: { x: hasIcon ? half : 0, y: labelSize / 2 + 1 + (labelLength - 1) * 6 }
  };
};

const registerNodeRect = (name: string) => {
  G6.registerNode(name, {
    draw(cfg: any, group: any) {
      const {
        size,
        icon,
        isLock,
        iconColor,
        fillColor,
        showLabels,
        hasLine = false,
        labelLength = 15,
        labelType = 'adapt',
        labelFixLength = 160,
        position = 'top',
        labelFill = '#000000',
        strokeColor = themeColor
      } = cfg?._sourceData || {};
      const layer = cfg?.layer || 3;
      const hasIcon = icon && icon !== 'empty';
      const isFixLength = labelType === 'fixed';

      cfg._half = position === 'center' ? height / 2 : size / 2;
      cfg._width = size;
      cfg._height = position === 'center' ? height : size;

      const shapeX = -size / 2;
      const shapeY = -(position === 'center' ? height / 2 : size / 2);
      // 节点蒙版, 用于统一鼠标滑动和点击事件
      const nodeMask = group.addShape('rect', {
        zIndex: 100,
        name: 'node-mask',
        attrs: {
          opacity: 0,
          x: shapeX,
          y: shapeY,
          lineWidth: 0.75,
          stroke: strokeColor,
          fill: fillColor,
          fillOpacity: 0,
          cursor: 'pointer',
          width: isFixLength ? labelFixLength : cfg._width,
          height: cfg._height
        }
      });
      const nodeRect = group.addShape('rect', {
        name: 'node-rect',
        attrs: {
          x: shapeX,
          y: shapeY,
          radius: 2,
          lineWidth: 0.75,
          stroke: strokeColor,
          fill: fillColor,
          width: isFixLength ? labelFixLength : cfg._width,
          height: cfg._height
        }
      });

      // 节点前色卡
      if (hasLine) {
        group.addShape('rect', {
          name: 'node-rect-line',
          attrs: {
            x: shapeX,
            y: -cfg._height / 2,
            width: 4,
            height: cfg._height,
            radius: [2, 0, 0, 2],
            fill: strokeColor,
            fillOpacity: 1
          }
        });
      }

      // 节点 label
      let nodeLabel = null;
      const defaultLabel = '';
      let label = getLabelValues(showLabels, labelLength) || defaultLabel;
      if (label && layer > 2) {
        const defaultLabelSize = 12;
        const labelSize = defaultLabelSize;
        const defaultLabelPosition = { x: 0, y: -cfg._half };

        let labels = _.filter(label.split('\n'), item => !!item);
        let labelWidth = Math.max(0, ..._.map(labels || [], item => HELPER.getLengthFromString(item, labelSize)));

        if (position === 'center') {
          const nodeWidth = nodeMask.attr('width') + labelWidth + (hasIcon ? size / 3 : 0);
          nodeMask.attr('width', isFixLength ? labelFixLength : nodeWidth);
          nodeRect.attr('width', isFixLength ? labelFixLength : nodeWidth);

          if (isFixLength) {
            // 固定长度的逻辑
            try {
              let temp = labelLength;
              const pon = hasIcon ? iconSize + 30 : 30;
              while (labelWidth > 20 && labelWidth > labelFixLength - pon) {
                label = getLabelValues(showLabels, temp--);
                labels = _.filter(label.split('\n'), item => !!item);
                labelWidth = Math.max(0, ..._.map(labels || [], item => HELPER.getLengthFromString(item, labelSize)));
              }
            } catch (error) {
              label = getLabelValues(showLabels, labelLength);
              labels = _.filter(label.split('\n'), item => !!item);
              labelWidth = Math.max(0, ..._.map(labels || [], item => HELPER.getLengthFromString(item, labelSize)));
            }
          }

          const rectOffsetY = (labels.length - 1) * labelSize;
          const nodeRectHeight = nodeRect.attr('height') + rectOffsetY;
          const nodeRectY = nodeRect.attr('y') - rectOffsetY / 2;
          nodeMask.attr('height', nodeRectHeight);
          nodeRect.attr('height', nodeRectHeight);
          nodeMask.attr('y', nodeRectY);
          nodeRect.attr('y', nodeRectY);
        }

        const labelPositionParam = {
          half: cfg._half,
          size,
          hasIcon,
          labelSize,
          labelWidth,
          labelLength: labels.length
        };
        const labelPosition: any = (getLabelPosition(labelPositionParam) as any)?.[position] || defaultLabelPosition;

        nodeLabel = group.addShape('text', {
          name: 'node-label',
          attrs: {
            ...labelPosition,
            fontFamily,
            text: label,
            fill: labelFill,
            fontSize: labelSize,
            textAlign: position === 'center' ? 'left' : 'center'
          }
        });
      }

      // 节点 icon
      let nodeIcon;
      if (hasIcon && layer > 1) {
        const iconText = getIconCode(icon);
        nodeIcon = group.addShape('text', {
          id: icon,
          name: 'node-icon',
          attrs: {
            x: 0,
            y: 0,
            fontFamily: 'iconfont',
            textAlign: 'center',
            textBaseline: 'middle',
            text: iconText,
            fill: iconColor || '#fff',
            fontSize: position === 'center' ? iconSize : size * iconRatio
          }
        });
      }

      // 节点锁定
      if (isLock && layer > 1) {
        const lockR = size / 4;
        const nodeWidth = nodeMask.attr('width');
        const nodeHeight = nodeMask.attr('height');
        group.addShape('circle', {
          name: 'node-lock',
          attrs: {
            r: lockR,
            x: shapeX + nodeWidth,
            y: shapeY + nodeHeight,
            lineWidth: 1,
            fill: '#ffffff',
            cursor: 'pointer',
            stroke: strokeColor
          }
        });
        group.addShape('text', {
          name: 'node-lock-icon',
          attrs: {
            x: shapeX + nodeWidth,
            y: shapeY + nodeHeight,
            fontWeight: 600,
            fill: fillColor,
            cursor: 'pointer',
            fontSize: size / 4,
            textAlign: 'center',
            fontFamily: 'iconfont',
            textBaseline: 'middle',
            text: getIconCode('graph-lock1')
          }
        });
      }

      const nodeWidth = nodeMask.attr('width');
      const nodeWidthCenter = nodeMask.attr('width') / 2;

      group.sort();
      return nodeMask;
    },
    setState(name, value, node: any) {
      const item = node.getModel();
      const state = _.filter(node?._cfg?.states, item => item !== 'normal')[0];

      const { fillColor, strokeColor = themeColor } = item?._sourceData || {};
      const lineWidth = 13;
      const colorWhite = '#ffffff';
      const colorBlack = '#000000';
      const colorYellow = '#FFDB00';
      const colorGray = 'rgba(0,0,0, 0.1)';

      const group: any = node.getContainer();
      const shapes = group?.get('children');
      let nodeRect: any = null;
      let nodeLabel: any = null;
      let nodeIcon: any = null;
      let nodeTemp: any = null;
      _.forEach(shapes, item => {
        if (item.cfg.name === 'node-rect') nodeRect = item;
        if (item.cfg.name === 'node-label') nodeLabel = item;
        if (item.cfg.name === 'node-icon') nodeIcon = item;
        if (item.cfg.name === 'node-temp') nodeTemp = item;
      });
      if (nodeTemp) group.removeChild(nodeTemp);

      const x = nodeRect.attr('x');
      const y = nodeRect.attr('y');
      const width = nodeRect.attr('width');
      const height = nodeRect.attr('height');

      switch (state) {
        case 'selected':
          nodeRect.attr({
            lineWidth: 0.75,
            shadowBlur: 0,
            fillOpacity: 1,
            stroke: colorBlack,
            shadowColor: colorBlack
          });
          group.addShape('rect', {
            zIndex: -9,
            name: 'node-temp',
            attrs: {
              radius: 4,
              fill: colorGray,
              x: x - lineWidth / 2,
              y: y - lineWidth / 2,
              width: width + lineWidth,
              height: height + lineWidth
            }
          });
          if (nodeLabel) nodeLabel.attr('fillOpacity', 1);
          group.sort();
          break;
        case '_hover':
          group.addShape('rect', {
            zIndex: -9,
            name: 'node-temp',
            attrs: {
              x,
              y,
              radius: 4,
              lineWidth,
              width,
              height,
              fill: fillColor,
              stroke: HELPER.hexToRgba(strokeColor, 0.2)
            }
          });
          group.sort();
          break;
        case '_path':
          nodeRect.attr({
            lineWidth: 0.75,
            shadowBlur: 5,
            fillOpacity: 1,
            stroke: colorYellow,
            shadowColor: colorYellow
          });
          if (nodeLabel) nodeLabel.attr('fillOpacity', 1);
          break;
        case '_shallow':
          nodeRect.attr({
            lineWidth: 0.75,
            shadowBlur: 0,
            fillOpacity: 0.05,
            stroke: colorWhite
          });
          nodeIcon && nodeIcon.attr({ opacity: 0.05 });
          if (nodeLabel) nodeLabel.attr('fillOpacity', 0.05);
          break;
        case '_focus':
          nodeRect.attr({
            lineWidth: 0.75,
            shadowBlur: 0,
            fillOpacity: 1,
            stroke: colorBlack,
            shadowColor: colorBlack
          });
          group.addShape('rect', {
            zIndex: -9,
            name: 'node-temp',
            attrs: {
              radius: 6,
              fill: colorGray,
              x: x - lineWidth / 2,
              y: y - lineWidth / 2,
              width: width + lineWidth,
              height: height + lineWidth
            }
          });
          if (nodeLabel) nodeLabel.attr('fillOpacity', 1);
          break;
        default:
          nodeRect.attr({
            lineWidth: 0.75,
            shadowBlur: 0,
            fillOpacity: 1,
            fill: fillColor,
            stroke: strokeColor
          });
          nodeIcon && nodeIcon.attr({ opacity: 1 });
          if (nodeLabel) nodeLabel.attr('fillOpacity', 1);
          break;
      }
    }
  });
};

export default registerNodeRect;
