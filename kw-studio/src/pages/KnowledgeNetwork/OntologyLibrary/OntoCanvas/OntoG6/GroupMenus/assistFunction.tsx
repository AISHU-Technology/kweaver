import intl from 'react-intl-universal';
import _ from 'lodash';
import { GraphData, BrushData } from '../types/data';
import { GraphGroupItem } from '../types/items';

const NUM_KEYS = {
  entity: 'entity_num',
  edge: 'edge_num'
};

/**
 * 给图数据初始化添加_group字段
 * WARMING 初始化时后端返回的数据无uid唯一标识
 * @param graph 后端返回的图数据
 * @param groupList 后端返回的分组数据
 */
export const ontoInitGraphGroup = (graph: GraphData, groupList: GraphGroupItem[]) => {
  const nodeMap: Record<string, any> = {};
  const cloneNodes = [...graph.nodes];
  const cloneEdges = [...graph.edges];

  _.forEach([...cloneNodes, ...cloneEdges], item => {
    item._group = [];
    const key = item.relations ? String(item.relations) : item.name;
    nodeMap[key] = item;
  });

  // 标记分组
  _.forEach(groupList, group => {
    if (group.isUngrouped) return;

    _.forEach([...group.entity, ...group.edge], item => {
      const key = item.relations ? String(item.relations) : item.name;
      if (!nodeMap[key]) return;
      nodeMap[key]._group.push(group.id);
    });
  });

  return { nodes: cloneNodes, edges: cloneEdges };
};

/**
 * 根据框选的分组，更新图数据
 * @param brushData 框选数据
 * @param graph 图数据
 */
export const ontoMergeBrushToGraph = (brushData: BrushData, graph: GraphData): GraphData => {
  const { targetGroup, nodes, edges } = brushData;
  // if (!targetGroup?.id || !(nodes.length + edges.length)) return graph; // 修复点边数为零分组不能清空
  if (!targetGroup?.id) return graph;
  const nodeIdMap: Record<string, boolean> = _.reduce(nodes, (res, d) => ({ ...res, [d.uid]: true }), {});
  const edgeIdMap: Record<string, boolean> = _.reduce(edges, (res, d) => ({ ...res, [d.uid]: true }), {});
  const newNodes = _.map(graph.nodes, d => {
    const newGroup = nodeIdMap[d.uid]
      ? [...(d._group || []), targetGroup.id]
      : _.filter(d._group, gid => gid !== targetGroup.id);
    return { ...d, _group: _.uniq(newGroup) };
  });
  const newEdges = _.map(graph.edges, d => {
    const newGroup = edgeIdMap[d.uid]
      ? [...(d._group || []), targetGroup.id]
      : _.filter(d._group, gid => gid !== targetGroup.id);
    return { ...d, _group: _.uniq(newGroup) };
  });
  return { nodes: newNodes, edges: newEdges };
};

/**
 * 图数据变化时自动更新分组中的信息
 * @param graph 图数据
 * @param group 原分组数据
 */
export const ontoAutoUpdateGroup = (graph: GraphData, group: GraphGroupItem[]) => {
  if (!group.length) return group;
  const cloneGroup = [...group];
  const { nodes, edges } = graph;
  const groupMap = new Map();
  const nodeMap: Record<string, any> = {};
  let ungroupedId = 1;

  _.forEach(cloneGroup, g => {
    g.isUngrouped && (ungroupedId = g.id);
    groupMap.set(g.id, {
      ...g,
      entity: [],
      entity_num: 0,
      edge: [],
      edge_num: 0
    });
  });

  const loopUpdate = (type: 'entity' | 'edge', data: any[]) => {
    _.forEach(data, d => {
      type === 'entity' && (nodeMap[d.uid] = d);
      const correctGroupIds = _.filter(d._group, gid => groupMap.get(gid));
      d._group = correctGroupIds;
      const relationInfo =
        type === 'edge'
          ? {
              sourceAlias: nodeMap[d.startId]?.alias,
              targetAlias: nodeMap[d.endId]?.alias,
              relations: [nodeMap[d.startId]?.name, d.name, nodeMap[d.endId]?.name]
            }
          : {};

      if (!correctGroupIds.length) {
        if (!groupMap.get(ungroupedId)) return;
        groupMap.get(ungroupedId)[type].push({ ...d, ...relationInfo });
        groupMap.get(ungroupedId)[NUM_KEYS[type]] += 1;
        return;
      }

      _.forEach(correctGroupIds, gid => {
        groupMap.get(gid)[type].push({ ...d, ...relationInfo });
        groupMap.get(gid)[NUM_KEYS[type]] += 1;
      });
    });
  };
  loopUpdate('entity', nodes);
  loopUpdate('edge', edges);

  // 未分组中可能存在 `端点` 已分组, 但 `边` 未分组的情况, 此时需要补全未分组形成`图`
  // 即存在 既是已分组 又是未分组 的点
  const ungrouped = groupMap.get(ungroupedId);
  if (ungrouped) {
    const relationNodeIds = _.reduce(
      ungrouped.edge,
      (res, { startId, endId }) => ({ ...res, [startId]: true, [endId]: true }),
      {} as Record<string, boolean>
    );
    const relationNode = _.filter(nodes, ({ uid }) => relationNodeIds[uid]);
    ungrouped.entity = _.uniqBy([...ungrouped.entity, ...relationNode], d => d.uid);
    ungrouped.entity_num = ungrouped.entity.length;
  }
  return [...groupMap.values()];
};

/**
 * 更新分组数据名称, 未分组添加标记且置底
 * @param group 后端查询的新分组列表
 * @param oldGroup 当前界面已操作的数据
 */
export const ontoResetGroups = (group: any[], oldGroup: any[] = []) => {
  let ungrouped: any; // 缓存未分组
  const oldGroupMap: Record<number, any> = _.keyBy(oldGroup, 'id');
  const newGroup = _.filter(group, g => {
    // 除了名称， 其它数据以当前界面的数据为准, 覆盖
    if (oldGroupMap[g.id]) {
      Object.assign(g, oldGroupMap[g.id], { name: g.name });
    }

    if (g.isUngrouped || g.name === 'ungrouped') {
      g.isUngrouped = true;
      g.name = intl.get('createEntity.ungrouped');
      ungrouped = g;
    }

    return !g.isUngrouped;
  });

  ungrouped && newGroup.push(ungrouped);
  return newGroup;
};
