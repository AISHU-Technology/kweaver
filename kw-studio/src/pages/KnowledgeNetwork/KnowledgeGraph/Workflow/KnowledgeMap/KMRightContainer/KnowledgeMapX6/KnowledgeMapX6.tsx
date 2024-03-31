/* eslint-disable max-lines */
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import AdReactX6, { X6RefProps } from '@/components/AdReactX6/AdReactX6';
import type { Node, Edge, Graph as IGraph } from '@antv/x6';
import {
  AdX6EntityNode,
  AdX6Edge,
  AdX6DataFileNode,
  AdX6EntityNodeWidth,
  AdX6RelationNode,
  AdX6RelationStartNode,
  AdX6RelationEndNode,
  AdX6DataFileNodeWidth,
  AdRowStartPointPortRight,
  AdRowStartPointPortLeft,
  AdRowEndPointPortLeft,
  AdRowEndPointPortRight,
  AdHeaderStartPointPortRight,
  AdHeaderEndPointPortLeft,
  AdX6ModelNode,
  AdX6ModelDirFileNode,
  AdFileDirPortRight,
  AdX6MindMapEdge,
  AdX6EdgeNoArrow,
  AdX6ModelEdge
} from '@/components/AdReactX6/utils/constants';
import { useKnowledgeMapContext } from '@/pages/KnowledgeNetwork/KnowledgeGraph/Workflow/KnowledgeMap/KnowledgeMapContext';
import useDeepCompareEffect from '@/hooks/useDeepCompareEffect';
import _ from 'lodash';
import { message } from 'antd';
import servicesCreateEntity from '@/services/createEntity';
import { Markup } from '@antv/x6';
import {
  DataFileType,
  Flow4ErrorType,
  G6EdgeData,
  G6NodeData,
  GraphKMapType
} from '@/pages/KnowledgeNetwork/KnowledgeGraph/Workflow/KnowledgeMap/types';
import { DS_SOURCE, EXTRACT_TYPE, stringSeparator1, stringSeparator2 } from '@/enums';
import {
  convertToRules,
  getRepeatMapProps,
  getX6RelationClassStartEndNodeId,
  generateSqlExtractRule
} from '@/pages/KnowledgeNetwork/KnowledgeGraph/Workflow/KnowledgeMap/assistant';
import { getPostfix } from '@/utils/handleFunction';
import LoadingMask from '@/components/LoadingMask';
import './style.less';
import IconFont from '@/components/IconFont';
import { InfoCircleFilled } from '@ant-design/icons';
import intl from 'react-intl-universal';

import HOOKS from '@/hooks';

export type KnowledgeMapX6RefProps = {
  autoMapProps: () => void;
  clearMap: () => void;
};

type KnowledgeMapX6Props = {
  onEditDataFile: (dataFile: DataFileType) => void;
  isAutoMapPropsSignRef: React.MutableRefObject<boolean>; // 是否进行自动属性映射标识
  parsingSet: any;
  setParsingSet: (data: any) => void;
  onX6BlankClick: (graphX6: IGraph) => void; // X6画布空白点击事件
  defaultParsingRule: any;
  selectFileType: any;
  setCurrentParse: any;
  arFileSave: any;
  setArFileSave: (data: any) => void;
};

type GraphX6DataProps = Array<Node.Metadata | Edge.Metadata>;
/**
 * 注意事项：
 * 任何地方只要对节点或者边进行了删除或者新增的操作，都要去执行updateStoreGraphKMap函数，去更新store中graph_KMP存储的映射关系
 */
