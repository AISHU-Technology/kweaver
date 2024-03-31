import _ from 'lodash';
import G6 from '@antv/g6';

import HELPER from '@/utils/helper';

type NodeType = {
  uid: string;
  name: string;
  alias: string;
  size: number;
  [key: string]: any;
};
type EdgeType = {
  uid: string;
  alias: string;
  color: string;
  relations: string[];
  [key: string]: any;
};
// range: (n/base)*100得到的级别范围
// size: 节点的大小
// arrowOffset: 因为 Antv G6 的表现原因，箭头偏移量需要单独设置，后期如找到相关的文档，可以删除这个字段
const LEVEL_SIZE = [
  { range: [0, 15], level: 1, size: 24, arrowOffset: 7 },
  { range: [15, 30], level: 2, size: 36, arrowOffset: 10 },
  { range: [30, 45], level: 3, size: 48, arrowOffset: 13 },
  { range: [45, 60], level: 4, size: 60, arrowOffset: 16 },
  { range: [60, 70], level: 5, size: 80, arrowOffset: 21 },
  { range: [70, 80], level: 6, size: 96, arrowOffset: 25 },
  { range: [80, 90], level: 7, size: 120, arrowOffset: 31 },
  { range: [90, 101], level: 8, size: 140, arrowOffset: 36 }
];
const addNodeExtendedProperties = (nodes: object[], base: number) => {
  return _.map(nodes, (item: NodeType) => {
    const size = (item?.count / base) * 100 || 0;
    for (let i = 0; i < LEVEL_SIZE.length; i++) {
      const LEVEL = LEVEL_SIZE[i];
      if (size >= LEVEL.range[0] && size < LEVEL.range[1]) {
        item.size = LEVEL.size;
        item.level = LEVEL.level;
        item.arrowOffset = LEVEL.arrowOffset;
        break;
      }
    }
    return item;
  });
};

type OptionType = {
  nodesConfig?: {};
  edgesConfig?: {};
  extendNode?: {};
  extendEdge?: {};
  layoutType?: string;
};
const constructGraphData = (_data: any, option?: OptionType): any => {
  const data = _.cloneDeep(_data);
  const calculatedSizeBaseNumber = Math.max(..._.map(data.nodes, item => item.count));
  const nodeWithSize = addNodeExtendedProperties(data.nodes, calculatedSizeBaseNumber);

  // 构建nodes
  const nodes = _.map(nodeWithSize || [], (item: NodeType) => {
    const { uid, size, count, alias, color } = item;
    const label = alias.length < 20 ? alias : `${alias.substring(0, 17)}...`;
    const extendConfig = (option?.nodesConfig as any)?.[uid] || {};

    return {
      size,
      id: uid,
      comboId: color,
      cluster: color,
      style: { fill: color },
      label: `${label} (${HELPER.formatNumberWithComma(count)})`,
      ...(extendConfig || {}),
      ...(option?.extendNode || {}),
      _sourceData: item
    };
  });
  const nodeKV: any = _.keyBy(nodes, 'id');

  // 构建edges
  const parallel: any = {};
  const edges = _.map(data.edges || [], (item: EdgeType) => {
    const { uid, alias, color, relation } = item;
    const source = relation?.[0];
    const target = relation?.[2];
    const arrowOffset = nodeKV?.[target]?._sourceData?.arrowOffset;
    const extendConfig = (option?.edgesConfig as any)?.[uid] || {};

    const typeLoop = {
      type: 'loop',
      loopCfg: { position: 'top', dist: 50 },
      style: { endArrow: { fill: color, path: G6.Arrow.triangle(10, 12, 0) } }
    };
    const typeLine = {
      type: 'line',
      style: { endArrow: { fill: color, path: G6.Arrow.triangle(10, 12, arrowOffset || 20) } }
    };

    const result = {
      id: uid,
      color,
      source,
      target,
      label: alias.length < 20 ? alias : `${alias.substring(0, 17)}...`,
      ...(source === target ? typeLoop : typeLine),
      ...(extendConfig || {}),
      ...(option?.extendEdge || {}),
      _sourceData: item
    };

    const s_t = [source, target].sort().join('_');
    if (!parallel[s_t]) parallel[s_t] = [];
    if (parallel[s_t]) parallel[s_t].push(result);

    return result;
  });

  const _temp = {};
  const offsetDiff = 20;
  _.forEach(parallel, d => {
    if (d.length === 1) return;
    let startOffset = -(Math.floor(d.length / 2) * offsetDiff);
    _.forEach(d, item => {
      const curveOffset = startOffset;
      startOffset += offsetDiff;
      if (d.length % 2 === 0 && startOffset === 0) startOffset += offsetDiff;
      item.curveOffset = curveOffset;
    });
  });

  const edgeClone = _.cloneDeep(edges);
  G6.Util.processParallelEdges(edgeClone);

  return { nodes, edges };
};

export { constructGraphData };
