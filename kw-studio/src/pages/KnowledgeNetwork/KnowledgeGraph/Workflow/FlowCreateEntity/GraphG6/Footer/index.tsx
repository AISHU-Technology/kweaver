import _ from 'lodash';
import React, { useState } from 'react';
import { Button, message, ConfigProvider } from 'antd';
import intl from 'react-intl-universal';
import servicesCreateEntity from '@/services/createEntity';
import servicesSubGraph from '@/services/subGraph';
import { generateGroupBody, generateGraphBody, isSameEdge } from '../assistant';
import { verifyProperty } from '../NodeInfo/PropertyList/assistant';
import { GraphData } from '../types/data';
import { GraphGroupItem } from '../types/items';
import './style.less';
import {
  NodeApiDataType,
  EdgeApiDataType,
  NodeEdgePropertiesType
} from '@/pages/KnowledgeNetwork/OntologyLibrary/OntoCanvas/OntoG6/types/data';
import {
  validateItem,
  validateTheEdge,
  validateTheNode
} from '@/pages/KnowledgeNetwork/OntologyLibrary/OntoCanvas/OntoG6/assistantFunction';
import { initGraphByEdit } from '@/pages/KnowledgeNetwork/OntologyLibrary/OntoCanvas/OntoG6/assistant';

export interface FooterProps {
  prev: Function;
  next: Function;
  graphId: number;
  ontologyId: number;
  groupList: GraphGroupItem[];
  initOntoData: Record<string, any>;
  dataInfoRef: any;
  onCheckErr: () => void;
  setOntoData: (data: any) => void;
  getCanvasGraphData: () => GraphData;
  onSave: (messageVisible: boolean) => void;
  detailUpdateData: Function;
  graphData: GraphData;
  // canvas: Record<string, string>; // 流程3画布设置去除
}

