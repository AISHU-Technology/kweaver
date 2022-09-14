import type { Graph } from '@antv/g6';
import five from '@/assets/images/five.svg';

/**
 * 绘制星星标记
 * @param graph G6实例
 * @param id 节点id
 * @param isDelete 是否删除
 */
const drawMark = (graph: Graph, id: string, isDelete = false, style: Record<string, any> = {}) => {
  const group = graph.findById(id).getContainer();
  const starShape = group.findById(`star-${id}`);
  const { size = 16, cursor } = style;

  // 已存在, 无需重新绘制或直接删除
  if (starShape || isDelete) {
    isDelete && group.removeChild(starShape);

    return;
  }

  group.addShape('image', {
    attrs: {
      x: -(size / 2),
      y: -(size / 2),
      width: size,
      height: size,
      img: five,
      cursor
    },
    id: `star-${id}`,
    name: `star-${id}`,
    draggable: true
  });
};

export { drawMark };
