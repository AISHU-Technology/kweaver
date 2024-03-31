import _ from 'lodash';
import G6 from '@antv/g6';

import HELPER from '@/utils/helper';
import { getIconCode } from '@/utils/antv6';
import { getIconCode as getIconCode2 } from '@/utils/antv6/getIconMore';

import {
  signWidth,
  cardPadding,
  iconFontSize,
  iconMargin,
  iconBackRadius,
  labelSize,
  labelLineHeight,
  labelMarginMargin
} from '../enum';

export const getLabelValues = (labels?: any[], limit?: number) => {
  if (!labels) return '';
  const checkedLabel = _.filter(labels, l => l?.isChecked);
  return _.map(checkedLabel, l => HELPER.stringEllipsis(l.value, limit || 15))?.join('\n');
};

const templateDataAssetInventory = (name: string) => {
  G6.registerNode(name, {
    draw(cfg: any, group: any) {
      const { label, subLabel, _isRoot, _isAgency, _width, _sourceData } = cfg;
      const { icon, iconColor, fillColor, treeBadgeIcon = 'reduce' } = _sourceData || {};
      // const hasIcon = icon && icon !== 'empty';
      const hasIcon = _isRoot || _isAgency;

      const labelFill = 'rgba(0,0,0,0.85)';
      const subLabelFill = 'rgba(0,0,0,0.45)';
      const colorGrey = '#cfcfcf';

      // 节点蒙版, 用于统一鼠标滑动和点击事件
      const lineLength = subLabel ? 2 : 1;
      const width = _width + cardPadding * 2;
      const height = lineLength * labelLineHeight + cardPadding * 2;
      group.addShape('rect', {
        name: 'node-rect',
        attrs: {
          x: 0,
          y: -height / 2,
          width,
          height,
          radius: 2,
          fill: '#ffffff',
          lineWidth: 1,
          fillOpacity: 1,
          shadowBlur: 10,
          shadowColor: 'rgba(0,0,0,0.08)'
        }
      });

      // 节点前色卡
      group.addShape('rect', {
        name: 'node-rect-line',
        attrs: {
          x: 0,
          y: -height / 2,
          width: signWidth,
          height,
          radius: [2, 0, 0, 2],
          fill: fillColor,
          fillOpacity: 1
        }
      });

      // 节点icon
      if (hasIcon) {
        const iconX = signWidth + iconFontSize + iconMargin;
        const iconText = getIconCode(icon);
        const _iconColor = HELPER.hexToRgba(iconColor, 0.2);
        group.addShape('circle', {
          name: 'circle',
          attrs: { r: iconBackRadius, x: iconX, y: 0, fill: _iconColor }
        });
        group.addShape('text', {
          id: icon,
          name: 'node-icon',
          attrs: {
            x: iconX,
            y: 0,
            fontSize: iconFontSize,
            text: iconText,
            fontFamily: 'iconfont',
            textAlign: 'center',
            textBaseline: 'middle',
            fill: iconColor || '#000000'
          }
        });
      }

      // 节点文本
      if (label) {
        const labelX = hasIcon ? signWidth + iconBackRadius * 2 + iconMargin * 2 : labelMarginMargin;
        const nodeLabel = group.addShape('text', {
          name: 'node-label',
          attrs: {
            x: labelX,
            y: 0,
            text: label,
            fill: labelFill,
            fontSize: labelSize,
            textAlign: 'left',
            textBaseline: 'middle'
          }
        });
        if (subLabel) {
          const labelYOffset = -labelSize / 2;
          nodeLabel.attr('y', labelYOffset - 4);
          group.addShape('text', {
            name: 'node-label',
            attrs: {
              x: labelX,
              y: -labelYOffset + 6,
              text: subLabel,
              fill: subLabelFill,
              fontSize: labelSize,
              textAlign: 'left',
              textBaseline: 'middle'
            }
          });
        }
      }

      // 节点缩放功能
      if (!_.isEmpty(cfg.children)) {
        const nodeBadgeIcon = getIconCode2('graph-reduce-circle');
        group.addShape('circle', {
          name: 'tree-badge-background',
          attrs: { r: 8, x: width + 14, y: 0, fill: '#ffffff' }
        });

        if (treeBadgeIcon === 'reduce') {
          group.addShape('text', {
            name: 'tree-badge',
            attrs: {
              x: width + 23,
              y: 0,
              text: nodeBadgeIcon,
              fill: colorGrey,
              fontSize: 18,
              cursor: 'pointer',
              textAlign: 'end',
              fontFamily: 'iconfont',
              textBaseline: 'middle'
            }
          });
        } else {
          group.addShape('text', {
            name: 'tree-badge',
            attrs: {
              x: width + 17,
              y: 0,
              text: cfg.children?.length,
              fill: colorGrey,
              fontSize: 10,
              cursor: 'pointer',
              textAlign: 'end',
              fontFamily: 'iconfont',
              textBaseline: 'middle'
            }
          });
        }
      }

      const nodeMask = group.addShape('rect', {
        name: 'node-rect',
        attrs: { x: 0, y: -height / 2, width, height, cursor: 'pointer' }
      });

      return nodeMask;
    }
  });
};

export default templateDataAssetInventory;
