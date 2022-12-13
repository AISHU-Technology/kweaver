import _ from 'lodash';
import G6 from '@antv/g6';
import { GraphData } from './types/data';
import { GraphGroupItem } from './types/items';

type NodeType = {
  uid: string;
  name: string;
  alias: string;
  size: number;
  [key: string]: any;
};
type EdgeType = {
  uid: string;
  alias: string;
  color: string;
  relations: string[];
  [key: string]: any;
};

/**
 * 生成唯一id
 */
export const uniqNodeId = () => _.uniqueId('node_');
export const uniqEdgeId = () => _.uniqueId('edge_');

/**
 * 后端遗留的坑, id类型转换
 * @param data
 */
const transIdType = (data: Record<string, any>, to: 'number' | 'string') => {
  ['ds_id', 'task_id'].forEach(key => {
    if (!data[key]) return;
    const func = to === 'number' ? Number : String;
    data[key] = func(data[key]);
  });
};

/**
 * 编辑时处理取回的后端数据
 * @param data 后端返回的图数据
 */
export const initGraphByEdit = (data: { entity: any[]; edge: any[] }): GraphData => {
  const { entity, edge } = data;
  const nodeMap: Record<string, string> = {};
  const nodes = _.map(entity, item => {
    const uid = uniqNodeId();
    nodeMap[item.name] = uid;
    const node = { ...item, uid, color: item.colour };
    transIdType(node, 'number');
    return node;
  });
  const edges = _.map(edge, item => {
    const uid = uniqEdgeId();
    const [sourceName, _, targetName] = item.relations;
    const edge = {
      ...item,
      uid,
      color: item.colour,
      source: nodeMap[sourceName],
      target: nodeMap[targetName],
      startId: nodeMap[sourceName],
      endId: nodeMap[targetName]
    };
    transIdType(edge, 'number');
    return edge;
  });

  return { nodes, edges };
};

/**
 * 处理平行边
 * @param edges 边集合
 */
export const handleParallelEdges = (edges: any[]) => {
  const offsetDiff = 30;
  const multiEdgeType = 'quadratic';
  const singleEdgeType = 'line';
  const loopEdgeType = 'loop';
  G6.Util.processParallelEdges(edges, offsetDiff, multiEdgeType, singleEdgeType, loopEdgeType);
};

/**
 * 定义选中的样式
 * @param type 点或边
 */
export const getSelectedStyles = (type: 'node' | 'edge') =>
  type === 'edge'
    ? { shadowBlur: 0, lineWidth: 1, stroke: '#4e4e4e' }
    : {
        stroke: '#fff',
        lineWidth: 2,
        shadowColor: '#fff',
        shadowBlur: 0,
        fill: '#4e4e4e'
      };

/**
 * 构造渲染的图模型
 * @param _data 图数据
 */
export const constructGraphData = (_data: any): any => {
  const data = _.cloneDeep(_data);

  // 构建nodes
  const nodes = _.map(data.nodes || [], (d: NodeType) => {
    const item: any = d;
    if (d.colour) item.color = d.colour;
    const { uid, alias, color, x, y, model } = item;

    const label = alias.length < 20 ? alias : `${alias.substring(0, 17)}...`;

    const nodeData: any = {
      id: uid,
      label,
      size: 36,
      type: model ? 'model-circle' : 'circle',
      style: { fill: color },
      stateStyles: { selected: { ...getSelectedStyles('node') } },
      _sourceData: item
    };
    if (x !== undefined) nodeData.x = x;
    if (y !== undefined) nodeData.y = y;

    return nodeData;
  });

  // 构建edges
  const edges = _.map(data.edges || [], (d: EdgeType) => {
    const item: any = d;
    if (d.colour) item.color = d.colour;
    const { uid, source, target, alias, color } = item;

    return {
      id: uid,
      color,
      source,
      target,
      type: 'line',
      label: alias.length < 20 ? alias : `${alias.substring(0, 17)}...`,
      style: { endArrow: { fill: color, path: G6.Arrow.triangle(8, 10, source === target ? 0 : 10) } },
      stateStyles: { selected: { ...getSelectedStyles('edge') } },
      _sourceData: item
    };
  });

  // 两节点多条边的处理
  handleParallelEdges(edges);
  return { nodes, edges };
};

/**
 * 处理框选后点击勾选的数据
 * @param oldData 原数据
 * @param newData 新数据
 * @param graphData 图数据
 */
