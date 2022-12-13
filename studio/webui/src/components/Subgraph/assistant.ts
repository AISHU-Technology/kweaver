import _ from 'lodash';
import G6 from '@antv/g6';

const constructGraphData = (graphData: any): any => {
  const { entity, edge } = graphData;

  // 处理点
  const nodes = _.reduce(
    entity,
    (res: any, item: any) => {
      const { name, alias, colour, entity_id } = item;
      const node = {
        entity_id,
        name,
        alias,
        color: colour,
        id: name,
        loopEdge: [], // 自闭环的边(自定义字段, 方便查询)
        relationEdges: [], // 相邻的边(自定义字段, 方便查询)
        label: alias.length <= 15 ? alias : `${alias.slice(0, 15)}...`,
        style: { fill: colour }
      };

      res.push(node);

      return res;
    },
    []
  );

  // 处理边
  const edges = _.reduce(
    edge,
    (res: any, item: any) => {
      const { name, alias, colour, relations, edge_id } = item;

      const id = relations.join('-');
      const [source, , target] = relations;
      const isLoop = source === target; // 是否是 自闭环
      const edge = {
        edge_id,
        name,
        alias,
        id,
        label: alias.length <= 15 ? alias : `${alias.slice(0, 15)}...`,
        color: colour,
        source,
        target,
        type: isLoop ? 'loop' : undefined,
        loopCfg: isLoop ? { position: 'top', dist: 100 } : undefined,
        style: {
          lineAppendWidth: 14,
          endArrow: {
            fill: colour,
            path: isLoop ? G6.Arrow.triangle(10, 12, 0) : G6.Arrow.triangle(10, 12, 25),
            d: isLoop ? 0 : 25
          }
        }
      };
      res.push(edge);

      return res;
    },
    []
  );

  G6.Util.processParallelEdges(edges);

  // 两节点多条边的处理
  const offsetDiff = 20;
  const multiEdgeType = 'quadratic';
  const singleEdgeType = 'line';
  const loopEdgeType = 'loop';
  G6.Util.processParallelEdges(edges, offsetDiff, multiEdgeType, singleEdgeType, loopEdgeType);
  return { nodes, edges };
};

export { constructGraphData };
