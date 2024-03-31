/* eslint-disable max-lines */
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useKnowledgeMapContext } from '@/pages/KnowledgeNetwork/KnowledgeGraph/Workflow/KnowledgeMap/KnowledgeMapContext';
import './style.less';
import _ from 'lodash';
import G6, { G6GraphEvent } from '@antv/g6';
import type { Graph, INode, GraphData, NodeConfig, EdgeConfig, NodeEventType } from '@antv/g6';
import useDeepCompareEffect from '@/hooks/useDeepCompareEffect';
import AdResizeObserver, { ResizeProps } from '@/components/AdResizeObserver/AdResizeObserver';
import {
  initGraphByEdit,
  constructGraphData
} from '@/pages/KnowledgeNetwork/OntologyLibrary/OntoCanvas/OntoG6/assistant';
import registerNodeCircle from '@/pages/KnowledgeNetwork/OntologyLibrary/OntoCanvas/OntoG6/OntoCanvasG6/registerNodeCircle';
import registerLineLine from '@/pages/KnowledgeNetwork/OntologyLibrary/OntoCanvas/OntoG6/OntoCanvasG6/registerLineLine';
import registerLineLoop from '@/pages/KnowledgeNetwork/OntologyLibrary/OntoCanvas/OntoG6/OntoCanvasG6/registerLineLoop';
import registerLineQuadratic from '@/pages/KnowledgeNetwork/OntologyLibrary/OntoCanvas/OntoG6/OntoCanvasG6/registerLineQuadratic';
import { registerToolTip, toolTipWorkFlow } from '@/utils/antv6';
// import registerNodeSelectedBehavior from './registerNodeSelectedBehavior';
import registerItemHoverBehavior from './registerItemHoverBehavior';
// import registerEdgeSelectedBehavior from './registerEdgeSelectedBehavior';
import registerFileNode from './registerFileNode';
import { DS_SOURCE, EXTRACT_TYPE } from '@/enums';
import OntologyG6Search from './OntologyG6Search/OntologyG6Search';
import {
  DataFileErrorsProps,
  DataFileType,
  Flow4ErrorType,
  G6EdgeData,
  G6NodeData
} from '@/pages/KnowledgeNetwork/KnowledgeGraph/Workflow/KnowledgeMap/types';
import registerRelationClassEdge from '@/pages/KnowledgeNetwork/KnowledgeGraph/Workflow/KnowledgeMap/KMLeftContainer/OntologyG6/registerRelationClassEdge';
import AdG6ToolBar from '@/components/AdReactG6/AdG6ToolBar/AdG6ToolBar';
import intl from 'react-intl-universal';
import { getRepeatMapProps } from '@/pages/KnowledgeNetwork/KnowledgeGraph/Workflow/KnowledgeMap/assistant';

