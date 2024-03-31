import _ from 'lodash';
import { createLabelsInfo } from './utils';

const genPathId = () => _.uniqueId('path'); // 生成路径id
const genStatementId = () => _.uniqueId('statement'); // 生成语句id

/**
 * 构造点
 */
export const createNode = (item: any) => {
  return { ...item, ...createLabelsInfo(item, 'node'), uid: item.id };
};

/**
 * 构造边
 */
export const createEdge = (item: any) => {
  const relation = [item.source, item.id, item.target];
  return { ...item, ...createLabelsInfo(item, 'edge'), uid: item.id, relation };
};

/**
 * 构造路径信息
 * @param paths 后端返回的paths
 * @param idsMap 点和边的id数据映射
 */
const createPaths = (paths: any[], idsMap: Record<string, any>) => {
  return _.map(paths, path => {
    return {
      id: genPathId(),
      nodes: _.reduce(path.nodes, (res, id) => (idsMap[id] ? [...res, idsMap[id]] : res), [] as any[]),
      edges: _.reduce(path.edges, (res, id) => (idsMap[id] ? [...res, idsMap[id]] : res), [] as any[])
    };
  });
};

/**
 * 构造语句查询的文本内容
 * @param texts 后端返回的文本内容
 */
const createTexts = (texts: any[]) => {
  const result: string[] = [];
  _.forEach(texts, item => {
    if (_.isArray(item.values)) {
      result.push(...item.values);
    }
    if (_.isArray(item.columns)) {
      result.push(..._.flatten(_.map(item.columns, c => c.values || c.value)));
    }
  });
  return result;
};

/**
 * 解析通用的查询结果(全文检索、路径探索、邻居)
 * @param response 后端返回的res
 * @param options 解析的规则选项
 * @returns graph 用于绘制的图数据, 包含nodes、edges数组
 * @returns groups 用于绘制子图的数据
 * @returns paths 如果是路径查询会返回路径
 */
export const parseCommonResult = (response: any, options?: Record<string, any>) => {
  const nodesMap: Record<string, any> = {};
  const edgesMap: Record<string, any> = {};
  const nodes = _.map(response?.nodes, item => {
    const node = createNode(item);
    nodesMap[item.id] = node;
    return node;
  });
  const edges = _.map(response?.edges, item => {
    const edge = createEdge(item);
    edgesMap[item.id] = edge;
    return edge;
  });
  let paths: any[] = [];
  let groups;
  if (response?.paths) {
    paths = createPaths(response.paths, { ...nodesMap, ...edgesMap });
    groups = _.map(response.paths, path => ({ ...path, groupType: 'path' }));
  }
  return { graph: { nodes, edges }, groups, paths };
};

/**
 * 查询语句的返回类型
 * @param statement
 */
const getRenderType = (statement: any) => {
  if (statement.paths?.length) return 'path';
  if (statement.nodes?.length && statement.edges?.length) return 'subgraph';
  if (!statement.nodes?.length && statement.edges?.length) return 'edges';
  return 'nodes';
};

/**
 * 解析语句查询的返回结果
 * @param response 后端返回的res
 * @param options 解析的规则选项
 * @returns graph 用于绘制的图数据
 * @returns groups 子图
 * @returns result 语句结果面板数据
 */
export const parseStatementResult = (response: any, options?: Record<string, any>) => {
  const result: any[] = [];
  const groups: any[] = [];
  const graphMap: any = { nodes: {}, edges: {} };
  let _response = response;
  // 图服务返回单句, 构造数组
  if (!Array.isArray(response) && response?.nodes) {
    _response = [response];
  }
  _.forEach(_response, statement => {
    const renderType = getRenderType(statement);
    const error = statement?.error?.ErrorDetails?.[0]?.detail || statement?.error;
    const texts = createTexts(statement.texts);
    // const texts = Array.from({ length: 50 }, (v, i) => '阿三大王烦烦烦烦烦烦烦烦烦烦烦烦方法' + i);

    const nodesMap: Record<string, any> = {};
    const edgesMap: Record<string, any> = {};

    // 点
    _.forEach(statement.nodes, item => {
      nodesMap[item.id] = createNode(item);
    });

    // 边
    _.forEach(statement.edges, item => {
      const { source, target } = item;
      edgesMap[item.id] = createEdge(item);
      if (!nodesMap[source] && statement.nodes_detail?.[source]) {
        nodesMap[source] = createNode(statement.nodes_detail?.[source]);
      }
      if (!nodesMap[target] && statement.nodes_detail?.[target]) {
        nodesMap[target] = createNode(statement.nodes_detail?.[target]);
      }
    });

    // 路径
    const paths = createPaths(statement.paths, { ...nodesMap, ...edgesMap });
    paths.length && groups.push(..._.map(statement.paths, path => ({ ...path, groupType: 'path' })));

    // 子图
    if (renderType === 'subgraph') {
      groups.push({
        nodes: _.keys(nodesMap),
        edges: _.keys(edgesMap),
        groupType: 'subgraph'
      });
    }

    // 处理完单条语句
    const nodes: any[] = _.values(nodesMap);
    const edges: any[] = _.values(edgesMap);
    result.push({
      id: genStatementId(),
      statement: statement.statement,
      renderType,
      error,
      data: {
        nodes,
        edges,
        paths,
        texts
      }
    });

    // 添加到总数据
    _.assign(graphMap.nodes, nodesMap);
    _.assign(graphMap.edges, edgesMap);
  });

  const graph = { nodes: _.values(graphMap.nodes), edges: _.values(graphMap.edges) };
  return { graph, groups, result };
};
