import G6 from '@antv/g6';
import {
  AdBackEndEdgeDataProps,
  AdBackEndNodeDataProps,
  AdBackEndOntologyDataProps,
  G6EdgeSourceDataAttributesProps,
  G6NodeSourceDataAttributesProps,
  ReactG6NodeSourceDataProps,
  ReactG6EdgeSourceDataProps,
  ReactG6GraphDataProps,
  ReactG6NodeDataProps,
  ReactG6GraphSourceDataProps,
  ReactG6EdgeDataProps
} from './types';
import _ from 'lodash';
import { processLoopEdges } from '@/pages/KnowledgeNetwork/OntologyLibrary/OntoCanvas/OntoG6/OntoCanvasG6/registerLineLoop';
import { isDef } from '@/utils/handleFunction';
import {
  validateTheEdge,
  validateTheNode
} from '@/pages/KnowledgeNetwork/OntologyLibrary/OntoCanvas/OntoG6/assistantFunction';
import { stringSeparator1 } from '@/enums';

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
 * 将后端返回的本体数据处理成G6可渲染的数据
 * @param ontologyData 后端返回的本体数据
 */
export const generateG6GraphDataByOntologyData = (ontologyData: AdBackEndOntologyDataProps): ReactG6GraphDataProps => {
  const _sourceData = generateG6GraphSourceDataByOntologyData(ontologyData);
  const graphData = generateG6GraphDataByGraphSourceData(_sourceData);
  return graphData;
};

/**
 * 通过本体数据构造的sourceData，去生成用于G6渲染的数据
 * @param graphSourceData
 */
