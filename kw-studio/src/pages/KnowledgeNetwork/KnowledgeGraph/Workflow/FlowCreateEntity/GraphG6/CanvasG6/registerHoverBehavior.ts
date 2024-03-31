/**
 * 注册 悬停样式
 */
import _ from 'lodash';
import G6 from '@antv/g6';
import type { Graph as TGraph, INode, IEdge } from '@antv/g6';
import HELPER from '@/utils/helper';

export const registerNodeHoverBehavior = (name: string) => {
  G6.registerBehavior(name, {
    getEvents() {
      return {
        'node:mouseenter': 'onMouseenter',
        'node:mouseleave': 'onNodeLeave'
      };
    },
    onMouseenter(e: any) {
      const graph = this.graph as TGraph;
      mouseenterListener(e, graph);
    },
    onNodeLeave(e: any) {
      const graph = this.graph as TGraph;
      mouseleaveListener(e, graph);
    }
  });
};

export const registerEdgeHoverBehavior = (name: string) => {
  G6.registerBehavior(name, {
    getEvents() {
      return {
        'edge:mouseenter': 'onMouseenter',
        'edge:mouseleave': 'onNodeLeave'
      };
    },
    onMouseenter(e: any) {
      const graph = this.graph as TGraph;
      mouseenterListener(e, graph);
    },
    onNodeLeave(e: any) {
      const graph = this.graph as TGraph;
      mouseleaveListener(e, graph);
    }
  });
};

// 不覆盖选中状态
const unCoverState: any = { selected: 1, _active: 1, _inactive: 1 };
const mouseenterListener = (e: any, graph: any) => {
  const { item } = e;
  const states = item?.getStates();
  if (!item || _.some(states, state => unCoverState[state])) return;
  // 用setItemState会导致hover的状态提升, 覆盖其他样式
  // graph.setItemState(item, '_hover', true);
  Object.assign(item._cfg, { states: _.uniq([...states, '_hover']) });
  updateHoverStyle(graph, item, true);
};
const mouseleaveListener = (e: any, graph: any) => {
  const { item } = e;
  const states = item?.getStates();
  if (_.some(states, state => unCoverState[state])) {
    return graph.clearItemStates(item, '_hover');
  }
  if (!_.includes(states, '_hover')) return;
  graph.clearItemStates(item, '_hover');
  updateHoverStyle(graph, item, false);
};
const updateHoverStyle = (graph: TGraph, item: INode | IEdge, isHover: boolean) => {
  const cfg = item.getModel();
  const type = item.getType();
  const { size, style } = cfg as any;
  if (type === 'node') {
    const lineWidth = isHover ? size / 2 : 3;
    const color = style?.fill || '#000';
    const stroke = isHover ? HELPER.hexToRgba(color, 0.2) : '#fff';
    graph.updateItem(item, { style: { lineWidth, stroke } });
  }
  if (type === 'edge') {
    const shadowBlur = isHover ? 3 : 0;
    graph.updateItem(item, { style: { shadowColor: style?.stroke, shadowBlur } });
  }
};
