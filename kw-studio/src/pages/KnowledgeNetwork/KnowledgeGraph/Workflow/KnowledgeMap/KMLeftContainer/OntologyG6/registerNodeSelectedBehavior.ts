import G6, { Graph, G6GraphEvent } from '@antv/g6';
import { G6NodeData } from '@/pages/KnowledgeNetwork/KnowledgeGraph/Workflow/KnowledgeMap/types';

/**
 * 注册选中的节点只高亮自身, 除此之外其他元素处于隐藏状态
 * @param name
 */
const registerNodeSelectedBehavior = (name: string) => {
  G6.registerBehavior(name, {
    getEvents() {
      return {
        'node:click': 'onNodeClick',
        'canvas:click': 'onCanvasClick'
      };
    },
    onNodeClick(e: G6GraphEvent) {
      const graph = this.graph as Graph;
      (this as any).removeState();
      const selectedNode = e.item;
      const selectedNodeData = selectedNode.getModel() as G6NodeData;
      const edges = graph.getEdges();
      const nodes = graph.getNodes();
      let allHideItems = [...edges, ...nodes].filter(item => item._cfg?.id !== selectedNodeData.id);
      if (selectedNodeData._sourceData.model) {
        allHideItems = allHideItems.filter(item => {
          const dataModel = item.getModel() as any;
          return dataModel._sourceData.model !== selectedNodeData._sourceData.model;
        });
      }
      allHideItems.forEach(item => {
        graph.setItemState(item, '_hide', true);
      });
      graph.setItemState(selectedNode, 'selected', true);
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

export default registerNodeSelectedBehavior;