const OntologyG6 = forwardRef((props, ref) => {
  const {
    knowledgeMapStore: {
      ontologyData,
      graphG6Data,
      g6RelationDataFileObj,
      graphKMap,
      currentStep,
      selectedG6Node,
      selectedG6Edge,
      selectedModel,
      selectedG6ModelEdge,
      selectedG6ModelNode
    },
    setKnowledgeMapStore,
    getLatestStore
  } = useKnowledgeMapContext();
  const [g6Init, setG6Init] = useState<boolean>(false);
  const g6Container = useRef<HTMLDivElement>(null);
  const graph = useRef<Graph | null>(null); // 储存G6的实例
  const prefixLocale = 'workflow.knowledgeMap';

  useImperativeHandle(ref, () => ({
    cancelSelected: onCanvasClick, // 将取消选中暴露出去，列表页面调用
    updateGraphDataStatusByDataFile // 更新G6实体类与关系类的错误状态
  }));

  useEffect(() => {
    mounted();
    return () => {
      unMounted();
    };
  }, []);

  /**
   * 监听ontologyData流程三配置的本体数据，去获取G6的数据
   */
  useDeepCompareEffect(() => {
    getGraphData();
  }, [ontologyData[0]?.entity, ontologyData[0]?.edge]);

  /**
   * 监听Store中的G6的数据源，去绘制G6 图
   */
  useDeepCompareEffect(() => {
    if (g6Init) {
      const newGraphG6Data = _.cloneDeep(graphG6Data);
      graph.current?.changeData({ ...newGraphG6Data });
      graph.current?.fitCenter();
    }
  }, [graphG6Data, g6Init]);

  /**
   * 监听store中的graphKMap映射数据，获取节点或边与数据文件关联的数据源
   */
  useDeepCompareEffect(() => {
    const dataFileObj = getEntityEdgeRelDataFile();
    const errorList = getErrorListByKMapAndG6Data(dataFileObj);
    setKnowledgeMapStore(preStore => ({
      ...preStore,
      g6RelationDataFileObj: dataFileObj,
      flow4ErrorList: errorList
    }));
  }, [graphKMap, graphG6Data]);

  // /**
  //  * 实时监听数据文件去更新G6数据源，将文件绘制到G6中
  //  */
  // useEffect(() => {
  //   // updateGraphDataByDataFile();
  //   if (currentStep === 3) {
  //     // updateGraphDataStatusByDataFile();
  //   }
  // }, [g6RelationDataFileObj, errorTips, currentStep]);

  useEffect(() => {
    initDefaultSelectedNodeOrEdge();
    // 取消选中或者切换到其他选中的节点或边，去更新节点或边的错误状态
    updateGraphDataStatusByDataFile();

    handleFocusItem();
  }, [selectedG6Node, selectedG6Edge, selectedModel]);

  /**
   * 选中的节点或边居中到画布中央显示
   */
  const handleFocusItem = () => {
    let g6Items: string[] = [];
    if (selectedG6Node.length > 0) {
      const nodeId = selectedG6Node[0].id;
      g6Items.push(nodeId);
    }
    if (selectedG6Edge.length > 0) {
      const { startNodeData, endNodeData } = selectedG6Edge[0];
      const startNodeId = startNodeData.id;
      const endNodeId = endNodeData.id;
      g6Items = [...g6Items, startNodeId, endNodeId];
    }

    if (selectedModel.length > 0) {
      if (selectedG6ModelNode.length > 0) {
        const nodeId = selectedG6ModelNode[0].id;
        g6Items = [...g6Items, nodeId];
      }
      if (selectedG6ModelEdge.length > 0) {
        const { startNodeData, endNodeData } = selectedG6ModelEdge[0];
        const startNodeId = startNodeData.id;
        const endNodeId = endNodeData.id;
        g6Items = [...g6Items, startNodeId, endNodeId];
      }
    }

    if (g6Items.length > 0) {
      const items = g6Items.map(item => graph.current!.findById(item));
      graph.current?.focusItems(items);
    }
  };

  /**
   * 根据selectedG6Node或者selectedG6Edge设置选中的状态
   */
  const initDefaultSelectedNodeOrEdge = () => {
    if (selectedG6Node.length > 0) {
      const item = graph.current
        ?.getNodes()
        .find(item => (item.getModel()._sourceData as any).entity_id === selectedG6Node[0]._sourceData.entity_id);
      // item && onNodeClick({ item } as G6GraphEvent);
      item && highlightNode({ item } as G6GraphEvent);
    }
    if (selectedG6Edge.length > 0) {
      const { edgeData } = selectedG6Edge[0];
      const item = graph.current
        ?.getEdges()
        .find(item => (item.getModel()._sourceData as any).edge_id === edgeData._sourceData.edge_id);
      item && highlightEdge({ item } as G6GraphEvent);
    }
    if (selectedModel.length > 0) {
      if (selectedG6ModelNode.length > 0) {
        const item = graph.current
          ?.getNodes()
          .find(
            item => (item.getModel()._sourceData as any).entity_id === selectedG6ModelNode[0]._sourceData.entity_id
          );
        // item && onNodeClick({ item } as G6GraphEvent);
        item && highlightNode({ item } as G6GraphEvent);
      }
      if (selectedG6ModelEdge.length > 0) {
        const { edgeData } = selectedG6ModelEdge[0];
        const item = graph.current
          ?.getEdges()
          .find(item => (item.getModel()._sourceData as any).edge_id === edgeData._sourceData.edge_id);
        item && highlightEdge({ item } as G6GraphEvent);
      }
    }
  };

  /**
   * 通过映射数据和G6数据源获取实体类与关系类的错误信息
   */
  const getErrorListByKMapAndG6Data = (g6RelationDataFileObj: any) => {
    const errorData: Flow4ErrorType[] = [];
    const relateClassNames = Object.keys(g6RelationDataFileObj); // 已经关联的实体类name或者关系类id
    [...graphG6Data.nodes!, ...graphG6Data.edges!].forEach((item: G6NodeData | G6EdgeData) => {
      const relations = item._sourceData.relations; // 关系类的关系
      const className = relations ? String(item._sourceData.edge_id) : item._sourceData.name; // 实体类name或关系类的id
      const defaultProps = item._sourceData.default_tag; // 默认属性
      const mergeProps = item._sourceData.primary_key ?? []; // 融合属性

      // 只有关联了数据文件的实体类或者关系类，才有肯会出现报错的情况
      if (relateClassNames.includes(className)) {
        if (item._sourceData.model) {
        } else if (relations) {
          // 此时是关系类
          graphKMap.edge.forEach(edge => {
            if (_.isEqual(edge.relations, relations)) {
              // 关系类关联了数据文件
              if (edge.entity_type) {
                // 说明关系类有属性，看默认显示属性是否映射
                if (edge.property_map.length > 0) {
                  edge.property_map.forEach(attr => {
                    if (defaultProps === attr.edge_prop && !attr.entity_prop) {
                      errorData.push({
                        name: className,
                        type: 'required',
                        error: intl.get(`${prefixLocale}.defaultTagRequiredTip`)
                      });
                    }
                  });
                  // 检查是否有多个属性映射到同一个数据文件字段身上的问题
                  const repeatData = getRepeatMapProps(edge.property_map);
                  repeatData.forEach(item => {
                    errorData.push({
                      name: className,
                      attrName: item.edge_prop,
                      type: 'repeat',
                      error: intl.get(`${prefixLocale}.fieldMapUniqueError`)
                    });
                  });
                }
                // 起点和终点同时未映射
                if (!edge.relation_map.equation_end && !edge.relation_map.equation_begin) {
                  errorData.push({
                    name: className,
                    type: 'required',
                    error: intl.get(`${prefixLocale}.x6RelStartEndRequiredTip`)
                  });
                } else {
                  // 终点未映射
                  if (!edge.relation_map.equation_end) {
                    errorData.push({
                      name: className,
                      type: 'required',
                      error: intl.get(`${prefixLocale}.x6RelEndNodeRequiredTip`)
                    });
                  }
                  // 起点未映射
                  if (!edge.relation_map.equation_begin) {
                    errorData.push({
                      name: className,
                      type: 'required',
                      error: intl.get(`${prefixLocale}.x6RelStartNodeRequiredTip`)
                    });
                  }
                }
              }

              // 关系类没有关联数据文件, 那么起点和终点必须要进行映射
              if (!edge.entity_type) {
                if (!edge.relation_map.equation) {
                  errorData.push({
                    name: className,
                    type: 'required',
                    error: intl.get(`${prefixLocale}.x6RelStartEndNoFileRequiredTip`)
                  });
                }
              }
            }
          });
        } else {
          // 此时是实体类
          graphKMap.entity.forEach(entity => {
            if (entity.name === className && entity.entity_type) {
              let unConfigDefaultTag = false;
              let unConfigMergeTag = false;
              entity.property_map.forEach(attr => {
                if (defaultProps === attr.otl_prop && !attr.entity_prop) {
                  unConfigDefaultTag = true;
                }
                if (mergeProps.includes(attr.otl_prop) && !attr.entity_prop) {
                  unConfigMergeTag = true;
                }
              });
              if (unConfigDefaultTag && unConfigMergeTag) {
                errorData.push({
                  name: className,
                  type: 'required',
                  error: intl.get(`${prefixLocale}.errorTips1`)
                });
              } else {
                if (unConfigDefaultTag) {
                  errorData.push({
                    name: className,
                    type: 'required',
                    error: intl.get(`${prefixLocale}.defaultTagRequiredTip`)
                  });
                }
                if (unConfigMergeTag) {
                  errorData.push({
                    name: className,
                    type: 'required',
                    error: intl.get(`${prefixLocale}.mergeRequiredTip`)
                  });
                }
                // 检查是否有多个属性映射到同一个数据文件字段身上的问题
                const repeatData = getRepeatMapProps(entity.property_map);
                repeatData.forEach(item => {
                  errorData.push({
                    name: className,
                    attrName: item.otl_prop,
                    type: 'repeat',
                    error: intl.get(`${prefixLocale}.fieldMapUniqueError`)
                  });
                });
              }
            }
          });
        }
      }
    });
    return errorData;
  };

  /**
   * 组件挂载
   */
  const mounted = () => {
    initG6GraphConfig();
    registerToolTip(graph, false);
  };

  /**
   * 组件卸载
   */
  const unMounted = () => {
    handleRemoveEvents();
    graph.current?.destroy();
  };

  /**
   * G6画布自适应窗口
   * @param width
   * @param height
   */
  const g6GraphResize = ({ width, height }: ResizeProps) => {
    if (graph.current && g6Container.current) {
      graph.current.changeSize(width, height);
      // graph.current?.fitView(20, { onlyOutOfViewPort: true, direction: 'y' });
      graph.current?.fitCenter();
    }
  };

  /**
   * 初始化G6的配置
   */
  const initG6GraphConfig = () => {
    // registerEdgeSelectedBehavior('activate-edge'); // 注册高亮边的自定义行为
    // registerNodeSelectedBehavior('activate-node'); // 注册高亮节点的自定义行为
    registerItemHoverBehavior('hover-item'); // 注册节点/边 hover的自定义行为
    registerNodeCircle('customCircle');
    registerFileNode('kw-g6-file-node');
    registerLineLine('customLine');
    registerLineLoop('customLoop');
    registerLineQuadratic('customQuadratic');
    registerRelationClassEdge('kw-g6-relation-edge');
    graph.current = new G6.Graph({
      linkCenter: true,
      // plugins: [toolTipWorkFlow(280)],
      container: g6Container.current!,
      modes: { default: ['drag-canvas', 'zoom-canvas', 'drag-node', 'activate-node', 'activate-edge', 'hover-item'] },
      // layout: {
      //   type: 'force',
      //   linkDistance: 200, // 可选，边长
      //   nodeStrength: -100, // 可选
      //   edgeStrength: 1, // 可选
      //   collideStrength: 1, // 可选
      //   preventOverlap: true,
      //   alpha: 0.8, // 可选
      //   alphaDecay: 0.028, // 可选
      //   alphaMin: 0.01 // 可选
      // },
      defaultNode: {
        type: 'customCircle',
        style: { cursor: 'pointer', stroke: 'white', lineWidth: 3 },
        labelCfg: { position: 'top', offset: 7, style: { fill: '#000' } }
      },
      defaultEdge: {
        size: 1,
        type: 'customLine',
        color: '#000',
        style: { cursor: 'pointer', lineAppendWidth: 30 },
        loopCfg: { cursor: 'pointer', position: 'top', dist: 100 },
        labelCfg: { cursor: 'pointer', autoRotate: true, refY: 7, style: { fill: '#000' } }
      }
    });
    graph.current.get('canvas').set('localRefresh', false);
    graph.current.data({ nodes: [], edges: [] });
    graph.current.render();
    handleBindEvents();
    setG6Init(true);
  };

  /**
   * 根据本体数据源提炼出符合自定义节点与边的G6数据源
   */
  const getGraphData = () => {
    const newOntologyData = _.cloneDeep(ontologyData);
    if (newOntologyData.length > 0) {
      const { entity, edge } = newOntologyData[0];
      const graphData = constructGraphData(initGraphByEdit({ entity, edge }));
      handleGraphNodePosition(graphData);
      updateSelectedNodeOrEdge(_.cloneDeep(graphData));
      setKnowledgeMapStore(preStore => ({
        ...preStore,
        graphG6Data: graphData
      }));
    }
  };

  /**
   * 流程三本体有修改的话，那么该函数去更新流程四选中的实体类和关系类
   * @param graphData
   */
  const updateSelectedNodeOrEdge = (graphData: { nodes: G6NodeData[]; edges: G6EdgeData[] }) => {
    if (selectedG6Node.length > 0) {
      const nodeData = selectedG6Node[0];
      const newNodeData = graphData.nodes.find(item => item._sourceData.entity_id === nodeData._sourceData.entity_id);
      if (newNodeData) {
        setKnowledgeMapStore(preStore => ({
          ...preStore,
          selectedG6Node: [newNodeData]
        }));
      } else {
        onCanvasClick();
      }
    }
    if (selectedG6Edge.length > 0) {
      const { edgeData, startNodeData, endNodeData } = selectedG6Edge[0];
      const newEdgeData = graphData.edges.find(item => item._sourceData.edge_id === edgeData._sourceData.edge_id);
      if (newEdgeData) {
        const newStartNodeData = graphData.nodes.find(
          item => item._sourceData.entity_id === startNodeData._sourceData.entity_id
        );
        const newEndNodeData = graphData.nodes.find(
          item => item._sourceData.entity_id === endNodeData._sourceData.entity_id
        );

        setKnowledgeMapStore(preStore => ({
          ...preStore,
          selectedG6Edge: [
            {
              edgeData: newEdgeData,
              startNodeData: newStartNodeData,
              endNodeData: newEndNodeData
            }
          ]
        }));
      } else {
        onCanvasClick();
      }
    }
    if (selectedModel.length > 0) {
      const modelNode = selectedG6ModelNode[0];
      if (modelNode) {
        const newModelNodeData = graphData.nodes.find(
          item => item._sourceData.entity_id === modelNode._sourceData.entity_id
        );
        if (newModelNodeData) {
          setKnowledgeMapStore(preStore => ({
            ...preStore,
            selectedG6ModelNode: [newModelNodeData]
          }));
        } else {
          onCanvasClick();
        }
      }
      const modelEdge = selectedG6ModelEdge[0];
      if (modelEdge) {
        const { edgeData, startNodeData, endNodeData } = modelEdge;
        const newModelEdgeData = graphData.edges.find(
          item => item._sourceData.edge_id === edgeData._sourceData.edge_id
        );
        if (newModelEdgeData) {
          const modelStartNodeData = graphData.nodes.find(
            item => item._sourceData.entity_id === startNodeData._sourceData.entity_id
          );
          const modelEndNodeData = graphData.nodes.find(
            item => item._sourceData.entity_id === endNodeData._sourceData.entity_id
          );
          setKnowledgeMapStore(preStore => ({
            ...preStore,
            selectedG6ModelEdge: [
              {
                edgeData: newModelEdgeData,
                startNodeData: modelStartNodeData,
                endNodeData: modelEndNodeData
              }
            ]
          }));
        } else {
          onCanvasClick();
        }
      }
    }
  };

  /**
   * 处理G6图谱节点位置
   */
  const handleGraphNodePosition = (graphData: any) => {
    const { nodes } = graphData;
    nodes.forEach((node: any) => {
      node.x = node.fx;
      node.y = node.fy;
    });

    nodes.forEach((node: G6NodeData) => {
      graphKMap?.entity.forEach(entity => {
        if (node._sourceData.name === entity.name) {
          if (entity.x) {
            node.x = entity.x;
          }
          if (entity.y) {
            node.y = entity.y;
          }
        }
      });
    });
  };

  /**
   * 获取实体、边关联的数据文件
   */
  const getEntityEdgeRelDataFile = (): Record<string, DataFileType> => {
    const dataFileObj: Record<string, DataFileType | any> = {}; // 键就是 实体类/关系类 的name, 储存实体类/关系类所关联的数据文件
    graphKMap?.entity.forEach(entity => {
      const entity_type = entity.entity_type;
      graphKMap?.files.forEach(file => {
        const fileExtractRules = file.extract_rules.map(item => item.entity_type);
        if (fileExtractRules.includes(entity_type)) {
          // 说明实体类是与当期file进行关联的
          dataFileObj[entity.name] = _.cloneDeep(file);
        }
      });
    });
    graphKMap?.edge.forEach(edge => {
      // 先获取关系类的name
      const relationClass = graphG6Data.edges?.find((item: any) =>
        _.isEqual(item._sourceData.relations, edge.relations)
      ) as G6EdgeData | undefined;
      if (relationClass) {
        const relationClassId = relationClass._sourceData.edge_id;
        const entity_type = edge.entity_type;
        if (entity_type) {
          graphKMap?.files.forEach(file => {
            const fileExtractRules = file.extract_rules.map(item => item.entity_type);
            if (fileExtractRules.includes(entity_type)) {
              // 说明关系类是与当前file进行关联的
              dataFileObj[relationClassId] = _.cloneDeep(file);
            }
          });
        } else {
          // 说明关系类没有关联数据文件，只是关系类的起点和终点进行了映射
          if (edge.relation_map.equation) {
            dataFileObj[
              relationClassId
            ] = `${edge.relation_map.begin_class_prop}${edge.relation_map.equation}${edge.relation_map.end_class_prop}`;
          }
        }
      }
    });
    return dataFileObj;
  };

  const getNodePosition = (node: G6NodeData): { x: number; y: number } => {
    const nodePosition: { x: number; y: number } = {
      x: node.fx as number,
      y: node.fy as number
    };
    const maxPoint = { x: window.innerWidth / 2 - 100, y: window.innerHeight / 2 + 36 };
    // const allG6Nodes = graph.current?.getNodes() ?? [];
    // allG6Nodes.forEach(node => {
    //   const nodeData = node.getModel();
    //   if (nodeData.x! > maxPoint.x) maxPoint.x = nodeData.x!;
    //   if (nodeData.y! > maxPoint.y) maxPoint.y = nodeData.y!;
    // });
    let nodeY = nodePosition.y - 300;

    if (nodeY > maxPoint.y) {
      nodeY = maxPoint.y;
    }
    return {
      x: nodePosition.x! + 10,
      y: nodeY
    };
  };

  // /**
  //  * 根据数据文件去更新G6数据源，将文件绘制到G6中
  //  */
  // const updateGraphDataByDataFile = () => {
  //   const allNode = graph.current?.getNodes();
  //   const allEdge = graph.current?.getEdges();
  //   const getFileType = (file: DataFileType) => {
  //     if ([EXTRACT_TYPE.SQL].includes(file.extract_type)) {
  //       return 'sql';
  //     }
  //     return 'sheet';
  //   };
  //   const addFileNodes: G6NodeData[] = [];
  //   const deleteFileNodes: string[] = [];
  //   const addFileEdges: G6EdgeData[] = [];
  //   const deleteFileEdges: string[] = [];
  //   const { graphG6Data } = getLatestStore();
  //   graphG6Data.nodes?.forEach((item: G6NodeData, index) => {
  //     const name = item._sourceData.name;
  //     const nodeId = item.id;
  //     const dataFile = g6RelationDataFileObj[name];
  //     if (dataFile) {
  //       // 说明实体类与数据文件进行关联了
  //       dataFile.files.forEach(fileData => {
  //         const nodePosition = getNodePosition(item);
  //         addFileNodes.push({
  //           id: fileData.file_name,
  //           x: dataFile.x || nodePosition.x,
  //           y: dataFile.y || nodePosition.y,
  //           type: 'kw-g6-file-node',
  //           label: fileData.file_name,
  //           fileType: getFileType(dataFile),
  //           size: 32,
  //           _sourceData: {
  //             dataFile,
  //             relationEntityClassName: name // 记录当前生成的数据文件G6节点连接的是哪一个实体类
  //           }
  //         });
  //         addFileEdges.push({
  //           source: fileData.file_name,
  //           target: nodeId,
  //           type: 'line',
  //           // type: 'kw-g6-relation-edge',
  //           style: {
  //             endArrow: false,
  //             startArrow: false,
  //             lineDash: [5]
  //           },
  //           _sourceData: {
  //             relationEntityClassName: name, // 记录当前生成的虚线连接的是哪一个实体类
  //             noTip: true
  //           }
  //         });
  //       });
  //     } else {
  //       // 说明实体类与数据文件可能已经取消关联了
  //       allNode?.forEach(node => {
  //         const nodeData = node.getModel() as G6NodeData;
  //         if (nodeData._sourceData.relationEntityClassName === name) {
  //           deleteFileNodes.push(nodeData.id!);
  //         }
  //       });
  //       allEdge?.forEach(edge => {
  //         const edgeData = edge.getModel() as G6EdgeData;
  //         if (edgeData._sourceData.relationEntityClassName === name) {
  //           deleteFileEdges.push(edgeData.id!);
  //         }
  //       });
  //     }
  //   });
  //
  //   addFileNodes.forEach((item: any) => {
  //     graph.current?.addItem('node', item);
  //   });
  //   addFileEdges.forEach((item: any) => {
  //     graph.current?.addItem('edge', item);
  //   });
  //
  //   deleteFileNodes.forEach(item => {
  //     graph.current?.removeItem(item);
  //   });
  //   deleteFileEdges.forEach(item => {
  //     graph.current?.removeItem(item);
  //   });
  // };

  /**
   * 根据节点或者边与数据文件是否关联来去渲染节点/边的状态(已关联状态，数据文件错误状态)
   */
  const updateGraphDataStatusByDataFile = () => {
    const { graphG6Data, flow4ErrorList, g6RelationDataFileObj } = getLatestStore();
    const cloneG6RelationDataFileObj = _.cloneDeep(g6RelationDataFileObj);
    const cloneGraphG6Data = _.cloneDeep(graphG6Data);
    // 获取所有已经与数据文件关联的实体类/关系类的name
    const names = Object.keys(cloneG6RelationDataFileObj);
    [...cloneGraphG6Data.nodes!, ...cloneGraphG6Data.edges!].forEach((item: G6NodeData | G6EdgeData) => {
      const relations = item._sourceData.relations;
      const className = relations ? String(item._sourceData.edge_id) : item._sourceData.name; // 实体类name或关系类的id
      // 只有关联了数据文件，才会出现成功和错误的标识， 没有关联数据文件的实体类或者关系类则不用打标记
      if (names.includes(className)) {
        let hasError: string[] = [];
        // 说明当前实体类或者关系类已经和数据文件关联了
        const dataFile = cloneG6RelationDataFileObj[className];
        const errorData = flow4ErrorList.find(errorItem => errorItem.name === className);
        if (errorData) {
          hasError = [errorData.error];
        }
        graph.current?.updateItem(item.id!, {
          _sourceData: {
            ...item._sourceData,
            hasRelationDataFile: dataFile,
            hasError,
            hasWarn: false
          }
        });
      } else {
        // 没有关联数据文件，就不会报错
        graph.current?.updateItem(item.id!, {
          _sourceData: {
            ...item._sourceData,
            hasRelationDataFile: undefined,
            hasError: []
          }
        });
      }
    });
  };

  /**
   * 绑定G6相关事件
   */
  const handleBindEvents = () => {
    // graph.current?.on('afterlayout', () => {
    //   graph.current?.fitView(40, { onlyOutOfViewPort: true, direction: 'y' });
    // });
    graph.current?.on('node:click', onNodeClick);
    graph.current?.on('edge:click', onEdgeClick);
    graph.current?.on('canvas:click', onCanvasClick);
    graph.current?.on('node:dragend', onNodeDragend);
  };

  /**
   * 解绑G6相关事件
   */
  const handleRemoveEvents = () => {
    graph.current?.off('node:click', onNodeClick);
    graph.current?.off('edge:click', onEdgeClick);
    graph.current?.off('canvas:click', onCanvasClick);
    graph.current?.off('node:dragend', onNodeDragend);
  };

  /**
   * 节点点击事件
   * @param evt
   */
  const onNodeClick = (evt: G6GraphEvent) => {
    // 对于从G6身上获取的数据，设置到store里面需要进行深拷贝一下，否则数据被冻结之后，G6内部不可以再自己添加属性导致报错
    // 详见官方回答：https://github.com/antvis/Graphin/issues/357
    const node = _.cloneDeep(evt.item.getModel()) as G6NodeData;
    if (node._sourceData.model) {
      // 说明选中的是模型上面的实体
      setKnowledgeMapStore(prevState => {
        prevState.selectedModel = [node._sourceData.model];
        prevState.selectedG6ModelNode = [node as G6NodeData];
        prevState.selectedG6ModelEdge = [];
        prevState.selectedG6Node = [];
        prevState.selectedG6Edge = [];
      });
    } else {
      setKnowledgeMapStore(prevState => {
        prevState.selectedModel = [];
        prevState.selectedG6ModelNode = [];
        prevState.selectedG6ModelEdge = [];
        prevState.selectedG6Node = [node as G6NodeData];
        prevState.selectedG6Edge = [];
      });
    }
  };

  /**
   * 高亮节点
   */
  const highlightNode = (e: G6GraphEvent) => {
    removeG6ItemState();
    const selectedNode = e.item;
    const selectedNodeData = selectedNode.getModel() as G6NodeData;
    const edges = graph.current!.getEdges();
    const nodes = graph.current!.getNodes();
    let allHideItems = [...edges, ...nodes].filter(item => item._cfg?.id !== selectedNodeData.id);
    if (selectedModel.length > 0) {
      allHideItems = allHideItems.filter(item => {
        const dataModel = item.getModel() as any;
        return dataModel._sourceData.model !== selectedModel[0];
      });
    }
    allHideItems.forEach(item => {
      graph.current!.setItemState(item, '_hide', true);
    });
    graph.current!.setItemState(selectedNode, 'selected', true);
  };

  /**
   * 移除G6中节点与边的状态
   */
  const removeG6ItemState = () => {
    const edges = graph.current!.getEdges();
    const nodes = graph.current!.getNodes();
    const allItems = [...edges, ...nodes];
    allItems.forEach(item => {
      graph.current!.clearItemStates(item);
    });
  };

  /**
   * 高亮边以及边的起点和终点
   * @param e
   */
  const highlightEdge = (e: G6GraphEvent) => {
    removeG6ItemState();
    const selectedEdge: any = e.item.getModel();
    const edges = graph.current!.getEdges();
    const nodes = graph.current!.getNodes();
    const sourceNodeId = selectedEdge?._sourceData?.startId;
    const targetNodeId = selectedEdge?._sourceData?.endId;
    const selectedEdgeId = selectedEdge.id!;
    const selectedIds = [selectedEdgeId, sourceNodeId, targetNodeId];
    let allHideItems = [...edges, ...nodes].filter(item => !selectedIds.includes(item._cfg?.id));
    if (selectedEdge._sourceData.model) {
      allHideItems = allHideItems.filter(item => {
        const dataModel = item.getModel() as any;
        return dataModel._sourceData.model !== selectedEdge._sourceData.model;
      });
    }
    allHideItems.forEach(item => {
      graph.current!.setItemState(item, '_hide', true);
    });
    graph.current!.setItemState(selectedEdgeId, '_active', true); // 高亮边
  };

  /**
   * 边的点击事件
   * @param evt
   */
  const onEdgeClick = (evt: G6GraphEvent) => {
    const edge = evt.item;
    const selectedEdgeDataModel = _.cloneDeep(edge.getModel()) as G6EdgeData;
    const nodes = graph.current?.getNodes() as INode[];
    const sourceNodeId = selectedEdgeDataModel?._sourceData?.startId;
    const targetNodeId = selectedEdgeDataModel?._sourceData?.endId;
    const startNode = nodes.find(node => node._cfg?.id === sourceNodeId)!;
    const endNode = nodes.find(node => node._cfg?.id === targetNodeId)!;

    if (selectedEdgeDataModel._sourceData.model) {
      // 说明选中的是模型上面的关系类
      setKnowledgeMapStore(prevState => {
        prevState.selectedModel = [selectedEdgeDataModel._sourceData.model];
        prevState.selectedG6ModelNode = [];
        prevState.selectedG6ModelEdge = [
          {
            edgeData: selectedEdgeDataModel,
            startNodeData: _.cloneDeep(startNode.getModel()) as G6NodeData,
            endNodeData: _.cloneDeep(endNode.getModel()) as G6NodeData
          }
        ];
        prevState.selectedG6Node = [];
        prevState.selectedG6Edge = [];
      });
    } else {
      setKnowledgeMapStore(prevState => ({
        ...prevState,
        selectedModel: [],
        selectedG6ModelNode: [],
        selectedG6ModelEdge: [],
        selectedG6Node: [],
        selectedG6Edge: [
          {
            edgeData: selectedEdgeDataModel,
            startNodeData: _.cloneDeep(startNode?.getModel()),
            endNodeData: _.cloneDeep(endNode?.getModel())
          }
        ]
      }));
    }
  };

  const onCanvasClick = () => {
    removeG6ItemState();
    setKnowledgeMapStore(prevState => ({
      ...prevState,
      selectedG6Node: [],
      selectedG6Edge: [],
      selectedModel: [],
      selectedG6ModelNode: [],
      selectedG6ModelEdge: [],
      currentDataFile: []
    }));
  };

  const onNodeDragend = (evt: G6GraphEvent) => {
    const node = _.cloneDeep(evt.item.getModel()) as G6NodeData;
    const { graphKMap } = getLatestStore();
    const cloneGraphKMap = _.cloneDeep(graphKMap);
    cloneGraphKMap?.entity.forEach(entity => {
      if (entity.name === node._sourceData.name) {
        entity.x = node.x!;
        entity.y = node.y!;
      }
    });
    setKnowledgeMapStore(preStore => {
      preStore.graphKMap = cloneGraphKMap;
    });
  };

  /**
   * 搜索的值变化事件
   * @param selectedData
   */
  const searchChange = (type: string, selectedData: G6NodeData | G6EdgeData) => {
    const item = graph.current?.findById(selectedData.id!);
    if (type === 'node') {
      onNodeClick({ item } as G6GraphEvent);
    }
    if (type === 'edge') {
      onEdgeClick({ item } as G6GraphEvent);
    }
  };

  /**
   * 扫描按钮的点击事件
   */
  const onScanClick = () => {
    const { graphG6Data } = getLatestStore();
    const cloneG6RelationDataFileObj = _.cloneDeep(g6RelationDataFileObj);
    const cloneGraphG6Data = _.cloneDeep(graphG6Data);
    const relationClassNames = Object.keys(cloneG6RelationDataFileObj);
    [...cloneGraphG6Data.nodes!, ...cloneGraphG6Data.edges!].forEach((item: G6NodeData | G6EdgeData) => {
      const uniqueKey = item._sourceData.relations ? String(item._sourceData.edge_id) : item._sourceData.name;
      if (!relationClassNames.includes(uniqueKey)) {
        graph.current?.updateItem(item.id!, {
          ...item,
          _sourceData: {
            ...item._sourceData,
            hasRelationDataFile: undefined,
            hasError: [],
            hasWarn: true
          }
        });
      }
    });
  };

  return (
    <AdResizeObserver onResize={g6GraphResize}>
      <div className="ontologyG6 kw-w-100 kw-h-100">
        <OntologyG6Search
          data={graphG6Data}
          onChange={searchChange}
          onScanClick={onScanClick}
          updateGraphDataStatusByDataFile={updateGraphDataStatusByDataFile}
          removeG6ItemState={removeG6ItemState}
        />
        <div className="kw-w-100 kw-h-100" ref={g6Container} />
        {graph.current && <AdG6ToolBar style={{ bottom: 89, right: 38 }} graph={graph.current} />}
      </div>
    </AdResizeObserver>
  );
});

export default OntologyG6;
