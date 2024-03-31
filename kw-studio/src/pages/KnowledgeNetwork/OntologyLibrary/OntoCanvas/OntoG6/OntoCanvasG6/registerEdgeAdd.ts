import _ from 'lodash';
import G6 from '@antv/g6';
import { uniqEdgeId } from '@/pages/KnowledgeNetwork/OntologyLibrary/OntoCanvas/OntoG6/assistant';

// const index = 9000;
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
        delete edge.isAdding;
        const color = edge.color;
        const size = 0.75;
        const nodeStateId = self.startNode?._sourceData?.uid;
        const nodeEdgId = model?._sourceData?.uid;
        const nodeStateName = self.startNode?._sourceData?.name;
        const nodeEdgName = model?._sourceData?.name;
        const name = `${nodeStateName}_2_${nodeEdgName}`;

        const newEdgeData = {
          uid: self.edge._cfg.id,
          name,
          color,
          size,
          alias: name,
          source: nodeStateId,
          target: nodeEdgId,
          startId: nodeStateId,
          endId: nodeEdgId,
          properties_index: [],
          properties: [],
          switchDefault: false,
          switchMaster: false,
          relations: [nodeStateName, name, nodeEdgName]
        };

        if (addGraphItem) addGraphItem([newEdgeData], 'update');
        self.edge = null;
        self.startNode = null;
        self.addingEdge = false;
      } else {
        self.startNode = model;
        self.addingEdge = true;
        // const uid = `${index++}`;
        self.edge = graph.addItem('edge', {
          id: uniqEdgeId(),
          source: model.id,
          target: model.id,
          color: model?._sourceData?.color,
          isAdding: true,
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
