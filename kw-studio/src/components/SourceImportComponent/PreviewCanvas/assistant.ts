import G6 from '@antv/g6';
import _ from 'lodash';
import { getCorrectColor, isDef } from '@/utils/handleFunction';
import { MODEL_ICON } from '@/utils/antv6';
import { GRAPH_MODEL_ALIAS } from '@/enums';
import { initGraphByEdit } from '@/pages/KnowledgeNetwork/OntologyLibrary/OntoCanvas/OntoG6/assistant';

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
 * 解析模型预测数据, 构造图谱
 * @param modelOtl 后端返回的模型预测数据
 * @param isGetProperty 是否提取属性
 */
type ModelOtl = {
  entity_list: string[][];
  entity_relation_set: string[][][];
  entity_property_dict: {
    entity: string;
    primary_key: string[];
    property: Record<string, any>;
    property_index: string[];
  }[];
  relation_property_dict: { edge: string; property: Record<string, any>; property_index: string[] }[];
};
export const parseModelGraph = (modelOtl: ModelOtl, isGetProperty = false, extendProperty?: any) => {
  const { entity_list, entity_relation_set, entity_property_dict, relation_property_dict } = modelOtl;
  const nodeMap: Record<string, number> = {};
  const nodes = _.map(entity_list, ([name, alias], index) => {
    if (extendProperty && extendProperty?.[name] && entity_property_dict?.[index]) {
      entity_property_dict[index] = { ...(entity_property_dict[index] || {}), ...(extendProperty?.[name] || {}) };
    }
    const id = Number(_.uniqueId());
    const color = getCorrectColor();
    let proInfo: any = {};
    nodeMap[name] = id;
    if (isGetProperty) {
      const properties = _.map(entity_property_dict[index]?.property, pro => {
        const { name, data_type } = pro;
        return [name, data_type, GRAPH_MODEL_ALIAS[name] || name];
      });
      proInfo = {
        properties,
        properties_index: entity_property_dict[index]?.property_index
      };
    }
    const restNode = {
      entity_id: id,
      name,
      alias,
      default_tag: entity_property_dict[index]?.property[0].name,
      description: '',
      fill_color: color,
      icon: MODEL_ICON,
      index_default_switch: true,
      index_main_switch: true,
      mode: '',
      primary_key: entity_property_dict[index]?.primary_key,
      properties: entity_property_dict[index]?.property,
      properties_index: proInfo.properties_index || [],
      shape: 'circle',
      size: '0.5x',
      source_type: 'automatic',
      stroke_color: color,
      synonym: '',
      text_color: 'rgba (154, 205,50,1)',
      text_position: 'bottom',
      text_type: 'adaptive',
      text_width: 5,
      showLabels: [
        {
          key: name,
          alias,
          value: alias,
          type: 'node',
          isChecked: true,
          isDisabled: false
        }
      ]
    };
    return {
      ...restNode,
      _sourceData: { ...restNode }
    };
  });
  const edges = _.map(entity_relation_set, (item, index) => {
    const [startNode, edge, endNode] = item;
    const id = Number(_.uniqueId());
    const color = getCorrectColor();
    const source = nodeMap[startNode[0]];
    const target = nodeMap[endNode[0]];
    const relations = [startNode[0], edge[0], endNode[0]];
    let proInfo: any = {};
    if (isGetProperty) {
      const properties = _.map(relation_property_dict[index]?.property, pro => {
        const { name, data_type } = pro;
        return [name, data_type, GRAPH_MODEL_ALIAS[name] || name];
      });
      proInfo = {
        properties,
        properties_index: relation_property_dict[index]?.property_index
      };
    }
    const restEdge = {
      alias: edge[1],
      color,
      colour: color,
      default_tag: relation_property_dict[index]?.property[0].name,
      description: '',
      edge_id: id,
      index_default_switch: true,
      index_main_switch: true,
      model: '',
      name: edge[0],
      properties: relation_property_dict[index]?.property,
      properties_index: proInfo.properties_index || [],
      relations,
      shape: 'line',
      source_type: 'automatic',
      synonym: '',
      width: '0.25x',
      target,
      source
    };
    return {
      ...restEdge,
      _sourceData: { ...restEdge }
    };
  });

  handleParallelEdges(edges);
  return { nodes, edges };
};

export const constructGraphData = (_data: any): any => {
  const data = initGraphByEdit({ entity: _data.nodes || _data.entity, edge: _data.edges || _data.edge });
  const theNodes: any[] = _.map(data.nodes || [], (d: NodeType) => {
    const item: any = d;
    const { uid, type, alias, color, icon, x, y, fx, fy, default_tag, properties, name } = item;
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
      ]
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

    if (isDef(x)) nodeData.fx = isDef(fx) ? fx : x;
    if (isDef(y)) nodeData.fy = isDef(fy) ? fy : y;

    return nodeData;
  });
  const theEdges = _.map(data.edges || [], (d: EdgeType) => {
    const item: any = d;
    if (d.colour) item.color = d.colour;
    const { relations, alias, color, size, uid } = item;

    const source = _.filter(theNodes, node => node._sourceData.name === relations[0])[0].id;
    const target = _.filter(theNodes, node => node._sourceData.name === relations[2])[0].id;
    return {
      id: uid,
      color,
      source,
      size,
      target,
      type: 'line',
      label: alias.length < 20 ? alias : `${alias.substring(0, 17)}...`,
      style: { endArrow: { fill: color, path: G6.Arrow.triangle(8, 10, source === target ? 0 : 6) } },
      stateStyles: { selected: { ...getSelectedStyles('edge') } },
      _sourceData: item
    };
  });

  handleParallelEdges(theEdges);
  return { nodes: theNodes, edges: theEdges };
};

/**
 * 解析本体数据
 * @param otl 后端返回的模型预测数据
 */
type Otl = {
  entity: any[];
  edge: any[];
  [key: string]: any;
};
export const parseOntoGraph = (otl: Otl) => {
  const nodes = _.map(otl.entity, d => {
    if (d.colour) d.color = d.colour;
    const { name, alias, color, icon, x, y } = d;

    const label = alias.length < 20 ? alias : `${alias.substring(0, 17)}...`;
    const nodeData: any = {
      id: name,
      label,
      icon,
      style: { fill: color },
      _sourceData: d
    };

    if (isDef(x)) nodeData.fx = x;
    if (isDef(y)) nodeData.fy = y;

    return nodeData;
  });

  const edges = _.map(otl.edge || [], d => {
    if (d.colour) d.color = d.colour;
    const { relations, alias, color } = d;
    const [source, target] = relations;

    return {
      color,
      source,
      target,
      label: alias.length < 20 ? alias : `${alias.substring(0, 17)}...`,
      style: { endArrow: { fill: color, path: G6.Arrow.triangle(8, 10, source === target ? 0 : 10) } },
      _sourceData: d
    };
  });

  handleParallelEdges(edges);
  return { nodes, edges };
};
