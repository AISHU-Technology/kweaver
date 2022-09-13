import type { TGraphData, TConfigData } from '../types';

/**
 * 同名的边合并，添加merge字段存放被合并的边id
 * @param graph 图数据
 */
const mergeGraph = (graph: TGraphData): TGraphData => {
  const nodes = [...(graph.nodes || [])];
  const edgeObj = (graph.edges || []).reduce((res: Record<string, any>, item: Record<string, any>) => {
    const { name, id } = item;

    if (res[name]) {
      res[name].merge?.push(id) || (res[name].merge = [id]);
    } else {
      res[name] = item;
    }

    return res;
  }, {});

  return { nodes, edges: Object.values(edgeObj) };
};

/**
 * 判断开关状态
 * @param selectedKeys 选择的id
 * @param data 列表显示的数据
 */
type boolCheckStatusParams = (selectedKeys: string[], data: any[]) => { checked: boolean; disabled: boolean };
const boolCheckStatus: boolCheckStatusParams = (selectedKeys, data) => {
  if (!selectedKeys.length || !data.length) {
    return { checked: false, disabled: !data.length };
  }

  const mapData = new Map();
  selectedKeys.forEach(name => mapData.set(name, true));
  const unChecked = data.some(item => !mapData.get(item?.name || item));

  return { checked: !unChecked, disabled: false };
};

/**
 * 再次编辑时，已勾选的数据排在前面
 * @param graph 图数据
 * @param configs 原配置
 */
type sortDataParams = (graph: TGraphData, configs: TConfigData) => { nodes: any[]; edges: any[] };
const sortData: sortDataParams = (graph, configs) => {
  const nodes = [...(graph.nodes || [])];
  const edges = [...(graph.edges || [])];
  const { nodeScope = [], nodeRes = [], edgeScope = [] } = configs;
  const nodeScopeMap = new Map();
  const nodeResMap = new Map();
  const edgeScopeMap = new Map();
  nodeScope.forEach((id: any) => nodeScopeMap.set(id, true));
  nodeRes.forEach((id: any) => nodeResMap.set(id, true));
  edgeScope.forEach((id: any) => edgeScopeMap.set(id, true));

  // 节点排序权重
  const getNodeWeight = (id: any) => {
    switch (true) {
      case nodeScopeMap.get(id) && nodeResMap.get(id):
        return 1;
      case nodeScopeMap.get(id) && !nodeResMap.get(id):
        return 2;
      case !nodeScopeMap.get(id) && nodeResMap.get(id):
        return 3;
      default:
        return 4;
    }
  };

  nodes.sort((a: any, b: any) => {
    const w1 = getNodeWeight(a.id);
    const w2 = getNodeWeight(b.id);

    return w1 - w2;
  });
  edges.sort((a: any, b: any) => {
    const w1 = edgeScopeMap.get(a.name) ? 1 : 2;
    const w2 = edgeScopeMap.get(b.name) ? 1 : 2;

    return w1 - w2;
  });

  return { nodes, edges };
};

/**
 * 获取一维数组重复的元素
 * @param arr 数组
 */
const getRepeat = (arr: any[]) => {
  const countObj = arr.reduce((res: any, id: string) => {
    id in res ? (res[id] += 1) : (res[id] = 0);

    return res;
  }, {});

  return Object.entries(countObj).reduce((res: any[], [key, value]) => (value ? [key, ...res] : res), []);
};

/**
 * 勾选点类, 关联勾选边类
 * @param addKeys 变化的key
 * @param oldKeys 原key
 * @param nodes 所有点类数据
 */
const getRelationEdges = (addKeys: string[], oldKeys: string[], nodes: any[]) => {
  // 新增的点相邻的边
  const changeNodes = nodes.filter(node => addKeys.includes(node.id));
  const addEdges = changeNodes.reduce((res, item: any) => [...res, ...item.relationEdges], []);
  let loopEdges: string[] = [];
  changeNodes.forEach(node => (loopEdges = [...loopEdges, ...node.loopEdge]));

  // 已选择的点相邻的边
  const oldEdges = nodes
    .filter(node => oldKeys.includes(node.id))
    .reduce((res, item: any) => [...res, ...item.relationEdges], []);

  // 多选时自身的点存在交集, 形成关联
  // 自闭环特殊处理，不用取交集判断
  // 新增与已选存在交集, 形成关联的点连接
  const selfEdges = getRepeat(addEdges);
  const aEdges = [...new Set(addEdges)];
  const oEdges = [...new Set(oldEdges)];
  const relationEdges = aEdges.filter(e => oEdges.includes(e)) as string[];
  return [...new Set([...selfEdges, ...loopEdges, ...relationEdges])];
};

/**
 * 处理高亮
 * 同名的边会合并成一条选项，所以要根据起点和终点是否高亮，来判断同名边是否高亮
 * @param nodeScope 点类范围
 * @param edgeScope 边类范围
 * @param graph 图数据
 * @param mergeEdges 边数据(合并去重, 数组类型的merge字段存储重复的边id)
 */
const handleHighlight = (nodeScope: any[], edgeScope: any[], graph: TGraphData, mergeEdges: any[]) => {
  const { mapping } = graph;
  const edges = mergeEdges.filter(e => edgeScope.includes(e.name));

  const handleEdge = (arr: any[], edge: Record<string, any>) => {
    const { source, target, id } = edge;
    id && nodeScope.includes(source) && nodeScope.includes(target) && arr.push(id);
  };

  const highlightEdgeIds = edges.reduce((res, item) => {
    handleEdge(res, item);

    item.merge?.forEach((id: string) => {
      const edge = mapping!.get(id) || {};
      handleEdge(res, edge);
    });

    return res;
  }, []);

  return [...nodeScope, ...highlightEdgeIds];
};

/**
 * 基于已选的点，它们相邻的边的交集，是能够勾选配置的边
 * @param nodeScope 已选的点类范围
 * @param nodes 所有点类数据
 */
const handleAbleEdge = (nodeScope: string[], nodes: any[]) => {
  const edgeArr = nodes
    .filter(node => nodeScope.includes(node.id))
    .reduce((res, item) => {
      const { relationEdges, loopEdge } = item;
      const addE = [...relationEdges, ...loopEdge];

      return [...res, ...addE];
    }, []);

  return getRepeat(edgeArr);
};

/**
 * 比较配置是否变更
 * TODO 数据都是string[], 直接转为字符串比较
 * @param data1 原配置
 * @param data2 新配置
 * @returns isChange 是否变更
 */
const compareConfig = (data1: TConfigData, data2: TConfigData): boolean => {
  const { nodeScope: nScope1, nodeRes: nRes1, edgeScope: eScope1 } = data1;
  const { nodeScope: nScope2, nodeRes: nRes2, edgeScope: eScope2 } = data2;

  return String(nScope1) !== String(nScope2) || String(nRes1) !== String(nRes2) || String(eScope1) !== String(eScope2);
};

export { mergeGraph, boolCheckStatus, sortData, getRelationEdges, handleHighlight, handleAbleEdge, compareConfig };
