/* eslint-disable max-lines */
import _ from 'lodash';
import { message } from 'antd';
import { DoubleRightOutlined, DoubleLeftOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import React, { useState, useEffect, useRef, useReducer } from 'react';
import servicesSubGraph from '@/services/subGraph';
import { getParam, triggerEvent } from '@/utils/handleFunction';
import servicesCreateEntity from '@/services/createEntity';
import serviceGraphDetail from '@/services/graphDetail';

import IconPreRender from '@/components/IconPreRender';

import Header, { OntoHeaderRef } from './Header';
import OntoFooter from './OntoFooter';
import FlowFooter, { FlowFooterRef } from './FlowFooter';
import OntoNodeInfo, { NodeInfoRef } from './NodeInfo';
import OntoEdgeInfo, { EdgeInfoRef } from './EdgeInfo';
import OntoTaskList from './TaskList';
import OntoHelpTips from './HelpTips';
import OntoSummaryInfo from './SummaryInfo';
import SaveToOnto, { SaveToOntoRef } from './SaveToOnto';
import OntoBrushSelectDialog from './BrushSelectDialog';
import OntoGroupOpModal from './GroupMenus/GroupOpModal';
import OntoCanvasG6, { OntoCanvasG6Ref } from './OntoCanvasG6';
import SaveOntologyModal, { SaveOntoModalRef } from './OntoFooter/SaveOntoModal';
import { validateItem, validateTheNode, validateTheEdge } from './assistantFunction';
import ONTOLOGY_GRAPH_CONFIG from './enums';

import GroupMenus, {
  ontoInitGraphGroup,
  ontoMergeBrushToGraph,
  ontoResetGroups,
  ontoAutoUpdateGroup
} from './GroupMenus';
import {
  initGraphByEdit,
  changeBrushClickData,
  mergeBrushSelect,
  generateGroupBody,
  handleMultipleSelectionData
} from '../OntoG6/assistant';
import {
  GraphData,
  BrushData,
  InitOntoData,
  NodeEdgePropertiesType,
  NodeApiDataType,
  EdgeApiDataType,
  OntoApiDataType
} from '../OntoG6/types/data';
import { GraphGroupItem } from '../OntoG6/types/items';
import { GraphPattern, OperationKey } from '../OntoG6/types/keys';
import { ItemAdd, ItemDelete, ItemUpdate, UpdateGraphData, ItemSelected } from '../OntoG6/types/update';

import './style.less';
import { DataFileType, GraphKMapType } from '@/pages/KnowledgeNetwork/KnowledgeGraph/Workflow/KnowledgeMap/types';
import { convertToRules } from '@/pages/KnowledgeNetwork/KnowledgeGraph/Workflow/KnowledgeMap/assistant';
import serviceWorkflow from '@/services/workflow';
import { DS_SOURCE } from '@/enums';
import { useLocation } from 'react-router-dom';

const OntoGraphG6 = (props: any) => {
  const {
    childRef,
    current,
    osId,
    dbType,
    graphId,
    ontoData,
    ontologyId,
    setOntoData,
    knData,
    ontoLibType,
    onExit,
    saveOntoData,
    next,
    prev,
    onSave,
    showQuitTip,
    setOtlId,
    defaultParsingRule,
    setDefaultParsingRule,
    sourceFileType,
    setSourceFileType,
    parsingTreeChange,
    setParsingTreeChange
  } = props;
  const nodeInfoRef = useRef<NodeInfoRef>(null); // 点详情ref
  const edgeInfoRef = useRef<EdgeInfoRef>(null); // 边详情ref
  const canvasRef = useRef<OntoCanvasG6Ref>(null); // 画布ref
  const saveOntoRef = useRef<SaveOntoModalRef>(null); // 保存本体ref（非新建本体）
  const saveToRef = useRef<SaveToOntoRef>(null); // 保存本体ref(流程3保存至本体库)
  const ontoHeaderRef = useRef<OntoHeaderRef>(null); // header的ref
  const [initOntoData, setInitOntoData] = useState<InitOntoData>({} as InitOntoData);
  const [graphPattern, setGraphPattern] = useState<GraphPattern>('default'); // 图的模式
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] }); // 图数据(为避免频繁更新,不包含坐标信息)
  const [groupList, setGroupList] = useState<GraphGroupItem[]>([]); // 分组列表
  const [itemsAdd, setItemsAdd] = useState<ItemAdd>({} as ItemAdd); // 需要添加的数据
  const [itemsDelete, setItemsDeleteIds] = useState<ItemDelete>({} as ItemDelete); // 删除节点和边
  const [itemsUpdate, setItemsUpdate] = useState<ItemUpdate>({} as ItemUpdate); // 要更新的节点和边
  const [itemSelected, setItemSelected] = useState<ItemSelected>(); // 选中的数据
  const [operationKey, setOperationKey] = useState<OperationKey>(''); // 右侧面板key
  const [groupOperation, setGroupOperation] = useState({ visible: false, type: '', group: {} }); // 分组操作弹窗
  const [brushSelectData, setBrushSelectData] = useState<BrushData>({ nodes: [], edges: [] }); // 框选的图数据
  const [isLockGroupListener, setIsLockGroupListener] = useState(false); // 顶部功能时关闭`键盘开启分组`监听
  const [resetFlag, resetCanvas] = useReducer(flag => flag + 1, 0); // 重置画布标志
  const [taskPollingFlag, triggerTaskPolling] = useReducer(flag => flag + 1, 0); // 触发查询任务的标志
  const [showSaveOntologyModal, setShowSaveOntologyModal] = useState(false); // 是否显示保存本体modal
  const [draftOntoId, setDraftOntoId] = useState(0); // 新建状态的本体id
  const [firstShowSave, setFirstShowSave] = useState(true); // 首次显示保存至本体库
  const [showRightMenu, setShowRightMenu] = useState(true); // 右侧面板是否显示
  const [copyBehaviorShowNode, setCopyBehaviorShowNode] = useState(false); // 触发了Node外圈复制
  const [parsingFileSet, setParsingFileSet] = useState<any>([]); // 流程三文件对应的解析规则
  const [arFileSave, setArFileSave] = useState<any>({}); // 类型为AnyRobot时，实时保存文件的信息
  const savecallback = useRef(null);

  //   ------- 流程三变更流程四数据逻辑开始-----------
  const selectedDataFile = useRef<DataFileType[]>([]); // 导入实体类选中的数据文件
  const addGraphKMap = useRef<GraphKMapType>(); //  导入实体类对应的映射数据
  const cacheOldOntologyData = useRef<any>(); // 缓存变动之前的本体数据
  const cacheAddGraphEntityDataByTask = useRef<any>([]); // 缓存每次任务预测生成的图谱数据源
  //   ------- 流程三变更流程四数据逻辑结束-----------

  const [backColor, setBackColor] = useState(
    ontoLibType === '' ? 'white' : ontoData.canvas?.background_color || ONTOLOGY_GRAPH_CONFIG.DEFAULT.color
  );
  const [backImage, setBackImage] = useState(
    ontoLibType === '' ? 'point' : ontoData.canvas?.background_image || ONTOLOGY_GRAPH_CONFIG.DEFAULT.image
  );
  const hasTipVectorError = useRef<boolean>(false); // 记录是否已经提示向量错误
  const location = useLocation<any>();
  const viewMode = location.state?.mode === 'view'; // 是否处于查看模式
  const flowFooterRef = useRef<FlowFooterRef | null>(null);
  const [firstBuild, setFirstBuild] = useState<boolean>(true);
  // 退出保存时调用
  if (_.has(childRef, 'current')) {
    childRef.current = {
      getFlowData: () => {
        const { ontology_id, used_task = [], ontology_name, ontology_des } = initOntoData;
        const curGraphData = getNewCanvasGraphData();
        const groupBody = generateGroupBody(groupList, { nodes: curGraphData.entity, edges: curGraphData.edges }, true);
        const ontoBody = {
          entity: curGraphData.entity,
          edge: curGraphData.edges,
          used_task: _.map(used_task, Number),
          id: ontologyId || ontology_id,
          ontology_id: String(ontologyId || ontology_id),
          ontology_name,
          ontology_des
        };

        return { ontoBody, groupBody };
      },
      updateFlow4GraphKMap: (latestOntologyData: any) => updateFlow4GraphKMap(latestOntologyData),
      flowFooterNext: flowFooterRef.current?.next,
      flowFooterSave: flowFooterRef.current?.save
    };
  }

  useEffect(() => {
    (savecallback as any).current = onSaveDraft;
  });

  useEffect(() => {
    let interval: any;
    if (ontoLibType !== '') {
      initData();
      // 非流程3页面定时任务
      interval = setInterval(() => {
        (savecallback as any).current();
      }, 20 * 60 * 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
      setOntoData();
    };
  }, []);

  useEffect(() => {
    if (graphId !== '') {
      let newOntoData = ontoData;
      if (Array.isArray(ontoData)) {
        newOntoData = { entity: [], edge: [] };
      }
      cacheOldOntologyData.current = _.cloneDeep(newOntoData);
      initData();
      getGraphBasicData();
    }
  }, [graphId]);
  // 如果在其他流程缩放窗口, 会因为display: none导致当前画布宽高为0
  // 所以重新进入流程三时触发resize事件恢复宽高
  useEffect(() => {
    if (current !== 2) return;
    triggerEvent('resize');
  }, [current]);

  useEffect(() => {
    ontoLibType === '' && current === 2 && !viewMode && window.addEventListener('keydown', createGroupListener);
    return () => window.removeEventListener('keydown', createGroupListener);
  }, [current, graphPattern, itemSelected, operationKey, isLockGroupListener, brushSelectData]);

  useEffect(() => {
    const { pathname } = location;
    if (current === 2 && pathname !== '/knowledge/studio-concept-ontolib') {
      const { entity } = ontoData;
      if (!entity) return;
      const entityHasVector = entity.find((item: any) => item?.vector_generation?.length > 0);
      // 图谱实体中有已经配置向量的话，则去检测向量服务状态
      if (entityHasVector) {
        checkVectorServiceStatus();
      }
    }
  }, [current]);

  /**
   * 编辑状态初始化本体信息
   */
  const initData = async () => {
    let graph;
    if (ontoData && ontoLibType !== 'import') {
      // tempData = res.otl_temp;
      // 编辑优先采用草稿，如果没有草稿则编辑正式版本
      const { used_task, entity, edge, id, ontology_name, ontology_des, otl_temp } = ontoData;
      if (ontoLibType === 'edit' || ontoLibType === 'create' || ontoLibType === 'copy') {
        graph = initGraphByEdit({
          entity: otl_temp.length ? otl_temp[0].entity : entity,
          edge: otl_temp.length ? otl_temp[0].edge : edge
        });
      } else {
        graph = initGraphByEdit({ entity, edge });
      }
      setGraphData(graph);
      if (ontoLibType !== '') setOtlId(id);
      setInitOntoData({ ontology_id: id, used_task: _.map(used_task, Number), ontology_name, ontology_des });
    } else if (ontoLibType === 'import') {
      const { used_task, entity, edge, ontology_des, domain } = ontoData;
      const summaryData: OntoApiDataType = {
        ontology_name: saveOntoData.ontologyName,
        ontology_des,
        domain,
        knw_id: knData.id,
        entity,
        edge,
        temp_save: true,
        used_task: _.map(used_task, Number),
        canvas: { background_color: backColor, background_image: backImage }
      };
      const response = await servicesCreateEntity.addEntity(summaryData);
      if (response.res?.ontology_id) {
        setOtlId(response.res?.ontology_id);
        setDraftOntoId(response.res?.ontology_id);
        graph = initGraphByEdit({ entity, edge });
        setGraphData(graph);
        setInitOntoData({
          ontology_id: response.res?.ontology_id,
          used_task: _.map(used_task, Number),
          ontology_name: saveOntoData.ontologyName,
          ontology_des
        });
      } else if (response.Description) {
        // message.error(response.ErrorDetails);
        message.error({
          content: response.ErrorDetails,
          className: 'custom-class',
          style: {
            marginTop: '6vh'
          }
        });
        onExit();
      }
    }
    if (graph && ontoLibType === '') queryGroups(graph, undefined, true);
  };

  // 处理数据
  const getNewCanvasGraphData = () => {
    const dataBefore = getCanvasGraphData();
    const nodes = dataBefore.nodes;
    const edges = dataBefore.edges;
    let entity: any[] = [];
    _.map(nodes, node => {
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
    return { entity, edges: edgeFinal };
  };

  /**
   * 获取实时的图数据, 包含坐标信息, 仅保存时调用, 其他场景使用state中的graphData即可
   * 不能取图谱中的_sourcesData, 这个字段有可能是旧的
   */
  const getCanvasGraphData = () => {
    if (!canvasRef.current?.graph) return graphData;
    const coordinateObj = _.reduce(
      canvasRef.current.graph.getNodes(),
      (res, item) => {
        const { id, x, y } = item.getModel();
        res[id!] = { x, y };
        return res;
      },
      {} as Record<string, any>
    );
    const nodesXY = _.map(graphData.nodes, n => {
      if (!coordinateObj[n.uid]) return n;
      return { ...n, ...coordinateObj[n.uid] };
    });
    return { ...graphData, nodes: nodesXY };
  };

  /**
   * 监听 shift + N 创建分组
   * 创建、编辑点或边, 使用顶部功能, 无法触发
   */
  const createGroupListener = (e: KeyboardEvent) => {
    const { shiftKey, key, keyCode } = e;
    if (!(shiftKey && (keyCode === 78 || key?.toLowerCase() === 'n'))) return;
    if (graphPattern === 'addEdge' || isLockGroupListener) return;
    if (ontoLibType !== '') {
      showQuitTip.current = true;
    }
    openBrushMode();
  };

  const onChangePattern = (pattern: GraphPattern) => {
    if (ontoLibType !== '' && pattern === 'addEdge') {
      showQuitTip.current = true;
    }
    setGraphPattern(pattern);
  };

  /**
   * 选中的数据 为空表示取消选中
   * @param data 点或边
   */
  const onChangeSelectedItem = async (data: ItemSelected) => {
    setItemSelected(data);
    if (data) {
      setBrushSelectData({ nodes: [], edges: [], notRedraw: true });
      setOperationKey('');
    }
  };

  // 更新数据
  const onUpdateGraphData = (data: UpdateGraphData) => {
    const newGraphData = { ...graphData };

    if (data.operation === 'add') {
      const { type, items } = data?.updateData;
      if (type === 'node') newGraphData.nodes.unshift(...items);
      if (type === 'edge') newGraphData.edges.unshift(...items);
    }
    if (data.operation === 'delete') {
      const { type, items } = data?.updateData;
      if (type === 'node' || type === 'all') {
        newGraphData.nodes = _.filter(newGraphData.nodes, item => !_.includes(items, item?.uid));

        // 联动删除边
        newGraphData.edges = _.filter(newGraphData.edges, item => {
          if (_.includes(items, item?.startId) || _.includes(items, item?.endId)) {
            return false;
          }
          return true;
        });
      }
      if (type === 'edge' || type === 'all') {
        newGraphData.edges = _.filter(newGraphData.edges, item => !_.includes(items, item?.uid));
      }
      deleteUnUsedTask(newGraphData);
    }
    if (data.operation === 'update') {
      const { type, items } = data?.updateData || {};
      const itemsKV = _.keyBy(items, 'uid');
      if (type === 'node' || type === 'all') {
        newGraphData.nodes = _.map(newGraphData?.nodes, item => {
          const updateItem = itemsKV?.[item?.uid];
          if (updateItem) return updateItem;
          return item;
        });
        // 更新了实体类名，需要更新边的关系
        newGraphData.edges = _.map(newGraphData.edges, item => {
          _.map(items, upItem => {
            if (upItem.relations && item.uid === upItem.uid) {
              item.startId = upItem.source;
              item.endId = upItem.target;
              item.source = upItem.source;
              item.target = upItem.target;
              _.map(newGraphData.nodes, node => {
                // 更改的Node为Edge的起点;
                if (node.uid === item.source) {
                  item.relations[0] = node.name;
                }
                // 更改的Node为Edge的终点
                if (node.uid === item.target) {
                  item.relations[2] = node.name;
                }
              });
            }
          });
          return item;
        });
      }
      if (type === 'edge' || type === 'all') {
        newGraphData.edges = _.map(newGraphData?.edges, item => {
          const updateItem = itemsKV?.[item?.uid];
          if (updateItem) {
            updateItem.startId = updateItem.source;
            updateItem.endId = updateItem.target;
            _.map(newGraphData.nodes, node => {
              // 更改的Node为Edge的起点;
              if (node.uid === updateItem.source) {
                updateItem.relations[0] = node.name;
              }
              // 更改的Node为Edge的终点
              if (node.uid === updateItem.target) {
                updateItem.relations[2] = node.name;
              }
            });
            return updateItem;
          }
          return item;
        });
      }
    }
    const group = ontoAutoUpdateGroup(newGraphData, groupList);
    setGraphData(newGraphData);
    setGroupList(group);
  };

  /**
   * 删除未使用的任务
   * @param graph 图数据
   */
  const deleteUnUsedTask = async (graph: GraphData) => {
    const { used_task = [] } = initOntoData;
    if (!used_task.length) return;
    const curUsedTaskId = _.uniq(
      _.reduce(
        [...graph.nodes, ...graph.edges],
        (res, { task_id }) => (task_id ? [...res, Number(task_id)] : res),
        [] as number[]
      )
    );
    const unUsed = _.filter(used_task, id => !curUsedTaskId.includes(id));
    if (!unUsed.length) return;
    setInitOntoData({ ...initOntoData, used_task: curUsedTaskId });
    servicesCreateEntity.deleteEntityTask({ task_list: unUsed });
  };

  /** Header的操作 */
  const headerAddData = async (data: GraphData, from?: 'sql' | 'entity' | 'model' | string) => {
    if (ontoLibType !== '') {
      showQuitTip.current = true;
    }
    // if (from === 'entity') {
    //   setGraphData(data);
    //   return;
    // }
    const { nodes, edges } = data;
    if (nodes.length) {
      await Promise.resolve().then(() => {
        setItemsAdd({ type: 'node', items: nodes });
      });
    }

    if (edges.length) {
      await Promise.resolve().then(() => {
        setItemsAdd({ type: 'edge', items: edges });
      });
    }

    if (itemSelected || !nodes[0]?.name) return;
    // if (from === 'model') {
    const highlight = _.map([...nodes, ...edges], d => d.uid);
    setBrushSelectData({ nodes, edges, highlight });
    // }
  };

  // 批量添加边类
  const onAddEdgesBatch = (data: any[]) => {
    if (ontoLibType !== '') {
      showQuitTip.current = true;
    }
    setItemsAdd({ type: 'edge', items: data, from: 'edge' });
    setTimeout(() => {
      ontoHeaderRef.current?.position();
      canvasRef.current!.isCopyBehaviorNew.current = true;
    }, 100);
  };

  /** 详情的操作 */
  const detailDeleteData = (data: ItemDelete, deleteDataMes?: any) => {
    if (ontoLibType !== '') {
      showQuitTip.current = true;
    }
    setItemsDeleteIds(data);
    onHandleParsing(deleteDataMes);
  };

  /**
   * 实体删除后删除对应的解析规则
   */
  const onHandleParsing = (data: any) => {
    const gnsAll: any = [];
    const cloneData = _.cloneDeep(data);
    const cloneParsingData = _.cloneDeep(parsingFileSet);
    _.map(cloneData?.source_table, (item: any) => {
      gnsAll.push(item?.[0]);
    });
    const newParsing = _.filter(cloneParsingData, (item: any) => {
      return gnsAll?.[0] !== item?.key;
    });
    setParsingFileSet(newParsing);
  };

  // 更新
  const detailUpdateData = (data: ItemUpdate) => {
    setItemsUpdate(data);
  };

  /**
   * 右侧菜单栏展示或者隐藏
   * @param key 侧边栏key
   */
  const onChangeOperationKey = (key: OperationKey) => {
    if (key === 'saveToOnto') {
      const { nodes, edges } = graphData;
      if (nodes.length === 0) {
        message.error({
          content: intl.get('ontoLib.errInfo.entityEmptyTip'),
          className: 'custom-class',
          style: {
            marginTop: '6vh'
          }
        });
        return;
      }
      validateAllItems();
      const { nodesError, edgesError } = validateItem(graphData);
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
        return;
      }
    } else if (key === 'taskList' || key === 'summaryInfo') {
      setShowRightMenu(true);
    }
    setOperationKey(key);

    // 打开侧边栏时 关闭点编辑页面
    if (key && itemSelected) {
      onChangeSelectedItem(undefined);
      resetCanvas();
    }
  };

  /** 汇总信息操作 */
  const onSummaryDelete = (data: ItemDelete) => {
    setItemsDeleteIds(data);
  };

  /** 任务列表的操作 */
  const taskListAddData = async (data: GraphData[]) => {
    if (ontoLibType !== '') {
      showQuitTip.current = true;
    }
    const nodes: any[] = [];
    const edges: any[] = [];
    _.forEach(data, item => {
      nodes.unshift(...item.nodes);
      edges.unshift(...item.edges);
    });
    if (nodes.length) {
      await Promise.resolve().then(() => {
        setItemsAdd({ type: 'node', items: nodes, from: 'task' });
      });
    }
    if (edges.length) {
      await Promise.resolve().then(() => {
        setItemsAdd({ type: 'edge', items: edges, from: 'task' });
      });
    }
    setTimeout(() => {
      ontoHeaderRef.current?.position();
      canvasRef.current!.isCopyBehaviorNew.current = true;
    }, 100);
  };

  /**
   * 删除点或者边
   * @param data 点和边的id
   */
  const taskListDeleteData = (data: { nodes: string[]; edges: string[] }) => {
    if (ontoLibType !== '') {
      showQuitTip.current = true;
    }
    const { nodes, edges } = data;
    Promise.resolve().then(() => {
      setItemsDeleteIds({ type: 'node', items: nodes });
    });
    Promise.resolve().then(() => {
      setItemsDeleteIds({ type: 'edge', items: edges });
    });
  };

  /**
   * 选中任务
   * @param data
   */
  const onTaskSelect = (data: any) => {
    const nodes = _.filter(graphData.nodes, d => d.task_id === data.task_id);
    const edges = _.filter(graphData.edges, d => d.task_id === data.task_id);

    if (nodes.length === 1) {
      onChangeSelectedItem(nodes[0]);
      return;
    }
    const highlight = _.map([...nodes, ...edges], d => d.uid);
    setBrushSelectData({ nodes, edges, highlight });
  };

  /**
   * 触发右侧编辑面板的校验
   * TODO 暂时使用旧代码的ref控制
   * @return 数据是否有错误
   */
  const validateSelectItem = async (): Promise<boolean> => {
    if (!itemSelected) return false;
    const ref = nodeInfoRef.current || edgeInfoRef.current;
    if (!ref) return false;
    if (ref.checkData?.isErr || ref.checkData?.notIndex) {
      // message.error(intl.get('createEntity.de'));
      message.error({
        content: intl.get('createEntity.de'),
        className: 'custom-class',
        style: {
          marginTop: '6vh'
        }
      });
      return true;
    }

    if (!ref.formNameRef) return false;

    let isErr = false;
    const resError = await ref.verifyParameter();
    validateAllItems();
    if (resError?.length) {
      isErr = true;
    }
    // isErr && message.error(intl.get('createEntity.de'));
    return isErr;
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
   * 校验出错回调
   */
  const onCheckErr = () => {
    if (itemSelected) return;
    setOperationKey('summaryInfo');
  };

  /**
   * 查询获取所有分组信息
   * @param graph 图数据
   * @param oldGroups 旧分组数据
   * @param isInit 是否是初始化
   */
  const queryGroups = async (graph?: GraphData, oldGroups?: GraphGroupItem[], isInit?: boolean) => {
    const { res, Description } =
      (await servicesSubGraph.subgraphGetList({ graph_id: graphId, subgraph_name: '', return_all: 'True' })) || {};
    if (!res) {
      // return Description && message.error(Description);
      return (
        Description &&
        message.error({
          content: Description,
          className: 'custom-class',
          style: {
            marginTop: '6vh'
          }
        })
      );
    }
    let groups = ontoResetGroups(res, oldGroups || groupList);
    if (graph) {
      let curGraph = graph;
      if (isInit) {
        curGraph = ontoInitGraphGroup(graph, groups);
        setGraphData(curGraph);
      }
      groups = ontoAutoUpdateGroup(curGraph, groups);
    }
    setGroupList(groups);
  };

  // 打开\关闭  创建分组弹窗
  const openCreateGroupModal = () => setGroupOperation({ visible: true, type: 'create', group: {} });
  const closeCreateGroupModal = () => setGroupOperation({ visible: false, type: '', group: {} });

  /**
   * 创建分组
   * @param name 分组名称
   * @param graph 分组数据
   * @param setErr 设置错误的回调
   */
  const createGroup = async (name: string, setErr?: Function) => {
    if (ontoLibType !== '') {
      showQuitTip.current = true;
    }
    const params = {
      graph_id: graphId,
      ontology_id: ontologyId || initOntoData.ontology_id || ontoData[0].id,
      name,
      entity: [],
      edge: []
    };
    try {
      const { res, ErrorCode, Description } = (await servicesSubGraph.subgraphAdd(params)) || {};
      if (res) {
        // message.success(intl.get('createEntity.createGroupTip'));
        const newGraph = ontoMergeBrushToGraph(
          { ...brushSelectData, targetGroup: { id: res.subgraph_id } as GraphGroupItem },
          graphData
        );
        setGraphData(newGraph);
        closeCreateGroupModal();
        onBrushExist();
        queryGroups(newGraph, [
          ...groupList,
          { id: res.subgraph_id, entity: brushSelectData.nodes, edge: brushSelectData.edges } as GraphGroupItem
        ]);
        return;
      }
      if (ErrorCode === 'Builder.SubgraphService.CreateSubgraphConfig.DuplicateName') {
        setErr?.({ name: 'name', errors: [intl.get('createEntity.groupExistErr')] });
        return;
      }
      // Description && message.error(Description);
      Description &&
        message.error({
          content: Description,
          className: 'custom-class',
          style: {
            marginTop: '6vh'
          }
        });
    } catch (err) {
      // none
    }
  };

  /**
   * 新建/重命名 点击确认的回调
   * @param type 新建 | 重命名
   * @param group 编辑后的数据
   * @param setErr 设置错误的回调
   */
  const onAfterOp = async (type: string, group: Record<string, any>, setErr?: Function) => {
    if (ontoLibType !== '') {
      showQuitTip.current = true;
    }
    if (type === 'create') {
      createGroup(group.name, setErr);
    }

    if (type === 'edit') {
      try {
        const groupBody = [{ subgraph_id: group.id, name: group.name }];
        const { res, error } = (await servicesSubGraph.subgraphEdit(graphId, groupBody)) || {};
        if (res) {
          // 前端先更新, 再调接口静默更新
          const newGroupList = _.map(groupList, g => {
            g.id === group.id && (g.name = group.name);
            return g;
          });
          setGroupList(newGroupList);
          // message.success(intl.get('createEntity.updateGroupTip'));
          closeCreateGroupModal();
          queryGroups(graphData, newGroupList);
          return;
        }
        if (error?.[0]) {
          const { Description, ErrorCode } = error[0];
          if (ErrorCode === 'Builder.SubgraphService.EditSubgraphConfig.DuplicateName') {
            setErr?.({ name: 'name', errors: [intl.get('createEntity.groupExistErr')] });
            return;
          }
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
      } catch {
        // none
      }
    }
  };

  /**
   * 框选分组操作, 若是鼠标多选，直接覆盖，若是点击可取消
   * @param graph 框选的图数据
   * @param action 框选 | 点击 | 多选
   */
  const onBrushSelect = (changedGraph: BrushData, action: 'brush' | 'click' | 'multiClick') => {
    const { targetGroup } = brushSelectData;
    if (action === 'click' || action === 'multiClick') {
      const { nodes, edges } = changeBrushClickData(brushSelectData, changedGraph);
      const highlight = action === 'multiClick' ? _.map([...nodes, ...edges], d => d.uid) : undefined;
      setBrushSelectData({ targetGroup, nodes, edges, highlight });
      return;
    }
    const select = mergeBrushSelect(brushSelectData, changedGraph, graphData);
    const highlight = graphPattern === 'default' ? _.map([...select.nodes, ...select.edges], d => d.uid) : undefined;
    setBrushSelectData({ targetGroup, ...select, highlight, notRedraw: changedGraph.notRedraw });
  };

  /**
   * 编辑分组, 为已有分组添加数据
   * @param group 指定的分组
   */
  const onGroupEdit = async (group: GraphGroupItem) => {
    if (!['brushSelect', 'default'].includes(graphPattern)) {
      return;
    }
    if (ontoLibType !== '') {
      showQuitTip.current = true;
    }
    if (itemSelected) {
      const isErr = await validateSelectItem();
      // if (isErr) return; Bug-422842 即使有错误信息也能切换面板
      setItemSelected(undefined);
      resetCanvas();
    }
    setGraphPattern('brushSelect');

    // 自动补全 边的两个端点
    const autoAddBrushData = handleMultipleSelectionData(brushSelectData, canvasRef);
    const autoBrushData = changeBrushClickData(brushSelectData, autoAddBrushData);
    // const autoHighlight = _.map([...autoBrushData.nodes, ...autoBrushData.edges], d => d.uid);
    // setBrushSelectData({
    //   targetGroup: group,
    //   nodes: autoBrushData.nodes,
    //   edges: autoBrushData.edges,
    //   highlight: autoHighlight
    // });

    // 如果是自由框选, 则自动带入已框选的;
    // const mergeNodes = brushSelectData.targetGroup ? [] : brushSelectData.nodes;
    // const mergeEdges = brushSelectData.targetGroup ? [] : brushSelectData.edges;
    const mergeNodes = brushSelectData.targetGroup ? [] : autoBrushData.nodes;
    const mergeEdges = brushSelectData.targetGroup ? [] : autoBrushData.edges;
    const nodes = _.uniqBy([...mergeNodes, ...group.entity], d => d.uid);
    const edges = _.uniqBy([...mergeEdges, ...group.edge], d => d.uid);
    const highlight = _.map([...nodes, ...edges], d => d.uid);
    setBrushSelectData({ targetGroup: group, nodes, edges, highlight });
  };

  /**
   * 分组菜单选择回调
   * @param group 选中的分组
   */
  const onGroupSelect = async (group: GraphGroupItem) => {
    if (!['brushSelect', 'default'].includes(graphPattern)) return;
    if (itemSelected) {
      const isErr = await validateSelectItem();
      // if (isErr) return; Bug-422842 即使有错误信息也能切换面板
      setItemSelected(undefined);
    }
    if (!(group.entity.length + group.edge.length)) {
      // message.success(intl.get('createEntity.groupEmptyErr'));
      message.success({
        content: intl.get('createEntity.groupEmptyErr'),
        className: 'custom-class',
        style: {
          marginTop: '6vh'
        }
      });
    }
    // 如果正在编辑, 选中时将该分组叠加到正在编辑的分组, 否则只高亮该分组
    const targetGroup = graphPattern === 'default' ? group : brushSelectData.targetGroup;
    const mergeNodes = graphPattern === 'default' ? [] : brushSelectData.nodes;
    const mergeEdges = graphPattern === 'default' ? [] : brushSelectData.edges;
    const nodes = _.uniqBy([...mergeNodes, ...group.entity], d => d.uid);
    const edges = _.uniqBy([...mergeEdges, ...group.edge], d => d.uid);
    const highlight = _.map([...nodes, ...edges], d => d.uid);
    setBrushSelectData({ targetGroup, nodes, edges, highlight });
  };

  /**
   * 清除已选分组
   */
  const onClearGroupSelect = () => {
    if (brushSelectData.targetGroup || brushSelectData.nodes.length || graphPattern === 'brushSelect') {
      onBrushExist();
    }
  };

  /**
   * 开启框选模式, 仅默认模式、无其他操作时, 可开启
   */
  const openBrushMode = async () => {
    if (graphPattern === 'default' && !operationKey) {
      if (itemSelected) {
        const isErr = await validateSelectItem();
        // if (isErr) return; Bug-422842 即使有错误信息也能切换面板
        setItemSelected(undefined);
        resetCanvas();
      }

      // 自动补全 边的两个端点
      const { targetGroup } = brushSelectData;
      const autoAddBrushData = handleMultipleSelectionData(brushSelectData, canvasRef);
      const { nodes, edges } = changeBrushClickData(brushSelectData, autoAddBrushData);
      const highlight = _.map([...nodes, ...edges], d => d.uid);
      setBrushSelectData({ targetGroup, nodes, edges, highlight });

      setGraphPattern('brushSelect');
    }
  };

  /**
   * 退出框选分组模式
   */
  const onBrushExist = () => {
    setGraphPattern('default');
    setBrushSelectData({ nodes: [], edges: [], notRedraw: true });
    resetCanvas();
  };

  /**
   * 框选模式下点击确认添加分组
   */
  const onBrushConfirmAdd = () => {
    const { targetGroup } = brushSelectData;

    // 未选择分组 | 选中未分组 | 分组已被删除
    if (!targetGroup?.id || targetGroup?.isUngrouped || !groupList.some(g => g.id === targetGroup?.id)) {
      openCreateGroupModal();
      return;
    }
    const newGraph = ontoMergeBrushToGraph(brushSelectData, graphData);
    const groups = ontoAutoUpdateGroup(newGraph, groupList);
    setGraphData(newGraph);
    setGroupList(groups);
    onBrushExist();
    // message.success(intl.get('createEntity.addGroupTip'));
  };

  /**
   * 点击画布空白区域
   */
  const onCanvasClick = () => {
    graphPattern === 'default' && setBrushSelectData({ nodes: [], edges: [], notRedraw: true });
  };

  const onSaveDraft = () => {
    saveOntology(true);
    if (ontoLibType !== '') {
      showQuitTip.current = false;
    }
  };

  const onSaveAndExit = () => {
    validateAllItems();
    const { nodesError, edgesError } = validateItem(graphData);
    if (nodesError.length || edgesError.length) {
      let err: any[] = [];
      _.map(nodesError, nodeErr => {
        err = [...err, nodeErr.name + ' ' + nodeErr.value + ' ' + nodeErr.error];
      });
      _.map(edgesError, edgeErr => {
        err = [...err, edgeErr.name + ' ' + edgeErr.value + ' ' + edgeErr.error];
      });
      // message.error(err.join('.'));
      setShowRightMenu(true);
      // message.error(intl.get('ontoLib.errInfo.confErr'));
      message.error({
        content: intl.get('ontoLib.errInfo.confErr'),
        className: 'custom-class',
        style: {
          marginTop: '6vh'
        }
      });
      onCheckErr();
      return;
    }
    if (ontoLibType !== '') {
      showQuitTip.current = false;
    }

    // if (ontoLibType === 'create') {
    saveOntology(false);
    // } else {
    // setShowSaveOntologyModal(true);
    // }
  };

  const modalOkSave = () => {
    saveOntology(false);
  };

  const flowToLib = async (type: string, otl_id: string) => {
    const summaryData = dealWithSoManyDataSaveTo(type);
    if (type === 'create') {
      const response = (await servicesCreateEntity.addEntity(summaryData)) || {};
      if (response.res) {
        // message.success(intl.get('datamanagement.savedSuccessfully'));
        message.success({
          content: intl.get('datamanagement.savedSuccessfully'),
          className: 'custom-class',
          style: {
            marginTop: '6vh'
          }
        });
        setFirstShowSave(false);
        setOperationKey('');
      } else if (response?.Description) {
        if (saveToRef.current) {
          saveToRef.current!.formDetailError.current = response.ErrorDetails;
        }
        saveToRef.current?.form.validateFields();
        // message.error(response.ErrorDetails);
      }
    } else {
      const response = await servicesCreateEntity.editEntity(otl_id, { ...summaryData, cover: true });
      if (response?.res) {
        // message.success(intl.get('datamanagement.savedSuccessfully'));
        message.success({
          content: intl.get('datamanagement.savedSuccessfully'),
          className: 'custom-class',
          style: {
            marginTop: '6vh'
          }
        });
        setOperationKey('');
      } else if (response?.Description) {
        // message.error(response.ErrorDetails);
        message.error({
          content: response.ErrorDetails,
          className: 'custom-class',
          style: {
            marginTop: '6vh'
          }
        });
      }
    }
  };

  const closeSaveOntologyModal = () => {
    setShowSaveOntologyModal(false);
  };

  const closeSaveToOnto = () => {
    setOperationKey('');
  };

  const saveOntology = (isDraft = false) => {
    dealWithSoManyData(isDraft);
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
  const dealWithSoManyData = async (isDraft: boolean) => {
    const dataBefore = getCanvasGraphData();
    const nodes = dataBefore.nodes;
    const edges = dataBefore.edges;
    let entity: any[] = [];
    let used_task: number[] = [];
    let errorNode: any[] = [];
    const nodeCache: any = {};
    _.map(nodes, node => {
      nodeCache[node.uid] = node;
      if (!isDraft) {
        if (node.hasError?.length) {
          errorNode = [...errorNode, node.alias];
        }
      }
      let properties: any[] = [];
      let primary_key: string[] = [];
      let vector_generation: string[] = [];
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
      if (temp.task_id !== '') {
        used_task = [...used_task, Number(temp.task_id)];
      }
    });

    if (errorNode.length) {
      // message.error(`${intl.get('ontoLib.entity')} ${errorNode.join(',')} ${intl.get('ontoLib.hasError')}`);
      message.error({
        content: `${intl.get('ontoLib.entity')} ${errorNode.join(',')} ${intl.get('ontoLib.hasError')}`,
        className: 'custom-class',
        style: {
          marginTop: '6vh'
        }
      });
      return;
    }

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
    const summaryData = {
      ontology_name: saveOntoData.ontologyName,
      ontology_des: saveOntoData.ontologyDescribe,
      domain: saveOntoData.domainArray,
      entity,
      edge: edgeFinal,
      temp_save: isDraft,
      used_task: Array.from(new Set(used_task)),
      canvas: { background_color: backColor, background_image: backImage }
    };
    const finalId = draftOntoId === 0 ? ontologyId || initOntoData?.ontology_id : draftOntoId;
    const response = await servicesCreateEntity.editEntity(finalId, { ...summaryData, cover: false });
    if (!isDraft && response?.res) {
      setShowSaveOntologyModal(false);
      onExit();
    } else if (isDraft && response?.res) {
      // message.success(intl.get('ontoLib.saveDraftOk'));
      message.success({
        content: intl.get('ontoLib.saveDraftOk'),
        className: 'custom-class',
        style: {
          marginTop: '6vh'
        }
      });
    } else if (response?.Description) {
      if (ontoLibType !== '') {
        showQuitTip.current = true;
      }
      if (saveOntoRef.current) {
        saveOntoRef.current!.formDetailError.current = response.ErrorDetails;
      }
      saveOntoRef.current?.form.validateFields();
      // message.error(response.ErrorDetails);
      message.error({
        content: response.ErrorDetails,
        className: 'custom-class',
        style: {
          marginTop: '6vh'
        }
      });
    }
  };

  // 处理数据，适配新接口
  const dealWithSoManyDataSaveTo = (type: string) => {
    const dataBefore = getCanvasGraphData();
    const nodes = dataBefore.nodes;
    const edges = dataBefore.edges;
    let entity: any[] = [];
    const nodeCache: any = {};
    let used_task: number[] = [];
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
      if (temp.task_id !== '') {
        used_task = [...used_task, Number(temp.task_id)];
      }
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
    const ontoSummaryData = saveToRef.current?.dataSummary.current;
    let summaryData;
    if (type === 'create') {
      summaryData = {
        ontology_name: ontoSummaryData?.ontologyName,
        ontology_des: ontoSummaryData?.ontologyDescribe,
        domain: ontoSummaryData?.domainArray,
        knw_id: Number(getParam('knId')),
        entity,
        edge: edgeFinal,
        temp_save: false,
        used_task: Array.from(new Set(used_task)),
        canvas: { background_color: backColor, background_image: backImage }
      };
    } else {
      summaryData = {
        ontology_name: ontoSummaryData?.ontologyName,
        ontology_des: ontoSummaryData?.ontologyDescribe,
        domain: ontoSummaryData?.domainArray,
        entity,
        edge: edgeFinal,
        temp_save: false,
        used_task: Array.from(new Set(used_task)),
        canvas: { background_color: backColor, background_image: backImage }
      };
    }
    return summaryData;
  };

  //   ------- 流程三变更流程四数据逻辑开始-----------
  /**
   * 任务预测结束，实体类已经生成
   * @param data 任务预测的结果 (该结果相当于是流程四数据抽取接口返回的结果)
   * @param data 导入生成的实体类数据源
   */
  const onTaskFinish = async (data: any) => {
    if (selectedDataFile.current.length > 0 && data.length > 0) {
      // 拿到最新的图谱数据，将entity_id设置进来
      const dataFile: DataFileType[] = [];
      data.forEach((dataItem: any) => {
        const res = dataItem.result;
        res.entity_main_table_dict.forEach((dictItem: any) => {
          let dataFileUniqueSign = dictItem.main_table[0]; // 对mysql、hive：表名
          if (dataItem.data_source.data_source === DS_SOURCE.as) {
            // 对于as：[gns路径，文件名，完整文件名]
            dataFileUniqueSign = dictItem.main_table[0][0];
          }
          if (dictItem.main_table[0]) {
            const cloneData = _.cloneDeep(selectedDataFile?.current);
            let file: any = {};
            _.find(cloneData, (fileItem: any) => {
              const sameNameSource =
                fileItem.data_source === DS_SOURCE.AnyRobot
                  ? fileItem.files[0].file_name
                  : fileItem.files[0].file_source;
              if (dataFileUniqueSign === sameNameSource) {
                file = fileItem;
              }
            });
            // const file = cloneData.find(
            //   // fileItem => dataFileUniqueSign === fileItem.files[0].file_source
            //   fileItem =>
            //     dataFileUniqueSign === (fileItem.data_source === DS_SOURCE.AnyRobot)
            //       ? fileItem.files[0].file_name
            //       : fileItem.files[0].file_source
            // );

            if (file) {
              dataFile.push(_.cloneDeep(file)); // 深拷贝一次，后续处理entity_type重复的问题不会相互影响
            }
          }
        });
      });

      // 说明是导入实体类，任务预测完成，此时要吧新导入的实体类与数据文件进行映射，保存到流程四的数据中
      const kMapData = generateFlow4KMapDataFormat(data, dataFile);

      addGraphKMap.current = addGraphKMap.current
        ? {
            entity: [...addGraphKMap.current.entity, ...kMapData.entity],
            edge: [...addGraphKMap.current.edge, ...kMapData.edge],
            files: [...addGraphKMap.current.files, ...kMapData.files]
          }
        : {
            entity: [...kMapData.entity],
            edge: [...kMapData.edge],
            files: [...kMapData.files]
          };

      setTimeout(() => {
        const taskIds = data.map((item: any) => item.task_id);
        const nodeData = _.cloneDeep(graphData.nodes.filter(item => taskIds.includes(item.task_id)));
        cacheAddGraphEntityDataByTask.current = [...cacheAddGraphEntityDataByTask.current, ...nodeData];
      }, 0);
    }
  };

  /**
   * 更新流程四的映射字段 PARSING（流程三点击保存和点击下一步按钮会执行此函数）
   * @param latestOntologyData 画布正最终保存的本体数据
   */
  const updateFlow4GraphKMap = async (latestOntologyData: any) => {
    // todo 最新的本体数据源latestOntologyData 采用调接口再查询一次的方式或者点下一步的时候直接使用下一步的数据源
    // 先获取一次最新的流程四映射数据
    const graph_KMap = await getFlow4ExistGraphKMapData(graphId);
    if (graph_KMap) {
      let newKMap = _.cloneDeep(graph_KMap);
      // 说明新增了批量导入的实体类
      if (addGraphKMap.current) {
        // 对addGraphKMap.current进行处理，因为存在对预测生成的实体类进行删除和更改类名以及新增或删除属性的情况
        handleDeleteNodeOfTaskKMap(addGraphKMap.current, latestOntologyData, cacheAddGraphEntityDataByTask.current);
        handleEditNodeOfTaskKMap(addGraphKMap.current, latestOntologyData, cacheAddGraphEntityDataByTask.current);
        handleUpdatePropertiesNodeOfTaskKMap(
          addGraphKMap.current,
          latestOntologyData,
          cacheAddGraphEntityDataByTask.current
        );
        dealWithEntityTypeRepeat(newKMap, addGraphKMap.current);
        newKMap = {
          entity: [...newKMap.entity, ...addGraphKMap.current.entity],
          edge: [...newKMap.edge, ...addGraphKMap.current.edge],
          files: [...newKMap.files, ...addGraphKMap.current.files]
        };
      }
      // debugger;
      // 被删除的实体类/关系类，同步删除其在流程四对应的映射配置
      handleDeletedNodeEdgeKMap(newKMap, latestOntologyData, cacheOldOntologyData.current);

      // 实体类/关系类 编辑了类名，同步修改映射数据中对应的name或relations
      handleEditNodeEdgeKMap(newKMap, latestOntologyData, cacheOldOntologyData.current);

      // 实体类/关系类 新增或者删除了属性，同步修改映射数据中对应的映射配置
      handleUpdatePropertiesNodeEdgeKMap(newKMap, latestOntologyData, cacheOldOntologyData.current);

      handleUpdateNodePosition(newKMap, latestOntologyData, cacheOldOntologyData.current);

      selectedDataFile.current = [];
      addGraphKMap.current = undefined;
      cacheOldOntologyData.current = _.cloneDeep(latestOntologyData);
      cacheAddGraphEntityDataByTask.current = [];
      return newKMap; // 回调出去让savenocheck方法保存
    }
  };

  /**
   * 处理任务预测生成的实体类，新增或者删除了属性，同步修改映射数据中对应的映射配置(此时没有点击保存或下一步按钮)
   */
  const handleUpdatePropertiesNodeOfTaskKMap = (
    newKMap: GraphKMapType,
    latestOntologyData: any,
    oldOntologyEntityData: any
  ) => {
    latestOntologyData.entity.forEach((newEntity: any) => {
      const newEntityProps = newEntity.properties; // 当前实体类最新的属性
      const oldEntity = oldOntologyEntityData.find((oldEntity: any) => Number(oldEntity.uid) === newEntity.entity_id);
      if (oldEntity) {
        const oldEntityProps = oldEntity.attributes; // 当前实体类之前的属性
        const newEntityPropNames = newEntityProps.map((item: any) => item.name);
        const oldEntityPropNames = oldEntityProps.map((item: any) => item.attrName);
        const addPropNames: string[] = _.difference(newEntityPropNames, oldEntityPropNames);
        const deletePropNames: string[] = _.difference(oldEntityPropNames, newEntityPropNames);
        newKMap.entity.forEach(item => {
          // 此处可以使用name进行匹配的原因是，先执行了handleEditNodeOfTaskKMap，即使实体类类名变了，到这个地方就已经可以体现出来了
          if (item.name === newEntity.name) {
            item.property_map = item.property_map.filter(mapItem => !deletePropNames.includes(mapItem.otl_prop));
            // addPropNames 添加进去
            addPropNames.forEach(propName => {
              item.property_map.push({
                entity_prop: '',
                otl_prop: propName
              });
            });
          }
        });
      }
    });
  };

  /**
   * 处理删除任务预测生成的实体类(此时没有点击保存或下一步按钮)
   */
  const handleDeleteNodeOfTaskKMap = (newKMap: GraphKMapType, latestOntologyData: any, oldOntologyEntityData: any) => {
    const latestNodeIds = latestOntologyData.entity.map((item: any) => item.entity_id);
    const oldNodeIds = oldOntologyEntityData.map((item: any) => Number(item.uid));
    const deletedNodeIds = _.difference(oldNodeIds, latestNodeIds);
    const deletedNode: Array<{ name: string; model: string }> = []; // 被删除的实体类
    oldOntologyEntityData.forEach((item: any) => {
      if (deletedNodeIds.includes(Number(item.uid))) {
        deletedNode.push({
          name: item.name,
          model: item.model
        });
      }
    });
    const deletedEntityType: string[] = [];
    newKMap.entity.forEach((item, index) => {
      const deletedTargetNode = deletedNode.find(node => node.name === item.name);
      if (deletedTargetNode) {
        deletedEntityType.push(item.entity_type);
      }
    });
    newKMap.entity = newKMap.entity.filter(item => !deletedEntityType.includes(item.entity_type));
    const deleteFilesIndex: number[] = [];
    newKMap.files.forEach((item, index) => {
      item.extract_rules = item.extract_rules.filter(rule => !deletedEntityType.includes(rule.entity_type));
      if (item.extract_rules.length === 0) {
        deleteFilesIndex.push(index);
      }
    });
    newKMap.files = newKMap.files.filter((item, index) => !deleteFilesIndex.includes(index));
  };

  /**
   * 处理编辑任务预测生成的实体类的类名(此时没有点击保存或下一步按钮)
   */
  const handleEditNodeOfTaskKMap = (newKMap: GraphKMapType, latestOntologyData: any, oldOntologyEntityData: any) => {
    const newEntityObj: Record<number, string> = {}; // key是实体类id，value是实体类名
    latestOntologyData.entity.forEach((item: any) => {
      newEntityObj[item.entity_id] = item.name;
    });
    const oldEntityObj: Record<number, string> = {}; // key是实体类id，value是实体类名
    oldOntologyEntityData.forEach((item: any) => {
      oldEntityObj[item.uid] = item.name;
    });
    const entity_ids: number[] = latestOntologyData.entity.map((item: any) => item.entity_id);
    entity_ids.forEach(entity_id => {
      if (newEntityObj[entity_id] && oldEntityObj[entity_id] && newEntityObj[entity_id] !== oldEntityObj[entity_id]) {
        // 说明entity_id对应的name被修改了
        // 通过旧实体类名在graph_KMap中找到配置，然后把配置中的name替换成最新的name
        newKMap.entity.forEach(item => {
          if (item.name === oldEntityObj[entity_id]) {
            item.name = newEntityObj[entity_id];
          }
        });
      }
    });
  };

  /**
   * 处理已存在的节点或边，其属性被删除或者新增之后，更新对应的映射配置
   * @param newKMap 映射数据
   * @param latestOntologyData 最新的本体数据
   * @param oldOntologyData 旧的本体数据
   */
  const handleUpdatePropertiesNodeEdgeKMap = (
    newKMap: GraphKMapType,
    latestOntologyData: any,
    oldOntologyData: any
  ) => {
    latestOntologyData.entity.forEach((newEntity: any) => {
      const newEntityProps = newEntity.properties; // 当前实体类最新的属性
      const oldEntity = oldOntologyData.entity.find((oldEntity: any) => oldEntity.entity_id === newEntity.entity_id);
      if (oldEntity) {
        const oldEntityProps = oldEntity.properties; // 当前实体类之前的属性
        const newEntityPropNames = newEntityProps.map((item: any) => item.name);
        const oldEntityPropNames = oldEntityProps.map((item: any) => item.name);
        const addPropNames: string[] = _.difference(newEntityPropNames, oldEntityPropNames);
        const deletePropNames: string[] = _.difference(oldEntityPropNames, newEntityPropNames);
        newKMap.entity.forEach(item => {
          // 此处可以使用name进行匹配的原因是，先执行了handleEditNodeEdgeKMap，即使实体类或关系类的类名变了，到这个地方就已经可以体现出来了
          if (item.name === newEntity.name) {
            item.property_map = item.property_map.filter(mapItem => !deletePropNames.includes(mapItem.otl_prop));
            // addPropNames 添加进去
            addPropNames.forEach(propName => {
              item.property_map.push({
                entity_prop: '',
                otl_prop: propName
              });
            });
          }
        });
      }
    });

    latestOntologyData.edge.forEach((newEdge: any) => {
      const newEdgeProps = newEdge.properties; // 当前关系类最新的属性
      const oldEdge = oldOntologyData.edge.find((oldEdge: any) => oldEdge.edge_id === newEdge.edge_id);
      if (oldEdge) {
        const oldEdgeProps = oldEdge.properties; // 当前关系类之前的属性
        const newEdgePropNames = newEdgeProps.map((item: any) => item.name);
        const oldEdgePropNames = oldEdgeProps.map((item: any) => item.name);
        const addPropNames: string[] = _.difference(newEdgePropNames, oldEdgePropNames);
        const deletePropNames: string[] = _.difference(oldEdgePropNames, newEdgePropNames);
        newKMap.edge.forEach(item => {
          // 此处可以使用relations进行匹配的原因是，先执行了handleEditNodeEdgeKMap，即使实体类或关系类的类名变了，到这个地方就已经可以体现出来了
          if (_.isEqual(item.relations, newEdge.relations)) {
            item.property_map = item.property_map.filter(mapItem => !deletePropNames.includes(mapItem.edge_prop));
            // addPropNames 添加进去
            addPropNames.forEach(propName => {
              item.property_map.push({
                entity_prop: '',
                edge_prop: propName
              });
            });
          }
        });
      }
    });
  };

  /**
   * 处理被删除的节点或边对应的映射配置
   * @param newKMap 映射数据
   * @param latestOntologyData 最新的本体数据
   * @param oldOntologyData 旧的本体数据
   */
  const handleDeletedNodeEdgeKMap = (newKMap: GraphKMapType, latestOntologyData: any, oldOntologyData: any) => {
    // 存在一种情况是先改类名，再删除，故不能用类名作为匹配条件，应该使用id
    const latestNodeIds = latestOntologyData.entity.map((item: any) => item.entity_id);
    const latestEdgeIds = latestOntologyData.edge.map((item: any) => item.edge_id);
    const oldNodeIds = oldOntologyData.entity.map((item: any) => item.entity_id);
    const oldEdgeIds = oldOntologyData.edge.map((item: any) => item.edge_id);
    const deletedNodeIds = _.difference(oldNodeIds, latestNodeIds);
    const deletedEdgeIds = _.difference(oldEdgeIds, latestEdgeIds);
    const deletedNode: Array<{ name: string; model: string }> = []; // 被删除的实体类
    const deletedEdge: Array<{ name: string; model: string; relations: string[] }> = []; // 被删除的关系类

    oldOntologyData.entity.forEach((item: any) => {
      if (deletedNodeIds.includes(item.entity_id)) {
        deletedNode.push({
          name: item.name,
          model: item.model
        });
      }
    });

    oldOntologyData.edge.forEach((item: any) => {
      if (deletedEdgeIds.includes(item.edge_id)) {
        deletedEdge.push({
          name: item.name,
          model: item.model,
          relations: item.relations
        });
      }
    });

    const deletedEntityType: string[] = [];
    newKMap.entity.forEach((item, index) => {
      const deletedTargetNode = deletedNode.find(node => node.name === item.name);
      if (deletedTargetNode) {
        deletedEntityType.push(item.entity_type);
      }
    });
    newKMap.entity = newKMap.entity.filter(item => !deletedEntityType.includes(item.entity_type));
    newKMap.edge.forEach((item, index) => {
      const deletedTargetEdge = deletedEdge.find(edge => _.isEqual(edge.relations, item.relations));
      if (deletedTargetEdge) {
        deletedEntityType.push(item.entity_type);
      }
    });
    newKMap.edge = newKMap.edge.filter(item => !deletedEntityType.includes(item.entity_type));
    const deleteFilesIndex: number[] = [];
    newKMap.files.forEach((item, index) => {
      item.extract_rules = item.extract_rules.filter(rule => !deletedEntityType.includes(rule.entity_type));
      if (item.extract_rules.length === 0) {
        deleteFilesIndex.push(index);
      }
    });
    newKMap.files = newKMap.files.filter((item, index) => !deleteFilesIndex.includes(index));
  };

  /**
   * 处理被编辑的实体类/关系类 对应的映射配置
   * @param newKMap
   * @param latestOntologyData
   * @param oldOntologyData
   */
  const handleEditNodeEdgeKMap = (newKMap: GraphKMapType, latestOntologyData: any, oldOntologyData: any) => {
    // TODO 本体自身逻辑代码在编辑边的类名时，并没有把边relations中的边的类名修改掉   不知道会不会造成问题
    // 新的本体id对应的name
    const newEntityObj: Record<number, string> = {}; // key是实体类id，value是实体类名
    const newEdgeObj: Record<number, string[]> = {}; // key是关系类id，value是关系类的relations
    latestOntologyData.entity.forEach((item: any) => {
      newEntityObj[item.entity_id] = item.name;
    });
    latestOntologyData.edge.forEach((item: any) => {
      newEdgeObj[item.edge_id] = item.relations;
    });
    // 旧的本体id对应的name
    const oldEntityObj: Record<number, string> = {}; // key是实体类id，value是实体类名
    const oldEdgeObj: Record<number, string> = {}; // key是关系类id，value是关系类的relations
    oldOntologyData.entity.forEach((item: any) => {
      oldEntityObj[item.entity_id] = item.name;
    });
    oldOntologyData.edge.forEach((item: any) => {
      oldEdgeObj[item.edge_id] = item.relations;
    });

    // 获取最新的节点id和边id
    const entity_ids: number[] = latestOntologyData.entity.map((item: any) => item.entity_id);
    const edge_ids: number[] = latestOntologyData.edge.map((item: any) => item.edge_id);
    entity_ids.forEach(entity_id => {
      if (newEntityObj[entity_id] && oldEntityObj[entity_id] && newEntityObj[entity_id] !== oldEntityObj[entity_id]) {
        // 说明entity_id对应的name被修改了
        // 通过旧实体类名在graph_KMap中找到配置，然后把配置中的name替换成最新的name
        newKMap.entity.forEach(item => {
          if (item.name === oldEntityObj[entity_id]) {
            item.name = newEntityObj[entity_id];
          }
        });
      }
    });
    edge_ids.forEach(edge_id => {
      if (newEdgeObj[edge_id] && oldEdgeObj[edge_id] && !_.isEqual(newEdgeObj[edge_id], oldEdgeObj[edge_id])) {
        // 说明edge_id对应的relations被修改了
        newKMap.edge.forEach(item => {
          if (_.isEqual(item.relations, oldEdgeObj[edge_id])) {
            item.relations = newEdgeObj[edge_id];
          }
        });
      }
    });
  };

  /**
   * 流程三改变了节点的位置信息，同步修改流程四节点的位置信息
   * @param newKMap
   * @param latestOntologyData
   * @param oldOntologyData
   */
  const handleUpdateNodePosition = (newKMap: GraphKMapType, latestOntologyData: any, oldOntologyData: any) => {
    // 先找出那些节点的位置被改变了
    const newEntityObj: Record<number, { x: number; y: number }> = {}; // key是实体类id，value是实体类的位置
    latestOntologyData.entity.forEach((item: any) => {
      newEntityObj[item.entity_id] = {
        x: item.x,
        y: item.y
      };
    });
    const oldEntityObj: Record<number, { x: number; y: number }> = {}; // key是实体类id，value是实体类的位置
    oldOntologyData.entity.forEach((item: any) => {
      oldEntityObj[item.entity_id] = {
        x: item.x,
        y: item.y
      };
    });
    const entity_ids: number[] = latestOntologyData.entity.map((item: any) => item.entity_id);
    entity_ids.forEach(entity_id => {
      if (
        newEntityObj[entity_id] &&
        oldEntityObj[entity_id] &&
        !_.isEqual(newEntityObj[entity_id], oldEntityObj[entity_id])
      ) {
        // 说明更改了entity_id对应的节点位置
        // 根据entity_id获取到实体类的name
        const entityClass = latestOntologyData.entity.find((item: any) => item.entity_id === entity_id);
        newKMap.entity.forEach(item => {
          if (item.name === entityClass.name) {
            item.x = newEntityObj[entity_id].x;
            item.y = newEntityObj[entity_id].y;
          }
        });
      }
    });
  };

  /**
   * 处理entity_type重名的问题
   */
  const dealWithEntityTypeRepeat = (exist_KMap: GraphKMapType, add_KMap: GraphKMapType) => {
    // 从存在的映射数据去获取所有的entity_type
    const existEntityType = [...exist_KMap.entity!, ...exist_KMap.edge!].map(item => item.entity_type);
    [...add_KMap.entity, ...add_KMap.edge].forEach((entity, index) => {
      let entity_type = entity.entity_type;
      if (existEntityType.includes(entity_type)) {
        entity_type = _.uniqueId(`${entity_type}_`);
      }
      existEntityType.push(entity_type);
      entity.entity_type = entity_type;
      add_KMap.files[index].extract_rules[0].entity_type = entity_type;
    });
  };

  /**
   * 获取流程四的映射数据 PARSING 流程三退出时会调用的接口
   * @param graphId
   */
  const getFlow4ExistGraphKMapData = async (graphId: number) => {
    const KMapRes = await serviceWorkflow.graphGet(graphId); // 先获取一次最新的流程四映射数据
    if (KMapRes && KMapRes.res) {
      const graph_KMap = KMapRes.res.graph_KMap;
      const graphKMap = { entity: [], edge: [], files: [] } as GraphKMapType;
      if (Object.keys(graph_KMap).length > 0) {
        // 根据已存在的映射数据与最新的本体数据去组合生成最新的映射数据
        graphKMap.entity = graph_KMap.entity.map((item: any) => ({
          name: item.name,
          entity_type: item.entity_type,
          x: item.x,
          y: item.y,
          property_map: item.property_map
        }));
        graphKMap.edge = graph_KMap.edge.map((item: any) => ({
          relations: item.relations,
          entity_type: item.entity_type,
          property_map: item.property_map,
          relation_map: item.relation_map
        }));
        graphKMap.files = graph_KMap.files.map((item: any) => {
          const obj = {
            ...item
          };
          delete obj.ds_name;
          return obj;
        });
      }
      return graphKMap;
    }
    return false;
  };

  /**
   * 生成流程四需要的映射数据
   * @param data
   */
  const generateFlow4KMapDataFormat = (data: any, dataFile: DataFileType[]) => {
    // const fileNames = [];
    // const rulesObj: any = {};
    const entity: any = [];

    data.forEach((dataItem: any) => {
      const ds = dataItem.data_source;
      const res = dataItem.result;
      res.entity_main_table_dict.forEach((item: any) => {
        let fileName = item.main_table[0];
        if (ds.data_source === DS_SOURCE.as) {
          // 对于as：[gns路径，文件名，完整文件名]
          fileName = item.main_table[0][0];
        }

        const fileEntityType = _.uniqueId(`${item.entity}_`);
        const rules = convertToRules(res, fileName, ds.extract_type);
        // 更新数据文件中的抽取规则字段值
        dataFile.forEach(item => {
          if (
            (ds.data_source === DS_SOURCE.AnyRobot ? item.files[0].file_name : item.files[0].file_source) === fileName
          ) {
            item.extract_rules = [
              {
                entity_type: fileEntityType,
                property: rules.map(item => ({
                  column_name: item.property.column_name,
                  property_field: item.property.property_field
                }))
              }
            ];
          }
        });
        entity.push({
          name: item.entity,
          entity_type: fileEntityType,
          x: 0,
          y: 0,
          property_map: rules.map((item: any) => ({
            entity_prop: item.property.property_field,
            otl_prop: item.property.property_field
          }))
        });
      });
    });
    return {
      entity,
      edge: [],
      files: dataFile
    };
  };

  //   ------- 流程三变更流程四数据逻辑结束-----------

  const canvasConfigChanged = (canvasConfig: any) => {
    setBackColor(canvasConfig.data.color);
    setBackImage(canvasConfig.data.image);
  };

  // 删除节点分组时，需要考虑子图的完整性
  const handleGroupNodes = (groupId: number, operateNodeUid: string) => {
    const selectGroupArr = groupList.filter(item => item.id === groupId);
    const targetGroup = selectGroupArr[0];
    const nodes = _.uniqBy(targetGroup.entity, d => d.uid);
    const newNodes = nodes.filter(item => item.uid === operateNodeUid);
    const edges = _.uniqBy(targetGroup.edge, d => d.uid);

    const changeData = changeBrushClickData({ nodes, edges }, { nodes: newNodes, edges: [] });
    const highlight = _.map([...changeData.nodes, ...changeData.edges], d => d.uid);
    setBrushSelectData({ targetGroup, nodes: changeData.nodes, edges: changeData.edges, highlight });

    const newGraph = ontoMergeBrushToGraph(
      { targetGroup, nodes: changeData.nodes, edges: changeData.edges, highlight },
      graphData
    );
    const group = ontoAutoUpdateGroup(newGraph, groupList);
    setGraphData(newGraph);
    setGroupList(group);

    setGraphPattern('default');
    setBrushSelectData({ nodes: [], edges: [], notRedraw: true });
  };

  /**
   * 检查向量服务状态
   */
  const checkVectorServiceStatus = async () => {
    const { pathname } = location;
    if (hasTipVectorError.current || pathname === '/knowledge/studio-concept-ontolib') {
      return;
    }
    try {
      const { res } = (await servicesCreateEntity.getVectorServiceStatus()) || {};
      if (res === 'Vector service not configured') {
        message.warning(intl.get('ontoLib.errInfo.vectorNotConfig'));
      }
      if (res === 'Vector Service Exception') {
        message.warning(intl.get('ontoLib.errInfo.vectorConfigError'));
      }
      // eslint-disable-next-line require-atomic-updates
      hasTipVectorError.current = true;
    } catch (error) {
      const errorTip = error.type === 'message' ? error.response.ErrorDetails : error.data.ErrorDetails;
      message.error(errorTip);
    }
  };

  const getGraphBasicData = async () => {
    try {
      const result = await serviceGraphDetail.graphGetInfoBasic({
        is_all: true,
        graph_id: graphId
      });
      const data = result?.res || {};

      if (data.task_status) {
        // 说明不是首次构建
        setFirstBuild(false);
      }
    } catch (error) {
      const { type, response } = error;
      if (type === 'message') {
        // message.error(response?.Description || '');
        message.error({
          content: response?.Description || '',
          className: 'custom-class',
          style: {
            padding: 0
          }
        });
      }
    }
  };

  return (
    <div
      className={
        ontoLibType === ''
          ? 'kw-flex-column kw-h-100 graphG6Root'
          : 'kw-flex-column kw-flex-item-full-height graphG6RootOnto'
      }
      style={{
        ...(backImage !== 'empty'
          ? { backgroundImage: `url(${ONTOLOGY_GRAPH_CONFIG.BACKGROUND_IMAGE?.[backImage]})` }
          : {}),
        backgroundColor: ONTOLOGY_GRAPH_CONFIG.BACKGROUND_COLOR?.[backColor]
      }}
    >
      <IconPreRender />

      <Header
        ref={ontoHeaderRef}
        knData={knData}
        draftOntoId={draftOntoId}
        current={current}
        disabled={graphPattern === 'brushSelect' || ontoLibType === 'view'}
        osId={osId}
        dbType={dbType}
        graphId={graphId}
        graphData={graphData}
        ontologyId={ontologyId}
        graphPattern={graphPattern}
        ontology_id={initOntoData?.ontology_id}
        operationKey={operationKey}
        ontoLibType={ontoLibType}
        onAddEdgesBatch={onAddEdgesBatch}
        detailUpdateData={detailUpdateData}
        onChangePattern={onChangePattern}
        headerAddData={headerAddData}
        onChangeOperationKey={onChangeOperationKey}
        setIsLockGroupListener={setIsLockGroupListener}
        onAfterBuildTask={triggerTaskPolling}
        validateSelectItem={validateSelectItem}
        onAddDataFile={(dataFile: any) => {
          selectedDataFile.current = [...selectedDataFile.current, ...dataFile];
        }}
        setParsingFileSet={setParsingFileSet}
        defaultParsingRule={defaultParsingRule}
        setDefaultParsingRule={setDefaultParsingRule}
        sourceFileType={sourceFileType}
        setSourceFileType={setSourceFileType}
        parsingTreeChange={parsingTreeChange}
        setParsingTreeChange={setParsingTreeChange}
        setShowRightMenu={setShowRightMenu}
        canvasRef={canvasRef}
        canvasConfigChanged={canvasConfigChanged}
        canvasConfig={{ color: backColor, image: backImage }}
        arFileSave={arFileSave}
        setArFileSave={setArFileSave}
        checkVectorServiceStatus={checkVectorServiceStatus}
      />
      <div className="kw-flex-item-full-height" style={{ position: 'relative' }}>
        <OntoCanvasG6
          ref={canvasRef}
          current={current}
          graphData={graphData}
          graphPattern={graphPattern}
          itemsAdd={itemsAdd}
          itemsUpdate={itemsUpdate}
          itemSelected={itemSelected}
          itemsDelete={itemsDelete}
          brushSelectData={brushSelectData}
          resetFlag={resetFlag}
          onChangePattern={onChangePattern}
          onUpdateGraphData={onUpdateGraphData}
          onChangeOperationKey={onChangeOperationKey}
          onChangeSelectedItem={onChangeSelectedItem}
          onBrushSelect={onBrushSelect}
          validateSelectItem={validateSelectItem}
          onCanvasClick={onCanvasClick}
          setShowRightMenu={setShowRightMenu}
          ontoLibType={ontoLibType}
          showQuitTip={showQuitTip}
          headerRef={ontoHeaderRef}
          setCopyBehaviorShowNode={setCopyBehaviorShowNode}
          backgroundColor={ONTOLOGY_GRAPH_CONFIG.BACKGROUND_COLOR?.[backColor]}
          setItemSelected={setItemSelected}
        />
        {!!itemSelected && !itemSelected?.relations && !copyBehaviorShowNode && (
          <div className="rightBox">
            <div className={showRightMenu ? 'expand' : 'collapse'} onClick={() => setShowRightMenu(!showRightMenu)}>
              <div className="tipsText">
                {showRightMenu ? intl.get('ontoLib.collapse') : intl.get('ontoLib.expand')}
                {showRightMenu ? (
                  <DoubleRightOutlined className="textIcon" />
                ) : (
                  <DoubleLeftOutlined className="textIcon" />
                )}
              </div>
            </div>
            <div className="rightMenu" style={{ display: showRightMenu ? undefined : 'none' }}>
              {/* <div className={showRightMenu ? 'rightMenuShow' : 'rightMenuHide'}> */}
              <OntoNodeInfo
                firstBuild={firstBuild}
                key={itemSelected.uid}
                ref={nodeInfoRef}
                nodes={graphData.nodes}
                edges={graphData.edges}
                detailDeleteData={detailDeleteData}
                selectedElement={itemSelected}
                setSelectedElement={onChangeSelectedItem}
                detailUpdateData={detailUpdateData}
                groupList={groupList}
                used_task={initOntoData.used_task || []}
                setUsedTask={(task: number[]) => setInitOntoData({ ...initOntoData, used_task: task })}
                onAddEdgesBatch={onAddEdgesBatch}
                onCreateGroup={openCreateGroupModal}
                ontoLibType={ontoLibType}
                showQuitTip={showQuitTip}
                handleGroupNodes={handleGroupNodes}
                checkVectorServiceStatus={checkVectorServiceStatus}
              />
            </div>
          </div>
        )}
        {!!itemSelected && itemSelected?.relations && (
          <div className="rightBox">
            <div className={showRightMenu ? 'expand' : 'collapse'} onClick={() => setShowRightMenu(!showRightMenu)}>
              <div className="tipsText">
                {showRightMenu ? intl.get('ontoLib.collapse') : intl.get('ontoLib.expand')}
                {showRightMenu ? (
                  <DoubleRightOutlined className="textIcon" />
                ) : (
                  <DoubleLeftOutlined className="textIcon" />
                )}
              </div>
            </div>
            <div className="rightMenu" style={{ display: showRightMenu ? undefined : 'none' }}>
              <OntoEdgeInfo
                firstBuild={firstBuild}
                key={itemSelected.uid}
                ref={edgeInfoRef}
                nodes={graphData.nodes}
                edges={graphData.edges}
                selectedElement={itemSelected}
                setSelectedElement={onChangeSelectedItem}
                groupList={groupList}
                onCreateGroup={openCreateGroupModal}
                setItemsAdd={setItemsAdd}
                setItemsUpdate={setItemsUpdate}
                detailUpdateData={detailUpdateData}
                setItemsDeleteIds={setItemsDeleteIds}
                ontoLibType={ontoLibType}
                showQuitTip={showQuitTip}
              />
            </div>
          </div>
        )}
        {operationKey === 'summaryInfo' && (
          <div className="rightBox">
            <div className={showRightMenu ? 'expand' : 'collapse'} onClick={() => setShowRightMenu(!showRightMenu)}>
              <div className="tipsText">
                {showRightMenu ? intl.get('ontoLib.collapse') : intl.get('ontoLib.expand')}
                {showRightMenu ? (
                  <DoubleRightOutlined className="textIcon" />
                ) : (
                  <DoubleLeftOutlined className="textIcon" />
                )}
              </div>
            </div>
            <div className="rightMenu" style={{ display: showRightMenu ? undefined : 'none' }}>
              <OntoSummaryInfo
                graph={graphData}
                groupList={groupList}
                setSelectedElement={onChangeSelectedItem}
                onClose={() => onChangeOperationKey('')}
                onDelete={onSummaryDelete}
                onUpdateGraphData={onUpdateGraphData}
                onCreateGroup={openCreateGroupModal}
                ontoLibType={ontoLibType}
              />
            </div>
          </div>
        )}
        {/* 存在接口轮询, 关闭时不销毁组件 */}
        <div className="rightBox" style={{ display: operationKey === 'taskList' ? undefined : 'none' }}>
          <div className={showRightMenu ? 'expand' : 'collapse'} onClick={() => setShowRightMenu(!showRightMenu)}>
            <div className="tipsText">
              {showRightMenu ? intl.get('ontoLib.collapse') : intl.get('ontoLib.expand')}
              {showRightMenu ? (
                <DoubleRightOutlined className="textIcon" />
              ) : (
                <DoubleLeftOutlined className="textIcon" />
              )}
            </div>
          </div>
          <div
            className="rightMenu"
            style={{ display: operationKey === 'taskList' && showRightMenu ? undefined : 'none' }}
          >
            <OntoTaskList
              viewMode={viewMode}
              visible={operationKey === 'taskList'}
              nodes={graphData.nodes}
              edges={graphData.edges}
              ontologyId={draftOntoId === 0 ? ontologyId || initOntoData?.ontology_id : draftOntoId}
              used_task={initOntoData.used_task || []}
              taskPollingFlag={taskPollingFlag}
              taskListAddData={taskListAddData}
              taskListDeleteData={taskListDeleteData}
              onClose={() => onChangeOperationKey('')}
              setUsedTask={(task: number[]) => setInitOntoData({ ...initOntoData, used_task: task })}
              onSelect={onTaskSelect}
              onTaskFinish={onTaskFinish} // 任务预测完成的回调
              parsingFileSet={parsingFileSet}
              setParsingFileSet={setParsingFileSet}
            />
          </div>
        </div>
      </div>
      {operationKey === 'saveToOnto' && (
        <SaveToOnto
          ref={saveToRef}
          showSaveOntologyModal={operationKey === 'saveToOnto'}
          closeSaveOntologyModal={closeSaveToOnto}
          modalOkSave={flowToLib}
          initData={{ ontologyName: '', domainArray: [], ontologyDescribe: '' }}
          modalTitle={intl.get('ontoLib.saveTo')}
          firstShow={firstShowSave}
        />
      )}
      {ontoLibType === '' && (
        <GroupMenus
          graphId={graphId}
          groupList={groupList}
          operateGroup={brushSelectData.targetGroup}
          onEdit={onGroupEdit}
          onSelect={onGroupSelect}
          onDelete={() => queryGroups(graphData)}
          onCreate={openBrushMode}
          onRename={group => setGroupOperation({ visible: true, type: 'edit', group })}
          onClear={onClearGroupSelect}
        />
      )}
      <OntoGroupOpModal {...groupOperation} onOk={onAfterOp} onCancel={closeCreateGroupModal} />
      <OntoBrushSelectDialog
        visible={graphPattern === 'brushSelect'}
        nodeLen={brushSelectData.nodes?.length}
        edgeLen={brushSelectData.edges?.length}
        onOk={onBrushConfirmAdd}
        onCancel={onBrushExist}
      />
      <OntoHelpTips visible={current === 2} />
      {ontoLibType === '' ? (
        <FlowFooter
          ref={flowFooterRef}
          prev={prev}
          next={next}
          graphId={graphId}
          ontologyId={ontoData[0]?.id || ontologyId}
          groupList={groupList}
          initOntoData={initOntoData}
          dataInfoRef={!!itemSelected && !itemSelected?.relations ? nodeInfoRef.current : edgeInfoRef.current}
          onCheckErr={onCheckErr}
          setOntoData={setOntoData}
          getCanvasGraphData={getCanvasGraphData}
          onSave={onSave}
          detailUpdateData={detailUpdateData}
          graphData={graphData}
          // canvas={{ background_color: backColor, background_image: backImage }} // 流程3画布设置去除
        />
      ) : (
        ontoLibType !== 'view' && (
          <OntoFooter
            onSaveDraft={onSaveDraft}
            graphId={graphId}
            ontologyId={ontologyId}
            groupList={groupList}
            initOntoData={initOntoData}
            dataInfoRef={!!itemSelected && !itemSelected?.relations ? nodeInfoRef.current : edgeInfoRef.current}
            onCheckErr={onCheckErr}
            setOntoData={setOntoData}
            getCanvasGraphData={getCanvasGraphData}
            onSaveAndExit={onSaveAndExit}
          />
        )
      )}
      {showSaveOntologyModal && (
        <SaveOntologyModal
          ref={saveOntoRef}
          showSaveOntologyModal={showSaveOntologyModal}
          closeSaveOntologyModal={closeSaveOntologyModal}
          modalOkSave={modalOkSave}
          initData={saveOntoData}
          modalTitle={intl.get('ontoLib.saveTitle')}
        />
      )}
    </div>
  );
};

export default (props: any) => {
  const isMounted = useRef(false);
  if (!props.canShowCanvas && !isMounted.current) return null;
  isMounted.current = true;
  return <OntoGraphG6 {...props} />;
};
