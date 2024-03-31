import G6, { Graph, G6GraphEvent } from '@antv/g6';

/**
 * 注册选中的边只高亮自身及起始的节点, 除此之外其他元素处于隐藏状态
 * @param name
 */
const registerEdgeSelectedBehavior = (name: string) => {
  G6.registerBehavior(name, {
    getEvents() {
      return {
        'edge:click': 'onEdgeClick',
        'canvas:click': 'onCanvasClick'
      };
    },
    onEdgeClick(e: G6GraphEvent) {
      const graph = this.graph as Graph;
      (this as any).removeState();
      const selectedEdge: any = e.item.getModel();
      const edges = graph.getEdges();
      const nodes = graph.getNodes();
      const sourceNodeId = selectedEdge?._sourceData?.startId;
      const targetNodeId = selectedEdge?._sourceData?.endId;
      const selectedEdgeId = selectedEdge.id!;
      const selectedIds = [selectedEdgeId, sourceNodeId, targetNodeId];
      let allHideItems = [...edges, ...nodes].filter(item => !selectedIds.includes(item._cfg?.id));
      if (selectedEdge._sourceData.model) {
        allHideItems = allHideItems.filter(item => {
          const dataModel = item.getModel() as any;
          return dataModel._sourceData.model !== selectedEdge._sourceData.model;
        });
      }
      allHideItems.forEach(item => {
        graph.setItemState(item, '_hide', true);
      });
      [sourceNodeId, targetNodeId].forEach(nodeId => {
        graph.setItemState(nodeId, 'selected', true); // 高亮节点
      });
      graph.setItemState(selectedEdgeId, '_active', true); // 高亮边
    },
    onCanvasClick() {
      (this as any).removeState();
    },
    removeState() {
      const graph = this.graph as Graph;
      const edges = graph.getEdges();
      const nodes = graph.getNodes();
      const allItems = [...edges, ...nodes];
      allItems.forEach(item => {
        graph.clearItemStates(item);
      });
    },
    shouldUpdate: () => false
  });
};

export default registerEdgeSelectedBehavior;
