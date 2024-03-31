import _ from 'lodash';
import G6 from '@antv/g6';

// let index = 9000;
const registerEdgeAdd = (name: string, option: any) => {
  const { explorePath } = option;
  G6.registerBehavior(name, {
    getEvents() {
      return {
        'node:click': 'onNodeClick',
        'edge:click': 'onEdgeClick',
        'canvas:click': 'onCanvasClick',
        mousemove: 'onMousemove'
      };
    },
    onNodeClick(ev: any) {
      const self = this as any;
      const node = ev.item;
      const graph = self.graph;
      const model = node.getModel();
      if (self.addingEdge && self.edge) {
        graph.removeItem(self.edge, false);
        if (explorePath) explorePath({ start: self.startNode, end: model });
        self.edge = null;
        self.startNode = null;
        self.addingEdge = false;
      } else {
        self.startNode = model;
        self.addingEdge = true;
        const uid = 'edge_register_add';
        self.edge = graph.addItem(
          'edge',
          {
            id: uid,
            source: model.id,
            target: model.id,
            color: model?._sourceData?.color,
            style: { endArrow: { fill: model?._sourceData?.color, path: G6.Arrow.triangle(10, 12, 0) } },
            __isTemp: true
          },
          false
        );
      }
    },
    onMousemove(ev: any) {
      const self = this as any;
      const point = { x: ev.x, y: ev.y };
      if (self.addingEdge && self.edge) {
        self.graph.updateItem(self.edge, { target: point }, false);
      }
    },
    onEdgeClick(ev: any) {
      const self = this as any;
      const currentEdge = ev.item;
      if (self.addingEdge && self.edge === currentEdge) {
        self.graph.removeItem(self.edge, false);
        self.edge = null;
        self.startNode = null;
        self.addingEdge = false;
        self.graph.__onSetGraphMode('default'); // 切换默认模式
      }
    },
    onCanvasClick() {
      const self = this as any;
      self.graph.removeItem('edge_register_add');
      self.edge = null;
      self.startNode = null;
      self.addingEdge = false;
      self.graph.__onSetGraphMode('default'); // 切换默认模式
    }
  });
};

export default registerEdgeAdd;
