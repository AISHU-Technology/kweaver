import _ from 'lodash';
import G6 from '@antv/g6';

import HELPER from '@/utils/helper';
import { getIconCode } from '@/utils/antv6';
import { getIconCode as getIconCodeMore } from '@/utils/antv6/getIconMore';

import { height, themeColor } from './enums';

export const getLabelValues = (labels?: any[], limit?: number) => {
  if (!labels) return '';
  const checkedLabel = _.filter(labels, l => l?.isChecked);
  return _.map(checkedLabel, l => HELPER.stringEllipsis(l.value, limit || 15))?.join('\n');
};

const getLabelPosition = ({ half, size, hasIcon, labelSize, labelWidth, labelLength }: any) => {
  const offset = 5;
  return {
    top: { x: 0, y: -half - 5 },
    bottom: { x: 0, y: half + size / 2 + 3 + (labelLength - 1) * labelSize },
    left: { x: -labelWidth / 2 - size / 2 - offset, y: labelSize / 2 + (labelLength - 1) * (labelSize / 2) },
    right: { x: labelWidth / 2 + size / 2 + offset, y: labelSize / 2 + (labelLength - 1) * (labelSize / 2) },
    center: { x: 0, y: hasIcon ? half / 2 + 5 : half / 3 }
  };
};

const getIconSize = ({ size }: any) => {
  return {
    top: size * 0.55,
    bottom: size * 0.55,
    left: size * 0.55,
    right: size * 0.55,
    center: size * 0.4
  };
};
const getIconPosition = () => {
  return {
    top: { x: 0, y: 0 },
    bottom: { x: 0, y: 0 },
    left: { x: 0, y: 0 },
    right: { x: 0, y: 0 },
    center: { x: 0, y: -6 }
  };
};

