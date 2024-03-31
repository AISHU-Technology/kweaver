/**
 * 注册 悬停样式
 */
import _ from 'lodash';
import G6 from '@antv/g6';
import type { Graph as TGraph } from '@antv/g6';
import { uniqEdgeId, uniqNodeId, handleParallelEdges } from '../assistant';
import React from 'react';
import { getCorrectColor } from '@/utils/handleFunction';

// node可copy区域的className
const NODE_HALO_CLASS = 'node-halo-class';
// 是否开始监听鼠标移动
let listenMouseMoveable = false;
// 源Node的model
let sourceNodeModel: any = null;
// 复制的Node的model
let copiedNodeModel: any = null;
// 自动生成的Edge的ID
let autoCreatedEdgeID: any = null;
// 自动生成的Edge的颜色
let autoCreatedEdgeColor: any = null;
// 自动生成的后缀数字
let auto_create_index = 1;

/* eslint-disable */
export const registerNodeCopyBehavior = (
  name: string,
  addGraphEdge: Function,
  addGraphNode: Function,
  onNodeClick: Function,
  onChangeSelectedItem: Function,
  isNodeCopyBehavior: React.RefObject<boolean>
) => {
  G6.registerBehavior(name, {
    getEvents() {
      return {
        'node:click': 'onNodeClick',
        'canvas:mousemove': 'onCanvasMouseMove'
      };
    },
    onNodeClick(e: any) {
      const graph = this.graph as TGraph;
      nodeClickListener(e, graph, addGraphEdge, addGraphNode, onNodeClick, onChangeSelectedItem, isNodeCopyBehavior);
    },
    onCanvasMouseMove(e: any) {
      const graph = this.graph as TGraph;
      canvasMouseMoveListener(e, graph);
    }
  });
};

const nodeClickListener = (
  e: any,
  graph: any,
  addGraphEdge: any,
  addGraphNode: any,
  onNodeClick: any,
  onChangeSelectedItem: any,
  isNodeCopyBehavior: any
) => {
  if (e.target.get('className') === NODE_HALO_CLASS && !isNodeCopyBehavior.current) {
    isNodeCopyBehavior.current = true;
    const copiedNodeID = uniqNodeId();
    listenMouseMoveable = true;
    autoCreatedEdgeID = uniqEdgeId();
    const suffixIndex = auto_create_index++;

    // 复制Node
    sourceNodeModel = e.item.getModel();
    // const copiedNodeName = `${sourceNodeModel._sourceData.name}_${suffixIndex}`;
    // const copiedNodeAlias = `${sourceNodeModel._sourceData.alias}_${suffixIndex}`;
    const copiedNodeName = '';
    const copiedNodeAlias = '';
    const nodeRandomColor = getCorrectColor('');
    copiedNodeModel = {
      ...sourceNodeModel,
      id: copiedNodeID,
      _sourceData: {
        ...sourceNodeModel._sourceData,
        uid: copiedNodeID,
        name: copiedNodeName,
        alias: copiedNodeAlias,
        attributes: [
          {
            attrDescribe: '',
            attrDisplayName: '',
            attrIndex: true,
            attrMerge: true,
            attrName: '',
            attrSynonyms: [''],
            attrType: 'string'
          }
        ],
        default_tag: '',
        primary_key: [],
        properties: [[]],
        properties_index: [],
        model: '',
        position: '',
        icon: '',
        labels: '',
        color: nodeRandomColor,
        fillColor: nodeRandomColor,
        strokeColor: nodeRandomColor,
        synonyms: [''],
        describe: '',
        _group: [],
        showLabels: [
          {
            key: copiedNodeName,
            alias: copiedNodeAlias,
            value: copiedNodeAlias,
            type: 'node',
            isChecked: true,
            isDisabled: false
          }
        ]
      }
    };
    delete copiedNodeModel._sourceData.entity_id;
    addGraphNode([copiedNodeModel._sourceData]);

    // 自动生成Edge
    const edgeRandomColor = getCorrectColor('');
    autoCreatedEdgeColor = edgeRandomColor;
    graph.addItem('edge', {
      id: autoCreatedEdgeID,
      source: sourceNodeModel.id,
      target: copiedNodeID,
      color: autoCreatedEdgeColor,
      style: { endArrow: { fill: autoCreatedEdgeColor, path: G6.Arrow.triangle(8, 10, 0) } }
    });
  } else if (e.item.getModel().id === copiedNodeModel?.id) {
    // const name = `${sourceNodeModel?._sourceData?.name}_2_${copiedNodeModel?._sourceData?.name}`;
    const name = '';
    const newEdgeData = {
      uid: autoCreatedEdgeID,
      name,
      color: autoCreatedEdgeColor,
      size: 0.75,
      alias: name,
      source: sourceNodeModel.id,
      target: copiedNodeModel.id,
      startId: sourceNodeModel.id,
      endId: copiedNodeModel.id,
      properties_index: [],
      properties: [],
      switchDefault: false,
      switchMaster: false,
      relations: [sourceNodeModel?._sourceData?.name, name, copiedNodeModel?._sourceData?.name]
    };
    addGraphEdge([newEdgeData], 'update');

    const edgesModel = _.map(graph.getEdges(), d => d.getModel());
    handleParallelEdges(edgesModel);
    graph.refresh();
    onNodeClick(graph, copiedNodeModel._sourceData);
    onChangeSelectedItem({ ...copiedNodeModel._sourceData, eventType: 'click' });

    listenMouseMoveable = false;
    sourceNodeModel = null;
    copiedNodeModel = null;
    autoCreatedEdgeID = null;
    autoCreatedEdgeColor = null;
    isNodeCopyBehavior.current = false;
  }
};

const canvasMouseMoveListener = (e: any, graph: any) => {
  if (listenMouseMoveable) {
    const node = graph.findById(copiedNodeModel.id);
    graph.updateItem(node, { x: e.x, y: e.y });
  }
};