const KnowledgeMapX6 = forwardRef<KnowledgeMapX6RefProps, KnowledgeMapX6Props>((props, ref) => {
  const {
    knowledgeMapStore: {
      selectedG6Edge,
      selectedG6Node,
      currentDataFile,
      selectedModel,
      helpTips,
      graphKMap,
      flow4ErrorList,
      graphDataSource,
      viewMode
    },
    setKnowledgeMapStore,
    getLatestStore
  } = useKnowledgeMapContext();
  const prefixClsLocale = 'workflow.knowledgeMap';
  const {
    onEditDataFile,
    isAutoMapPropsSignRef,
    parsingSet,
    setParsingSet,
    defaultParsingRule,
    selectFileType,
    setCurrentParse,
    onX6BlankClick,
    arFileSave,
    setArFileSave
  } = props;
  const [graphX6Data, setGraphX6Data] = useState<GraphX6DataProps>([]);
  const x6Ref = useRef<X6RefProps | null>(null);
  const x6EdgeLabelData = useRef<Record<string, string>>({});
  const [modelData, setModelData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const mounted = useRef<boolean>(false); // 组件是否挂载标识
  const language = HOOKS.useLanguage();

  /**
   * 根据G6选中的边或者选中的节点去创建其在X6中对应的节点
   */
  useDeepCompareEffect(() => {
    if (selectedG6Node.length > 0) {
      generateX6NodeBySelectedG6Node();
    }
    if (selectedG6Edge.length > 0) {
      generateX6NodeBySelectedG6Edge();
    }
  }, [selectedG6Edge, selectedG6Node]);

  /**
   * 根据当前X6视图中选中的数据文件，去渲染X6视图中的边
   */
  useEffect(() => {
    if (mounted.current) {
      if (selectedG6Node.length > 0) {
        generateX6NodeBySelectedDataFile(false);
      }
      if (selectedG6Edge.length > 0) {
        generateX6NodeBySelectedDataFileAndRelationsClass();
      }
    }
  }, [currentDataFile[0]?.extract_rules]); // 只有数据文件的抽取规则发生变化才重新渲染数据文件节点

  useDeepCompareEffect(() => {
    if (selectedModel.length > 0 && Object.keys(modelData).length > 0) {
      generateX6ModelNodeBySelectedModel();
    }
  }, [selectedModel, modelData]);

  /**
   * 根据当前X6视图中选中的数据文件，去渲染X6视图中的模型
   */
  // useDeepCompareEffect(() => {
  useEffect(() => {
    if (selectedModel.length > 0) {
      generateX6NodeBySelectedDataFileForModel();
    }
  }, [currentDataFile]); // 只有数据文件的抽取规则发生变化才重新渲染数据文件节点

  useEffect(() => {
    fetchModel();

    return () => {
      setKnowledgeMapStore(preStore => ({
        ...preStore,
        firstAddFile: false
      }));
    };
  }, []);

  /**
   * 根据映射数据源去显示操作提示或错误提示
   */
  useEffect(() => {
    const graph = x6Ref.current?.graphX6;
    if (graph) {
      handleRequireProperty(graph);
      handleHelpTips(graph);
    }
  }, [graphKMap]);

  useImperativeHandle(ref, () => ({
    autoMapProps,
    clearMap
  }));

  useEffect(() => {
    mounted.current = true;
  }, []);

  /**
   * 移除store中存储的数据文件
   */
  const removeCurrentDataFile = () => {
    setKnowledgeMapStore(preStore => ({
      ...preStore,
      currentDataFile: []
    }));
    const graph = x6Ref.current?.graphX6;
    if (graph) {
      handleRequireProperty(graph);
    }
  };

  /**
   * 通过选中的模型去生成模型节点
   */
  const generateX6ModelNodeBySelectedModel = () => {
    // 生成模型节点
    const { cacheGraphX6Data, selectedModel, graphId, graphKMap } = getLatestStore();
    const modelKey = selectedModel[0];
    let modelNodePosition = {
      x: 400,
      y: 185
    };
    const cacheX6ModelNodeData = cacheGraphX6Data[modelKey]?.find(x6Data => x6Data.id === modelKey);
    if (cacheX6ModelNodeData) {
      modelNodePosition = cacheX6ModelNodeData.position;
    }
    const modelName = language === 'en-US' ? modelKey : modelData[modelKey];
    const modelNode: Node.Metadata = {
      id: modelKey,
      shape: AdX6ModelNode,
      position: modelNodePosition,
      data: {
        label: modelName
      },
      ports: [{ id: modelKey, group: AdHeaderEndPointPortLeft }]
    };
    setGraphX6Data([modelNode]);
    // 选中的G6模型是否已经进行属性映射了
    const file = graphKMap?.files.filter(item => selectedModel.includes(item.extract_model!));
    if (file) {
      // 说明选中的G6模型已经和数据文件关联了
      setKnowledgeMapStore(prevState => ({
        ...prevState,
        currentDataFile: file ?? []
      }));
    } else {
      removeCurrentDataFile();
    }
  };

  /**
   * 清空所有的边
   */
  const clearAllEdge = () => {
    const graphX6 = x6Ref.current?.graphX6;
    const allEdges = graphX6?.getEdges();
    const deleteEdges = allEdges?.filter(edge => edge.getData()?.deleteBtnVisible !== false);
    deleteEdges && graphX6?.removeCells(deleteEdges);
  };

  /**
   * 自动将选中数据文件与实体属性进行关联
   */
  const autoMapProps = () => {
    const { currentDataFile } = getLatestStore();
    const graphX6 = x6Ref.current?.graphX6;
    if (graphX6) {
      const edgeData: Array<Edge.Metadata> = [];
      const nodes = graphX6.getNodes().map(item => item.toJSON())!;
      const entityNode = nodes.find(item => item.shape === AdX6EntityNode)!;
      const relationNode = nodes.find(item => item.shape === AdX6RelationNode)!;
      const dataFileNode = nodes.find(item => item.shape === AdX6DataFileNode)!;
      const allEdgeSourcePortId = graphX6.getEdges()!.map(item => item.getSourcePortId());
      const allEdgeTargetPortId = graphX6.getEdges()!.map(item => item.getTargetPortId());
      if (dataFileNode) {
        const isHive = currentDataFile[0]?.data_source === DS_SOURCE.hive;
        if (entityNode) {
          // @ts-ignore
          entityNode.ports?.items.forEach((entityPort: any) => {
            if (!allEdgeSourcePortId.includes(entityPort.id)) {
              const [entityClassName, nodePropName] = entityPort.id.split(stringSeparator1);
              // @ts-ignore
              dataFileNode.ports?.items.forEach((filePort: any) => {
                if (!allEdgeTargetPortId.includes(filePort.id)) {
                  // eslint-disable-next-line prefer-const
                  let [file, filePropName] = isHive
                    ? filePort.name.split(stringSeparator1)
                    : filePort.id.split(stringSeparator1);
                  filePropName =
                    filePropName.includes('.') && isHive ? filePropName.split('.').slice(-1)[0] : filePropName;
                  if (nodePropName === filePropName) {
                    edgeData.push({
                      zIndex: 0,
                      shape: AdX6Edge,
                      source: {
                        cell: entityClassName,
                        port: entityPort.id
                      },
                      target: {
                        cell: file,
                        port: filePort.id
                      }
                    });
                  }
                }
              });
            }
          });
        }
        if (relationNode) {
          // @ts-ignore
          relationNode.ports?.items.forEach((port: any) => {
            const [entityClassName, nodePropName] = port.id.split(stringSeparator1);
            if (!allEdgeSourcePortId.includes(port.id)) {
              // @ts-ignore
              dataFileNode.ports?.items.forEach((filePort: any) => {
                if (!allEdgeTargetPortId.includes(filePort.id)) {
                  if (filePort.id.includes(stringSeparator2)) {
                    // eslint-disable-next-line prefer-const
                    let [file, filePropName] = isHive
                      ? filePort.name.split(stringSeparator2)
                      : filePort.id.split(stringSeparator2);
                    filePropName =
                      filePropName.includes('.') && isHive ? filePropName.split('.').slice(-1)[0] : filePropName;
                    if (nodePropName === filePropName) {
                      edgeData.push({
                        zIndex: 0,
                        shape: AdX6Edge,
                        source: {
                          cell: entityClassName,
                          port: port.id
                        },
                        target: {
                          cell: file,
                          port: filePort.id
                        }
                      });
                    }
                  }
                }
              });
            }
          });
        }
      }
      if (edgeData.length > 0) {
        const allEdges = graphX6.getEdges().map(item => item.toJSON());
        const mapCompleteEdge: Edge.Metadata[] = [];
        edgeData.forEach(item => {
          allEdges.forEach(edge => {
            // @ts-ignore
            if (edge.source.port === item.source.port && edge.target.port === item.target?.port) {
              mapCompleteEdge.push(item);
            }
          });
        });
        if (_.isEqual(edgeData, mapCompleteEdge)) {
          // message.warn(intl.get(`${prefixClsLocale}.autoMapNoResultTip`));
          message.warn({
            content: intl.get(`${prefixClsLocale}.autoMapNoResultTip`),
            className: 'custom-class',
            style: {
              marginTop: '6vh'
            }
          });
        } else {
          graphX6?.addEdges(edgeData);
          updateStoreGraphKMap(graphX6!);
        }
      } else {
        // message.info(intl.get(`${prefixClsLocale}.autoMapFailTips`));
        message.info({
          content: intl.get(`${prefixClsLocale}.autoMapFailTips`),
          className: 'custom-class',
          style: {
            marginTop: '6vh'
          }
        });
      }
      handleHelpTips(graphX6!);
    }
  };

  /**
   * 清空映射关系
   */
  const clearMap = () => {
    const { selectedModel, graphKMap } = getLatestStore();
    const graphX6 = x6Ref.current?.graphX6;
    if (selectedModel.length > 0) {
      const allNodes = graphX6?.getNodes();
      const deleteNodes = allNodes?.filter(node => node.toJSON()?.shape !== AdX6ModelNode);
      deleteNodes && graphX6?.removeCells(deleteNodes);
      const newGraphKMap = _.cloneDeep(graphKMap)!;
      clearModelMap(newGraphKMap);
      setKnowledgeMapStore(preStore => ({
        ...preStore,
        graphKMap: newGraphKMap,
        currentDataFile: []
      }));
    } else {
      clearAllEdge();
      updateStoreGraphKMap(graphX6!);
    }
  };

  /**
   * 获取模型下拉框的候选项
   */
  const fetchModel = async () => {
    const res = await servicesCreateEntity.fetchModelList();
    if (res && res.res) {
      setModelData(res.res);
    }
  };

  /**
   * 根据选中的G6节点 生成X6Data
   */
  const generateX6NodeBySelectedG6Node = () => {
    const { graphKMap, cacheGraphX6Data } = getLatestStore();
    const newSelectedG6Node = _.cloneDeep(selectedG6Node);
    const entityClassName = newSelectedG6Node[0]?._sourceData.name;
    let fileEntityType = '';
    // 选中的G6节点是否已经进行属性映射了
    graphKMap?.entity.forEach(item => {
      if (item.name === entityClassName) {
        if (item.entity_type) {
          fileEntityType = item.entity_type;
        }
      }
    });
    const x6Nodes: Node.Metadata[] = newSelectedG6Node.map(g6Node => {
      const { _sourceData }: any = g6Node;
      let nodePosition = { x: 30, y: 100 };
      const cacheX6NodeData = cacheGraphX6Data[_sourceData.name]?.find(x6Data => x6Data.id === _sourceData.name);
      if (cacheX6NodeData) {
        nodePosition = cacheX6NodeData.position;
      }
      const x6EntityNodeId = _sourceData.name;
      const ports = _sourceData.attributes.map((attribute: any) => ({
        id: `${x6EntityNodeId}${stringSeparator1}${attribute.attrName}`,
        group: AdRowStartPointPortRight
      }));
      const tableData = _sourceData.attributes?.map((item: any) => ({
        fieldName: item.attrName,
        fieldType: item.attrType
      }));
      return {
        id: x6EntityNodeId,
        shape: AdX6EntityNode,
        position: nodePosition,
        data: {
          label: _sourceData.alias,
          name: _sourceData.name,
          icon: _sourceData.icon,
          iconColor: _sourceData.iconColor,
          iconBgColor: _sourceData.fillColor,
          tableData,
          uniqueProperty: _sourceData.default_tag ?? '', // 唯一属性
          mergeProperty: _sourceData.primary_key ?? [], // 融合属性
          configProperty: [], // 已配置的属性
          repeatMapField: [] // 重复映射字段
        },
        ports
      };
    });
    setGraphX6Data(x6Nodes);

    const file = graphKMap?.files.find(item => item.extract_rules[0].entity_type === fileEntityType);
    if (file) {
      // 说明选中的G6节点已经和数据文件关联了
      setKnowledgeMapStore(prevState => ({
        ...prevState,
        currentDataFile: [file]
      }));
      removeHelpTips();
    } else {
      removeCurrentDataFile();
      handleHelpTips(x6Ref.current!.graphX6!);
    }
  };

  /**
   * 获取实体节点对应的下拉选择框的数据(根据实体融合属性排序的结果，融合属性始终在前面)
   */
  const getG6NodeSelectOptions = (nodeG6Data: G6NodeData) => {
    const nodeAttributesObj: Record<string, string> = {};
    nodeG6Data._sourceData.attributes.forEach((item: any) => {
      nodeAttributesObj[item.attrName] = item.attrDisplayName;
    });
    // 默认选中融合属性, 并将融合属性排在前面
    const mergeAttributes: string[] = nodeG6Data._sourceData.primary_key ?? [];

    const mergeAttributeObj: Record<string, string> = {};

    mergeAttributes.forEach((key: string) => {
      mergeAttributeObj[key] = nodeAttributesObj[key];
      delete nodeAttributesObj[nodeAttributesObj[key]];
    });

    const resultObj = {
      ...mergeAttributeObj,
      ...nodeAttributesObj
    };

    const resultArr = Object.keys(resultObj);

    const nodeAttributesOptions = resultArr.map(key => ({
      label: resultObj[key],
      value: key
    }));
    return nodeAttributesOptions;
  };

  /**
   * 根绝G6选中的边 去生成x6数据
   */
  const generateX6NodeBySelectedG6Edge = () => {
    const { graphKMap, cacheGraphX6Data, currentDataFile } = getLatestStore();
    const { edgeData, startNodeData, endNodeData } = selectedG6Edge[0];
    const { _sourceData }: any = edgeData;

    const relationClassRelations = _sourceData.relations;
    const relationClassHaveAttribute = edgeData._sourceData.attributes.length > 0;

    let fileEntityType = '';
    let begin_class_prop = '';
    let end_class_prop = '';
    graphKMap?.edge.forEach(item => {
      if (_.isEqual(relationClassRelations, item.relations)) {
        // 选中的G6边是否已经进行属性映射了
        if (item.entity_type) {
          fileEntityType = item.entity_type;
        }
        begin_class_prop = item.relation_map.begin_class_prop;
        end_class_prop = item.relation_map.end_class_prop;
      }
    });

    // 关系类节点
    let relationClassX6Position = { x: 30, y: 110 };
    const cacheX6RelationNodeNodeData = cacheGraphX6Data[_sourceData.name]?.find(
      x6Data => x6Data.id === _sourceData.name
    );
    if (cacheX6RelationNodeNodeData) {
      relationClassX6Position = cacheX6RelationNodeNodeData.position;
    }
    const ports = _sourceData.attributes.map((attribute: any) => ({
      id: `${_sourceData.name}${stringSeparator1}${attribute.attrName}`,
      group: AdRowStartPointPortRight
    }));
    const tableData = _sourceData.attributes?.map((item: any) => ({
      fieldName: item.attrName,
      fieldType: item.attrType
    }));
    const x6RelationNode = {
      id: _sourceData.name,
      shape: AdX6RelationNode,
      position: relationClassX6Position,
      data: {
        label: _sourceData.alias,
        name: _sourceData.name,
        icon: _sourceData.icon,
        iconColor: _sourceData.iconColor,
        iconBgColor: _sourceData.fillColor,
        tableData,
        relations: _sourceData.relations,
        uniqueProperty: _sourceData.default_tag ?? '', // 唯一属性
        configProperty: [], // 已配置的属性
        repeatMapField: [] // 重复映射字段
      },
      ports
    };

    // 关系类起始节点
    const { startNodeId, endNodeId } = getX6RelationClassStartEndNodeId(startNodeData, endNodeData);
    let relationClassStartNodeX6Position = { x: 600, y: 100 };
    const cacheX6RelationStartNodeData = cacheGraphX6Data[_sourceData.name]?.find(
      x6Data => x6Data.id === startNodeData._sourceData.name
    );
    if (cacheX6RelationStartNodeData) {
      relationClassStartNodeX6Position = cacheX6RelationStartNodeData.position;
    }
    const startNodeAttributesOptions = getG6NodeSelectOptions(startNodeData);
    const startNodeSelectValue = begin_class_prop || startNodeAttributesOptions[0]?.value;
    const x6RelationStartNode = {
      id: startNodeId,
      shape: AdX6RelationStartNode,
      position: relationClassStartNodeX6Position,
      data: {
        type: 'start',
        label: startNodeData._sourceData.alias,
        name: startNodeData._sourceData.name,
        icon: startNodeData._sourceData.icon,
        iconColor: startNodeData._sourceData.iconColor,
        iconBgColor: startNodeData._sourceData.fillColor,
        selectOptions: startNodeAttributesOptions,
        selectValue: startNodeSelectValue,
        updateStoreGraphKMap,
        relations: _sourceData.relations,
        readOnly: viewMode
      },
      ports: [
        {
          id: `${startNodeData._sourceData.name}${stringSeparator1}${startNodeSelectValue}`,
          group: AdRowStartPointPortLeft
        }
      ]
    };

    // 关系类终点节点
    let relationClassEndNodeX6Position = { x: 600, y: 300 };
    const cacheX6RelationEndNodeData = cacheGraphX6Data[_sourceData.name]?.find(x6Data => x6Data.id === endNodeId);
    if (cacheX6RelationEndNodeData) {
      relationClassEndNodeX6Position = cacheX6RelationEndNodeData.position;
    }
    const endNodeAttributesOptions = getG6NodeSelectOptions(endNodeData);
    const endNodeSelectValue = end_class_prop || endNodeAttributesOptions[0].value;
    const x6RelationEndNode = {
      id: endNodeId,
      shape: AdX6RelationEndNode,
      position: relationClassEndNodeX6Position,
      data: {
        type: 'end',
        label: endNodeData._sourceData.alias,
        name: endNodeData._sourceData.name,
        icon: endNodeData._sourceData.icon,
        iconColor: endNodeData._sourceData.iconColor,
        iconBgColor: endNodeData._sourceData.fillColor,
        selectOptions: endNodeAttributesOptions,
        selectValue: endNodeSelectValue,
        updateStoreGraphKMap,
        relations: _sourceData.relations,
        readOnly: viewMode
      },
      ports: [
        {
          id: `${endNodeData._sourceData.name}${stringSeparator1}${endNodeSelectValue}`,
          group: relationClassHaveAttribute ? AdRowStartPointPortLeft : AdRowEndPointPortLeft
        }
      ]
    };

    setGraphX6Data([x6RelationNode, x6RelationStartNode, x6RelationEndNode]);

    const file = graphKMap?.files.find(item => item.extract_rules[0].entity_type === fileEntityType);
    if (file) {
      // 说明选中的G6边已经和数据文件关联了
      setKnowledgeMapStore(prevState => ({
        ...prevState,
        currentDataFile: [file]
      }));
    } else {
      currentDataFile.length > 0 && removeCurrentDataFile();
      handleHelpTips(x6Ref.current!.graphX6!);
      setTimeout(() => {
        generateX6EdgeByDataFileAndG6Edge();
      }, 0);
    }
  };

  /**
   * 获取数据文件中的数据
   */
  const getDataByDataFile = (dataFile: DataFileType, isEdit = true) => {
    return new Promise(resolve => {
      let name = dataFile.files[0].file_name;
      if ([DS_SOURCE.as, DS_SOURCE.AnyRobot].includes(dataFile.data_source)) {
        name = dataFile.files[0].file_source;
      }
      let params: any = {};
      params = {
        id: String(dataFile.ds_id),
        data_source: dataFile.data_source,
        name
      };

      const filterNodeGraph = _.filter(_.cloneDeep(graphDataSource), (item: any) => item?.id === dataFile?.ds_id);
      // 编辑进入的时候只存有解析规则的
      if (
        // 改的地方
        ['as', 'as7'].includes(dataFile?.data_source) &&
        filterNodeGraph?.[0]?.dataType === 'structured' &&
        // graphDataSource?.[0]?.dataType === 'structured' &&
        selectFileType === 'csv' &&
        String(dataFile?.files?.[0]?.file_name?.split?.('.')?.[1]) === 'csv'
      ) {
        const fileMes = currentDataFile[0]?.files?.[0];
        let handleFileSelect: any = [];
        const isParsing = fileMes?.delimiter;
        // 里面有解析规则
        if (isParsing) {
          // if (isParsing && isEdit) {
          handleFileSelect = [
            {
              key: fileMes?.file_source,
              parsing: { delimiter: fileMes?.delimiter, quotechar: fileMes?.quotechar, escapechar: fileMes?.escapechar }
            }
          ];
          setCurrentParse(handleFileSelect);
        } else {
          // 1.当改变解析规则   2.升级进入没有解析规则
          // const fileSelect = [
          //   {
          //     key: fileMes?.file_source,
          //     parsing: { delimiter: fileMes?.delimiter,
          //      quotechar: fileMes?.quotechar, escapechar: fileMes?.escapechar}
          //   }
          // ];
          const { delimiter, quotechar, escapechar } = defaultParsingRule;
          const fileSelect = [
            {
              key: fileMes?.file_source,
              parsing: { delimiter, quotechar, escapechar }
            }
          ];
          handleFileSelect = _.isEmpty(fileSelect) ? [{ parsing: defaultParsingRule }] : fileSelect;
        }
        params = {
          ...params,
          ...handleFileSelect?.[0]?.parsing
        };
      }
      if (dataFile?.data_source === 'AnyRobot') {
        params = onAssignToTime(params);
      }
      servicesCreateEntity.getOtherPreData(params).then(({ res, ErrorCode, ErrorDetails }) => {
        let tables: any = [];
        let error = '';
        if (res) {
          tables = res;
        }
        if (ErrorCode) {
          error = ErrorDetails;
          if (ErrorCode.includes('FileNotExist')) {
            // 说明是数据文件不存在的错误
            error = intl.get(`${prefixClsLocale}.fileNotExist`);
          }
          message.error({
            content: error,
            className: 'custom-class',
            style: {
              padding: 0
            }
          });
        }
        resolve({ tables, error });
      });
    });
  };

  /**
   * 类型为AnyRobot时参数处理
   */
  const onAssignToTime = (filesObj: any, type?: any) => {
    let params: any = {};
    const filesEdit = _.cloneDeep(currentDataFile[0]?.files);
    const currentSelectedFile = arFileSave[filesObj?.file_name];
    // 编辑状态更改数据配置
    if (!_.isEmpty(filesEdit) && _.isEmpty(currentSelectedFile)) {
      if (type === 'extract') {
        params = {
          ...filesObj,
          start_time: Number(filesEdit?.[0]?.start_time),
          end_time: Number(filesEdit?.[0]?.end_time),
          view_name: filesEdit?.[0]?.file_name,
          file: filesEdit?.[0]?.file_source
        };
      } else {
        const reduceData = _.reduce(
          _.cloneDeep(currentDataFile[0]?.files),
          (pre: any, key: any) => {
            pre[key.file_name] = {
              name: key.file_source,
              data_source: 'AnyRobot',
              start_time: Number(key.start_time),
              end_time: Number(key.end_time)
            };
            return pre;
          },
          {}
        );
        params = {
          ...filesObj,
          name: filesEdit?.[0]?.file_source,
          start_time: Number(filesEdit?.[0]?.start_time),
          end_time: Number(filesEdit?.[0]?.end_time)
        };
        setArFileSave(reduceData);
      }
    } else {
      if (type === 'extract') {
        if (!currentSelectedFile?.start_time) {
          params = {
            ...filesObj,
            start_time: Number(currentSelectedFile?.start_time),
            end_time: Number(currentSelectedFile?.end_time),
            view_name: currentSelectedFile?.file_name
          };
        } else {
          params = filesObj;
        }
      } else {
        if (!_.isEmpty(currentSelectedFile) && !currentSelectedFile?.start_time) {
          params = { ...filesObj, ...currentSelectedFile };
        } else {
          params = filesObj;
          arFileSave[filesObj?.file_name] = { ...filesObj, start_time: 0, end_time: 0 };
          setArFileSave(arFileSave);
        }
      }
    }
    return params;
  };

  /**
   * 获取sql抽取数据文件中的数据
   * @param file
   */
  const getDataBySqlDataFile = (dataFile: DataFileType) => {
    const sql = dataFile.files[0].file_source;
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async resolve => {
      const params = { ds_id: dataFile.ds_id, sql };
      let tables: any = [];
      let errorTip = '';
      try {
        const { res } = (await servicesCreateEntity.sqlExtractPreview(params)) || {};
        if (res) {
          tables = res;
        }
      } catch (error) {
        errorTip = error.type === 'message' ? error.response.ErrorDetails : error.data.ErrorDetails;
        if (errorTip.includes("doesn't exist")) {
          // 说明是数据文件不存在的错误
          errorTip = intl.get(`${prefixClsLocale}.fileNotExist`);
        }
        message.error({
          content: errorTip,
          className: 'custom-class',
          style: {
            padding: 0
          }
        });
      }
      resolve({ tables, error: errorTip });
    });
  };

  /**
   * 编辑进入时解析规则参数判断
   */
  const onHandleParsingShow = () => {
    let filterData: any = {};
    const { delimiter, quotechar, escapechar } = defaultParsingRule;
    const isParsing = currentDataFile[0]?.files?.[0]?.delimiter;
    // editData里面有解析规则
    if (isParsing) {
      filterData = {
        delimiter: currentDataFile[0]?.files?.[0]?.delimiter,
        quotechar: currentDataFile[0]?.files?.[0]?.quotechar,
        escapechar: currentDataFile[0]?.files?.[0]?.escapechar
      };
    } else {
      // 1.升级进入editData不为空但没有解析规则
      // 2.快速抽取进入此时没有editData
      filterData = {
        key: currentDataFile[0]?.files?.[0]?.file_source,
        parsing: { delimiter, quotechar, escapechar }
      };
    }
    return filterData;
  };

  /**
   * 获取数据文件的抽取规则-刷新已选字段
   * @param file
   * @param postfix 文件后缀名
   */
  const getExtractRule = (dataFile: DataFileType) => {
    const { graphId } = getLatestStore();
    return new Promise(resolve => {
      let name = dataFile.files[0].file_name;
      let postfix = '';
      let params: any = {};
      if ([DS_SOURCE.as].includes(dataFile.data_source)) {
        postfix = getPostfix(name);
        name = dataFile.files[0].file_source;
      }
      params = {
        graph_id: graphId,
        ds_id: String(dataFile.ds_id),
        data_source: dataFile.data_source,
        file: name,
        extract_type: dataFile.extract_type,
        postfix
      };
      const filterNodeGraph = _.filter(_.cloneDeep(graphDataSource), (item: any) => item?.id === dataFile?.ds_id);
      if (
        // 改的地方
        ['as', 'as7'].includes(dataFile.data_source) &&
        postfix === 'csv' &&
        String(dataFile?.files?.[0]?.file_name?.split('.')?.[1]) === 'csv' &&
        filterNodeGraph?.[0]?.dataType === 'structured'
      ) {
        const parsing = onHandleParsingShow();
        params.delimiter = parsing?.delimiter;
        params.quotechar = parsing?.quotechar;
        params.escapechar = parsing?.escapechar;
      }
      if (dataFile.data_source === 'AnyRobot') {
        params = onAssignToTime(params, 'extract');
      }
      servicesCreateEntity.submitExtractTask(params).then(({ res, Description }) => {
        let rules: any = [];
        let error = '';
        if (res) {
          rules = convertToRules(res, name, dataFile.extract_type);
        }
        if (Description) {
          error = intl.get(`${prefixClsLocale}.fileNotExist`);
          message.error({
            content: error,
            className: 'custom-class',
            style: {
              padding: 0
            }
          });
        }
        resolve({ rules, error });
      });
    });
  };

  /**
   * 获取SQL的抽取规则
   */
  const getSqlExtractRule = (dataFile: DataFileType) => {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async resolve => {
      let rules: any = [];
      let errorTip = '';
      try {
        const { res } =
          (await servicesCreateEntity.sqlExtract({
            ds_id: dataFile.ds_id,
            sql: dataFile.files[0].file_source,
            sql_name: dataFile.files[0].file_name
          })) || {};
        if (res) {
          const deepCloneData = _.cloneDeep(res);
          rules = generateSqlExtractRule(deepCloneData.file_name, deepCloneData.property);
        }
      } catch (error) {
        errorTip = intl.get(`${prefixClsLocale}.fileNotExist`);
        message.error({
          content: errorTip,
          className: 'custom-class',
          style: {
            padding: 0
          }
        });
      }
      resolve({ rules, error: errorTip });
    });
  };

  /**
   * 编辑数据文件
   */
  const editDataFile = () => {
    onEditDataFile?.(currentDataFile[0]);
  };

  /**
   * 获取数据文件的属性和属性值（第一行数据作为属性值）
   */
  const getPropertyAndDataByDataFile = async (dataFile: DataFileType, isEdit?: any) => {
    const isRabbitMQ = dataFile.data_source.includes(DS_SOURCE.mq); // 是不是RabbitMQ数据库
    const isSQLExtract = dataFile.extract_type === EXTRACT_TYPE.SQL; // 是不是SQL抽取
    let dataFileProperty = []; // 储存数据文件的属性
    const dataFileData: Record<string, any> = {}; // key是列名 不是列的key
    let errorTip = ''; // 数据文件是否有错误
    if (isRabbitMQ) {
      // RabbitMQ数据库没有数据，无需展示数据，只展示抽取字段即可
      const { rules, error }: any = await getExtractRule(dataFile);
      if (!error) {
        dataFileProperty = rules.map((item: any) => ({
          columnName: item.property.column_name,
          key: item.property.property_field
        }));
      } else {
        errorTip = error;
      }
    } else {
      const extractRule = dataFile.extract_rules[0].property; // 数据文件身上的抽取规则

      const { tables, error }: any = isSQLExtract
        ? await getDataBySqlDataFile(dataFile)
        : await getDataByDataFile(dataFile, isEdit);
      if (!error) {
        // 数据预览接口返回了当前表的最新字段，（表的字段经过新增或者删除之后的最新结果），判断抽取规则对应的字段还在不在
        const { property, content } = tables; // property是去除特殊字符的
        const columnName = content[0] ?? [];
        const columnConfig = property.map((item: string, index: number) => ({
          columnName: columnName[index],
          key: item
        }));
        // 根据数据文件身上的抽取规则对property进行过滤，只展示数据文件身上配置的抽取规则字段
        dataFileProperty = extractRule.map((rule: any) => {
          const column = columnConfig.find((item: any) => item.key === rule.property_field);
          if (column) {
            // 说明抽取规则字段在最新的返回的表中还存在
            return {
              columnName: column.columnName,
              key: column.key
            };
          }
          return {
            columnName: rule.column_name,
            key: rule.property_field,
            error: intl.get(`${prefixClsLocale}.fieldNoExistTips`)
          };
        });
        const filedName = content[0]; // 第一行是列名
        const filedValue = content[1]; // 第二行才是值
        filedName?.forEach((key: string, index: number) => {
          dataFileData[key] = filedValue?.[index] ?? '';
        });
      } else {
        // 数据文件不存在，报错之后，要显示原先数据文件的字段名
        dataFileProperty = extractRule.map((rule: any) => ({
          columnName: rule.column_name,
          key: rule.property_field
        }));
        errorTip = error;
      }
    }
    return {
      dataFileProperty,
      dataFileData,
      errorTip
    };
  };

  /**
   * 移除数据文件节点
   */
  const removeX6DataFileNode = () => {
    const graphX6 = x6Ref.current?.graphX6;
    const allNode = graphX6?.getNodes();
    const target = allNode?.find((node: any) => node.toJSON().shape === AdX6DataFileNode);
    // 删除上次添加的数据文件节点
    if (target) {
      graphX6?.removeNode(target);
    }
  };

  const removeX6ModelDataFileNode = () => {
    const graphX6 = x6Ref.current?.graphX6;
    const allNode = graphX6?.getNodes();
    const targetNodes = allNode?.filter((node: any) => node.toJSON().shape === AdX6ModelDirFileNode) ?? [];
    if (targetNodes.length > 0) {
      graphX6?.removeCells(targetNodes);
    }
  };

  const addHelpTips = (tips: any) => {
    setKnowledgeMapStore(preStore => ({
      ...preStore,
      helpTips: tips
    }));
  };

  const removeHelpTips = () => {
    setKnowledgeMapStore(preStore => ({
      ...preStore,
      helpTips: []
    }));
  };

  const addErrorTips = (errorData: Flow4ErrorType[]) => {
    // const { flow4ErrorList } = getLatestStore();
    // const newFlow4ErrorList = _.cloneDeep(flow4ErrorList);
    const newFlow4ErrorList = clearErrorTips();
    // const index = newFlow4ErrorList.findIndex(
    //   errorItem => errorItem.name === errorData.name && errorItem.error === errorData.error
    // );
    // if (index === -1) {
    //   newFlow4ErrorList.push(errorData);
    // } else {
    //   newFlow4ErrorList.splice(index, 1, errorData);
    // }
    setKnowledgeMapStore(preStore => ({
      ...preStore,
      flow4ErrorList: [...newFlow4ErrorList, ...errorData]
    }));
  };

  const clearErrorTips = () => {
    const { selectedG6Node, selectedG6Edge, flow4ErrorList } = getLatestStore();
    let className = '';
    if (selectedG6Node.length > 0) {
      className = selectedG6Node[0]._sourceData.name;
    }
    if (selectedG6Edge.length > 0) {
      const { edgeData } = selectedG6Edge[0];
      className = String(edgeData._sourceData.edge_id);
    }
    let newFlow4ErrorList = _.cloneDeep(flow4ErrorList);
    newFlow4ErrorList = newFlow4ErrorList.filter(item => item.name !== className);
    setKnowledgeMapStore(preStore => ({
      ...preStore,
      flow4ErrorList: newFlow4ErrorList
    }));
    return newFlow4ErrorList;
  };

  /**
   * 刷新数据文件
   */
  const refreshDataFile = async (dataFile: DataFileType, node: Node<Node.Properties>) => {
    const isSqlExtract = dataFile.extract_type === EXTRACT_TYPE.SQL;
    const newDataFile: DataFileType = _.cloneDeep(dataFile);
    const extractRule = newDataFile.extract_rules[0].property; // 保存的数据文件身上的抽取规则
    // 重新获取文件的抽取规则
    const { rules, error }: any = isSqlExtract
      ? await getSqlExtractRule(newDataFile)
      : await getExtractRule(newDataFile);
    if (error) {
      node.updateData({
        error
      });
      return;
    }
    message.success({
      content: intl.get(`${prefixClsLocale}.refreshSuccess`),
      className: 'custom-class',
      style: {
        marginTop: '6vh'
      }
    });
    // 刷新之后，接口返回的新抽取规则
    const newExtractRule = rules.map((item: any) => ({
      column_name: item.property.column_name,
      property_field: item.property.property_field
    }));
    // 新旧比较哪些抽取规则被删除了
    const oldExtractRuleField = extractRule.map(item => item.property_field);
    const newExtractRuleField = newExtractRule.map((item: any) => item.property_field);
    const deleteField = _.difference(oldExtractRuleField, newExtractRuleField);

    const targetExtractRule = extractRule.filter(item => !deleteField.includes(item.property_field));

    const targetFile = {
      ...newDataFile,
      extract_rules: [
        {
          entity_type: newDataFile.extract_rules[0].entity_type,
          property: targetExtractRule
        }
      ]
    };
    setKnowledgeMapStore(preStore => ({
      ...preStore,
      currentDataFile: [targetFile]
    }));
  };

  /**
   * 获取数据文件的图标类型
   */
  const getDataFileIconType = (dataFile: DataFileType) => {
    if (dataFile.extract_type === EXTRACT_TYPE.SQL) {
      return 'sql';
    }
    return 'sheet';
  };

  /**
   * 根据选中的数据文件生成X6Data(选中的是G6实体类的情况)
   */
  const generateX6NodeBySelectedDataFile = async (isEdit = true) => {
    const { cacheGraphX6Data } = getLatestStore();
    const graphX6 = x6Ref.current?.graphX6;
    if (currentDataFile.length > 0) {
      const dataFile = currentDataFile[0];
      setLoading(true);
      const { dataFileProperty, dataFileData, errorTip } = await getPropertyAndDataByDataFile(dataFile, isEdit);
      setLoading(false);
      const x6DataFileNodeId = `${dataFile.data_source}/${dataFile.files[0].file_name}`;
      const ports = dataFileProperty.map((attribute: any) => ({
        id: `${x6DataFileNodeId}${stringSeparator1}${attribute.key}`,
        name: `${x6DataFileNodeId}${stringSeparator1}${attribute.columnName}`, // 用列名作为连接桩的名字，用于hive数据源的匹配
        group: AdRowEndPointPortLeft
      }));

      const tableData = dataFileProperty.map((attribute: any, index: number) => ({
        fieldName: attribute.columnName,
        fieldValue: dataFileData[attribute.columnName] ?? '',
        fieldKey: attribute.key,
        fieldError: attribute.error // 字段的错误信息
      }));

      // 获取节点的位置信息
      let dataFileNodePosition = {
        x: 30 + 120 + AdX6EntityNodeWidth,
        y: 110
      };
      const cacheX6DataFileNodeData = cacheGraphX6Data[selectedG6Node[0]._sourceData.name]?.find(
        x6Data => x6Data.id === `${dataFile.data_source}/${dataFile.files[0].file_name}`
      );
      if (cacheX6DataFileNodeData) {
        dataFileNodePosition = cacheX6DataFileNodeData.position;
      }

      // 获取数据文件的名字
      let fileName = dataFile.files[0].file_name;
      if ([DS_SOURCE.sqlserver, DS_SOURCE.postgresql, DS_SOURCE.kingbasees].includes(dataFile.data_source)) {
        // 将模式名截取调
        if (dataFile.extract_type !== EXTRACT_TYPE.SQL) {
          fileName = fileName.split('/')[1];
        }
      }

      const x6Node: Node.Metadata = {
        id: x6DataFileNodeId,
        shape: AdX6DataFileNode,
        position: dataFileNodePosition,
        data: {
          fileName,
          fileIcon: getDataFileIconType(dataFile),
          fileEntityType: dataFile.extract_rules[0].entity_type,
          refreshDataFile: (node: Node<Node.Properties>) => refreshDataFile(dataFile, node),
          onClearX6FileNode,
          editDataFile,
          tableData,
          error: errorTip,
          dataFile,
          readOnly: viewMode
        },
        ports
      };
      removeX6DataFileNode();
      graphX6?.addNode(x6Node);

      // if (errorTip) {
      //   return;
      // }

      generateX6EdgeByDataFileAndG6Node();
    } else {
      updateStoreGraphKMap(graphX6!);
    }
  };

  /**
   * 处理必填属性
   */
  const handleRequireProperty = (graph: IGraph) => {
    const { selectedG6Node, currentDataFile, selectedG6Edge } = getLatestStore();
    if (currentDataFile.length === 0) {
      clearErrorTips();
      return;
    }
    const graphX6 = graph;
    const allEdges = graphX6?.getEdges() ?? [];
    const edgeDatas = allEdges.map((item: any) => item.toJSON());
    if (selectedG6Node.length > 0) {
      const filterNodeGraph = _.filter(
        _.cloneDeep(graphDataSource),
        (item: any) => item?.id === currentDataFile[0]?.ds_id
      );
      if (
        // 改的地方
        ['as', 'as7'].includes(currentDataFile[0]?.data_source) &&
        String(currentDataFile[0]?.files?.[0]?.file_name?.split?.('.')?.[1]) === 'csv' &&
        filterNodeGraph?.[0]?.dataType === 'structured'
      ) {
        onHandleParsing(currentDataFile[0]?.files);
      }

      const edgeSourceProp = edgeDatas.map((item: any) => {
        const [className, propName] = item.source.port.split(stringSeparator1);
        return propName;
      });
      const errorData: Flow4ErrorType[] = [];
      const { _sourceData } = selectedG6Node[0];
      const uniqueProperty = _sourceData.default_tag;
      const mergeProperty = _sourceData.primary_key;

      let unConfigDefaultTag = false;
      let unConfigMergeTag = false;
      // if (edgeSourceProp.length > 0 && !edgeSourceProp.includes(uniqueProperty)) {
      if (!edgeSourceProp.includes(uniqueProperty)) {
        // 说明没有配置默认显示属性
        unConfigDefaultTag = true;
      }
      mergeProperty.forEach((prop: string) => {
        // if (edgeSourceProp.length > 0 && !edgeSourceProp.includes(prop)) {
        if (!edgeSourceProp.includes(prop)) {
          // 说明没有配置融合属性
          unConfigMergeTag = true;
        }
      });
      if (unConfigDefaultTag && unConfigMergeTag) {
        errorData.push({ name: _sourceData.name, error: intl.get(`${prefixClsLocale}.errorTips1`), type: 'required' });
      } else if (unConfigDefaultTag) {
        errorData.push({
          name: _sourceData.name,
          error: intl.get(`${prefixClsLocale}.defaultTagRequiredTip`),
          type: 'required'
        });
      } else if (unConfigMergeTag) {
        errorData.push({
          name: _sourceData.name,
          error: intl.get(`${prefixClsLocale}.mergeRequiredTip`),
          type: 'required'
        });
      }

      // 检查是否有多个属性映射到同一个数据文件字段身上的问题
      const repeatMapField: string[] = [];
      const matchEntity = graphKMap.entity.find(item => item.name === _sourceData.name);
      if (matchEntity) {
        const repeatData = getRepeatMapProps(matchEntity.property_map);
        repeatData.forEach(item => {
          repeatMapField.push(item.otl_prop);
          errorData.push({
            name: _sourceData.name,
            attrName: item.otl_prop,
            type: 'repeat',
            error: intl.get(`${prefixClsLocale}.fieldMapUniqueError`)
          });
        });
      }
      addErrorTips(errorData);
      const node = graphX6?.getCellById(_sourceData.name);
      node?.updateData({
        configProperty: edgeSourceProp,
        dataFile: currentDataFile[0],
        repeatMapField
      });
    }
    if (selectedG6Edge.length > 0) {
      const errorTips: Flow4ErrorType[] = [];
      const { edgeData, startNodeData, endNodeData } = selectedG6Edge[0];
      const { _sourceData } = edgeData;
      const edge_id = String(_sourceData.edge_id);
      const { startNodeId, endNodeId } = getX6RelationClassStartEndNodeId(startNodeData, endNodeData);
      const node = graphX6?.getCellById(_sourceData.name);
      const edgeSourceProp: any = [];
      edgeDatas.forEach((item: any) => {
        const [className, propName] = item.source.port.split(stringSeparator1);
        if (
          className === _sourceData.name &&
          propName &&
          item.source.cell !== startNodeId &&
          item.source.cell !== endNodeId
        ) {
          edgeSourceProp.push(propName);
        }
      });
      const uniqueProperty = _sourceData.default_tag;
      let unConfigDefaultTag = false;
      let unConfigStartNode = true;
      let unConfigEndNode = true;
      if (uniqueProperty && !edgeSourceProp.includes(uniqueProperty)) {
        // 说明没有配置默认显示属性
        unConfigDefaultTag = true;
      }
      edgeDatas.forEach((item: any) => {
        const cellId = item.source.cell;
        if (cellId === startNodeId) {
          unConfigStartNode = false;
        }
        if (cellId === endNodeId) {
          unConfigEndNode = false;
        }
      });

      if (unConfigDefaultTag) {
        errorTips.push({
          name: edge_id,
          error: intl.get(`${prefixClsLocale}.defaultTagRequiredTip`),
          type: 'required'
        });
      }
      if (unConfigStartNode && unConfigEndNode) {
        errorTips.push({
          name: edge_id,
          error: intl.get(`${prefixClsLocale}.x6RelStartEndRequiredTip`),
          type: 'required'
        });
      } else if (unConfigStartNode) {
        errorTips.push({
          name: edge_id,
          error: intl.get(`${prefixClsLocale}.x6RelStartNodeRequiredTip`),
          type: 'required'
        });
      } else if (unConfigEndNode) {
        errorTips.push({
          name: edge_id,
          error: intl.get(`${prefixClsLocale}.x6RelEndNodeRequiredTip`),
          type: 'required'
        });
      }
      // 检查是否有多个属性映射到同一个数据文件字段身上的问题
      const repeatMapField: string[] = [];
      const matchEdge = graphKMap.edge.find(item => _.isEqual(item.relations, _sourceData.relations));
      if (matchEdge) {
        const repeatData = getRepeatMapProps(matchEdge.property_map);
        repeatData.forEach(item => {
          repeatMapField.push(item.edge_prop);
          errorTips.push({
            name: edge_id,
            attrName: item.edge_prop,
            type: 'repeat',
            error: intl.get(`${prefixClsLocale}.fieldMapUniqueError`)
          });
        });
      }
      addErrorTips(errorTips);
      node?.updateData({
        configProperty: edgeSourceProp,
        dataFile: currentDataFile[0],
        repeatMapField
      });
    }
  };

  /**
   * 实体删除后删除对应的解析规则
   */
  const onHandleParsing = (data: any) => {
    const gnsAll: any = [];
    const cloneData = _.cloneDeep(data);
    const cloneParsingData = _.cloneDeep(parsingSet);
    _.map(cloneData, (item: any) => {
      gnsAll.push(item?.file_source);
    });
    const newParsing = _.filter(cloneParsingData, (item: any) => {
      return gnsAll?.[0] !== item?.key;
    });
    setParsingSet(newParsing);
  };

  /**
   * 实体类已经和数据文件映射了的话，该函数去渲染实体类的映射
   */
  const generateX6EdgeByDataFileAndG6Node = () => {
    const dataFile = currentDataFile[0];
    const { graphKMap } = getLatestStore();
    const x6DataFileNodeId = `${dataFile.data_source}/${dataFile.files[0].file_name}`;
    const graphX6 = x6Ref.current?.graphX6;
    if (graphX6) {
      const extractRulesFields = dataFile.extract_rules[0].property.map(ruleField => ruleField.property_field);
      const edgeData: Array<Edge.Metadata> = [];
      const entityClassName = selectedG6Node[0]?._sourceData.name;
      graphKMap?.entity.forEach(item => {
        if (item.name === entityClassName) {
          item.property_map.forEach(props => {
            // 说明实体身上的属性已经和数据文件进行映射 并且 实体关联数据文件的属性还是存在的
            if (props.entity_prop && extractRulesFields.includes(props.entity_prop)) {
              edgeData.push({
                zIndex: 0,
                shape: AdX6Edge,
                source: {
                  cell: item.name,
                  port: `${item.name}${stringSeparator1}${props.otl_prop}`
                },
                target: {
                  cell: x6DataFileNodeId,
                  port: `${x6DataFileNodeId}${stringSeparator1}${props.entity_prop}`
                }
              });
            }
          });
        }
      });
      if (edgeData.length > 0) {
        graphX6?.addEdges(edgeData);
      } else {
        if (isAutoMapPropsSignRef.current) {
          isAutoMapPropsSignRef.current = false;
          // 新添加的数据文件要进行自动属性映射
          autoMapProps();
        }
      }
      updateStoreGraphKMap(graphX6);
    }
  };

  /**
   * 根据选中的数据文件生成X6Data(选中的是G6关系类的情况)
   * isRefresh 是不是点击了刷新按钮
   */
  const generateX6NodeBySelectedDataFileAndRelationsClass = async (isRefresh = false) => {
    const { cacheGraphX6Data } = getLatestStore();
    const graphX6 = x6Ref.current?.graphX6;
    const allNode = graphX6?.getNodes();
    const { edgeData, startNodeData, endNodeData } = selectedG6Edge[0];
    const { startNodeId, endNodeId } = getX6RelationClassStartEndNodeId(startNodeData, endNodeData);
    // 获取关系类，起点，终点三个X6节点
    const relationClassNode = allNode?.find((node: any) => node.toJSON().id === edgeData._sourceData.name);
    const startNode = allNode?.find((node: any) => node.toJSON().id === startNodeId);
    const endNode = allNode?.find((node: any) => node.toJSON().id === endNodeId);
    // 关系类是否具有属性
    const relationClassHaveAttribute = edgeData._sourceData.attributes.length > 0;

    if (currentDataFile.length > 0) {
      const dataFile = currentDataFile[0];

      const relationClassPosition = relationClassNode!.position();

      // 获取数据文件节点的位置
      let dataFileNodePosition = {
        x: relationClassPosition.x! + AdX6EntityNodeWidth + 80,
        y: relationClassPosition.y
      };
      const cacheX6DataFileNodeData = cacheGraphX6Data[edgeData._sourceData.name]?.find(
        x6Data => x6Data.id === `${dataFile.data_source}/${dataFile.files[0].file_name}`
      );
      if (cacheX6DataFileNodeData) {
        dataFileNodePosition = cacheX6DataFileNodeData.position;
      }

      // 获取关系类起始节点的位置
      let newStartNodePosition = {
        x: dataFileNodePosition.x + AdX6DataFileNodeWidth + 80,
        y: dataFileNodePosition.y
      };
      const cacheX6RelationStartNodeData = cacheGraphX6Data[edgeData._sourceData.name]?.find(
        x6Data => x6Data.id === startNodeId
      );
      // if (cacheX6RelationStartNodeData && haveDataFileNode) {
      if (cacheX6RelationStartNodeData) {
        newStartNodePosition = cacheX6RelationStartNodeData.position;
      }
      // 获取关系类终点节点的位置
      let newEndNodePosition = {
        x: dataFileNodePosition.x + AdX6DataFileNodeWidth + 80,
        y: dataFileNodePosition.y + 200
      };
      const cacheX6RelationEndNodeData = cacheGraphX6Data[edgeData._sourceData.name]?.find(
        x6Data => x6Data.id === endNodeId
      );
      // if (cacheX6RelationEndNodeData && haveDataFileNode) {
      if (cacheX6RelationEndNodeData) {
        newEndNodePosition = cacheX6RelationEndNodeData.position;
      }
      // 插入数据文件节点，必定要调整起始节点的位置
      startNode?.position(newStartNodePosition.x, newStartNodePosition.y);
      endNode?.position(newEndNodePosition.x, newEndNodePosition.y);

      if (!relationClassHaveAttribute) {
        // 更改终点连接桩
        endNode?.removePorts(); // 先删除之前的连接桩然后在添加
        const endNodeConfigData = endNode?.getData();
        endNode?.addPort({
          group: AdRowStartPointPortLeft,
          id: `${endNodeData._sourceData.name}${stringSeparator1}${endNodeConfigData.selectValue}`
        });
      }

      setLoading(true);
      const { dataFileProperty, dataFileData, errorTip } = await getPropertyAndDataByDataFile(dataFile);
      setLoading(false);
      const newEdges: any[] = [];
      const x6DataFileNodeId = `${dataFile.data_source}/${dataFile.files[0].file_name}`;
      let ports = dataFileProperty.map((attribute: any) => ({
        id: `${x6DataFileNodeId}${stringSeparator1}${attribute.key}`,
        name: `${x6DataFileNodeId}${stringSeparator1}${attribute.columnName}`, // 用列名作为连接桩的名字，用于hive数据源的匹配
        group: AdRowEndPointPortRight
      }));

      if (!relationClassHaveAttribute) {
        if (!relationClassNode?.hasPort(edgeData._sourceData.name)) {
          // 给关系类添加一个头部右侧连接桩
          relationClassNode?.addPort({
            group: AdHeaderStartPointPortRight,
            id: edgeData._sourceData.name
          });
        }
        // 给数据文件添加一个头部左侧连接桩
        ports.push({
          id: `${x6DataFileNodeId}${stringSeparator1}${x6DataFileNodeId}`,
          group: AdHeaderEndPointPortLeft
        });
        // 将关系类节点与数据文件节点用边连接起来
        newEdges.push({
          zIndex: 0,
          shape: AdX6Edge,
          source: {
            cell: edgeData._sourceData.name,
            port: edgeData._sourceData.name
          },
          target: {
            cell: x6DataFileNodeId,
            port: `${x6DataFileNodeId}-${x6DataFileNodeId}`
          },
          data: {
            deleteBtnVisible: false
          },
          label: {
            attrs: {
              text: {
                text: intl.get(`${prefixClsLocale}.x6EdgeLabel`)
              }
            }
          }
        });
      }

      if (relationClassHaveAttribute) {
        ports = [
          ...ports,
          ...dataFileProperty.map((attribute: any) => ({
            id: `${x6DataFileNodeId}${stringSeparator2}${attribute.key}`,
            name: `${x6DataFileNodeId}${stringSeparator2}${attribute.columnName}`, // 用列名作为连接桩的名字，用于hive数据源的匹配
            group: AdRowEndPointPortLeft
          }))
        ];
      }

      const tableData = dataFileProperty.map((attribute: any, index: number) => ({
        fieldName: attribute.columnName,
        fieldValue: dataFileData[attribute.columnName] ?? '',
        fieldKey: attribute.key,
        fieldError: attribute.error // 字段的错误信息
      }));

      // 获取数据文件的名字
      let fileName = dataFile.files[0].file_name;
      if ([DS_SOURCE.sqlserver, DS_SOURCE.postgresql, DS_SOURCE.kingbasees].includes(dataFile.data_source)) {
        // 将模式名截取调
        fileName = fileName.split('/')[1];
      }
      const x6Node: Node.Metadata = {
        id: x6DataFileNodeId,
        shape: AdX6DataFileNode,
        position: dataFileNodePosition,
        data: {
          fileName,
          fileIcon: getDataFileIconType(dataFile),
          fileEntityType: dataFile.extract_rules[0].entity_type,
          refreshDataFile: (node: Node<Node.Properties>) => refreshDataFile(dataFile, node),
          onClearX6FileNode,
          editDataFile,
          tableData,
          error: errorTip,
          dataFile,
          readOnly: viewMode
        },
        ports
      };
      removeX6DataFileNode();
      graphX6?.addNode(x6Node);
      graphX6?.addEdges(newEdges);
      // graphX6?.scaleContentToFit({ maxScale: 1, preserveAspectRatio: true });
      // if (errorTip) {
      //   return;
      // }
    }
    if (currentDataFile.length === 0 && !relationClassHaveAttribute) {
      // 更改终点连接桩
      endNode?.removePorts(); // 先删除之前的连接桩然后在添加
      const endNodeConfigData = endNode?.getData();
      endNode?.addPort({
        group: AdRowEndPointPortLeft,
        id: `${endNodeData._sourceData.name}${stringSeparator1}${endNodeConfigData.selectValue}`
      });

      if (relationClassNode?.hasPort(edgeData._sourceData.name)) {
        // 给关系类添加一个头部右侧连接桩
        relationClassNode?.removePorts();
      }
    }
    generateX6EdgeByDataFileAndG6Edge();
  };

  /**
   * 关系类已经和数据文件映射了的话，该函数去渲染关系类的映射
   */
  const generateX6EdgeByDataFileAndG6Edge = () => {
    const { graphKMap } = getLatestStore();
    const graphX6 = x6Ref.current?.graphX6;
    if (graphX6) {
      const x6EdgeConfigData: Array<Edge.Metadata> = [];
      const relations = selectedG6Edge[0].edgeData._sourceData.relations;
      const { edgeData, startNodeData, endNodeData } = selectedG6Edge[0];
      const { startNodeId, endNodeId } = getX6RelationClassStartEndNodeId(startNodeData, endNodeData);
      const relationClassName = edgeData._sourceData.name;
      let x6DataFileNodeId = '';
      // 当前选中数据文件身上的抽取规则字段
      let extractRulesFields: string[] = [];
      if (currentDataFile.length > 0) {
        const dataFile = currentDataFile[0];
        x6DataFileNodeId = `${dataFile.data_source}/${dataFile.files[0].file_name}`;
        extractRulesFields = dataFile.extract_rules[0].property.map(ruleField => ruleField.property_field);
      }
      graphKMap?.edge.forEach(item => {
        if (_.isEqual(relations, item.relations)) {
          const startNodeName = startNodeData._sourceData.name;
          const endNodeName = endNodeData._sourceData.name;
          if (currentDataFile.length > 0) {
            if (item.property_map.length > 0) {
              // 说明关系类有属性
              item.property_map.forEach(props => {
                // 说明关系类身上有属性已经和数据文件进行映射 并且 关系类关联数据文件的属性还是存在的
                if (props.entity_prop && extractRulesFields.includes(props.entity_prop)) {
                  x6EdgeConfigData.push({
                    zIndex: 0,
                    shape: AdX6Edge,
                    source: {
                      cell: relationClassName,
                      port: `${relationClassName}${stringSeparator1}${props.edge_prop}`
                    },
                    target: {
                      cell: x6DataFileNodeId,
                      port: `${x6DataFileNodeId}${stringSeparator2}${props.entity_prop}`
                    }
                  });
                }
              });
            }

            // 生成边的起始/终点节点与数据文件之间的映射关系,要保证数据文件身上关联的属性还在  才能去生成一条边
            if (
              item.relation_map.relation_begin_pro &&
              extractRulesFields.includes(item.relation_map.relation_begin_pro)
            ) {
              x6EdgeConfigData.push({
                zIndex: 0,
                shape: AdX6Edge,
                source: {
                  cell: startNodeName,
                  port: `${startNodeName}${stringSeparator1}${item.relation_map.begin_class_prop}`
                },
                target: {
                  cell: x6DataFileNodeId,
                  port: `${x6DataFileNodeId}${stringSeparator1}${item.relation_map.relation_begin_pro}`
                },
                label: {
                  position: 0.5
                },
                labelValue: item.relation_map.equation_begin,
                defaultLabel: {
                  markup: Markup.getForeignObjectMarkup(),
                  attrs: {
                    fo: {
                      width: 90,
                      height: 24,
                      x: -30,
                      y: -15
                    }
                  }
                }
              });
            }
            if (item.relation_map.relation_end_pro && extractRulesFields.includes(item.relation_map.relation_end_pro)) {
              x6EdgeConfigData.push({
                zIndex: 0,
                shape: AdX6Edge,
                source: {
                  cell: endNodeId,
                  port: `${endNodeName}${stringSeparator1}${item.relation_map.end_class_prop}`
                },
                target: {
                  cell: x6DataFileNodeId,
                  port: `${x6DataFileNodeId}${stringSeparator1}${item.relation_map.relation_end_pro}`
                },
                label: {
                  position: 0.5
                },
                labelValue: item.relation_map.equation_end,
                defaultLabel: {
                  markup: Markup.getForeignObjectMarkup(),
                  attrs: {
                    fo: {
                      width: 90,
                      height: 24,
                      x: -30,
                      y: -15
                    }
                  }
                }
              });
            }
          }
          if (currentDataFile.length === 0) {
            // 生成起始实体类节点与终点实体类节点之间的映射关系
            if (item.relation_map.equation) {
              x6EdgeConfigData.push({
                zIndex: 0,
                shape: AdX6MindMapEdge,
                source: {
                  cell: startNodeName,
                  port: `${startNodeName}${stringSeparator1}${item.relation_map.begin_class_prop}`
                },
                target: {
                  cell: endNodeId,
                  port: `${endNodeName}${stringSeparator1}${item.relation_map.end_class_prop}`
                },
                label: {
                  position: 0.5
                },
                labelValue: item.relation_map.equation,
                defaultLabel: {
                  markup: Markup.getForeignObjectMarkup(),
                  attrs: {
                    fo: {
                      width: 90,
                      height: 24,
                      x: -30,
                      y: -15
                    }
                  }
                }
              });
            }
          }
        }
      });
      if (x6EdgeConfigData.length > 0) {
        graphX6?.addEdges(x6EdgeConfigData);
      } else {
        if (isAutoMapPropsSignRef.current) {
          isAutoMapPropsSignRef.current = false;
          if (currentDataFile.length > 0) {
            // 新添加的数据文件要进行自动属性映射
            autoMapProps();
          }
        }
      }
      updateStoreGraphKMap(graphX6);
    }
  };

  /**
   * 根据选中的数据文件生成X6Data （选中的G6实体类或关系类是模型的情况）
   */
  const generateX6NodeBySelectedDataFileForModel = () => {
    const { cacheGraphX6Data, graphId, selectedModel } = getLatestStore();
    const graphX6 = x6Ref.current?.graphX6;
    const modelKey = selectedModel[0];
    if (graphX6) {
      if (currentDataFile.length > 0) {
        const modelNode = graphX6.getCellById(modelKey) as Node<Node.Properties>;
        const modelNodePosition = modelNode.position();
        // 文件节点/文件夹节点
        const fileNode: any = [];
        let indexStart = 0;
        currentDataFile.forEach(dataFile => {
          dataFile.files.forEach((file, index) => {
            let position = {
              x: modelNodePosition.x - AdX6EntityNodeWidth - 100,
              y: modelNodePosition.y + 56 * (index + indexStart)
            };
            const cacheX6FileNodeData = cacheGraphX6Data[modelKey]?.find(x6Data => x6Data.id === file.file_name);
            if (cacheX6FileNodeData) {
              position = cacheX6FileNodeData.position;
            }
            fileNode.push({
              id: file.file_name,
              shape: AdX6ModelDirFileNode,
              position,
              ports: [{ id: file.file_name, group: AdFileDirPortRight }],
              data: {
                label: file.file_name,
                type: file.file_type,
                onClearX6ModelFileNode,
                onRefreshModelDir,
                _sourceData: {
                  dataFile,
                  file,
                  graphId
                },
                flow4ErrorList,
                readOnly: viewMode
              }
            });
          });
          indexStart += dataFile.files.length;
        });

        // 生成边
        const edges: any = fileNode.map((item: any) => ({
          zIndex: 0,
          shape: AdX6ModelEdge,
          target: {
            cell: modelKey,
            port: modelKey
          },
          source: {
            cell: item.id,
            port: item.id
          },
          data: {
            deleteBtnVisible: false
          }
        }));
        removeX6ModelDataFileNode();
        graphX6.addNodes(fileNode);
        graphX6.addEdges(edges);
      }
      updateStoreGraphKMap(graphX6);
    }
  };

  /**
   * 模型关联的文件夹刷新按钮的回调事件
   * @param error
   */
  const onRefreshModelDir = (error: string, dataFile: DataFileType) => {
    // addErrorTips([
    //   {
    //     name: dataFile.extract_model!,
    //     error,
    //     type: 'dataFile',
    //     dataFile
    //   }
    // ]);
  };

  /**
   * 文件节点的关闭按钮点击事件
   */
  const onClearX6FileNode = () => {
    removeCurrentDataFile();
  };

  /**
   * 模型文件节点的关闭按钮点击事件
   */
  const onClearX6ModelFileNode = (file_source: string) => {
    const { selectedModel, graphKMap } = getLatestStore();
    const deleteDSId: number[] = [];
    const newGraphKMap = _.cloneDeep(graphKMap)!;
    newGraphKMap.files.forEach((item, index) => {
      if (item.extract_model === selectedModel[0]) {
        item.files = item.files.filter(file => file.file_source !== file_source);
        if (item.files.length === 0) {
          deleteDSId.push(item.ds_id);
          setKnowledgeMapStore(preStore => {
            // @ts-ignore
            preStore.currentDataFile = preStore.currentDataFile.filter(dataFile => dataFile.ds_id !== item.ds_id);
          });
        } else {
          setKnowledgeMapStore(preStore => {
            const targetIndex = preStore.currentDataFile.findIndex(dataFile => dataFile.ds_id === item.ds_id);
            const cloneCurrentDataFile = _.cloneDeep(preStore.currentDataFile);
            cloneCurrentDataFile.splice(targetIndex, 1, item);
            // @ts-ignore
            preStore.currentDataFile = cloneCurrentDataFile;
          });
        }
      }
    });
    if (deleteDSId.length > 0) {
      newGraphKMap.files = newGraphKMap.files.filter(file => !deleteDSId.includes(file.ds_id));
    }
    const modelFile = newGraphKMap.files.filter(file => file.extract_model === selectedModel[0]);
    // 映射数据中已经没有数据源和模型映射了，那么要去清空模型中所有实体类以及关系类的映射
    if (modelFile.length === 0) {
      clearModelMap(newGraphKMap);
    }
    setKnowledgeMapStore(preStore => {
      preStore.graphKMap = newGraphKMap;
    });
  };

  /**
   * 获取国际化提示文字
   */
  const getLocalTips = (tips: string) => {
    return tips.split('$').map((item, index) => {
      if (item.startsWith('icon-')) {
        return <IconFont key={index} type={item} style={{ fontSize: 16, margin: '0 6px' }} />;
      }
      return item;
    });
  };

  /**
   * 添加操作提示
   */
  const handleHelpTips = (graph: IGraph) => {
    const { selectedG6Node, selectedG6Edge, currentDataFile } = getLatestStore();
    const allNode = graph?.getNodes().map((item: any) => item.toJSON());
    const dataFileNode = allNode?.find((item: any) => item.shape === AdX6DataFileNode);
    const allEdges = graph?.getEdges() ?? [];
    let edges = allEdges.map((item: any) => item.toJSON());

    if (currentDataFile.length === 0 || !dataFileNode) {
      // 说明是没有数据文件节点
      if (selectedG6Edge.length > 0) {
        const { edgeData } = selectedG6Edge[0];
        const { _sourceData } = edgeData;
        let tips: any = getLocalTips(intl.get(`${prefixClsLocale}.addDataFileTips2`));
        if (_sourceData.attributes.length > 0) {
          tips = getLocalTips(intl.get(`${prefixClsLocale}.addDataFileTips1`));
        }
        addHelpTips([tips]);
        if (edges.length !== 0) {
          addHelpTips([]);
        }
      }
      if (selectedG6Node.length > 0 || selectedModel.length > 0) {
        addHelpTips([getLocalTips(intl.get(`${prefixClsLocale}.addDataFileTips1`))]);
      }
    } else if (currentDataFile.length > 0) {
      if (selectedG6Edge.length > 0) {
        const { edgeData, startNodeData, endNodeData } = selectedG6Edge[0];
        const { _sourceData } = edgeData;
        if (_sourceData.attributes.length === 0) {
          edges = edges.filter((item: any) => item.source.port !== _sourceData.name);
          if (edges.length !== 2) {
            addHelpTips([intl.get(`${prefixClsLocale}.mapTips3`)]);
          } else {
            addHelpTips([]);
          }
        }
        if (_sourceData.attributes.length > 0) {
          let tips = [getLocalTips(intl.get(`${prefixClsLocale}.mapTips1`)), intl.get(`${prefixClsLocale}.mapTips2`)];
          const edgeSourcePortCell = edges.map((item: any) => item.source.port.split(stringSeparator1)[0]);
          if (
            edgeSourcePortCell.includes(_sourceData.name) &&
            edgeSourcePortCell.includes(startNodeData._sourceData.name) &&
            edgeSourcePortCell.includes(endNodeData._sourceData.name)
          ) {
            tips = [];
          }
          addHelpTips(tips);
        }
      }
      if (selectedG6Node.length > 0) {
        if (edges.length === 0) {
          addHelpTips([getLocalTips(intl.get(`${prefixClsLocale}.mapTips1`))]);
        } else {
          addHelpTips([]);
        }
      }
      if (selectedModel.length > 0) {
        addHelpTips([]);
      }
    }
  };

  /**
   * 更改store中graphKMap存储的实体类映射关系(边和节点数量变化，此方法都会执行)
   */
  const updateStoreGraphKMap = (graphParam?: IGraph) => {
    const graph = graphParam || x6Ref.current?.graphX6;
    if (graph) {
      // handleRequireProperty(graph);
      // handleHelpTips(graph);
      // 此函数内部存在过时闭包问题，故采用getLatestStore方法获取store中最新的数据
      const { selectedG6Node, selectedG6Edge, selectedModel } = getLatestStore();
      if (selectedG6Node.length > 0) {
        updateStoreGraphKMapEntity(graph);
      }
      if (selectedG6Edge.length > 0) {
        updateStoreGraphKMapEdge(graph);
      }
      if (selectedModel.length > 0) {
        updateStoreGraphKMapModel(graph);
      }
    }
  };

  const updateStoreGraphKMapEntity = (graph: IGraph) => {
    const { currentDataFile, graphKMap, selectedG6Node } = getLatestStore();
    if (graphKMap) {
      const newGraphKMap = _.cloneDeep(graphKMap);
      if (currentDataFile.length > 0) {
        const allEdges = graph.getEdges();
        // 先清空一次选中实体类属性的所有映射关系
        newGraphKMap.entity.forEach(item => {
          if (item.name === selectedG6Node[0]._sourceData.name) {
            if (item.entity_type) {
              // 需要去清空newGraphKMap.files存储的数据文件
              newGraphKMap.files = newGraphKMap.files.filter(
                file => file.extract_rules[0].entity_type !== item.entity_type
              );
            }
            // item.entity_type = '';
            item.entity_type = currentDataFile[0]?.extract_rules[0].entity_type;
            item.property_map.forEach(props => {
              props.entity_prop = '';
            });
          }
        });

        let notRelationDataFile = true; // 默认没有和当前视图中的数据文件关联
        // 根据边去组合实体类属性的映射数据property_map
        allEdges?.forEach((edge: any) => {
          const { source, target } = edge.toJSON();
          const [entityClassName, nodePropName] = source.port.split(stringSeparator1);
          const [file, filePropName] = target.port.split(stringSeparator1);
          // 通过起点找到实体类以及实体类的属性要和终点文件的属性进行映射
          newGraphKMap.entity.forEach(item => {
            if (item.name === entityClassName) {
              item.property_map.forEach(props => {
                if (props.otl_prop === nodePropName) {
                  props.entity_prop = filePropName;
                  notRelationDataFile = false; // 说明实体与数据文件属性关联了
                }
              });
            }
          });
        });
        newGraphKMap.files.push(currentDataFile[0]);
      } else {
        // 先清空一次选中实体类属性的所有映射关系
        newGraphKMap.entity.forEach(item => {
          if (item.name === selectedG6Node[0]._sourceData.name) {
            if (item.entity_type) {
              // 需要去清空newGraphKMap.files存储的数据文件
              newGraphKMap.files = newGraphKMap.files.filter(
                file => file.extract_rules[0].entity_type !== item.entity_type
              );
            }
            item.entity_type = '';
            item.property_map.forEach(props => {
              props.entity_prop = '';
            });
          }
        });
      }
      setKnowledgeMapStore(preStore => ({
        ...preStore,
        graphKMap: newGraphKMap
      }));
    }
  };

  /**
   * 清空模型上所有实体类和关系类的映射关系
   */
  const clearModelMap = (graphKMap: GraphKMapType) => {
    const { graphG6Data, selectedModel } = getLatestStore();
    graphKMap.files = graphKMap.files.filter(file => !selectedModel.includes(file.extract_model!));
    const modelEntityClass = graphG6Data.nodes?.filter((node: G6NodeData) =>
      selectedModel.includes(node._sourceData.model)
    );
    const modelEntityClassName = modelEntityClass!.map((item: G6NodeData) => item._sourceData.name);
    const modelRelationClass = graphG6Data.edges?.filter((edge: G6EdgeData) =>
      selectedModel.includes(edge._sourceData.model)
    );
    const modelRelations = modelRelationClass!.map((item: G6EdgeData) => item._sourceData.relations);
    graphKMap.entity.forEach(item => {
      if (modelEntityClassName.includes(item.name)) {
        item.entity_type = '';
        item.property_map.forEach(props => {
          props.entity_prop = '';
        });
      }
    });
    modelRelations.forEach(relation => {
      graphKMap.edge.forEach(item => {
        if (_.isEqual(relation, item.relations)) {
          item.entity_type = '';
          item.property_map.forEach(props => {
            props.entity_prop = '';
          });
        }
      });
    });
  };

  /**
   * 更新模型的映射关系
   * @param graph
   */
  const updateStoreGraphKMapModel = (graph: IGraph) => {
    const { currentDataFile, graphKMap, selectedG6Node, graphG6Data, selectedModel } = getLatestStore();
    if (graphKMap && currentDataFile.length > 0) {
      const newGraphKMap = _.cloneDeep(graphKMap);
      // 先清空一次选中的模型实体类和关系类的所有映射关系
      // 需要去清空newGraphKMap.files存储的数据文件
      clearModelMap(newGraphKMap);

      // 过滤出当前选中模型的所有G6边
      const allModelEdge = graphG6Data.edges?.filter(
        (item: G6EdgeData) => item._sourceData.model && selectedModel.includes(item._sourceData.model)
      );

      // 对模型上所有的实体类与关系类进行属性映射
      // 对于模型来说每个数据源身上的extract_rules的值都是一样的
      const extractRules = currentDataFile[0].extract_rules; // 数据文件身上已经包含了模型身上的所有实体和关系的抽取规则
      extractRules.forEach(rule => {
        newGraphKMap.entity.forEach(entity => {
          if (entity.name === rule.entity_type) {
            entity.entity_type = rule.entity_type;
            entity.property_map.forEach(entityProps => {
              rule.property.forEach(ruleProp => {
                if (entityProps.otl_prop === ruleProp.property_field) {
                  entityProps.entity_prop = ruleProp.property_field;
                }
              });
            });
          }
        });
        newGraphKMap.edge.forEach(edge => {
          // 根据边的relations去找边的name
          const relationClass: G6EdgeData | undefined = allModelEdge?.find((item: G6EdgeData) =>
            _.isEqual(item._sourceData.relations, edge.relations)
          );
          if (relationClass) {
            if (relationClass._sourceData.name === rule.entity_type) {
              edge.entity_type = rule.entity_type;
              edge.property_map.forEach(edgeProps => {
                rule.property.forEach(ruleProp => {
                  if (edgeProps.edge_prop === ruleProp.property_field) {
                    edgeProps.entity_prop = ruleProp.property_field;
                  }
                });
              });
            }
          }
        });
      });
      newGraphKMap.files = [...newGraphKMap.files, ...currentDataFile];
      setKnowledgeMapStore(preStore => ({
        ...preStore,
        graphKMap: newGraphKMap
      }));
    }
  };

  const updateStoreGraphKMapEdge = (graph: IGraph) => {
    const { currentDataFile, graphKMap, selectedG6Edge } = getLatestStore();
    const { edgeData, startNodeData, endNodeData } = selectedG6Edge[0];
    const relationClassData = edgeData;

    if (graphKMap) {
      const newGraphKMap = _.cloneDeep(graphKMap);
      const allX6Edges = graph.getEdges();
      // 先循环一遍恢复默认值
      newGraphKMap.edge.forEach(item => {
        if (_.isEqual(item.relations, relationClassData._sourceData.relations)) {
          if (item.entity_type) {
            // 需要去清空newGraphKMap.files存储的数据文件
            newGraphKMap.files = newGraphKMap.files.filter(
              file => file.extract_rules[0].entity_type !== item.entity_type
            );
          }
          item.entity_type = '';
          if (currentDataFile.length > 0) {
            item.entity_type = currentDataFile[0]?.extract_rules[0].entity_type;
          }
          item.property_map.forEach(props => {
            props.entity_prop = '';
          });
          item.relation_map.begin_class_prop = '';
          item.relation_map.equation_begin = '';
          item.relation_map.relation_begin_pro = '';
          item.relation_map.equation = '';
          item.relation_map.relation_end_pro = '';
          item.relation_map.equation_end = '';
          item.relation_map.end_class_prop = '';
        }
      });

      let notRelationDataFile = true; // 默认没有和数据文件关联

      newGraphKMap.edge.forEach(item => {
        // 先匹配到store中graphKMap具体哪个关系类
        if (_.isEqual(item.relations, relationClassData._sourceData.relations)) {
          allX6Edges.forEach((x6Edge: any) => {
            const { source, target, id } = x6Edge.toJSON();
            // 说明关系类存在属性
            if (item.property_map.length > 0) {
              const [className, classPropName] = source.port.split(stringSeparator1);
              const [file, filePropName] = target.port.split(
                target.port.includes(stringSeparator2) ? stringSeparator2 : stringSeparator1
              );
              item.property_map.forEach(propItem => {
                if (className === relationClassData._sourceData.name) {
                  if (propItem.edge_prop === classPropName) {
                    propItem.entity_prop = filePropName;
                    notRelationDataFile = false; // 说明实体与数据文件属性关联了
                  }
                }
              });
            }
            // 说明没有数据文件
            if (currentDataFile.length === 0) {
              const [startEntityClassName, startEntityPropName] = source.port.split(stringSeparator1);
              const [endEntityClassName, endEntityPropName] = target.port.split(stringSeparator1);
              item.relation_map.begin_class_prop = startEntityPropName;
              item.relation_map.equation = x6EdgeLabelData.current[id!] ?? '等于';
              item.relation_map.end_class_prop = endEntityPropName;
            }
            // 说明有数据文件
            if (currentDataFile.length > 0) {
              const [entityNodeId, entityPropName] = source.port.split(stringSeparator1);
              const [file, filePropName] = target.port.split(stringSeparator1);
              if (startNodeData._sourceData.name === endNodeData._sourceData.name) {
                if (source.cell === startNodeData._sourceData.name) {
                  // 说明是起点
                  item.relation_map.begin_class_prop = entityPropName;
                  item.relation_map.relation_begin_pro = filePropName;
                  item.relation_map.equation_begin = x6EdgeLabelData.current[id!] ?? '等于';
                  notRelationDataFile = false; // 说明实体与数据文件属性关联了
                }
                if (source.cell === `${endNodeData._sourceData.name}-${endNodeData._sourceData.entity_id}`) {
                  // 说明是终点
                  item.relation_map.end_class_prop = entityPropName;
                  item.relation_map.relation_end_pro = filePropName;
                  item.relation_map.equation_end = x6EdgeLabelData.current[id!] ?? '等于';
                  notRelationDataFile = false; // 说明实体与数据文件属性关联了
                }
              } else {
                // 边的source是起点实体类
                if (source.cell === startNodeData._sourceData.name) {
                  item.relation_map.begin_class_prop = entityPropName;
                  item.relation_map.relation_begin_pro = filePropName;
                  item.relation_map.equation_begin = x6EdgeLabelData.current[id!] ?? '等于';
                  notRelationDataFile = false; // 说明实体与数据文件属性关联了
                }
                // 边的source是终点实体类
                if (source.cell === endNodeData._sourceData.name) {
                  item.relation_map.end_class_prop = entityPropName;
                  item.relation_map.relation_end_pro = filePropName;
                  item.relation_map.equation_end = x6EdgeLabelData.current[id!] ?? '等于';
                  notRelationDataFile = false; // 说明实体与数据文件属性关联了
                }
              }
            }
          });
        }
      });

      // // 说明当前X6视图中添加了数据文件
      if (currentDataFile.length > 0) {
        newGraphKMap.files = [...newGraphKMap.files, ...currentDataFile];
      }
      setKnowledgeMapStore(preStore => ({
        ...preStore,
        graphKMap: newGraphKMap
      }));
    }
  };

  /**
   * 缓存当前选中的G6实体类  关系类  模型对应的X6数据
   */
  const cacheX6JSONData = (graph: IGraph) => {
    const { selectedG6Node, selectedG6Edge, selectedModel } = getLatestStore();
    let key = '';
    if (selectedG6Node.length > 0) {
      key = selectedG6Node[0]._sourceData.name;
    }
    if (selectedG6Edge.length > 0) {
      key = selectedG6Edge[0].edgeData._sourceData.name;
    }
    if (selectedModel.length > 0) {
      key = selectedModel[0];
    }
    setKnowledgeMapStore(preStore => ({
      ...preStore,
      cacheGraphX6Data: {
        ...preStore.cacheGraphX6Data,
        [key]: graph.toJSON().cells
      }
    }));
  };

  /**
   * 渲染提示
   */
  const renderTips = () => {
    const { firstAddFile } = getLatestStore();
    let className = '';
    if (selectedG6Node.length > 0) {
      className = selectedG6Node[0]._sourceData.name;
    }
    if (selectedG6Edge.length > 0) {
      const { edgeData } = selectedG6Edge[0];
      className = String(edgeData._sourceData.edge_id);
    }
    const errorData = flow4ErrorList.filter(item => item.name === className);
    // 第一次添加不报错
    if (!firstAddFile) {
      if (errorData.length > 0) {
        return renderErrorTips(errorData);
      }
    }
    return renderHelpTips();
  };

  const renderErrorTips = (errorData: Flow4ErrorType[]) => {
    // 对错误数据进行去除处理
    const targetErrorData = _.uniqBy(errorData, 'error');
    return (
      <div className={`${prefixCls}-tips`}>
        {targetErrorData.map((item, index) => (
          <span className="kw-align-center kw-mb-1" key={index}>
            <IconFont type="icon-shibai" className="kw-c-error" />
            <span className="kw-ml-2" style={{ fontSize: 12 }}>
              {item.error}
            </span>
          </span>
        ))}
      </div>
    );
  };

  const renderHelpTips = () => {
    return (
      <div className={`${prefixCls}-tips`}>
        {helpTips.map(item => (
          <span className="kw-align-center kw-mb-1" key={item} style={{ display: 'flex', alignItems: 'flex-start' }}>
            <InfoCircleFilled className="kw-c-primary" style={{ marginTop: 3 }} />
            <span className="kw-ml-2" style={{ fontSize: 12 }}>
              {item}
            </span>
          </span>
        ))}
      </div>
    );
  };

  /**
   * 是否可以拉出一条边
   */
  const onValidateMagnet = (magnet: Element): boolean => {
    const { selectedG6Edge, currentDataFile } = getLatestStore();
    // 终点连接桩不允许拉出线
    if (magnet.getAttribute('port-group')?.includes('end-point')) {
      return false;
    }
    if (selectedG6Edge.length > 0) {
      // 说明当前选中的是关系类
      const { edgeData } = selectedG6Edge[0];
      const { _sourceData } = edgeData;
      if (_sourceData.attributes.length > 0) {
        // 关系类有属性
        if (currentDataFile.length === 0) {
          return false;
        }
      }
      if (_sourceData.attributes.length === 0) {
        // 关系类无属性
      }
    }
    return true;
  };

  /**
   * 创建的边是否生效
   * @param edge 新创建边的实例
   */
  const onValidateEdge = (edge: Edge<Edge.Properties>): boolean => {
    const { selectedG6Edge, currentDataFile } = getLatestStore();
    if (selectedG6Edge.length > 0) {
      const { edgeData, startNodeData, endNodeData } = selectedG6Edge[0];
      const sourceCellId = edge.getSourceCellId();
      const targetCellId = edge.getTargetCellId();
      const relName = edgeData._sourceData.name; // 关系类名
      const startEntity = startNodeData._sourceData.name; // 起点实体类名
      const endEntity = endNodeData._sourceData.name; // 终点实体类名
      // 关系类不能和起点、终点进行连线
      if (sourceCellId === relName && (targetCellId === startEntity || targetCellId === endEntity)) {
        return false;
      }
      if (targetCellId === relName && (sourceCellId === startEntity || sourceCellId === endEntity)) {
        return false;
      }
      if (currentDataFile.length > 0) {
        // 添加数据文件之后，起点和终点不能再连线
        if (targetCellId === startEntity || targetCellId === endEntity) {
          return false;
        }
      }
    }
    return true;
  };

  /**
   * 边创建完成事件
   */
  const onEdgeConnected = (graph: IGraph, edge: Edge<Edge.Properties>) => {
    setKnowledgeMapStore(preStore => ({
      ...preStore,
      firstAddFile: false
    }));
    const { selectedG6Edge, currentDataFile } = getLatestStore();
    if (selectedG6Edge.length > 0) {
      const { edgeData, startNodeData, endNodeData } = selectedG6Edge[0];
      const targetCellId = edge.getTargetCellId();
      const sourceCellId = edge.getSourceCellId();
      const startEntity = startNodeData._sourceData.name; // 起点实体类名
      let endEntity = endNodeData._sourceData.name; // 终点实体类名
      if (startEntity === endEntity) {
        // 起点和终点是同一个节点的情况
        endEntity = `${endEntity}${stringSeparator1}${endNodeData._sourceData.entity_id}`;
      }
      // --------------- 改变边的类型开始 -------------------
      let edgeShape = AdX6Edge;
      if (targetCellId === startEntity || targetCellId === endEntity) {
        edgeShape = AdX6MindMapEdge;
      }
      edge.setProp('shape', edgeShape, {
        silent: false
      });

      // 关系类 起点和终点 指向数据文件的边添加标识
      if ((currentDataFile.length > 0 && sourceCellId === startEntity) || sourceCellId === endEntity) {
        edge.setProp('targetToDataFileEdge', true, {
          silent: true
        });
      }
      const edgeDataConfig = edge.toJSON();
      graph.removeEdge(edge);
      graph.addEdge(edgeDataConfig);
      // --------------- 改变边的类型结束 -------------------
      if (sourceCellId === startEntity || sourceCellId === endEntity) {
        // 始终保持一对一的关系，所以新边创建完成之后，需要把之前连接桩上面已经存在的边移除
        const newEdgeSourcePortId = edge.getSourcePortId();
        const oldEdges = graph.getEdges().filter((item: any) => item.id !== edge.id);
        oldEdges?.forEach((oldEdge: any) => {
          const oldEdgeSourcePortId = oldEdge.getSourcePortId();
          // 保证边全部是来自于同一个节点
          if (newEdgeSourcePortId === oldEdgeSourcePortId && oldEdge.getSourceCellId() === edge.getSourceCellId()) {
            graph.removeEdge(oldEdge);
          }
        });
        updateStoreGraphKMap(graph);
        return;
      }
    }
    // 始终保持一对一的关系，所以新边创建完成之后，需要把之前连接桩上面已经存在的边移除
    const newEdgeSourcePortId = edge.getSourcePortId();
    const newEdgeTargetPortId = edge.getTargetPortId();
    const oldEdges = graph.getEdges().filter((item: any) => item.id !== edge.id);
    oldEdges?.forEach((oldEdge: any) => {
      if (newEdgeSourcePortId === oldEdge.getSourcePortId() || newEdgeTargetPortId === oldEdge.getTargetPortId()) {
        graph.removeEdge(oldEdge);
      }
    });
    updateStoreGraphKMap(graph);
  };

  const prefixCls = 'knowledge-map-x6';
  return (
    <div className={`${prefixCls} kw-w-100 kw-h-100`}>
      <LoadingMask loading={loading} />
      {!viewMode && renderTips()}
      <AdReactX6
        ref={x6Ref}
        onEdgeConnected={onEdgeConnected}
        onEdgeDeleteBtnClick={graph => {
          updateStoreGraphKMap(graph);
        }}
        data={graphX6Data}
        type="erGraph"
        onEdgeLabelSelectChange={(value, edge, graph) => {
          const edgeData = edge!.toJSON();
          x6EdgeLabelData.current[edgeData.id!] = value;
          updateStoreGraphKMap(graph!);
        }}
        onNodeMouseUp={graph => cacheX6JSONData(graph)}
        onValidateMagnet={onValidateMagnet}
        onValidateEdge={onValidateEdge}
        onBlankClick={onX6BlankClick}
        readOnly={viewMode}
      />
    </div>
  );
});

export default KnowledgeMapX6;
