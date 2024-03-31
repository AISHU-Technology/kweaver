import _ from 'lodash';
import G6 from '@antv/g6';

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

type OptionType = {
  nodes?: {};
  edges?: {};
  extendNode?: {};
  extendEdge?: {};
};
const constructGraphData = (_data: any, option?: OptionType): any => {
  const data = _.cloneDeep(_data);

  // 构建nodes
  const nodes = _.map(data.nodes, (item: NodeType) => {
    const { color, icon, default_property } = item;
    const uid = item.id || item.vid;
    const propertyValue = String(default_property?.value);
    const label = propertyValue.length < 20 ? propertyValue : `${propertyValue?.substring(0, 17)}...`;
    const extendOption = (option?.nodes as any)?.[uid] || {};

    return {
      id: uid,
      comboId: color,
      cluster: color,
      style: { fill: color },
      label: `${label}`,
      icon,
      ...(extendOption || {}),
      ...(option?.extendNode || {}),
      size: 40,
      _sourceData: item
    };
  });
  const nodeKV: any = _.keyBy(nodes, 'id');

  // 构建edges
  const edges = _.map(data.edges || [], (item: EdgeType) => {
    const { alias, color, source, target } = item;
    const uid = item.id || item.edge_id;
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
