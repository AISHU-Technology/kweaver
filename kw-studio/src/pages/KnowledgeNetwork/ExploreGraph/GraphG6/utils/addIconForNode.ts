import _ from 'lodash';
import type { INode } from '@antv/g6';
import { getIconCode } from '@/utils/antv6';

/**
 * 点添加图标
 * @param shape 节点图形
 */
export const addIconForNode = (shape: INode) => {
  const item: any = shape.getModel();
  if (item.type === 'customCircle' || item.type === 'customRect') return;

  const { size, _sourceData } = item;
  const group = shape.getContainer();

  const iconShape = group.findById('font_text');
  if (iconShape) group.removeChild(iconShape);

  const iconText = getIconCode(_sourceData?.icon);
  if (!iconText) return;

  group.addShape('text', {
    attrs: {
      x: 0,
      y: item?._sourceData?.position === 'center' ? 5 : 0,
      fontFamily: 'iconfont',
      textAlign: 'center',
      textBaseline: 'middle',
      text: iconText,
      fontSize: size * 0.55,
      fill: '#fff',
      cursor: 'pointer'
    },
    id: 'font_text',
    name: _sourceData.icon,
    draggable: true
  });
};
