import _ from 'lodash';
import G6 from '@antv/g6';

let index = 9000;
const registerEdgeAdd = (name: string, addGraphItem?: any) => {
  G6.registerBehavior(name, {
    getEvents() {
      return {
        'node:click': 'onClick',
        'edge:click': 'onEdgeClick',
        mousemove: 'onMousemove'
      };
    },
    onClick(ev: any) {
      const self = this as any;
      const node = ev.item;
      const graph = self.graph;
      const model = node.getModel();
      if (self.addingEdge && self.edge) {
        const edge = self.edge.getModel();
        const color = edge.color;
        const nodeStateId = self.startNode?._sourceData?.uid;
        const nodeEdgId = model?._sourceData?.uid;
        const nodeStateName = self.startNode?._sourceData?.name;
        const nodeEdgName = model?._sourceData?.name;
        const name = `${nodeStateName}_2_${nodeEdgName}`;

        const newEdgeData = {
          uid: self.edge._cfg.id,
          name,
          color,
          alias: name,
          source: nodeStateId,
          target: nodeEdgId,
          startId: nodeStateId,
          endId: nodeEdgId,
          properties_index: ['name'],
          properties: [['name', 'string']],
          relations: [nodeStateName, name, nodeEdgName]
        };

        if (addGraphItem) addGraphItem([newEdgeData], 'update');
        self.edge = null;
        self.startNode = null;
        self.addingEdge = false;
      } else {
        self.startNode = model;
        self.addingEdge = true;
        const uid = `edge_register_${index++}`;
        self.edge = graph.addItem('edge', {
          id: uid,
          source: model.id,
          target: model.id,
          color: model?._sourceData?.color,
          style: { endArrow: { fill: model?._sourceData?.color, path: G6.Arrow.triangle(8, 10, 0) } }
        });
        graph.__newItem = self.edge;
      }
    },
    onMousemove(ev: any) {
      const self = this as any;
      const point = { x: ev.x, y: ev.y };
      if (self.addingEdge && self.edge) {
        self.graph.updateItem(self.edge, { target: point });
      }
    },
    onEdgeClick(ev: any) {
      const self = this as any;
      const currentEdge = ev.item;
      if (self.addingEdge && self.edge === currentEdge) {
        self.graph.removeItem(self.edge);
        self.edge = null;
        self.startNode = null;
        self.addingEdge = false;
      }
    }
  });
};

export default registerEdgeAdd;
