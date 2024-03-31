import _ from 'lodash';
import G6 from '@antv/g6';

import HELPER from '@/utils/helper';
import { getIconCode } from '@/utils/antv6';
import { getIconCode as getIconCodeMore } from '@/utils/antv6/getIconMore';

import { height, padding, iconSize, fontSize, fontFamily, themeColor } from './enums';

export const getLabelValues = (labels?: any[], limit?: number) => {
  if (!labels) return '';
  const checkedLabel = _.filter(labels, l => l?.isChecked);
  return _.map(checkedLabel, l => HELPER.stringEllipsis(l.value, limit || 15))?.join('\n');
};

const registerTreeNodeRect = (name: string) => {
  G6.registerNode(name, {
    draw(cfg: any, group: any) {
      const { side, _width, _leftNodeOffset, _height = height } = cfg;
      const {
        icon,
        iconColor,
        fillColor,
        showLabels,
        hasLine = false,
        labelLength = 15,
        labelType = 'adapt',
        labelFixLength = 160,
        labelFill = '#000000',
        strokeColor = themeColor
      } = cfg?._sourceData;
      const layer = cfg?.layer || 3;
      const hasIcon = icon && icon !== 'empty';

      const _padding = padding;
      cfg._iconSize = iconSize <= _height ? iconSize : _height;
      const label = getLabelValues(showLabels, labelLength);

      let nodeWidth = cfg._width && label ? cfg._width + _padding * 2 : cfg._iconSize;

      nodeWidth = labelType === 'fixed' ? Math.max(labelFixLength, nodeWidth) : nodeWidth;

      const nodeMask = group.addShape('rect', {
        zIndex: 100,
        name: 'node-mask',
        attrs: {
          x: side === 'left' ? _leftNodeOffset : 0,
          width: nodeWidth,
          height: _height,
          fillOpacity: 0,
          cursor: 'pointer',
          lineWidth: 0.75,
          fill: fillColor
        }
      });
      const nodeRect = group.addShape('rect', {
        name: 'node-rect',
        attrs: {
          x: side === 'left' ? _leftNodeOffset : 0,
          radius: 2,
          width: nodeWidth,
          height: _height,
          fillOpacity: 1,
          fill: fillColor,
          lineWidth: 0.75,
          stroke: strokeColor
        }
      });

      // 节点前色卡
      if (hasLine) {
        group.addShape('rect', {
          name: 'node-rect-line',
          attrs: {
            x: side === 'left' ? _leftNodeOffset : 0,
            width: 4,
            height: _height,
            radius: [2, 0, 0, 2],
            fill: strokeColor,
            fillOpacity: 1
          }
        });
      }

      // 节点 label
      let nodeText = null;
      if (label && layer > 2) {
        const labelLine = label.split('\n')?.length;
        const rectOffsetY = (labelLine - 1) * fontSize;
        const nodeRectHeight = nodeRect.attr('height') + rectOffsetY;
        const nodeRectY = nodeRect.attr('y') - rectOffsetY / 2;
        nodeMask.attr('height', nodeRectHeight);
        nodeRect.attr('height', nodeRectHeight);
        nodeMask.attr('y', nodeRectY);
        nodeRect.attr('y', nodeRectY);

        nodeText = group.addShape('text', {
          id: label,
          name: 'node-label',
          attrs: {
            x: (side === 'left' ? _leftNodeOffset + _width + _padding : _padding) + (label.length > 2 ? 4 : 2),
            y: _height / 2 + 2,
            fontFamily,
            text: label,
            fill: labelFill,
            fontSize,
            textBaseline: 'middle',
            textAlign: side === 'left' ? 'right' : 'left'
          }
        });
      }

      // 节点带有图片时的样式
      if (hasIcon && layer > 1) {
        const iconText = getIconCode(icon) || getIconCodeMore(icon);
        const offsetIcon = (nodeText ? cfg._iconSize : 0) + (nodeText ? _padding : _padding * 2);
        const nodeRectWidth = nodeRect.attr('width') + offsetIcon;
        nodeMask.attr('width', nodeRectWidth);
        nodeRect.attr('width', nodeRectWidth);
        if (nodeText) {
          const nodeTextX = nodeText.attr('x');
          nodeText.attr('x', nodeTextX + cfg._iconSize + _padding);
        }
        if (side === 'left') {
          nodeMask.attr('x', nodeMask.attr('x') - offsetIcon);
          nodeRect.attr('x', nodeRect.attr('x') - offsetIcon);
          if (nodeText) {
            const nodeTextX = nodeText.attr('x');
            nodeText.attr('x', nodeTextX - offsetIcon);
          }
        }

        group.addShape('text', {
          id: icon,
          name: 'node-icon',
          attrs: {
            x: side === 'left' ? _leftNodeOffset - (nodeText ? _padding * 2 : _padding) : _padding,
            y: _height / 2,
            text: iconText,
            fill: iconColor || '#fff',
            textAlign: 'start',
            fontFamily: 'iconfont',
            textBaseline: 'middle',
            fontSize: cfg._iconSize
          }
        });
      }

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
      let nodeMask: any = null;
      let nodeRect: any = null;
      let nodeLabel: any = null;
      let nodeIcon: any = null;
      let nodeTemp: any = null;
      _.forEach(shapes, item => {
        if (item.cfg.name === 'node-mask') nodeMask = item;
        if (item.cfg.name === 'node-rect') nodeRect = item;
        if (item.cfg.name === 'node-label') nodeLabel = item;
        if (item.cfg.name === 'node-label') nodeIcon = item;
        if (item.cfg.name === 'node-temp') nodeTemp = item;
      });
      if (nodeTemp) group.removeChild(nodeTemp);

      const x = nodeRect.attr('x');
      const y = nodeRect.attr('y');
      const width = nodeRect.attr('width');
      const height = nodeRect.attr('height');

      const nodeMaskAttr = nodeMask.attr();
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
              x: nodeMaskAttr.x - lineWidth / 2,
              y: nodeMaskAttr.y - lineWidth / 2,
              width: nodeMaskAttr.width + lineWidth,
              height: nodeMaskAttr.height + lineWidth
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
              radius: 4,
              fill: colorGray,
              x: nodeMaskAttr.x - lineWidth / 2,
              y: nodeMaskAttr.y - lineWidth / 2,
              width: nodeMaskAttr.width + lineWidth,
              height: nodeMaskAttr.height + lineWidth
            }
          });
          if (nodeLabel) nodeLabel.attr('fillOpacity', 1);
          group.sort();
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

export default registerTreeNodeRect;