const Footer = (props: FooterProps) => {
  const {
    prev,
    next,
    graphId,
    ontologyId,
    groupList,
    initOntoData,
    dataInfoRef,
    onCheckErr,
    setOntoData,
    getCanvasGraphData,
    onSave,
    detailUpdateData,
    graphData
    // canvas // 流程3画布设置去除
  } = props;
  const [loading, setLoading] = useState(false);

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

  const filterSize = (type: string, value: string) => {
    if (type === 'node') {
      const filterData = SIZES_NODE.filter(sub => sub.size === String(value));
      return filterData[0].label;
    } else if (type === 'edge') {
      const filterData = SIZES_EDGE.filter(sub => sub.size === String(value));
      return filterData[0].label;
    }
    return '0.5x';
  };

  // 处理数据，适配新接口
  const dealWithSoManyData = (dataBefore: any) => {
    const nodes = dataBefore.nodes;
    const edges = dataBefore.edges;
    let entity: any[] = [];
    const nodeCache: any = {};
    _.map(nodes, node => {
      nodeCache[node.uid] = node;
      let properties: any[] = [];
      let primary_key: string[] = [];
      let vector_generation: string[] = []; // 向量
      _.map(node.attributes, attribute => {
        const temp: NodeEdgePropertiesType = {
          name: attribute.attrName, // 属性名
          description: attribute.attrDescribe, // 属性描述
          alias: attribute.attrDisplayName, // 显示名
          data_type: attribute.attrType, // 属性值数据类型
          synonym: attribute.attrSynonyms === undefined ? '' : attribute.attrSynonyms.join('|') // 同义词 用|来分隔
        };
        if (attribute.attrMerge) {
          primary_key = [...primary_key, attribute.attrName];
        }
        if (attribute.attrVector) {
          vector_generation = [...vector_generation, attribute.attrName];
        }
        properties = [...properties, temp];
      });
      // 实体类 2的图形必须在 ['circle', 'rect'] 中.
      // 2的大小必须为字符串!
      // 实体类 1的图形必须在 ['circle', 'rect'] 中.
      // 1 stroke_color不能为空.
      // 1 text_width不合法；1的大小必须为字符串!
      // 关系类 3 edge_id为空；3 这些参数：shape,width不存在；
      const temp: NodeApiDataType = {
        // entity_id: Number(node.uid), // id
        entity_id: node.entity_id ?? Number(node.uid), // 后端生成了entity_id，应该使用后端生成的
        name: node.name, // 实体类名
        description: node.describe, // 实体类描述
        alias: node.alias, // 别名
        synonym: node.synonyms === undefined ? '' : node.synonyms.join('|'), // 实体类名同义词 用|来分隔
        default_tag: node.default_tag, // 默认显示属性
        properties_index: node.properties_index, // 需要创建全文索引的属性
        primary_key, // 融合属性
        vector_generation, // 向量
        properties, // 属性列表
        x: node.x, // x坐标
        y: node.y, // y坐标
        icon: node.icon, // 图标
        shape: node.type !== undefined ? (node.type === 'customCircle' ? 'circle' : 'rect') : 'circle', // 形状circle（圆形）、rect（矩形）
        size: filterSize('node', node.size), // 大小
        fill_color: node.color, // 填充颜色
        stroke_color: node.strokeColor || node.color, // 描边颜色
        text_color: node.labelFill, // 文字颜色
        text_position: node.position, // 文字位置
        text_width: node.labelLength, // 文字宽度
        index_default_switch: node.switchDefault, // 索引默认开关
        index_main_switch: node.switchMaster, // 索引总开关
        text_type: node.labelType !== undefined ? (node.labelType === 'fixed' ? 'stable' : 'adaptive') : 'adaptive', // 文字自适应或固定 可选值：adaptive(自适应)、stable(固定) 仅形状为矩形时可选adaptive
        source_type: node.source_type || 'manual', // 实体类来源: automatic: 从数据源预测或者模型本体 manual: 手绘
        model: node.model || '',
        task_id: node.task_id === undefined ? '' : String(node.task_id),
        icon_color: node.iconColor || '#ffffff'
      };
      entity = [...entity, temp];
    });

    let edgeFinal: any[] = [];
    _.map(edges, edge => {
      edge.relations = [nodeCache[edge.source]?.name, edge.name, nodeCache[edge.target]?.name];
      let properties: any[] = [];
      _.map(edge.attributes, attribute => {
        const temp: NodeEdgePropertiesType = {
          name: attribute.attrName, // 属性名
          description: attribute.attrDescribe, // 属性描述
          alias: attribute.attrDisplayName, // 显示名
          data_type: attribute.attrType, // 属性值数据类型
          synonym: attribute.attrSynonyms === undefined ? '' : attribute.attrSynonyms.join('|') // 同义词 用|来分隔
        };
        properties = [...properties, temp];
      });
      const temp: EdgeApiDataType = {
        // edge_id: Number(edge.uid), // id
        edge_id: edge.edge_id ?? Number(edge.uid), // 后端生成了edge_id，使用后端生成的
        name: edge.name, // 边类名
        description: edge.describe || '', // 关系类描述
        alias: edge.alias, // 别名
        synonym: edge.synonyms === undefined ? '' : edge.synonyms.join('|'), // 边类名同义词
        properties_index: edge.properties_index, // 需要创建全文索引的属性
        default_tag: edge.default_tag, // 默认显示属性。若没有属性则可为空。
        properties, // 属性列表
        relations: edge.relations, // [起点实体类名, 边名, 终点实体类名]
        colour: edge.color, // 颜色
        shape: edge.type === 'cubic' ? 'curve' : 'line', // 形状 可选值：line（直线）、curve（曲线）
        width: filterSize('edge', String(edge.size)), // 粗细
        source_type: edge.source_type || 'manual', // automatic: 模型本体（不支持从数据源预测）manual: 手绘
        index_default_switch: edge.switchDefault, // 索引默认开关
        index_main_switch: edge.switchMaster, // 索引总开关
        model: edge.model || ''
      };
      edgeFinal = [...edgeFinal, temp];
    });
    return { entity, edge: edgeFinal };
  };

  /**
   * 校验保存数据
   */
  const checkSaveData = (graph: GraphData) => {
    const newGraph = initGraphByEdit({ entity: graph.nodes, edge: graph.edges });
    validateAllItems();
    const { nodesError, edgesError } = validateItem(newGraph);
    if (nodesError.length || edgesError.length) {
      let err: any[] = [];
      _.map(nodesError, nodeErr => {
        err = [...err, nodeErr.name + ' ' + nodeErr.value + ' ' + nodeErr.error];
      });
      _.map(edgesError, edgeErr => {
        err = [...err, edgeErr.name + ' ' + edgeErr.value + ' ' + edgeErr.error];
      });
      // message.error(err.join('.'));
      // message.error(intl.get('ontoLib.errInfo.confErr'));
      message.error({
        content: intl.get('ontoLib.errInfo.confErr'),
        className: 'custom-class',
        style: {
          marginTop: '6vh'
        }
      });
      onCheckErr();
      return true;
    }
    return false;
  };

  const validateAllItems = () => {
    let itemsNode: any = [];
    let itemsEdge: any = [];
    _.map(graphData.nodes, node => {
      const error = validateTheNode(graphData, node);
      if (!error.length) {
        const { _sourceData } = node;
        node._sourceData = { ..._sourceData, hasError: [] };
        node.hasError = [];
      } else {
        const { _sourceData } = node;
        node._sourceData = { ..._sourceData, hasError: error };
        node.hasError = error;
      }
      itemsNode = [...itemsNode, node];
    });
    _.map(graphData.edges, edge => {
      const error = validateTheEdge(graphData, edge);
      if (!error.length) {
        const { _sourceData } = edge;
        edge._sourceData = { ..._sourceData, hasError: [] };
        edge.hasError = [];
      } else {
        const { _sourceData } = edge;
        edge._sourceData = { ..._sourceData, hasError: error };
        edge.hasError = error;
      }
      itemsEdge = [...itemsEdge, edge];
    });
    detailUpdateData({ type: 'node', items: itemsNode });
    setTimeout(() => {
      detailUpdateData({ type: 'edge', items: itemsEdge });
    }, 0);
  };

  /**
   * 下一步
   */
  const onNext = async () => {
    if (loading) return;
    const graphData = getCanvasGraphData();
    const { entity, edge } = dealWithSoManyData(graphData);
    if (checkSaveData({ nodes: entity, edges: edge })) return;
    const { used_task = [], ontology_id } = initOntoData;
    // ontology_id为编辑状态时获取到的本体id ontologyId为创建本体时拿到的id
    const savedData: Record<string, any> = {
      entity,
      edge,
      used_task: _.map(used_task, Number),
      id: ontology_id || ontologyId,
      ontology_id: String(ontology_id || ontologyId),
      flag: 'nextstep',
      ontology_name: '',
      ontology_des: ''
      // canvas // 流程3画布设置去除
    };
    const requestData = {
      graph_step: 'graph_otl',
      updateoradd: 'update_otl_info',
      graph_process: [savedData]
    };
    setLoading(true);
    const resData = await servicesCreateEntity.changeFlowData(graphId, requestData);
    setLoading(false);
    if (resData.res) {
      setOntoData([savedData]);
      const groupBody = generateGroupBody(groupList, { nodes: entity, edges: edge }, true);
      const { res, error, Description } = (await servicesSubGraph.subgraphEdit(graphId, groupBody)) || {};
      if (res) {
        // 本体保存成功之后，去更新流程四的映射数据, 此时无需弹保存成功的message
        await onSave(false);
        next();
        return;
      }
      if (error?.[0]) {
        const { Description } = error[0];
        // Description && message.error(Description);
        Description &&
          message.error({
            content: Description,
            className: 'custom-class',
            style: {
              marginTop: '6vh'
            }
          });
      }
      Description &&
        message.error({
          content: Description,
          className: 'custom-class',
          style: {
            marginTop: '6vh'
          }
        });
      return;
    }
    if (resData.Code === 500026) {
      message.warning({
        content: [intl.get('createEntity.predicting')],
        className: 'custom-class',
        style: {
          marginTop: '6vh'
        }
      });
    }
    next(resData);
  };

  return (
    <div className="work-flow-footer">
      <ConfigProvider autoInsertSpaceInButton={false}>
        <Button
          className="btn"
          onClick={() => {
            prev();
          }}
        >
          {intl.get('global.previous')}
        </Button>

        <Button className="btn" type="primary" onClick={() => onSave(true)}>
          {intl.get('global.save')}
        </Button>

        <Button className="btn" onClick={onNext}>
          {intl.get('global.next')}
        </Button>
      </ConfigProvider>
    </div>
  );
};

export default Footer;
