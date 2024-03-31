import _ from 'lodash';

export const getProperties = (list: any) => {
  const pro: any = [];
  const def = ['#id', '#entity_class', '#edge_class', '#alias'];
  _.forEach(list, item => {
    const { alias, key, value } = item;
    if (!_.includes(def, key)) {
      pro.push({ name: key, alias, value });
    }
  });
  return pro;
};

/**
 * 查询范围为画布, 可能存在隐藏点, 恢复它们的显示
 * @param selectedItem 图实例
 * @param nodes 点
 * @param edges 边
 * @param onChangeData 修改的函数
 */
export const resetHided = (options: {
  selectedItem: any;
  nodes: any[];
  edges?: any[];
  onChangeData: (data: any) => void;
}) => {
  const { selectedItem, nodes, edges, onChangeData } = options;
  const showNodesMap = _.keyBy(nodes, d => d._cfg?.id || d.id);
  const showEdgesMap = _.keyBy(edges, d => d._cfg?.id || d.id);
  let hasHided = false;
  _.forEach(selectedItem.graph.current.getNodes(), shape => {
    if (showNodesMap[shape.get('id')]) {
      !shape.get('visible') && (hasHided = true);
      shape.show();
    }
  });
  _.forEach(selectedItem.graph.current.getEdges(), shape => {
    const source = shape.get('model')?.source;
    const target = shape.get('model')?.target;
    if (showEdgesMap[shape.get('id')] || (showNodesMap[source] && showNodesMap[target])) {
      !shape.get('visible') && (hasHided = true);
      shape.show();
    }
  });
  const newNodes = _.map(selectedItem.graphData?.nodes, d => {
    let hide = d.hide;
    if (showNodesMap[d.id]) {
      hide = false;
    }
    return { ...d, hide };
  });
  const newEdges = _.map(selectedItem.graphData?.edges, d => {
    let hide = d.hide;
    const source = d.source || d.relation?.[0];
    const target = d.target || d.relation?.[2];
    if (showEdgesMap[d.id] || (showNodesMap[source] && showNodesMap[target])) {
      hide = false;
    }
    return { ...d, hide };
  });
  selectedItem.graph.current.__canvasRefresh = hasHided; // 存在隐藏, 恢复时重新布局防止重叠
  onChangeData({ type: 'graphData', data: { nodes: newNodes, edges: newEdges } });
};
