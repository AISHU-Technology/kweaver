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
  { range: [0, 0], level: 1, size: 24, arrowOffset: 7 },
  { range: [0, 20], level: 2, size: 36, arrowOffset: 10 },
  { range: [20, 40], level: 3, size: 48, arrowOffset: 13 },
  { range: [40, 60], level: 4, size: 60, arrowOffset: 16 },
  { range: [60, 80], level: 5, size: 72, arrowOffset: 19 },
  { range: [80, 101], level: 6, size: 84, arrowOffset: 22 }
];
// const LEVEL_SIZE = [
//   { range: [0, 15], level: 1, size: 24, arrowOffset: 7 },
//   { range: [15, 30], level: 2, size: 36, arrowOffset: 10 },
//   { range: [30, 45], level: 3, size: 48, arrowOffset: 13 },
//   { range: [45, 60], level: 4, size: 60, arrowOffset: 16 },
//   { range: [60, 70], level: 5, size: 80, arrowOffset: 21 },
//   { range: [70, 80], level: 6, size: 96, arrowOffset: 25 },
//   { range: [80, 90], level: 7, size: 120, arrowOffset: 31 },
//   { range: [90, 101], level: 8, size: 140, arrowOffset: 36 }
// ];

const addNodeExtendedProperties = (nodes: object[], base: number) => {
  return _.map(nodes, (item: NodeType) => {
    if (item?.count === 0) {
      item.size = LEVEL_SIZE[0].size;
      item.level = LEVEL_SIZE[0].level;
      item.arrowOffset = LEVEL_SIZE[0].arrowOffset;
    } else {
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
    }
    return item;
  });
};

type OptionType = {
  nodes?: {};
  edges?: {};
  extendNode?: {};
  extendEdge?: {};
};
const constructGraphData = (_data: any, option?: OptionType): any => {
  const data = _.cloneDeep(_data);
  const calculatedSizeBaseNumber = Math.max(..._.map(data.nodes, item => item.count));
  const nodeWithSize = addNodeExtendedProperties(data.nodes, calculatedSizeBaseNumber);

  // 构建nodes
  const nodes = _.map(nodeWithSize || [], (item: NodeType) => {
    const { uid, size, count, alias, color } = item;
    const label = alias.length < 20 ? alias : `${alias.substring(0, 17)}...`;
    const extendOption = (option?.nodes as any)?.[uid] || {};

    return {
      size,
      id: uid,
      comboId: color,
      cluster: color,
      style: { fill: color },
      label: `${label} (${HELPER.formatNumberWithComma(count)})`,
      ...(extendOption || {}),
      ...(option?.extendNode || {}),
      _sourceData: item
    };
  });
  const nodeKV: any = _.keyBy(nodes, 'id');

  // 构建edges
  const edges = _.map(data.edges || [], (item: EdgeType) => {
    const { uid, alias, color, relation } = item;
    const source = relation?.[0];
    const target = relation?.[2];
    const isLoop = source === target;
    const arrowOffset = nodeKV?.[target]?._sourceData?.arrowOffset;
    const extendOption = (option?.edges as any)?.[uid] || {};

    return {
      id: uid,
      color,
      source,
      target,
      type: 'line',
      label: alias.length < 20 ? alias : `${alias.substring(0, 17)}...`,
      style: { endArrow: { fill: color, path: G6.Arrow.triangle(10, 12, isLoop ? 0 : arrowOffset || 20) } },
      ...(extendOption || {}),
      ...(option?.extendEdge || {}),
      _sourceData: item
    };
  });

  // 两节点多条边的处理
  const offsetDiff = 20;
  const multiEdgeType = 'quadratic';
  const singleEdgeType = 'line';
  const loopEdgeType = 'loop';
  G6.Util.processParallelEdges(edges, offsetDiff, multiEdgeType, singleEdgeType, loopEdgeType);
  return { nodes, edges };
};

export { constructGraphData };
