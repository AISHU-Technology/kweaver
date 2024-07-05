import _ from 'lodash';
import G6 from '@antv/g6';

import HELPER from '@/utils/helper';

import { constructEdgeConfig, constructNodeConfig } from './index';

const registerNodeActivate = (name: string) => {
  G6.registerBehavior(name, {
    getEvents() {
      return {
        'node:click': 'onNodeClick',
        'canvas:click': 'onCanvasClick'
      };
    },
    onNodeClick(e: any) {
      const graph: any = this.graph;
      (this as any).removeState();
      const node = e.item.getModel();

      const boundary: string[] = [];
      _.forEach(graph.getEdges(), d => {
        const edge = d.getModel();

        const source = edge?._sourceData?.relation?.[0];
        const target = edge?._sourceData?.relation?.[2];
        if (source === node.id) {
          boundary.push(target);
          graph.setItemState(d, '_active', true);
          return;
        }
        if (target === node.id) {
          boundary.push(source);
          graph.setItemState(d, '_active', true);
          return;
        }
        graph.setItemState(d, '_inactive', true);
      });
      _.forEach(graph.getNodes(), d => {
        const item = d.getModel();
        if (boundary.includes(item.id)) {
          graph.setItemState(d, '_active', true);
          return;
        }
        graph.setItemState(d, '_inactive', true);
      });
      (this as any).changeNodeAndEdge(node);
    },
    onCanvasClick() {
      (this as any).removeState();
      (this as any).changeNodeAndEdge();
    },
    removeState() {
      const graph: any = this.graph;
      _.forEach(graph.getNodes(), item => {
        graph.clearItemStates(item, ['_active', '_inactive']);
      });
      _.forEach(graph.getEdges(), item => {
        graph.clearItemStates(item, ['_active', '_inactive']);
      });
    },
    changeNodeAndEdge(selectedItem: any) {
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

        if (item.id === selectedItem?.id) {
          const lineWidth = Math.max(item?.size / 2, 16) || 16;
          d.update({
            style: { fill: color, lineWidth, opacity: 1, stroke: HELPER.hexToRgba(color, 0.2) },
            labelCfg: { position: 'top', offset: 7, style: { fill: '#000', opacity: 1 } }
          });
        }
      });
    },
    shouldUpdate: () => false
  });
};

export default registerNodeActivate;
