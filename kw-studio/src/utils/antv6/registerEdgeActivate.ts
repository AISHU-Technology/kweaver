import _ from 'lodash';
import G6 from '@antv/g6';

import { constructEdgeConfig, constructNodeConfig } from './index';

const registerEdgeActivate = (name: string) => {
  G6.registerBehavior(name, {
    getEvents() {
      return {
        'edge:click': 'onEdgeClick',
        'canvas:click': 'onCanvasClick'
      };
    },
    onEdgeClick(e: any) {
      const graph: any = this.graph;
      (this as any).removeState();
      const edge = e.item.getModel();

      const source = edge?._sourceData?.relation?.[0];
      const target = edge?._sourceData?.relation?.[2];
      _.forEach(graph.getEdges(), d => {
        const item = d.getModel();
        if (item.id === edge.id) {
          graph.setItemState(d, '_active', true);
          return;
        }
        graph.setItemState(d, '_inactive', true);
      });
      _.forEach(graph.getNodes(), d => {
        const item = d.getModel();
        if (item.id === source || item.id === target) {
          graph.setItemState(d, '_active', true);
          return;
        }
        graph.setItemState(d, '_inactive', true);
      });
      (this as any).changeNodeAndEdge();
    },
    onCanvasClick() {
      (this as any).removeState();
      (this as any).changeNodeAndEdge();
    },
    removeState() {
      const graph: any = this.graph;
      if (graph?.cfg?.states?._active?.length === 0) return;
      _.forEach(graph.getNodes(), item => {
        graph.clearItemStates(item, ['_active', '_inactive']);
      });
      _.forEach(graph.getEdges(), item => {
        graph.clearItemStates(item, ['_active', '_inactive']);
      });
    },
    changeNodeAndEdge() {
      const graph: any = this.graph;
      const nodes = graph.getNodes();
      const edges = graph.getEdges();

      _.forEach(edges, d => {
        const state = d?._cfg?.states?.[0];
        switch (state) {
          case '_inactive':
            d.update(constructEdgeConfig('#000', 0.1));
            break;
          case '_active':
            d.update(constructEdgeConfig('#000', 1));
            break;
          default:
            d.update(constructEdgeConfig('#000', 1));
        }
      });

      _.forEach(nodes, d => {
        const item = d.getModel();
        const state = d?._cfg?.states?.[0];
        const color = item?._sourceData?.color || item?._sourceData?.fill_color;
        switch (state) {
          case '_inactive':
            d.update(constructNodeConfig(color, 0.3));
            break;
          case '_active':
            d.update(constructNodeConfig(color, 1));
            break;
          default:
            d.update(constructNodeConfig(color, 1));
        }
      });
    },
    shouldUpdate: () => false
  });
};

export default registerEdgeActivate;
