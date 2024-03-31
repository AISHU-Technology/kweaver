import _ from 'lodash';
import G6 from '@antv/g6';

import { getIconCode } from '@/utils/antv6/getIconMore';
import { iconSize, themeColor, height as defaultHeight, fontSize as defaultFontSize } from './enums';

const registerNodeRect = (name: string) => {
  G6.registerNode(name, {
    draw(cfg: any, group: any) {
      const { icon, label, strokeColor = themeColor } = cfg?._sourceData || {};
      const iconText = getIconCode(icon);

      const height = defaultHeight;

      cfg._padding = 8;
      const signWidth = 12;
      const signHeight = 3;

      const nodeRect = group.addShape('rect', {
        name: 'node-rect',
        attrs: {
          x: 0,
          y: 0,
          width: cfg._layoutWidth + signWidth + iconSize + cfg._padding * 2,
          height
        }
      });
      const nodeRectWidth = nodeRect.attr('width');

      const nodeSign = group.addShape('rect', {
        name: 'node-sign',
        attrs: {
          x: 0,
          y: height / 2,
          width: signWidth,
          height: signHeight,
          fill: strokeColor
        }
      });

      // 节点 label
      const nodeLabel = group.addShape('text', {
        name: 'node-label',
        attrs: {
          fill: strokeColor,
          text: label,
          x: nodeRectWidth / 2,
          y: height / 2,
          textAlign: 'center',
          textBaseline: 'middle',
          fontSize: defaultFontSize
        }
      });

      // 文字节点 icon
      const nodeBadge = group.addShape('text', {
        id: icon,
        name: 'tree-badge',
        attrs: {
          x: nodeRectWidth,
          y: height / 2,
          text: iconText,
          fill: strokeColor,
          fontSize: iconSize,
          cursor: 'pointer',
          textAlign: 'end',
          fontFamily: 'iconfont',
          textBaseline: 'middle'
        }
      });

      // 文字节点底部线段
      const nodePath = group.addShape('rect', {
        name: 'bottom-path',
        attrs: {
          x: 0,
          y: height,
          width: nodeRectWidth,
          height: 1,
          fill: strokeColor
        }
      });

      if (cfg._direction === 'TB' || cfg._direction === 'BT' || cfg._direction === 'V') {
        const offset = nodeRectWidth / 2;
        nodeRect.attr('x', nodeRect.attr('x') - offset);
        nodeSign.attr('x', nodeSign.attr('x') - offset);
        nodeLabel.attr('x', nodeLabel.attr('x') - offset);
        nodeBadge.attr('x', nodeBadge.attr('x') - offset);
        nodePath.attr('x', nodePath.attr('x') - offset);
      }

      return nodeRect;
    }
  });
};

export default registerNodeRect;
