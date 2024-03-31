import _ from 'lodash';

/**
 * 改变画布元素 显示\隐藏 状态
 * @param graph 图谱实例
 * @param data 图数据
 */
export const changeVisible = (graph: any, data: { nodes: any[]; edges: any[] }) => {
  const hidedNodeMap: Record<string, any> = _.reduce(
    data?.nodes,
    (res, d) => (d.hide ? { ...res, [d.id]: true } : res),
    {}
  );
  const hidedEdgeMap: Record<string, any> = _.reduce(
    data?.edges,
    (res, d) => (d.hide ? { ...res, [d.id]: true } : res),
    {}
  );
  _.forEach(graph?.getNodes(), shape => {
    hidedNodeMap[shape?._cfg?.id] ? shape?.hide() : shape?.show();
  });
  _.forEach(graph?.getEdges(), shape => {
    hidedEdgeMap[shape?._cfg?.id] ? shape?.hide() : shape?.show();
  });
};
