import _ from 'lodash';
import G6 from '@antv/g6';

import HELPER from '@/utils/helper';
import { getIconCode } from '@/utils/antv6';
import { getIconCode as getIconCodeMore } from '@/utils/antv6/getIconMore';

import { height, themeColor } from './enums';

import curPng from '@/assets/images/node_copy_cur.png';

export const getLabelValues = (labels?: any[], limit?: number) => {
  if (!labels) return '';
  const checkedLabel = _.filter(labels, l => l?.isChecked);
  return _.map(checkedLabel, l => HELPER.stringEllipsis(l.value, limit || 15))?.join('\n');
};

const NODE_HALO_CLASS = 'node-halo-class';

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
      const {
        size,
        icon,
        iconColor,
        fillColor,
        showLabels,
        labelLength = 15,
        labelType = 'adapt',
        labelFixLength = 160,
        position = 'top',
        labelFill = '#000000',
        strokeColor = themeColor,
        hasError,
        hasRelationDataFile,
        hasWarn
      } = cfg?._sourceData || {};

      const zoom = Math.floor(cfg?.zoom || 1);
      const hasIcon = icon && icon !== 'empty';

      const half = size / 2;
      const halo = size / 2 + size / 3;
      const offsetX = 0;
      const offsetY = 0;
      cfg.offsetX = offsetX;
      cfg.offsetY = offsetY;

      // 节点蒙版, 用于统一鼠标滑动和点击事件
      const nodeMask = group.addShape('circle', {
        zIndex: 100,
        name: 'node-mask',
        attrs: { r: half, x: offsetX, y: offsetY, fill: fillColor, lineWidth: 3, opacity: 0, cursor: 'pointer' }
      });
      const nodeHalo = group.addShape('circle', {
        name: 'node-halo',
        attrs: {
          r: halo,
          x: offsetX,
          y: offsetY,
          fill: fillColor,
          lineWidth: 3,
          opacity: 0
          // cursor: `url(${curPng}),default`
        }
      });
      nodeHalo.set('className', NODE_HALO_CLASS);
      group.addShape('circle', {
        name: 'node-isolation',
        attrs: { r: half + 2, x: offsetX, y: offsetY, lineWidth: 1, stroke: '#fff', opacity: 0 }
      });
      group.addShape('circle', {
        name: 'node-circle',
        attrs: { r: half, x: offsetX, y: offsetY, fill: fillColor, lineWidth: 3, stroke: strokeColor }
      });

      let label = '';
      const defaultLabel = '';
      const defaultLabelSize = 12;
      let labelSize = defaultLabelSize;
      const _length = position === 'center' ? half / labelSize : labelLength;
      label = getLabelValues(showLabels, _length) || defaultLabel;

      // 节点 label
      if (label) {
        const defaultLabelPosition = { x: 0, y: -half };

        const labels = _.filter(label.split('\n'), item => !!item);
        const labelWidth = Math.max(0, ..._.map(labels || [], item => HELPER.getLengthFromString(item, labelSize)));
        const labelPositionParam = { half, size, hasIcon, labelSize, labelWidth, labelLength: labels.length };
        const labelPosition: any = (getLabelPosition(labelPositionParam) as any)?.[position] || defaultLabelPosition;

        if (position === 'center') {
          const rate = label?.split('\n')?.slice(0, Math.max(zoom, 1))?.length || 1;
          labelSize = 10 / rate || 4;
          label = getLabelValues(showLabels, size / labelSize) || defaultLabel;
          label = label?.split('\n')?.slice(0, Math.max(zoom, 1))?.join('\n');
        }
        let textX = labelPosition.x + offsetX;
        const textY = labelPosition.y + offsetY;
        if (position === 'left') {
          textX = labelPosition.x + offsetX - labelSize;
        } else if (position === 'right') {
          textX = labelPosition.x + offsetX + (3 * labelSize) / 2;
        }
        group.addShape('text', {
          id: label,
          name: 'node-label',
          attrs: {
            x: textX,
            y: textY,
            text: label,
            fill: labelFill,
            textAlign: 'center',
            fontSize: labelSize
          }
        });
      }

      if (hasError?.length) {
        // 错误tips
        const defaultLabelPosition = { x: 0, y: -half };
        const labels = _.filter(label.split('\n'), item => !!item);
        const labelWidth = Math.max(0, ..._.map(labels || [], item => HELPER.getLengthFromString(item, labelSize)));
        const labelPositionParam = { half, size, hasIcon, labelSize, labelWidth, labelLength: labels.length };
        const labelPosition: any = (getLabelPosition(labelPositionParam) as any)?.[position] || defaultLabelPosition;
        const addHeight = 4; // 矩形高补偿
        let errorIconX;
        let errorIconY;
        let errorShapeX;
        let errorShapeY;
        if (position === 'bottom') {
          errorIconX = labelWidth ? labelPosition.x + offsetX - labelWidth / 2 - labelSize : labelPosition.x + offsetX;
          errorIconY = labelWidth ? labelPosition.y + offsetY : labelPosition.y + labelSize;
          errorShapeX = labelWidth
            ? labelPosition.x + offsetX - labelWidth / 2 - labelSize * 2
            : labelPosition.x + offsetX - labelSize;
          errorShapeY = labelWidth
            ? labelPosition.y + offsetY - labelSize - addHeight / 2
            : labelPosition.y - addHeight / 2;
        } else if (position === 'left') {
          errorIconX = labelWidth
            ? labelPosition.x + offsetX - labelWidth / 2 - labelSize * 2
            : labelPosition.x + offsetX - labelSize;
          errorIconY = labelWidth ? labelPosition.y + offsetY : labelPosition.y + offsetY + labelSize / 2;
          errorShapeX = labelWidth
            ? labelPosition.x + offsetX - labelWidth / 2 - labelSize * 3
            : labelPosition.x + offsetX - labelSize * 2;
          errorShapeY = labelWidth
            ? labelPosition.y + offsetY - labelSize - addHeight / 2
            : labelPosition.y + offsetY - labelSize / 2 - addHeight / 2;
        } else if (position === 'right') {
          errorIconX = labelWidth
            ? labelPosition.x + offsetX - labelWidth / 2 + labelSize
            : labelPosition.x + offsetX + labelSize;
          errorIconY = labelWidth ? labelPosition.y + offsetY : labelPosition.y + offsetY + labelSize / 2;
          errorShapeX = labelWidth ? labelPosition.x + offsetX - labelWidth / 2 : labelPosition.x + offsetX;
          errorShapeY = labelWidth
            ? labelPosition.y + offsetY - labelSize - addHeight / 2
            : labelPosition.y + offsetY - labelSize / 2 - addHeight / 2;
        } else if (position === 'top') {
          errorIconX = labelWidth ? labelPosition.x + offsetX - labelWidth / 2 - labelSize : labelPosition.x + offsetX;
          errorIconY = labelPosition.y + offsetY;
          errorShapeX = labelWidth
            ? labelPosition.x + offsetX - labelWidth / 2 - labelSize * 2
            : labelPosition.x + offsetX - labelSize;
          errorShapeY = labelPosition.y + offsetY - labelSize - addHeight / 2;
        } else if (position === 'center') {
          errorIconX = labelWidth ? labelPosition.x + offsetX - labelSize : labelPosition.x + offsetX;
          errorIconY = labelWidth ? labelPosition.y + offsetY : labelPosition.y + offsetY + addHeight / 2;
          errorShapeX = labelWidth
            ? labelPosition.x + offsetX - labelWidth / 4 - labelSize * 2
            : labelPosition.x + offsetX - labelSize;
          errorShapeY = labelWidth
            ? labelPosition.y + offsetY - labelSize - addHeight / 2
            : labelPosition.y + offsetY - labelSize;
        }
        group.addShape('text', {
          id: icon,
          name: 'error-icon',
          attrs: {
            x: errorIconX,
            y: errorIconY,
            fontFamily: 'iconfont',
            textAlign: 'center',
            text: getIconCode('graph-warning1'),
            fontSize: labelSize,
            fill: 'rgba(255,0,0,1)'
          }
        });
        // 错误tips阴影
        group.addShape('rect', {
          zIndex: -9,
          name: 'error-temp',
          attrs: {
            x: errorShapeX,
            y: errorShapeY,
            width: labelWidth ? labelWidth + labelSize * 3 : labelSize * 2,
            height: labelSize + addHeight,
            fill: HELPER.hexToRgba('#FFE5E7'),
            radius: [(labelSize + addHeight) / 2]
          }
        });
        group.sort();
      }

      // 节点 icon
      if (hasIcon) {
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

      // 节点身上关联了数据文件
      if (hasRelationDataFile && !hasError?.length) {
        group.addShape('image', {
          name: 'node-pass-sign',
          draggable: true,
          attrs: {
            x: half - 5,
            y: -half,
            img: require('@/assets/images/duigou.svg'),
            width: 10,
            height: 10,
            cursor: 'pointer'
          }
        });
      }

      // 节点身上是否有警告标识
      if (hasWarn && !hasError?.length) {
        group.addShape('image', {
          name: 'node-warn-sign',
          draggable: true,
          attrs: {
            x: half - 5,
            y: -half,
            img: require('@/assets/images/warning.svg'),
            width: 12,
            height: 12,
            cursor: 'pointer'
          }
        });
      }

      group.sort();
      return nodeMask;
    },
    setState(name, value, node: any) {
      const item = node.getModel();
      const state = _.filter(node?._cfg?.states, item => item !== 'normal')[0];
      const { side, isRoot, _layout, _direction, _layoutWidth } = item;
      const { id, size, fillColor, strokeColor = themeColor } = item?._sourceData || {};

      const half = size / 2;
      const lineWidth = size / 2;
      const colorWhite = '#ffffff';
      const colorBlack = '#000000';
      const colorYellow = '#FFDB00';
      const colorGray = 'rgba(0,0,0, 0.1)';

      const group: any = node.getContainer();
      const shapes = group?.get('children');

      let nodeMask: any = null;
      let nodeHalo: any = null;
      let nodeIsolation: any = null;
      let nodeCircle: any = null;
      let nodeLabel: any = null;
      let nodeIcon: any = null;
      let nodeErrorIcon: any = null;
      let nodeErrorTemp: any = null;
      let nodePassSign: any = null;
      let nodeWarnSign: any = null;
      _.forEach(shapes, item => {
        if (item.cfg.name === 'node-mask') nodeMask = item;
        if (item.cfg.name === 'node-halo') nodeHalo = item;
        if (item.cfg.name === 'node-isolation') nodeIsolation = item;
        if (item.cfg.name === 'node-circle') nodeCircle = item;
        if (item.cfg.name === 'node-label') nodeLabel = item;
        if (item.cfg.name === 'node-icon') nodeIcon = item;
        if (item.cfg.name === 'error-icon') nodeErrorIcon = item;
        if (item.cfg.name === 'error-temp') nodeErrorTemp = item;
        if (item.cfg.name === 'node-pass-sign') nodePassSign = item;
        if (item.cfg.name === 'node-warn-sign') nodeWarnSign = item;
      });
      switch (state) {
        case '_hover':
          nodeHalo && nodeHalo.attr({ opacity: 0.3 });
          nodeIsolation && nodeIsolation.attr({ opacity: 1 });
          break;
        case 'selected':
          nodeHalo && nodeHalo.attr({ opacity: 0.1, fill: '#000000' });
          nodeIsolation && nodeIsolation.attr({ opacity: 1, stroke: '#000' });
          break;
        case '_hide':
          nodeMask && nodeMask.attr({ opacity: 0 });
          nodeHalo && nodeHalo.attr({ opacity: 0 });
          nodeIsolation && nodeIsolation.attr({ opacity: 0 });
          nodeCircle && nodeCircle.attr({ opacity: 0.1 });
          nodeLabel && nodeLabel.attr({ opacity: 0.1 });
          nodeIcon && nodeIcon.attr({ opacity: 0.1 });
          nodeErrorIcon && nodeErrorIcon.attr({ opacity: 0.1 });
          nodeErrorTemp && nodeErrorTemp.attr({ opacity: 0.1 });
          nodePassSign && nodePassSign.attr({ opacity: 0.1 });
          nodeWarnSign && nodeWarnSign.attr({ opacity: 0.1 });
          break;
        default:
          nodeMask && nodeMask.attr({ opacity: 0 });
          nodeHalo && nodeHalo.attr({ opacity: 0, fill: fillColor });
          nodeIsolation && nodeIsolation.attr({ opacity: 0 });
          nodeCircle && nodeCircle.attr({ opacity: 1 });
          nodeLabel && nodeLabel.attr({ opacity: 1 });
          nodeIcon && nodeIcon.attr({ opacity: 1 });
          nodeErrorIcon && nodeErrorIcon.attr({ opacity: 1 });
          nodeErrorTemp && nodeErrorTemp.attr({ opacity: 1 });
          nodePassSign && nodePassSign.attr({ opacity: 1 });
          nodeWarnSign && nodeWarnSign.attr({ opacity: 1 });
          break;
      }
    }
  });
};

export default registerNodeCircle;
