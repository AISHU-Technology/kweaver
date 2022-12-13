import { Arrow } from '@antv/g6';
import type { Graph as TGraph, INode, IEdge } from '@antv/g6';
import _ from 'lodash';

import { BrushData } from '../types/data';
import { ItemSelected } from '../types/update';

type StylesOptions = {
  isSelected?: boolean;
  isReset?: boolean;
  isHighlight?: boolean;
  edgeSelectedWithNode?: boolean; // 边和点都选中，需要改箭头偏移量
};

const SELECT_STROKE_COLOR = '#4e4e4e'; // 选中边框颜色

/**
 * 更新点样式
 * @param graph G6图实例
 * @param nodeShape 点图形
 * @param options 判断
 */
const updateNodeStyle = (graph: TGraph, nodeShape: INode, options?: StylesOptions) => {
  const { isSelected = false, isReset = false, isHighlight = false } = options || {};
  const { id } = nodeShape.getModel() as any;
  const opacity = isSelected || isReset || isHighlight ? 1 : 0.2;
  const stroke = isReset || !isSelected ? '#fff' : SELECT_STROKE_COLOR;
  graph.updateItem(nodeShape, {
    labelCfg: { style: { opacity } },
    style: { opacity, stroke },
    stateStyles: { selected: { stroke } }
  });
  addShadowByNode(graph, id, isReset || !isSelected);
};

/**
 * 更新边样式
 * @param graph G6图实例
 * @param edgeShape 点图形
 * @param options 判断
 */
const updateEdgeStyle = (graph: TGraph, edgeShape: IEdge, options: StylesOptions) => {
  const { isSelected = false, isReset = false, isHighlight = false, edgeSelectedWithNode = false } = options || {};
  const { type, color, source, target } = edgeShape.getModel() as any;
  const opacity = isSelected || isReset || isHighlight ? 1 : 0.2;
  const isResetStyle = isReset || !isSelected;
  const edgeType = type || 'line';
  const endArrow = {
    fill: isResetStyle ? color : SELECT_STROKE_COLOR,
    path: Arrow.triangle(
      8,
      10,
      source === target
        ? isResetStyle || !edgeSelectedWithNode
          ? 0
          : 4
        : isResetStyle || !edgeSelectedWithNode
        ? 10
        : 14
    )
  };

  graph.updateItem(edgeShape, {
    type: setEdgeType(isSelected, edgeType),
    labelCfg: { refY: isResetStyle ? 7 : 20, style: { opacity } },
    style: { endArrow, opacity, stroke: isResetStyle ? color : SELECT_STROKE_COLOR },
    stateStyles: { selected: { stroke: isResetStyle ? color : SELECT_STROKE_COLOR } }
  });
};

/**
 * 更新边类型
 * @param isCheck 是否选中
 * @param type 原来的边类型
 * @returns 新边类型
 */
const setEdgeType = (isCheck: boolean, type: string) => {
  return isCheck ? (_.includes(type, '-check') ? type : `${type}-check`) : _.split(type, '-').shift();
};

/**
 * 改变状态后更新样式
 * @param graph G6图实例
 * @param selectedItem 选中的图元数据
 */
const changeItemState = (graph: TGraph, selectedItem: ItemSelected) => {
  const nodes = graph.getNodes();
  const edges = graph.getEdges();

  _.forEach(edges, d => {
    const state = d?._cfg?.states?.[0];
    const item = d?.getModel();

    if (item.id === selectedItem?.uid) {
      updateEdgeStyle(graph, d, { isSelected: true });
      return;
    }

    switch (state) {
      case '_inactive':
        updateEdgeStyle(graph, d, { isHighlight: false });
        break;
      case '_active':
        updateEdgeStyle(graph, d, { isReset: true });
        break;
      default:
        updateEdgeStyle(graph, d, { isReset: true });
    }
  });

  _.forEach(nodes, d => {
    const item: any = d.getModel();
    const state = d?._cfg?.states?.[0];
    if (item.id === selectedItem?.uid) {
      updateNodeStyle(graph, d, { isSelected: true });
      return;
    }
    switch (state) {
      case '_inactive':
        updateNodeStyle(graph, d, { isHighlight: false });
        break;
      case '_active':
        updateNodeStyle(graph, d, { isReset: true });
        break;
      default:
        updateNodeStyle(graph, d, { isReset: true });
    }
  });
};
const removeState = (graph: TGraph) => {
  _.forEach(graph.getNodes(), item => {
    graph.clearItemStates(item, ['_active', '_inactive', 'active', 'selected']);
  });
  _.forEach(graph.getEdges(), item => {
    graph.clearItemStates(item, ['_active', '_inactive', 'active', 'selected']);
  });
};
const onNodeClick = (graph: TGraph, node: ItemSelected) => {
  removeState(graph);

  const boundary: string[] = []; // 与被点击节点相连的的节点，边界
  _.forEach(graph.getEdges(), d => {
    const edge: any = d.getModel();
    const source = edge?._sourceData?.startId;
    const target = edge?._sourceData?.endId;
    if (source === node?.uid) {
      boundary.push(target);
      graph.setItemState(d, '_active', true);
      return;
    }
    if (target === node?.uid) {
      boundary.push(source);
      graph.setItemState(d, '_active', true);
      return;
    }
    graph.setItemState(d, '_inactive', true);
  });
  _.forEach(graph.getNodes(), d => {
    const item: any = d.getModel();
    if (boundary.includes(item.id)) return graph.setItemState(d, '_active', true);
    graph.setItemState(d, '_inactive', true);
  });

  changeItemState(graph, node);
};
const onEdgeClick = (graph: TGraph, edge: ItemSelected) => {
  removeState(graph);

  const source = edge?.startId;
  const target = edge?.endId;
  _.forEach(graph.getEdges(), d => {
    const item = d.getModel();
    if (item.id === edge?.uid) return graph.setItemState(d, '_active', true);
    graph.setItemState(d, '_inactive', true);
  });
  _.forEach(graph.getNodes(), d => {
    const item = d.getModel();
    if (item.id === source || item.id === target) return graph.setItemState(d, '_active', true);
    graph.setItemState(d, '_inactive', true);
  });

  changeItemState(graph, edge);
};

/**
 * 节点选中阴影
 */
const addShadowByNode = (graph: TGraph, id: string, isDelete = false) => {
  const group = graph.findById(id).getContainer();
  const checkShadowShape = group.findById(`check-shadow-${id}`);

  if (checkShadowShape || isDelete) {
    isDelete && group.removeChild(checkShadowShape);
    return;
  }

  group.addShape('circle', {
    attrs: {
      x: 0,
      y: 0,
      r: 27,
      fill: '#dfdfdf'
    },
    id: `check-shadow-${id}`,
    draggable: true,
    zIndex: -9
  });
  group.sort();
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

  _.forEach(nodeShapes, d => {
    const { id } = d.getModel() as any;
    const isSelected = !!brushNodeIdMap[id];
    graph.setItemState(d, 'selected', isSelected);
    updateNodeStyle(graph, d, {
      isSelected,
      isReset,
      isHighlight: !highlight || _.includes(highlight, id)
    });
  });
  _.forEach(edgeShapes, d => {
    const { id } = d.getModel() as any;
    const isSelected = !!brushEdgeIdMap[id];
    graph.setItemState(d, 'selected', isSelected);
    updateEdgeStyle(graph, d, {
      isSelected,
      isReset,
      isHighlight: !highlight || _.includes(highlight, id),
      edgeSelectedWithNode: true
    });
  });
};

export { onNodeClick, onEdgeClick, removeState, changeItemState, changeBrushSelectState };
