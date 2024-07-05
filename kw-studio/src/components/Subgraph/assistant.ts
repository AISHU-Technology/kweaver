import _ from 'lodash';
import G6 from '@antv/g6';
import { isDef } from '@/utils/handleFunction';

const constructGraphData = (graphData: any): any => {
  const { entity, edge } = graphData;

  const nodes = _.reduce(
    entity,
    (res: any, item: any) => {
      const { name, alias, colour, fill_color, entity_id, icon, x, y } = item;
      const node: any = {
        entity_id,
        name,
        alias,
        id: name,
        icon,
        label: alias.length <= 15 ? alias : `${alias.slice(0, 15)}...`,
        style: { fill: colour || fill_color }
      };

      if (isDef(x)) node.x = x;
      if (isDef(y)) node.y = y;

      res.push(node);

      return res;
    },
    []
  );

  const edges = _.reduce(
    edge,
    (res: any, item: any) => {
      const { name, alias, colour, color, relations, relation, edge_id } = item;

      const relationFlag = relations || relation;
      const colorFlag = colour || color;

      const id = relationFlag.join('-');
      const [source, , target] = relationFlag;
      const isLoop = source === target;
      const edge = {
        edge_id,
        name,
        alias,
        id,
        label: alias.length <= 15 ? alias : `${alias.slice(0, 15)}...`,
        color: colorFlag,
        source,
        target,
        type: isLoop ? 'loop' : undefined,
        loopCfg: isLoop ? { position: 'top', dist: 100 } : undefined,
        style: {
          lineAppendWidth: 14,
          endArrow: {
            fill: colorFlag,
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

  const offsetDiff = 20;
  const multiEdgeType = 'quadratic';
  const singleEdgeType = 'line';
  const loopEdgeType = 'loop';
  G6.Util.processParallelEdges(edges, offsetDiff, multiEdgeType, singleEdgeType, loopEdgeType);
  return { nodes, edges };
};

export { constructGraphData };
