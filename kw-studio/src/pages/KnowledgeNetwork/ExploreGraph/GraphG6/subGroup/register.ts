/**
 * 将子图的 增删改查 方法挂载到graph实例上
 */
import _ from 'lodash';
import { v4 as generateUuid } from 'uuid';
import Hull from '.';

/**
 * 创建子图
 */
const __createSubGroup = (graph: any) => (cfg: any) => {
  if (!graph || !cfg?.members?.length) return;
  if (!cfg.id) cfg.id = generateUuid();

  let subGroup = graph.get('subGroup');
  let subGroupMap = graph.get('subGroupMap');
  if (!subGroupMap) {
    subGroupMap = {};
    graph.set('subGroupMap', subGroupMap);
  }
  if (!subGroup || subGroup.get('destroyed')) {
    subGroup = graph.get('group').addGroup({ id: 'subGroup' });
    subGroup.toBack();
    graph.set('subGroup', subGroup);
  }

  if (subGroup[cfg.id]) {
    return subGroup[cfg.id];
  }

  // 路径只存信息, 不绘制
  if (cfg.info?.groupType === 'path') {
    subGroupMap[cfg.id] = { cfg };
    return;
  }

  const group = subGroup.addGroup({
    id: `${cfg.id}-subGroup-container`
  });
  const hull = new Hull(graph, {
    ...cfg,
    group,
    name: cfg.name
  });
  const hullId = hull.id;
  subGroupMap[hullId] = hull;
};

/**
 * 获取所有子图
 */
const __getSubGroups = (graph: any) => () => {
  return graph?.get('subGroupMap') || {};
};

/**
 * 根据id查找子图
 */
const __getSubGroupById = (graph: any) => (id: string) => {
  return (graph?.get('subGroupMap') || {})[id];
};

// WARMING 下面的删除、更新操作需要 try catch
// 画布中存在异步更新, 在修改子图时可能会遇到元素已经提前被销毁的情况, 导致报错

/**
 * 删除单个子图
 */
const __removeSubGroup = (graph: any) => (group: string | Record<string, any>) => {
  try {
    if (!graph) return;
    let instance: any;
    if (typeof group === 'string') {
      instance = graph.__getSubGroupById(group);
    } else {
      instance = group;
    }
    delete graph.get('subGroupMap')?.[instance.id];
    instance.destroy();
  } catch {
    //
  }
};

/**
 * 删除所有子图
 */
const __removeSubGroups = (graph: any) => () => {
  if (!graph?.__getSubGroups) return;
  const groups = graph.__getSubGroups();
  if (!groups || !Object.keys(groups).length) return;
  Object.keys(groups).forEach(key => {
    try {
      const g = groups[key];
      g?.destroy();
    } catch {
      //
    }
  });
  graph.set('subGroupMap', {});
};

/**
 * 刷新子图
 */
const __refreshSubGroup = (graph: any) => () => {
  _.forEach(graph?.get('subGroupMap'), g => {
    try {
      if (g.cfg?.info?.groupType === 'path') return;
      g.updateData(g.members, g.nonMembers);
    } catch {
      //
    }
  });
};

export const registerSubGroup = (graph: any) => {
  _.entries({
    __createSubGroup,
    __getSubGroups,
    __getSubGroupById,
    __removeSubGroup,
    __removeSubGroups,
    __refreshSubGroup
  }).forEach(([funcName, func]) => {
    graph[funcName] = func(graph);
  });
};
