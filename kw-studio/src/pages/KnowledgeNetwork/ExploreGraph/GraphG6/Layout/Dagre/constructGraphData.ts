import _ from 'lodash';
import G6 from '@antv/g6';

import HELPER from '@/utils/helper';
import { nodeSize, edgeLineWidth, endArrowOffsetBaseSize } from '../../enums';

type NodeType = {
  uid: string;
  name: string;
  alias: string;
  size?: number;
  [key: string]: any;
};

type EdgeType = {
  uid: string;
  alias: string;
  color: string;
  relations: string[];
  [key: string]: any;
};

export const getLabelValues = (labels?: any[], limit?: number) => {
  if (!labels) return '';
  const checkedLabel = _.filter(labels, l => l?.isChecked);
  return _.map(checkedLabel, l => HELPER.stringEllipsis(l.value, limit || 15))?.join('\n');
};

/** 构建自由态数据 */
const nodeType: any = {
  circle: 'customCircle',
  rect: 'customRect'
};
export const constructGraphDagreData = (_data: any, cache?: any): any => {
  const newData = _data.newData || {};
  const defaultStyle = _data.defaultStyle || { node: {}, edge: {} };
  const _edges = _.uniqBy(_data?.edges || [], (d: any) => d?.uid || d?.id);
  const data = _.cloneDeep({ nodes: _data.nodes || [], edges: _edges });

  // 构建nodes
  const nodes = _.map(data.nodes || [], (_item: NodeType) => {
    _item.size = _item.size || nodeSize;
    const item: any = {
      labelLength: 15,
      position: 'top',
      type: 'customCircle',
      iconColor: 'rgba(255,255,255,1)',
      fillColor: _item.color,
      strokeColor: _item.color,
      size: nodeSize,
      ..._item
    };
    const { x, y, id, icon, size, type, labelLength, position, fillColor, showLabels, hide } = item;

    const node: any = {
      id,
      x,
      y,
      size,
      icon,
      labelLength,
      position,
      style: { fill: fillColor },
      type: nodeType[type] ? nodeType[type] : type,
      label: getLabelValues(showLabels, labelLength) || '',
      labelCfg: { position },
      visible: !hide,
      _sourceData: item
    };
    if (_data.isFirst) {
      node.fx = x;
      node.fy = y;
    }

    // 如果有缓存并且有新增节点，则使用缓存类型默认样式
    if (cache && cache?.node?.[item.class] && newData?.node?.[item.id]) {
      const data = cache?.node?.[item.class] || {};

      const { type, labelLength, showLabels: _showLabels } = data;

      let showLabelsKV = _.keyBy(item.showLabels, 'key');
      let showLabels = _.map(_showLabels, d => {
        if (!showLabelsKV?.[d?.key]) return d;
        const value = showLabelsKV[d.key]?.value;
        showLabelsKV = _.omit(showLabelsKV, d.key);
        return { ..._.cloneDeep(d), value };
      });
      // 本体添加新属性后构建再搜索新属性无法显示
      showLabels = _.concat(showLabels, _.values(showLabelsKV));

      node.type = nodeType[type] ? nodeType[type] : type;
      node.label = getLabelValues(showLabels, labelLength) || '';
      node._sourceData = { ...node._sourceData, ...data, showLabels };
    }

    return node;
  });

  const nodeKV = _.keyBy(nodes, 'id');

  // 构建edges
  let edges = _.map(data.edges || [], (_item: EdgeType) => {
    const item: any = {
      strokeColor: _item.color,
      lineWidth: edgeLineWidth,
      labelBackgroundColor: defaultStyle.edge.labelBackgroundColor,
      ..._item
    };
    const { id, relation, hide } = item;
    const source = relation?.[0];
    const target = relation?.[2];

    const edge: any = {
      id,
      source,
      target,
      label: getLabelValues(item.showLabels) || '',
      visible: !hide,
      _sourceData: item
    };

    // 如果有缓存并且有新增节点，则使用缓存类型默认样式
    if (cache && cache?.edge?.[item.class] && newData?.edge?.[item.id]) {
      const data = cache?.edge?.[item.class] || {};
      const { showLabels: _showLabels } = data;

      let showLabelsKV = _.keyBy(item.showLabels, 'key');
      let showLabels = _.map(_showLabels, d => {
        if (!showLabelsKV?.[d?.key]) return d;
        const value = showLabelsKV[d.key]?.value;
        showLabelsKV = _.omit(showLabelsKV, d.key);
        return { ..._.cloneDeep(d), value };
      });
      // 本体添加新属性后构建再搜索新属性无法显示
      showLabels = _.concat(showLabels, _.values(showLabelsKV));

      edge._sourceData = { ...edge._sourceData, ...data, lineWidth: data.size || item.size, showLabels };
      edge.label = getLabelValues(showLabels) || '';
    }
    // 如果有缓存并且有新增节点，则使用缓存类型默认样式

    return edge;
  });

  edges = _.filter(edges, (item: any) => {
    if (_.isEmpty(_data?.nodes) || (nodeKV?.[item.source] && nodeKV?.[item.target])) return true;
    return false;
  });

  // 两节点多条边的处理
  const offsetDiff = 35;
  const multiEdgeType = 'customLineQuadratic';
  const singleEdgeType = 'customLine';
  const loopEdgeType = 'customLineLoop';
  G6.Util.processParallelEdges(edges, offsetDiff, multiEdgeType, singleEdgeType, loopEdgeType);
  return { nodes, edges };
};