const registerNodeCircle = (name: string, option?: any) => {
  G6.registerNode(name, {
    draw(cfg: any, group: any) {
      const { side, isRoot, _layout, _direction, _layoutWidth } = cfg;
      const {
        size,
        icon,
        isLock,
        iconColor,
        fillColor,
        showLabels,
        labelLength = 15,
        labelType = 'adapt',
        labelFixLength = 160,
        position = 'top',
        labelFill = '#000000',
        strokeColor = themeColor
      } = cfg?._sourceData || {};
      const layer = cfg?.layer || 3;
      const zoom = Math.floor(cfg?.zoom || 1);
      const hasIcon = icon && icon !== 'empty';

      const half = size / 2;
      let offsetX = 0;
      if (_layout === 'tree') {
        if (_direction === 'H') {
          if (side === 'left') offsetX = _layoutWidth;
          if (side === 'right') offsetX = size / 2;
          if (isRoot) offsetX = _layoutWidth / 2 + size / 2;
        }
        if (_direction === 'LR') {
          offsetX = size / 2;
        }
        if (_direction === 'RL') {
          offsetX = _layoutWidth;
        }
      }
      const offsetY = _layout === 'tree' ? height / 2 : 0;
      cfg.offsetX = offsetX;
      cfg.offsetY = offsetY;
      group.addShape('circle', {
        attrs: { r: half, x: offsetX, y: offsetY, fill: fillColor, lineWidth: 0.75, stroke: strokeColor },
        name: 'node-circle'
      });

      let label = '';
      const defaultLabel = '';
      const defaultLabelSize = 12;
      let labelSize = defaultLabelSize;
      const _length = position === 'center' ? half / labelSize : labelLength;
      label = getLabelValues(showLabels, _length) || defaultLabel;
      // 节点 label
      if (label && layer > 2) {
        const defaultLabelPosition = { x: 0, y: -half };

        const labels = _.filter(label.split('\n'), item => !!item);
        const labelWidth = Math.max(0, ..._.map(labels || [], item => HELPER.getLengthFromString(item, labelSize)));
        const labelPositionParam = { half, size, hasIcon, labelSize, labelWidth, labelLength: labels.length };
        const labelPosition: any = (getLabelPosition(labelPositionParam) as any)?.[position] || defaultLabelPosition;

        if (position === 'center') {
          const rate = Math.max(zoom, 1) || 1;
          labelSize = 10 / rate || 4;
          label = getLabelValues(showLabels, size / labelSize) || defaultLabel;
          label = label?.split('\n')?.slice(0, Math.max(zoom, 1))?.join('\n');
        }

        group.addShape('text', {
          id: label,
          name: 'node-label',
          attrs: {
            x: labelPosition.x + offsetX,
            y: labelPosition.y + offsetY,
            text: label,
            fill: labelFill,
            textAlign: 'center',
            fontSize: labelSize
          }
        });
      }

      // 节点 icon
      if (hasIcon && layer > 1) {
        const iconText = getIconCode(icon) || getIconCodeMore(icon);
        const iconSize = label ? (getIconSize({ size }) as any)?.[position] : size * 0.55;
        const iconPosition: any = label ? (getIconPosition() as any)?.[position] : { x: 0, y: 0 };
        group.addShape('text', {
          id: icon,
          name: 'node-icon',
          attrs: {
            x: iconPosition.x + offsetX,
            y: iconPosition.y + offsetY,
            fontFamily: 'iconfont',
            textAlign: 'center',
            textBaseline: 'middle',
            text: iconText,
            fontSize: iconSize,
            fill: iconColor || '#fff'
          }
        });
      }

      // 节点锁定
      if (isLock && layer > 1) {
        const lockR = size / 4;
        const lockPosition = size / 3;
        group.addShape('circle', {
          name: 'node-lock',
          attrs: {
            r: lockR,
            x: lockPosition + offsetX,
            y: lockPosition + offsetY,
            lineWidth: 1,
            fill: '#ffffff',
            stroke: strokeColor
          }
        });
        group.addShape('text', {
          name: 'node-lock-icon',
          attrs: {
            x: lockPosition + offsetX,
            y: lockPosition + offsetY,
            fontWeight: 600,
            fill: fillColor,
            fontSize: size / 4,
            textAlign: 'center',
            fontFamily: 'iconfont',
            textBaseline: 'middle',
            text: getIconCode('graph-lock1')
          }
        });
      }

      // 节点蒙版, 用于统一鼠标滑动和点击事件
      const keyShape = group.addShape('circle', {
        name: 'node-mask',
        attrs: { r: half, x: offsetX, y: offsetY, fill: fillColor, lineWidth: 0.75, fillOpacity: 0, cursor: 'pointer' }
      });

      return keyShape;
    },
    setState(name, value, node: any) {
      const item = node.getModel();
      const state = _.filter(node?._cfg?.states, item => item !== 'normal')[0];
      const { side, isRoot, _layout, _direction, _layoutWidth } = item;
      const { id, size, fillColor, strokeColor = themeColor } = item?._sourceData || {};

      const half = size / 2;
      let offsetX = 0;
      if (_layout === 'tree') {
        if (_direction === 'H') {
          if (side === 'left') offsetX = _layoutWidth;
          if (side === 'right') offsetX = size / 2;
          if (isRoot) offsetX = _layoutWidth / 2 + size / 2;
        }
        if (_direction === 'LR') {
          offsetX = size / 2;
        }
        if (_direction === 'RL') {
          offsetX = _layoutWidth;
        }
      }
      const offsetY = _layout === 'tree' ? height / 2 : 0;
      const lineWidth = size / 2;
      const colorWhite = '#ffffff';
      const colorBlack = '#000000';
      const colorYellow = '#FFDB00';
      const colorGray = 'rgba(0,0,0, 0.1)';

      const group: any = node.getContainer();
      const shapes = group?.get('children');

      let nodeMask: any = null;
      let nodeCircle: any = null;
      let nodeLabel: any = null;
      let nodeIcon: any = null;
      let nodeTemp: any = null;
      _.forEach(shapes, item => {
        if (item.cfg.name === 'node-mask') nodeMask = item;
        if (item.cfg.name === 'node-circle') nodeCircle = item;
        if (item.cfg.name === 'node-label') nodeLabel = item;
        if (item.cfg.name === 'node-icon') nodeIcon = item;
        if (item.cfg.name === 'node-temp') nodeTemp = item;
      });
      if (nodeTemp) group.removeChild(nodeTemp);

      switch (state) {
        case 'selected':
          nodeCircle.attr({
            lineWidth: 0.75,
            shadowBlur: 0,
            fillOpacity: 1,
            stroke: colorBlack,
            shadowColor: colorBlack
          });
          group.addShape('circle', {
            zIndex: -9,
            name: 'node-temp',
            attrs: { x: offsetX, y: offsetY, r: size - size / 4, fill: colorGray }
          });
          nodeLabel && nodeLabel.attr('fillOpacity', 1);
          group.sort();
          break;
        case '_hover':
          group.addShape('circle', {
            zIndex: -9,
            name: 'node-temp',
            attrs: {
              x: offsetX,
              y: offsetY,
              r: half,
              lineWidth,
              fill: fillColor,
              stroke: HELPER.hexToRgba(strokeColor, 0.2)
            }
          });
          group.sort();
          break;
        case '_path':
          nodeCircle.attr({
            lineWidth: 0.75,
            shadowBlur: 5,
            fillOpacity: 1,
            stroke: colorYellow,
            shadowColor: colorYellow
          });
          nodeLabel && nodeLabel.attr('fillOpacity', 1);
          break;
        case '_shallow':
          nodeCircle.attr({
            lineWidth: 0.75,
            shadowBlur: 0,
            fillOpacity: 0.05,
            stroke: colorWhite
          });
          nodeIcon && nodeIcon.attr({ opacity: 0.05 });
          nodeLabel && nodeLabel.attr('fillOpacity', 0.05);
          break;
        case '_focus':
          nodeMask.attr('r', size - size / 4);
          nodeCircle.attr({
            lineWidth: 0.75,
            shadowBlur: 0,
            fillOpacity: 1,
            stroke: colorBlack,
            shadowColor: colorBlack
          });
          group.addShape('circle', {
            zIndex: -9,
            name: 'node-temp',
            attrs: { x: offsetX, y: offsetY, r: size - size / 4, fill: colorGray }
          });
          nodeLabel && nodeLabel.attr('fillOpacity', 1);
          group.sort();
          break;
        default:
          nodeMask.attr('r', half);
          nodeCircle.attr({
            lineWidth: 0.75,
            shadowBlur: 0,
            fillOpacity: 1,
            stroke: strokeColor
          });
          nodeIcon && nodeIcon.attr({ opacity: 1 });
          nodeLabel && nodeLabel.attr('fillOpacity', 1);
          break;
      }
    }
  });
};

export default registerNodeCircle;