export const changeBrushClickData = (oldData: GraphData, newData: GraphData): GraphData => {
  const clickNodeType = newData.edges.length ? 'edge' : 'node';
  const nodesMap = _.keyBy(oldData.nodes, 'uid');
  const edgeMap = _.keyBy(oldData.edges, 'uid');
  let action = 'add';
  let nodes: any[] = [];
  let edges: any[] = [];

  if (clickNodeType === 'node') {
    _.forEach(newData.nodes, node => {
      if (nodesMap[node.uid]) {
        action = 'remove';
        delete nodesMap[node.uid];
      } else {
        nodesMap[node.uid] = node;
      }
    });

    nodes = _.values(nodesMap);
    edges = _.values(edgeMap).filter(edge => nodesMap[edge.startId] && nodesMap[edge.endId]);
  }

  if (clickNodeType === 'edge') {
    _.forEach(newData.edges, edge => {
      if (edgeMap[edge.uid]) {
        action = 'remove';
        delete edgeMap[edge.uid];
      } else {
        edgeMap[edge.uid] = edge;
      }
    });
    _.forEach(newData.nodes, node => {
      if (action === 'add') {
        nodesMap[node.uid] = node;
      }
    });
    nodes = _.values(nodesMap);
    edges = _.values(edgeMap);
  }

  return { nodes, edges };
};

/**
 * 合并框选的数据
 * @param oldData 原数据
 * @param newData 新数据
 * @param graphData 图数据
 */
export const mergeBrushSelect = (oldData: GraphData, newData: GraphData, graphData: GraphData): GraphData => {
  const nodesMap: Record<string, boolean> = {};
  const edgeMap: Record<string, boolean> = {};
  const loopFunc = (graph: GraphData) => {
    _.forEach(graph.nodes, node => {
      nodesMap[node.uid] = true;
    });
    _.forEach(graph.edges, edge => {
      edgeMap[edge.uid] = true;
    });
  };
  loopFunc(oldData);
  loopFunc(newData);
  const nodes = _.filter(graphData.nodes, ({ uid }) => nodesMap[uid]);
  const edges = _.filter(graphData.edges, ({ uid }) => edgeMap[uid]);
  return { nodes, edges };
};

// 后端传参需要的key
const baseKeys = [
  'colour',
  'ds_name',
  'dataType',
  'data_source',
  'ds_path',
  'ds_id',
  'extract_type',
  'name',
  'source_table',
  'source_type',
  'properties',
  'file_type',
  'task_id',
  'properties_index',
  'model',
  'ds_address',
  'alias',
  'entity_id',
  'edge_id'
];
// 兼容旧数据, 手动创建的点赋予初值
const nodeTemplate = {
  dataType: '',
  data_source: '',
  ds_name: '',
  ds_path: '',
  extract_type: '',
  file_type: '',
  ds_id: '',
  model: '',
  task_id: '',
  source_type: 'manual',
  source_table: [],
  ds_address: ''
};

/**
 * 处理点或边
 * @param node 数据
 */
const createBaseNode = (node: any) => {
  const properties = _.map(node.properties, ([name, type]) => [name, type]);
  const data = _.pick({ ...nodeTemplate, ...node }, ...baseKeys);
  data.properties = properties;
  transIdType(data, 'string');
  if (!data.colour) data.colour = node.color;
  return data;
};

/**
 * 生成后端的分组数据
 * @param groups 前端的分组数据
 * @param graph 图数据
 * @param isHandled 是否已处理图数据
 */
export const generateGroupBody = (groups: GraphGroupItem[], graph: GraphData, isHandled = false) => {
  let nodes = graph.nodes;
  let edges = graph.edges;

  if (!isHandled) {
    const handledGraph = generateGraphBody(graph);
    nodes = handledGraph.entity;
    edges = handledGraph.edge;
  }

  const nodeMap = _.keyBy(nodes, 'name');
  const edgeMap = _.keyBy(edges, e => String(e.relations));

  return _.map(groups, item => {
    const { id, name, entity, edge, isUngrouped } = item;
    return {
      subgraph_id: id,
      name: isUngrouped ? 'ungrouped' : name, // 还原未分组名称
      entity: _.map(entity, d => nodeMap[d.name]),
      edge: _.map(edge, d => edgeMap[String(d.relations)])
    };
  });
};

/**
 * 生成后端的图数据
 * @param graph 前端图数据
 */
export const generateGraphBody = (graph: GraphData) => {
  const entity: any[] = [];
  const edge: any[] = [];
  const nodeMap: any = {};
  _.forEach(graph.nodes, (d, index) => {
    nodeMap[d.uid] = d;
    const data = createBaseNode(d);
    entity.push({ ...data, entity_id: index + 1 });
  });
  _.forEach(graph.edges, (d, index) => {
    const data = createBaseNode(d);
    const relations = [nodeMap[d.startId]?.name, d.name, nodeMap[d.endId]?.name];
    edge.push({ ...data, relations, edge_id: index + 1 });
  });
  return { entity, edge };
};
