import { Arrow } from '@antv/g6';
import type { Graph as TGraph, INode, IEdge } from '@antv/g6';
import _ from 'lodash';

import { BrushData } from '../types/data';
import { ItemSelected } from '../types/update';

/**
 * 改变状态后更新样式
 * @param graph G6图实例
 * @param selectedItem 选中的图元数据
 */
const removeState = (graph: TGraph) => {
  _.forEach(graph.getNodes(), item => {
    graph.clearItemStates(item);
  });
  _.forEach(graph.getEdges(), item => {
    graph.clearItemStates(item);
  });
};

const onNodeClick = (graph: TGraph, node: ItemSelected) => {
  // 清除图谱上节点所有状态
  removeState(graph);

  // 与被点击节点相连的的节点
  const boundary: string[] = [];

  // 遍历边，找到与被点击节点有关的边
  _.forEach(graph.getEdges(), d => {
    const item: any = d.getModel();
    const source = item?._sourceData?.startId;
    const target = item?._sourceData?.endId;
    graph.clearItemStates(d);
    if (source === node?.uid) {
      boundary.push(target);
      // 关联的边 默认状态
      return;
    }
    if (target === node?.uid) {
      boundary.push(source);
      // 关联的边 默认状态
      return;
    }
    // 其余边 虚化状态
    graph.setItemState(d, '_hide', true);
  });

  _.forEach(graph.getNodes(), d => {
    const eachNode: any = d.getModel();
    graph.clearItemStates(d);
    if (node?.uid === eachNode.id) {
      // 选中的节点 _active状态
      graph.setItemState(d, 'selected', true);
      return;
    }
    const item: any = d.getModel();
    // 关联节点 默认状态
    if (boundary.includes(item.id)) return;
    // 其余节点 虚化状态
    graph.setItemState(d, '_hide', true);
  });
};

const onEdgeClick = (graph: TGraph, edge: ItemSelected) => {
  // 清除图谱上节点所有状态
  removeState(graph);

  const source = edge?.startId;
  const target = edge?.endId;
  _.forEach(graph.getEdges(), d => {
    const item = d.getModel();
    graph.clearItemStates(d);
    if (item.id === edge?.uid) {
      graph.setItemState(d, '_active', true);
    } else {
      graph.setItemState(d, '_hide', true);
    }
  });
  _.forEach(graph.getNodes(), d => {
    const item = d.getModel();
    graph.clearItemStates(d);
    if (item.id === source || item.id === target) return;
    graph.setItemState(d, '_hide', true);
  });
};

/**
 * 处理框选状态
 * @param graph G6实例
 * @param brushData 框选数据
 * @param isReset 是否是重置状态
 */
const changeBrushSelectState = (graph: TGraph, brushData?: BrushData, isReset = false) => {
  const nodeShapes = graph.getNodes();
  const edgeShapes = graph.getEdges();
  const { nodes, edges, highlight } = brushData || {};
  const brushNodeIdMap = _.keyBy(nodes, 'uid');
  const brushEdgeIdMap = _.keyBy(edges, 'uid');
  if (isReset) {
    removeState(graph);
    return;
  }
  _.forEach(nodeShapes, d => {
    const { id } = d.getModel() as any;
    const isSelected = !!brushNodeIdMap[id];
    graph.clearItemStates(d);
    if (isSelected) {
      graph.setItemState(d, 'selected', true);
    } else {
      graph.setItemState(d, '_hide', true);
    }
  });
  _.forEach(edgeShapes, d => {
    const { id } = d.getModel() as any;
    const isSelected = !!brushEdgeIdMap[id];
    graph.clearItemStates(d);
    if (isSelected) {
      graph.setItemState(d, '_active', true);
    } else {
      graph.setItemState(d, '_hide', true);
    }
  });
};

export { onNodeClick, onEdgeClick, removeState, changeBrushSelectState };
