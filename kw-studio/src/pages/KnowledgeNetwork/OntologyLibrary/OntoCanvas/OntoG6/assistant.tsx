import _ from 'lodash';
import G6 from '@antv/g6';
import React from 'react';
import { GRAPH_MODEL_ALIAS } from '@/enums';
import { GraphData, BrushData } from './types/data';
import { GraphGroupItem } from './types/items';
import { isDef } from '@/utils/handleFunction';
import { EntityAttributesDataType } from './NodeInfo/EntityClassAttributes/CreateAttributesModal';
import { EdgeAttributesDataType } from './EdgeInfo/EdgeClassAttributes/CreateAttributesModal';
import { processLoopEdges } from './OntoCanvasG6/registerLineLoop';
import { validateTheNode, validateTheEdge } from './assistantFunction';
import { OntoCanvasG6Ref } from './OntoCanvasG6';

type NodeType = {
  uid: string;
  name: string;
  alias: string;
  size: number;
  styleBorderColor: string;
  styleFillColor: string;
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
export const uniqNodeId = () => _.uniqueId('');
export const uniqEdgeId = () => _.uniqueId('');

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

const SIZES_NODE = [
  { size: '16', label: '0.25x' },
  { size: '24', label: '0.5x' },
  { size: '36', label: '1x' },
  { size: '48', label: '2x' },
  { size: '64', label: '4x' }
];

const SIZES_EDGE = [
  { size: '0.75', label: '0.25x' },
  { size: '2', label: '0.5x' },
  { size: '3', label: '1x' },
  { size: '5', label: '2x' },
  { size: '10', label: '4x' }
];

const filterLabel = (type: string, value: string) => {
  if (type === 'node') {
    const filterData = SIZES_NODE.filter(sub => sub.label === value);
    return Number(filterData[0].size);
  } else if (type === 'edge') {
    const filterData = SIZES_EDGE.filter(sub => sub.label === value);
    return Number(filterData[0].size);
  }
  return 16;
};
const filterNodeId = (nodes: any, name: string) => {
  const filterNode = _.filter(nodes, node => node.name === name);
  return filterNode[0].uid;
};

const filterTargetNodeSize = (nodes: any, endID: string) => {
  const filterNode = _.filter(nodes, node => node.uid === endID);
  return filterNode[0].size;
};

const adaptNodeNewRecord = (idString: string, item: any) => {
  let attributes: any[] = [];
  let canvasProperties: any[] = [];
  _.map(item.properties, propertie => {
    const temp: EntityAttributesDataType = {
      attrName: propertie.name,
      attrDisplayName: propertie.alias,
      attrType: propertie.data_type,
      attrIndex: item.properties_index.includes(propertie.name),
      attrMerge: item.primary_key.includes(propertie.name),
      attrVector: item.vector_generation?.includes(propertie.name),
      attrSynonyms: propertie.synonym.split('|'),
      attrDescribe: propertie.description
    };
    attributes = [...attributes, temp];
    canvasProperties = [...canvasProperties, [propertie.name, propertie.data_type, propertie.alias]];
  });
  const finalData = {
    // uid: String(item.entity_id),
    primary_key: item.primary_key, // 融合属性
    vector_generation: item.vector_generation, // 向量
    default_tag: item.default_tag,
    uid: idString,
    entity_id: item.entity_id, // 后端存储的实体id
    alias: item.alias,
    name: item.name,
    x: item.x,
    y: item.y,
    ..._.pick(item, 'fx', 'fy'),
    icon: item.icon,
    describe: item.description,
    size: filterLabel('node', item.size),
    synonyms: item.synonym.split('|'),
    type: item.shape === 'circle' ? 'customCircle' : 'customRect',
    labelType: item.text_type === 'stable' ? 'fixed' : 'adapt',
    labelLength: item.text_width,
    position: item.text_position,
    properties_index: item.properties_index,
    source_table: [],
    labelFill: item.text_color,
    color: item.fill_color,
    fillColor: item.fill_color,
    strokeColor: item.stroke_color,
    iconColor: item.icon_color,
    showLabels: [
      {
        key: item.name,
        alias: item.alias,
        value: item.alias,
        type: 'node',
        isChecked: true,
        isDisabled: false
      }
    ],
    attributes,
    properties: canvasProperties,
    switchDefault: item.index_default_switch,
    switchMaster: item.index_main_switch,
    _sourceData: item._sourceData,
    model: item.model || '',
    source_type: item.source_type || '',
    task_id: item.task_id || ''
  };
  return finalData;
};
const adaptEdgeNewRecord = (idString: string, item: any, nodes: any) => {
  let attributes: any[] = [];
  let canvasProperties: any[] = [];
  _.map(item.properties, propertie => {
    const temp: EdgeAttributesDataType = {
      attrName: propertie.name,
      attrDisplayName: propertie.alias,
      attrIndex: item.properties_index.includes(propertie.name),
      attrType: propertie.data_type,
      attrSynonyms: propertie.synonym.split('|'),
      attrDescribe: propertie.description
    };
    attributes = [...attributes, temp];
    canvasProperties = [...canvasProperties, [propertie.name, propertie.data_type, propertie.alias]];
  });
  const finalData = {
    alias: item.alias,
    attributes,
    color: item.colour,
    default_tag: item.default_tag,
    describe: item.description,
    name: item.name,
    properties: canvasProperties,
    properties_index: item.properties_index,
    relations: item.relations,
    source: filterNodeId(nodes, item.relations[0]),
    target: filterNodeId(nodes, item.relations[2]),
    startId: filterNodeId(nodes, item.relations[0]),
    endId: filterNodeId(nodes, item.relations[2]),
    size: filterLabel('edge', item.width),
    synonyms: item.synonym.split('|'),
    type: item.shape === 'line' ? 'line' : 'cubic',
    // uid: String(item.edge_id),
    uid: idString,
    edge_id: item.edge_id, // 后端存储的关系id
    switchDefault: item.index_default_switch,
    switchMaster: item.index_main_switch,
    model: item.model || '',
    source_type: item.source_type || ''
    // nodeSize: filterTargetNodeSize(nodes, filterNodeId(nodes, item.relations[2]))
  };
  return finalData;
};
/**
 * 编辑时处理取回的后端数据
 * @param data 后端返回的图数据
 */
export const initGraphByEdit = (data: { entity: any[]; edge: any[] }): GraphData => {
  const { entity, edge } = data;
  const nodes = _.map(entity, item => {
    const nodeIdString = uniqNodeId();
    const node = adaptNodeNewRecord(nodeIdString, item);
    return node;
  });
  const edges = _.map(edge, item => {
    const edgeIdString = uniqEdgeId();
    const edge = adaptEdgeNewRecord(edgeIdString, item, nodes);
    return edge;
  });
  return { nodes, edges };
};

/**
 * 处理平行边
 * @param edges 边集合
 */
export const handleParallelEdges = (edges: any[]) => {
  processLoopEdges(edges, 10);
  const offsetDiff = 30;
  const multiEdgeType = 'customQuadratic';
  const singleEdgeType = 'customLine';
  const loopEdgeType = 'customLoop';
  G6.Util.processParallelEdges(edges, offsetDiff, multiEdgeType, singleEdgeType, loopEdgeType);
};

/**
 * 定义选中的样式
 * @param type 点或边
 */
export const getSelectedStyles = (type: 'node' | 'edge') =>
  type === 'edge'
    ? { shadowBlur: 0, lineWidth: 1, stroke: 'rgba(0,0,0, 0.1)' }
    : {
        stroke: '#fff',
        lineWidth: 2,
        shadowColor: '#fff',
        shadowBlur: 0,
        fill: 'rgba(0,0,0, 0.1)'
      };

/**
 * 构造G6可以渲染的数据
 * @param _data 图数据
 */
export const constructGraphData = (_data: any): any => {
  const data = _.cloneDeep(_data);

  // 构建nodes
  const nodes = _.map(_data.nodes || [], (d: NodeType) => {
    const item: any = d;
    const { type, uid, alias, color, icon, x, y, default_tag, properties, name, hasError = [] } = item;
    const resetData = {
      default_tag: default_tag || (properties.length ? properties[0][0] : ''),
      fillColor: color,
      showLabels: [
        {
          key: name,
          alias,
          value: alias,
          type: 'node',
          isChecked: true,
          isDisabled: false
        }
      ],
      hasError: []
    };
    const label = alias.length < 20 ? alias : `${alias.substring(0, 17)}...`;
    const nodeData: any = {
      type,
      id: uid,
      label,
      size: 24,
      icon,
      style: { fill: color },
      stateStyles: { selected: { ...getSelectedStyles('node') } },
      _sourceData: Object.assign(item, resetData)
    };

    // 力导向布局会分配位置, 使用fx、fy固定
    if (isDef(x) && typeof x === 'number') nodeData.fx = x;
    if (isDef(y) && typeof y === 'number') nodeData.fy = y;
    return nodeData;
  });

  // 构建edges
  const edges = _.map(data.edges || [], (d: EdgeType) => {
    const item: any = {
      lineWidth: d?.size,
      fillColor: d?.color || d?.colour,
      hasError: [],
      strokeColor: d?.color || d?.colour,
      ...d
    };
    if (d.colour) item.color = d.colour;
    const { uid, source, target, alias, color, size, hasError } = item;

    return {
      id: uid,
      color,
      source,
      size,
      target,
      type: 'line',
      hasError,
      label: alias.length < 20 ? alias : `${alias.substring(0, 17)}...`,
      _sourceData: item
    };
  });
  // 两节点多条边的处理
  handleParallelEdges(edges);

  // 初始化校验
  let theNodes: any = [];
  let theEdges: any = [];
  _.map(nodes, node => {
    const item = node._sourceData;
    theNodes = [...theNodes, item];
  });
  _.map(edges, edge => {
    const item = edge._sourceData;
    theEdges = [...theEdges, item];
  });
  _.map(theNodes, node => {
    const error = validateTheNode({ nodes: theNodes, edges: theEdges }, node);
    if (!error.length) {
      const { _sourceData } = node;
      node._sourceData = { ..._sourceData, hasError: [] };
      node.hasError = [];
    } else {
      const { _sourceData } = node;
      node._sourceData = { ..._sourceData, hasError: error };
      node.hasError = error;
    }
  });
  _.map(theEdges, edge => {
    const error = validateTheEdge({ nodes: theNodes, edges: theEdges }, edge);
    if (!error.length) {
      const { _sourceData } = edge;
      edge._sourceData = { ..._sourceData, hasError: [] };
      edge.hasError = [];
    } else {
      const { _sourceData } = edge;
      edge._sourceData = { ..._sourceData, hasError: error };
      edge.hasError = error;
    }
  });

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
    // 旧流程三的逻辑，边的起始点都有，才会被写进（现在改为无限制）
    if (action === 'remove') {
      edges = _.values(edgeMap).filter(edge => nodesMap[edge.startId] && nodesMap[edge.endId]);
    } else {
      edges = _.values(edgeMap);
    }
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

/**
 * 处理多选的数据
 * @param BrushData 多选数据
 */
export const handleMultipleSelectionData = (
  brushSelectData: BrushData,
  canvasRef: React.RefObject<OntoCanvasG6Ref>
): GraphData => {
  const nodes = brushSelectData.nodes;
  const edges = brushSelectData.edges;
  const nodesIds = nodes.map(node => {
    return node.uid;
  });
  let needAddNodesIds: string[] = [];
  // 遍历选中的边(起始点)
  _.map(edges, edge => {
    const startAndEndPoint = Object.assign([], [edge.source, edge.target]);
    const temp = startAndEndPoint.filter(item => !nodesIds.includes(item));
    needAddNodesIds = [...needAddNodesIds, ...temp];
  });
  // 画布上所有的Nodes
  const tempAllNodes = canvasRef.current?.graph?.getNodes();
  let allNodes: any[] = [];
  _.map(tempAllNodes, node => {
    const model = node.getModel();
    const sourceData = model._sourceData;
    allNodes = [...allNodes, sourceData];
  });
  const needAddNodes = allNodes.filter(item => needAddNodesIds.includes(item.uid));
  return { nodes: needAddNodes, edges: [] };
};

// 后端传参需要的key
const baseKeys = [
  'colour',
  // 'ds_name',
  // 'dataType',
  // 'data_source',
  // 'ds_path',
  // 'ds_id',
  // 'extract_type',
  'name',
  // 'source_table',
  'source_type',
  'properties',
  'properties_index',
  'file_type',
  'task_id',
  'model',
  // 'ds_address',
  'alias',
  'entity_id',
  'edge_id'
];
const nodeFieldKeys = [...baseKeys, 'icon', 'x', 'y', 'default_tag'];
const edgeFieldKeys = baseKeys;

// 兼容旧数据, 手动创建的点赋予初值
const nodeTemplate = {
  // dataType: '',
  // data_source: '',
  // ds_name: '',
  // ds_path: '',
  // extract_type: '',
  file_type: '',
  // ds_id: '',
  model: '',
  task_id: '',
  source_type: 'manual',
  // source_table: [],
  // ds_address: '',
  icon: ''
};

/**
 * 处理点或边
 * @param node 数据
 */
const createBaseNode = (node: any) => {
  const isEdge = !!node.relations;
  const properties = _.map(node.properties, ([name, type, alias]) => {
    const curAlias = alias || (node.model ? GRAPH_MODEL_ALIAS[name] || name : name);
    return [name, type, curAlias];
  });
  const data = _.pick({ ...nodeTemplate, ...node }, ...(isEdge ? edgeFieldKeys : nodeFieldKeys));
  data.properties = properties;
  transIdType(data, 'string');
  if (node.color) data.colour = node.color;
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
    if (!nodeMap[d.startId] || !nodeMap[d.endId]) return;
    const relations = [nodeMap[d.startId].name, d.name, nodeMap[d.endId].name];
    edge.push({ ...data, relations, edge_id: index + 1 });
  });
  return { entity, edge };
};

/**
 * 判断边是否相同
 * [bug 355406] 关系类名相同, 视为同一条边, 显示名与属性需要保持一致
 * @param edge1
 * @param edge2
 */
export const isSameEdge = (edge1: Record<string, any>, edge2: Record<string, any>) => {
  if (
    edge1.name !== edge2.name ||
    edge1.alias !== edge2.alias ||
    !_.isEqual(edge1.properties, edge2.properties) ||
    !_.isEqual(edge1.properties_index, edge2.properties_index)
  ) {
    return false;
  }

  return true;
};
