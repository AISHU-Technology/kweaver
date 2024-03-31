import _ from 'lodash';

/**
 * @description 兼容旧版图数据@release-2.0.1.8, 直接修改引用, 不返回新数据
 * @description 点唯一标识字段变更 default_property = { n, v, a } --> { name, value, alias }
 * @description 边id变更 "edge:node1->node2" --> edge:node1-node2
 * @param graph
 */
export const graphPolyfill = (graph: { nodes: any[]; edges: any[] }) => {
  _.forEach(graph.nodes, d => {
    if (d.default_property?.n) {
      const { n, v, a } = d.default_property;
      d.default_property = { name: n, value: v, alias: a };
    }
  });
  _.forEach(graph.edges, d => {
    if (_.includes(d.id, '"')) {
      d.id = _.replace(d.id, /"|>/g, '');
    }
  });
};
