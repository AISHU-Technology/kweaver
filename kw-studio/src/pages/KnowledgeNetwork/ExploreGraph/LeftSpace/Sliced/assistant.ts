import _ from 'lodash';
import visualAnalysis from '@/services/visualAnalysis';
import { createNode, createEdge } from '../components/ResultPanel';

/**
 * 查询切片详细信息, 返回 去重后的graph数据、携带详细点信息的分组、是否有点边被删除
 * @returns [graph, group, hasDeletedGroupIds]
 */
export const querySubGroup = async (_groupList: any[], kg_id: number) => {
  const groupList = _.cloneDeep(_groupList);
  // 查询
  const queryNodeIds = _.uniq(_.reduce(groupList, (res, item) => [...res, ...item.nodes], [] as string[]));
  const queryEdgeIds = _.uniq(_.reduce(groupList, (res, item) => [...res, ...item.edges], [] as string[]));
  const nodeParam = { kg_id, vids: queryNodeIds, page: 1, size: queryNodeIds.length, search_config: [] };
  const edgeParam = { kg_id, eids: queryEdgeIds };
  let nodeRes: any;
  let edgeRes: any;

  try {
    [nodeRes, edgeRes] = await Promise.all(
      [visualAnalysis.vidRetrieval(nodeParam), visualAnalysis.eidRetrieval(edgeParam)].map(promiseItem =>
        promiseItem.catch(err => err)
      )
    );
  } catch (err) {
    //
  }

  // 存入映射
  const nodeMap: Record<string, any> = {};
  const edgeMap: Record<string, any> = {};
  _.forEach(nodeRes?.res?.nodes, item => {
    nodeMap[item.id] = createNode(item);
  });
  _.forEach(edgeRes?.res?.edges, item => {
    edgeMap[item.id] = createEdge(item);
  });

  // 取出数据
  const hasDeletedGroupIds: Record<string, boolean> = {};
  const graph = { nodes: _.values(nodeMap), edges: _.values(edgeMap) };
  const group = _.map(groupList, item => {
    const nodesDetail = _.reduce(
      item.nodes,
      (res, id) => {
        if (!nodeMap[id]) {
          hasDeletedGroupIds[item.id] = true;
          item.hasDeleted = true;
        }
        return nodeMap[id] ? [...res, nodeMap[id]] : res;
      },
      [] as any[]
    );
    const edgesDetail = _.reduce(
      item.edges,
      (res, id) => {
        if (!edgeMap[id]) {
          hasDeletedGroupIds[item.id] = true;
          item.hasDeleted = true;
        }
        return edgeMap[id] ? [...res, edgeMap[id]] : res;
      },
      [] as any[]
    );
    return { ...item, nodesDetail, edgesDetail };
  });
  return [graph, group, _.keys(hasDeletedGroupIds)] as const;
};

/**
 * 保存切片时判断保存的类型
 * path -- 选中的点和路径完全一样
 * subgraph -- 包含点和边(路径混了游离的点也视为子图)
 * other -- 仅选中点类
 * @param selected
 * @param groups
 */
export const getSavedSlicedData = (selected: { nodes: any[]; edges: any[] }, groups: Record<string, any>) => {
  const nodesMap: any = _.keyBy(selected?.nodes, d => d?._cfg?.id);
  const edgesMap: any = {};
  // 边需要携带端点保存
  _.forEach(selected?.edges, shape => {
    const source = shape.getSource();
    const target = shape.getTarget();
    nodesMap[source?._cfg?.id] = source;
    nodesMap[target?._cfg?.id] = target;
    edgesMap[shape?._cfg?.id] = shape;
  });
  const edges = _.keys(edgesMap);
  const result = { slicedType: edges.length ? 'subgraph' : 'other', nodes: _.keys(nodesMap), edges };
  // if (!result.edges.length) return result;
  // result.slicedType = 'subgraph';
  // const paths: any[] = [];
  // _.forEach(_.values(groups), g => {
  //   if (g.cfg?.info?.groupType !== 'path') return;
  //   if (_.every(g.cfg?.info?.nodes, id => nodesMap[id]) && _.every(g.cfg?.info?.edges, id => edgesMap[id])) {
  //     paths.push(g.cfg?.info);
  //   }
  // });
  // 判断路径完全选中
  // if (paths.length) {
  //   const nodesLen = _.uniq(_.flattenDeep(paths.map(p => p.nodes))).length;
  //   const edgesLen = _.uniq(_.flattenDeep(paths.map(p => p.edges))).length;
  //   if (nodesLen === result.nodes.length && edgesLen === result.edges.length) {
  //     return { ...result, paths, slicedType: 'path' };
  //   }
  // }

  return result;
};

/**
 * 获取当前显示的key
 */
export const getShowKeys = (showData: any[], selectedKeys: string[]) => {
  const dataMap = _.keyBy(showData, 'id');
  return _.filter(selectedKeys, id => !!dataMap[id]);
};
