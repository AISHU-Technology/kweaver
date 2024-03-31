import _ from 'lodash';
import { isSameEdge } from '../assistant';
import { verifyProperty } from '../NodeInfo/PropertyList/assistant';

/**
 * 判断全选、半选状态
 * @param origin 列表数据
 * @param checkKeys 已选的数据
 * @returns isAll：是否全选, isPart: 是否半选
 */
export const boolCheckStatus = (origin: any[], checkKeys: string[]): { isAll: boolean; isPart: boolean } => {
  let isAll = false;
  let isPart = false;

  if (!origin.length || !checkKeys.length) {
    return { isAll, isPart };
  }

  let unCheckCount = 0; // 未勾选的计数
  const keyMap = new Map();
  _.forEach(checkKeys, id => keyMap.set(id, true));

  for (let i = 0; i < origin.length; i++) {
    const { uid } = origin[i];

    if (!keyMap.get(uid)) {
      unCheckCount += 1;
    } else {
      isPart = true;

      // 同时存在勾选和未勾选, 必然是半选
      if (unCheckCount) {
        break;
      }
    }
  }

  if (!unCheckCount) {
    isAll = true;
    isPart = false;
  }

  return { isAll, isPart };
};

type HandleRepeatMark = (graph: { nodes: any[]; edges: any[] }) => {
  nodes: string[];
  edges: string[];
  firstNodeErr: number;
  firstEdgeErr: number;
};

/**
 * 给边绑定端点显示名, 并处理重复的图数据, 返回重复的id对象
 * @param graph 图数据
 */
export const handleGraphToSummary: HandleRepeatMark = graph => {
  const nodesMap: Record<string, any> = {};
  const edgesMap: Record<string, boolean> = {};
  const nodeIds: string[] = [];
  const edgeIds: string[] = [];
  const nameReg = /^\w+$/;
  const maxLength = 50;
  let firstNodeErr = -1;
  let firstEdgeErr = -1;

  _.forEach(graph.nodes, (node, index) => {
    const { uid, name = '', alias = '', properties, properties_index = [], default_tag } = node;
    const lowName = name.toLowerCase();
    const lowAlias = alias.toLowerCase();
    nodesMap[uid] = node;

    if (
      !nameReg.test(name) ||
      name.length > maxLength ||
      nodesMap[lowName] ||
      nodesMap[lowAlias] ||
      !properties_index.length ||
      !default_tag ||
      verifyProperty(properties).errIndex > -1
    ) {
      nodeIds.push(uid);
      (firstNodeErr < 0 || firstNodeErr > index) && (firstNodeErr = index);
      return;
    }

    nodesMap[lowName] = lowName;
    nodesMap[lowAlias] = lowAlias;
  });

  _.forEach(graph.edges, (edge, index) => {
    const { uid, name = '', properties = [], startId, endId } = edge;
    const startNode = nodesMap[startId];
    const endNode = nodesMap[endId];

    const edgeKey = `${startNode?.name?.toLowerCase()}_${name.toLowerCase()}_${endNode?.name?.toLowerCase()}`;
    edge.sourceAlias = startNode?.alias;
    edge.targetAlias = endNode?.alias;

    if (
      !nameReg.test(name) ||
      name.length > maxLength ||
      edgesMap[edgeKey] ||
      _.some(graph.edges, e => e.uid !== uid && e.name === name && !isSameEdge(e, edge)) || // 同名, 但显示名或属性不同
      verifyProperty(properties).errIndex > -1
    ) {
      edgeIds.push(uid);
      (firstEdgeErr < 0 || firstEdgeErr > index) && (firstEdgeErr = index);
      return;
    }

    edgesMap[edgeKey] = true;
  });

  return { nodes: nodeIds, edges: edgeIds, firstNodeErr, firstEdgeErr };
};
