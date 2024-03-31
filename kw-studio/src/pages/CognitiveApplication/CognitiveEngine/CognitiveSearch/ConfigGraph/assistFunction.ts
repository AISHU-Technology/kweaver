import type { Graph } from '@antv/g6';
import _ from 'lodash';

/**
 * 绘制右上方圆圈标记
 * @param graph G6实例
 * @param id 节点id
 * @param isDelete 是否删除
 */
const drawCircle = (graph: Graph, id: string, colorStyle: string, style: Record<string, any> = {}) => {
  const group = graph?.findById(id)?.getContainer();
  const circleShape = group?.findById(`circle-${id}`);
  const circleShapeOut = group?.findById(`bigger-${id}`);
  const { cursor } = style;

  if (circleShapeOut || !colorStyle) {
    group.removeChild(circleShapeOut);
  }
  if (!colorStyle) {
    group.removeChild(circleShape);
    return;
  }

  if (circleShape) {
    group.removeChild(circleShape);
  }

  group?.addShape('circle', {
    attrs: { x: 14, y: -13, r: 7, fill: 'white', cursor },
    id: `bigger-${id}`,
    name: `bigger-${id}`,
    draggable: true
  });

  group?.addShape('circle', {
    attrs: {
      x: 14,
      y: -13,
      r: 5,
      fill: colorStyle,
      cursor
    },
    id: `circle-${id}`,
    name: `circle-${id}`,
    draggable: true
  });
};

// 判断点是入边 出边 还是中间点
const onJudgementEdges = (graph: any) => {
  const edges = graph?.current?.getEdges();
  // 边的起始点(格式未整理)
  const edgeSourceNodes = _.map(edges, (item: any) => {
    return item.getSource();
  });
  // 起始点名称集合
  const sourceNodesName = _.map(edgeSourceNodes, (item: any) => {
    return item.getModel().id;
  });
  // 边的终点(格式未整理)
  const edgeTargetNodes = _.map(edges, (item: any) => {
    return item.getTarget();
  });
  // 终点名称集合
  const targetNodesName = _.map(edgeTargetNodes, (item: any) => {
    return item.getModel().id;
  });
  // 既是起点又是终点
  const sourceAndTarget = _.filter(targetNodesName, (item: any) => {
    return sourceNodesName.includes(item);
  });

  return { sourceNodesName, targetNodesName, sourceAndTarget };
};

export { drawCircle, onJudgementEdges };
