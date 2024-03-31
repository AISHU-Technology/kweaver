import _ from 'lodash';
import { getShowLabels } from '../../utils';

/**
 * 构造showLabels
 * @param item
 */
export const createLabelsInfo = (item: any, type: 'node' | 'edge') => {
  const { id, alias, properties } = item;
  const classId = item.class || item.class_name || item.tag || item.tags?.[0] || item.edge_class;
  let proList = properties;
  if (type === 'node') {
    const proMap = _.keyBy(properties, 'tag');
    proList = proMap[classId]?.props || [];
  }
  const showLabels = getShowLabels(
    { '#id': id, '#alias': alias, [type === 'node' ? '#entity_class' : '#edge_class']: classId },
    proList,
    type === 'edge'
  );
  return { class: classId, showLabels };
};

/**
 * 构造全文检索的数据
 * @param data 源数据 Node[]
 * @param checkedKeys 选择添加的key
 */
export const constructRetrievalVid = (data: any[], checkedKeys?: string[]) => {
  let nodes = [...data];
  if (checkedKeys) {
    nodes = _.filter(nodes, d => _.includes(checkedKeys, d.id));
  }
  return { graph: { nodes, edges: [] } };
};

/**
 * 构造邻居查询的数据
 * @param data 源数据
 * @param checkedKeys 选择添加的key
 */
export const constructNeighbor = (
  data: {
    nodes: any[];
    edges: any[];
    neighbor?: {
      staticMode: boolean;
      queryNodes: any[];
    };
  },
  checkedKeys?: string[]
) => {
  let nodes = [...data.nodes];
  if (checkedKeys) {
    nodes = _.filter(nodes, d => _.includes(checkedKeys, d.id));
  }
  nodes = _.uniqBy([...(data?.neighbor?.queryNodes || []), ...nodes], 'id');
  const nodeMap = _.keyBy(nodes, 'id');
  const edges = _.reduce(
    data.edges,
    (res, item) => {
      const source = item.source;
      const target = item.target;
      if (nodeMap[source] || nodeMap[target]) res.push(item);
      return res;
    },
    [] as any[]
  );
  return { graph: { nodes, edges } };
};

/**
 * 构造路径数据
 * @param data 源数据
 * @param checkedKeys 选择添加的key
 */
export const constructPaths = (data: { id: string; nodes: any[]; edges: any[] }[], checkedKeys?: string[]) => {
  const groups: any[] = [];
  const nodesMap: any = {};
  const edgesMap: any = {};
  const paths = checkedKeys ? _.filter(data, d => _.includes(checkedKeys, d.id)) : data;
  _.forEach(paths, path => {
    const nodeIds: string[] = [];
    const edgeIds: string[] = [];
    _.forEach(path.nodes, node => {
      nodeIds.push(node.id);
      if (nodesMap[node.id]) return;
      nodesMap[node.id] = node;
    });
    _.forEach(path.edges, edge => {
      edgeIds.push(edge.id);
      if (edgesMap[edge.id]) return;
      edgesMap[edge.id] = edge;
    });
    groups.push({ groupType: 'path', nodes: nodeIds, edges: edgeIds });
  });
  return { graph: { nodes: _.values(nodesMap), edges: _.values(edgesMap) }, groups };
};

/**
 * 构造语句查询的数据
 * @param data 源数据
 * @param checkInfo 选择添加的key
 */
export const constructSql = (
  origin: { id: string; data: { nodes: any[]; edges: any[]; paths: any[] }; error?: string; renderType: string }[],
  checkInfo?: {
    checked: Record<string, any>;
    used: Record<string, any>;
  }
) => {
  const groups: any[] = [];
  const nodesMap: any = {};
  const edgesMap: any = {};
  _.forEach(origin, statement => {
    if (statement.error) return;
    const { data, renderType } = statement;

    if (renderType === 'nodes') {
      let nodes = data.nodes;
      if (checkInfo) {
        const keys = checkInfo.checked[statement.id] || [];
        nodes = _.filter(nodes, n => keys.includes(n.id));
      }
      Object.assign(nodesMap, _.keyBy(nodes, 'id'));
    }

    if (renderType === 'edges') {
      let edges = data.edges;
      let nodes = checkInfo ? [] : data.nodes;
      if (checkInfo) {
        const keys = checkInfo.checked[statement.id] || [];
        const relateNodeKeys: string[] = [];
        edges = _.filter(edges, d => {
          const bool = keys.includes(d.id);
          if (bool) {
            relateNodeKeys.push(d.source, d.target);
          }
          return bool;
        });
        nodes = _.filter(data.nodes, d => relateNodeKeys.includes(d.id));
      }
      Object.assign(edgesMap, _.keyBy(edges, 'id'));
      Object.assign(nodesMap, _.keyBy(nodes, 'id'));
    }

    if (renderType === 'path') {
      let paths = data.paths;
      if (checkInfo) {
        const keys = checkInfo.checked[statement.id] || [];
        paths = _.filter(paths, p => keys.includes(p.id));
      }
      _.forEach(paths, p => {
        Object.assign(nodesMap, _.keyBy(p.nodes, 'id'));
        Object.assign(edgesMap, _.keyBy(p.edges, 'id'));
        const nodeIds = _.map(p.nodes, d => d.id);
        const edgeIds = _.map(p.edges, d => d.id);
        groups.push({ groupType: 'path', nodes: nodeIds, edges: edgeIds });
      });
    }

    if (renderType === 'subgraph') {
      if (checkInfo && !checkInfo.checked?.[statement.id]) return;
      Object.assign(nodesMap, _.keyBy(data.nodes, 'id'));
      Object.assign(edgesMap, _.keyBy(data.edges, 'id'));
      const nodeIds = _.map(data.nodes, d => d.id);
      const edgeIds = _.map(data.edges, d => d.id);
      groups.push({ groupType: 'subgraph', nodes: nodeIds, edges: edgeIds });
    }
  });
  return { graph: { nodes: _.values(nodesMap), edges: _.values(edgesMap) }, groups };
};
