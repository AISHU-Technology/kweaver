import _ from 'lodash';

/**
 * 获取图数据
 * @param canvasInstance 画布实例
 * @param options 过滤条件, 默认返回可见的节点
 */
type FilterOptions = { filter: 'all' | 'visible' | 'hidden' };
const getGraphData =
  (canvasInstance: any) =>
  (options: FilterOptions = { filter: 'visible' }) => {
    const temp = { nodes: [], edges: [] };
    const graphData = canvasInstance?.graphData || temp;
    if (options.filter === 'visible') {
      return {
        nodes: _.filter(graphData.nodes, d => !d.hide),
        edges: _.filter(graphData.edges, d => !d.hide)
      };
    }
    if (options.filter === 'hidden') {
      return {
        nodes: _.filter(graphData.nodes, d => d.hide),
        edges: _.filter(graphData.edges, d => d.hide)
      };
    }
    return graphData;
  };

/**
 * 获取图元素实例数据
 * @param canvasInstance 画布实例
 * @param options 过滤条件, 默认返回可见的节点
 */
const getGraphShapes =
  (canvasInstance: any) =>
  (options: FilterOptions = { filter: 'visible' }) => {
    const graph = canvasInstance?.graph?.current;
    const filterCallback = (shape: any) => {
      if (shape?._cfg?.model?.__isTemp) return false;
      const visible = shape.get('visible');
      if (options.filter === 'visible') return visible;
      if (options.filter === 'hidden') return !visible;
      return true;
    };
    return {
      nodes: _.filter(graph?.getNodes(), filterCallback),
      edges: _.filter(graph?.getEdges(), filterCallback)
    };
  };

/**
 * 判断是否存在隐藏的数据
 * @param canvasInstance canvasInstance 画布实例
 */
const hasHided = (canvasInstance: any) => () => {
  const graphData = getGraphData(canvasInstance)({ filter: 'hidden' });
  return graphData?.nodes?.length || graphData?.edges?.length;
};

/**
 * 给画布实例注册api方法
 * @param canvasInstance 画布实例
 */
export const registerApis = (canvasInstance: any) => {
  return _.entries({
    getGraphData,
    hasHided,
    getGraphShapes
  }).reduce((apis, [funcName, func]) => ({ ...apis, [funcName]: func(canvasInstance) }), {});
};