export const generateG6GraphDataByGraphSourceData = (
  graphSourceData: ReactG6GraphSourceDataProps
): ReactG6GraphDataProps => {
  const cloneDeepGraphSourceData = _.cloneDeep(graphSourceData);
  // Construct nodes
  const nodes = cloneDeepGraphSourceData.nodes.map(item => {
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
    const nodeData: ReactG6NodeDataProps = {
      x,
      y,
      type,
      id: uid,
      label,
      size: 24,
      icon,
      style: { fill: color },
      stateStyles: { selected: { ...getSelectedStyles('node') } },
      _sourceData: Object.assign(item, resetData)
    };
    // Force-directed layout assigns positions，fixed using fx,fy
    if (isDef(x) && typeof x === 'number') nodeData.fx = x;
    if (isDef(y) && typeof y === 'number') nodeData.fy = y;
    return nodeData;
  });

  // Construct edges
  const edges = cloneDeepGraphSourceData.edges.map(d => {
    const item = {
      lineWidth: d.size,
      fillColor: d.color,
      hasError: [],
      strokeColor: d.color,
      ...d
    };
    const { uid, source, target, alias, color, size, hasError } = item;
    const edgeData: ReactG6EdgeDataProps = {
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
    return edgeData;
  });
  // Two nodes and multiple edges processing
  handleParallelEdges(edges);

  // Initialization check
  let theNodes: ReactG6NodeSourceDataProps[] = [];
  let theEdges: ReactG6EdgeSourceDataProps[] = [];
  nodes.forEach(node => {
    const item = node._sourceData;
    theNodes = [...theNodes, item];
  });
  edges.forEach(edge => {
    const item = edge._sourceData;
    theEdges = [...theEdges, item];
  });
  theNodes.forEach(node => {
    const error = validateTheNode({ nodes: theNodes, edges: theEdges }, node);
    if (!error.length) {
      node.hasError = [];
    } else {
      node.hasError = error;
    }
  });
  theEdges.forEach(edge => {
    const error = validateTheEdge({ nodes: theNodes, edges: theEdges }, edge);
    if (!error.length) {
      edge.hasError = [];
    } else {
      edge.hasError = error;
    }
  });
  return { nodes, edges };
};

/**
 * 将后端返回的本体数据处理成G6 的 _sourceData 结构
 * @param ontologyData 后端返回的本体数据
 */
export const generateG6GraphSourceDataByOntologyData = (
  ontologyData: AdBackEndOntologyDataProps
): ReactG6GraphSourceDataProps => {
  const { entity, edge } = ontologyData;
  const g6NodeSourceData = entity.map(item => ontologyNodeConvertG6NodeSourceData(item));
  const g6EdgeSourceData = edge.map(item => ontologyEdgeConvertG6EdgeSourceData(item));
  return { nodes: g6NodeSourceData, edges: g6EdgeSourceData };
};

/** 本体entity转化为G6节点sourceData */
const ontologyNodeConvertG6NodeSourceData = (ontologyNode: AdBackEndNodeDataProps) => {
  let attributes: G6NodeSourceDataAttributesProps[] = [];
  let canvasProperties: Array<string[]> = [];
  ontologyNode.properties.forEach(propertie => {
    const temp: G6NodeSourceDataAttributesProps = {
      attrName: propertie.name,
      attrDisplayName: propertie.alias,
      attrType: propertie.data_type,
      attrIndex: ontologyNode.properties_index.includes(propertie.name),
      attrMerge: ontologyNode.primary_key.includes(propertie.name),
      attrVector: ontologyNode.vector_generation?.includes(propertie.name),
      attrSynonyms: propertie.synonym.split('|'),
      attrDescribe: propertie.description
    };
    attributes = [...attributes, temp];
    canvasProperties = [...canvasProperties, [propertie.name, propertie.data_type, propertie.alias]];
  });
  const uniqueId = ontologyNode.entity_id;
  const nodeSourceData: ReactG6NodeSourceDataProps = {
    primary_key: ontologyNode.primary_key, // Fusion properties
    vector_generation: ontologyNode.vector_generation, // vector
    default_tag: ontologyNode.default_tag,
    uid: ontologyNode.name, // uid、id、entity_id values，Use node name as the only attribute
    entity_id: uniqueId, // uid、id、entity_id values，Use node name as the only attribute
    alias: ontologyNode.alias,
    name: ontologyNode.name,
    x: ontologyNode.x,
    y: ontologyNode.y,
    icon: ontologyNode.icon,
    describe: ontologyNode.description,
    size: filterLabel('node', ontologyNode.size),
    synonyms: ontologyNode.synonym.split('|'),
    type: ontologyNode.shape === 'circle' ? 'customCircle' : 'customRect',
    labelType: ontologyNode.text_type === 'stable' ? 'fixed' : 'adapt',
    labelLength: ontologyNode.text_width,
    position: ontologyNode.text_position,
    properties_index: ontologyNode.properties_index,
    source_table: [],
    labelFill: ontologyNode.text_color,
    color: ontologyNode.fill_color,
    fillColor: ontologyNode.fill_color,
    strokeColor: ontologyNode.stroke_color,
    iconColor: ontologyNode.icon_color,
    showLabels: [
      {
        key: ontologyNode.name,
        alias: ontologyNode.alias,
        value: ontologyNode.alias,
        type: 'node',
        isChecked: true,
        isDisabled: false
      }
    ],
    attributes,
    properties: canvasProperties,
    switchDefault: ontologyNode.index_default_switch,
    switchMaster: ontologyNode.index_main_switch,
    model: ontologyNode.model || '',
    source_type: ontologyNode.source_type || '',
    task_id: ontologyNode.task_id || '',
    fx: ontologyNode.fx,
    fy: ontologyNode.fy
  };
  return nodeSourceData;
};

/** 本体edge转化为G6 边 sourceData */
const ontologyEdgeConvertG6EdgeSourceData = (ontologyEdge: AdBackEndEdgeDataProps) => {
  let attributes: any[] = [];
  let canvasProperties: any[] = [];
  ontologyEdge.properties.forEach(propertie => {
    const temp: G6EdgeSourceDataAttributesProps = {
      attrName: propertie.name,
      attrDisplayName: propertie.alias,
      attrIndex: ontologyEdge.properties_index.includes(propertie.name),
      attrType: propertie.data_type,
      attrSynonyms: propertie.synonym.split('|'),
      attrDescribe: propertie.description
    };
    attributes = [...attributes, temp];
    canvasProperties = [...canvasProperties, [propertie.name, propertie.data_type, propertie.alias]];
  });
  const uniqueId = ontologyEdge.edge_id;
  const edgeSourceData: ReactG6EdgeSourceDataProps = {
    alias: ontologyEdge.alias,
    attributes,
    color: ontologyEdge.colour,
    default_tag: ontologyEdge.default_tag,
    describe: ontologyEdge.description,
    name: ontologyEdge.name,
    properties: canvasProperties,
    properties_index: ontologyEdge.properties_index,
    relations: ontologyEdge.relations,
    source: ontologyEdge.relations[0],
    target: ontologyEdge.relations[2],
    startId: ontologyEdge.relations[0],
    endId: ontologyEdge.relations[2],
    size: filterLabel('edge', ontologyEdge.width),
    synonyms: ontologyEdge.synonym.split('|'),
    type: ontologyEdge.shape === 'line' ? 'line' : 'cubic',
    uid: ontologyEdge.relations.join(stringSeparator1),
    edge_id: uniqueId, // The relationship class id returned by the backend
    switchDefault: ontologyEdge.index_default_switch,
    switchMaster: ontologyEdge.index_main_switch,
    model: ontologyEdge.model || '',
    source_type: ontologyEdge.source_type || ''
  };
  return edgeSourceData;
};
