import _ from 'lodash';
import { parseCommonResult } from '@/pages/KnowledgeNetwork/ExploreGraph/LeftSpace/components/ResultPanel';
import HELPER from '@/utils/helper';

export const parseToGraph = (data: { nodes: any[]; edges: any[] } | { vertices: any[]; edges: any[] }[]) => {
  const { graph, paths } = parseCommonResult(data);
  graph.nodes = _.uniqBy(graph?.nodes, e => e?.id);
  graph.edges = _.uniqBy(graph?.edges, e => e?.id);
  _.forEach(graph.nodes, node => {
    _.forEach(node.showLabels, label => {
      if (label.key === node.default_property?.name) {
        label.isChecked = true;
      }
    });
  });

  return { graph, paths };
};

const getLabelValues = (labels?: any[], limit?: number) => {
  if (!labels) return '';
  const checkedLabel = _.filter(labels, l => l?.isChecked);
  return _.map(checkedLabel, l => HELPER.stringEllipsis(l.value, limit || 15))?.join('\n');
};

/**
 * 初次添加graphData。需要手动改showLabels
 */
export const handelData = ({ nodes, edges, graphStyle }: any) => {
  const nodeType: any = {
    circle: 'customCircle',
    rect: 'customRect'
  };
  const rNodes = _.map(nodes, _item => {
    const item: any = {
      labelLength: 15,
      position: 'top',
      type: 'customCircle',
      iconColor: 'rgba(255,255,255,1)',
      fillColor: _item.color,
      strokeColor: _item.color,
      size: 36,
      ..._item
    };

    const data = graphStyle?.node?.[item.class] || {};
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
    return {
      ...item,
      ...data,
      type: nodeType[type] ? nodeType[type] : type,
      label: getLabelValues(showLabels, labelLength) || '',
      showLabels
    };
  });

  const rEdges = _.map(edges, _item => {
    const item: any = {
      strokeColor: _item.color,
      lineWidth: 0.75,
      ..._item
    };
    const data = graphStyle?.edge?.[item.class] || {};

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

    return {
      ...item,
      ...data,
      lineWidth: data.size || item.size,
      type: nodeType[type] ? nodeType[type] : type,
      label: getLabelValues(showLabels, labelLength) || '',
      showLabels
    };
  });
  return { nodes: rNodes, edges: rEdges };
};
