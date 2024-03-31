import G6, { Graph, G6GraphEvent, INode, IEdge } from '@antv/g6';

/**
 * 注册节点或者边的hover行为
 * @param name
 */
const registerItemHoverBehavior = (name: string) => {
  G6.registerBehavior(name, {
    getEvents() {
      return {
        'edge:mouseenter': 'onEdgeMouseEnter',
        'edge:mouseleave': 'onEdgeMouseLeave',
        'node:mouseenter': 'onNodeMouseEnter',
        'node:mouseleave': 'onNodeMouseLeave'
      };
    },
    onEdgeMouseEnter(e: G6GraphEvent) {
      const item = e.item;
      (this as any).onAddItemHoverState(item);
    },
    onEdgeMouseLeave(e: G6GraphEvent) {
      const item = e.item;
      (this as any).onRemoveItemHoverState(item);
    },
    onNodeMouseEnter(e: G6GraphEvent) {
      const item = e.item;
      (this as any).onAddItemHoverState(item);
    },
    onNodeMouseLeave(e: G6GraphEvent) {
      const item = e.item;
      (this as any).onRemoveItemHoverState(item);
    },
    onAddItemHoverState(item: INode | IEdge) {
      const graph = this.graph as Graph;
      graph.setItemState(item, '_hover', true);
    },
    onRemoveItemHoverState(item: INode | IEdge) {
      const graph = this.graph as Graph;
      graph.clearItemStates(item, '_hover');
    },
    shouldUpdate: () => false
  });
};

export default registerItemHoverBehavior;
