/* eslint-disable max-lines */
import React, { useState, useEffect, useRef, useReducer } from 'react';
import { message } from 'antd';
import intl from 'react-intl-universal';
import _ from 'lodash';

import servicesSubGraph from '@/services/subGraph';
import servicesCreateEntity from '@/services/createEntity';

import Header from './Header';
import CanvasG6 from './CanvasG6';
import NodeInfo from './NodeInfo';
import EdgeInfo from './EdgeInfo';
import TaskList from './TaskList';
import SummaryInfo from './SummaryInfo';
import GroupMenus from './GroupMenus';
import GroupOpModal from './GroupMenus/GroupOpModal';
import BrushSelectDialog from './BrushSelectDialog';
import HelpTips from './HelpTips';
import Footer from './Footer';

import { initGraphGroup, mergeBrushToGraph, resetGroups, autoUpdateGroup } from './GroupMenus/assistFunction';
import {
  initGraphByEdit,
  changeBrushClickData,
  mergeBrushSelect,
  generateGraphBody,
  generateGroupBody
} from './assistant';

import { GraphData, BrushData, InitOntoData, GroupTreeCheck } from './types/data';
import { GraphGroupItem } from './types/items';
import { GraphPattern, OperationKey } from './types/keys';
import { ItemAdd, ItemDelete, ItemUpdate, UpdateGraphData, ItemSelected } from './types/update';
import netPng from '@/assets/images/net.png';
import './style.less';

const GraphG6 = (props: any) => {
  const { childRef, current, osId, dbType, graphId, ontoData, graphName, ontologyId, next, prev } = props;
  const nodeInfoRef = useRef<any>(); // 点详情ref
  const edgeInfoRef = useRef<any>(); // 边详情ref
  const [initOntoData, setInitOntoData] = useState<InitOntoData>({} as InitOntoData);
  const [graphPattern, setGraphPattern] = useState<GraphPattern>('default'); // 图的模式
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] }); // 图的数据
  const [groupList, setGroupList] = useState<GraphGroupItem[]>([]); // 分组列表
  const [itemsAdd, setItemsAdd] = useState<ItemAdd>({} as ItemAdd); // 需要添加的数据
  const [itemsDelete, setItemsDeleteIds] = useState<ItemDelete>({} as ItemDelete); // 删除节点和边
  const [itemsUpdate, setItemsUpdate] = useState<ItemUpdate>({} as ItemUpdate); // 要更新的节点和边
  const [itemSelected, setItemSelected] = useState<ItemSelected>(); // 选中的数据
  const [operationKey, setOperationKey] = useState<OperationKey>(''); // 右侧面板key
  const [groupOperation, setGroupOperation] = useState({ visible: false, type: '', group: {} }); // 分组操作弹窗
  const [brushSelectData, setBrushSelectData] = useState<BrushData>({ nodes: [], edges: [] }); // 框选的图数据
  const [groupTreeCheck, setGroupTreeCheck] = useState<GroupTreeCheck>({ data: {} }); // 分组树选中的数据
  const [isLockGroupListener, setIsLockGroupListener] = useState(false); // 顶部功能时关闭`键盘开启分组`监听
  const [resetFlag, resetCanvas] = useReducer(flag => flag + 1, 0); // 重置画布标志
  const [taskPollingFlag, triggerTaskPolling] = useReducer(flag => flag + 1, 0); // 触发查询任务的标志

  // 退出保存时调用
  if (_.has(childRef, 'current')) {
    childRef.current = {
      getFlowData: () => {
        const { ontology_id, used_task, ontology_name, ontology_des } = initOntoData;
        const { entity, edge } = generateGraphBody(graphData);
        const groupBody = generateGroupBody(groupList, { nodes: entity, edges: edge }, true);
        const ontoBody = [
          {
            entity,
            edge,
            used_task,
            id: ontologyId || ontology_id,
            ontology_id: String(ontologyId || ontology_id),
            ontology_name,
            ontology_des
          }
        ];
        return { ontoBody, groupBody };
      }
    };
  }

  useEffect(() => {
    initData();
  }, []);

  useEffect(() => {
    current === 2 && window.addEventListener('keydown', createGroupListener);
    return () => window.removeEventListener('keydown', createGroupListener);
  }, [current, graphPattern, itemSelected, operationKey, isLockGroupListener]);

  const initData = () => {
    let graph;
    // 流程第三步 编辑状态获得本体信息
    if (ontoData?.length) {
      const { used_task, entity, edge, id, ontology_name, ontology_des } = ontoData[0];
      graph = initGraphByEdit({ entity, edge });
      setGraphData(graph);
      setInitOntoData({ ontology_id: id, used_task, ontology_name, ontology_des });
    }
    queryGroups(graph, undefined, true);
  };

  /**
   * 监听 shift + N 创建分组
   * 创建、编辑点或边, 使用顶部功能, 无法触发
   */
  const createGroupListener = (e: KeyboardEvent) => {
    const { shiftKey, key, keyCode } = e;
    if (!(shiftKey && (keyCode === 78 || key?.toLowerCase() === 'n'))) return;
    if (itemSelected || graphPattern === 'addEdge' || isLockGroupListener) return;
    openBrushMode();
  };

  const onChangePattern = (pattern: GraphPattern) => {
    setGraphPattern(pattern);
  };

  /**
   * 选中的数据 为空表示取消选中
   * @param data 点或边
   */
  const onChangeSelectedItem = async (data: ItemSelected) => {
    // console.log(data, '选中');
    setItemSelected(data);
    setGroupTreeCheck({ data: data || {} });
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
      if (type === 'node') {
        newGraphData.nodes = _.filter(newGraphData.nodes, item => !_.includes(items, item?.uid));
        newGraphData.edges = _.filter(newGraphData.edges, item => !_.includes(items, item?.startId || item?.endId));
      }
      if (type === 'edge') newGraphData.edges = _.filter(newGraphData.edges, item => !_.includes(items, item?.uid));
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
      }
      if (type === 'edge' || type === 'all') {
        newGraphData.edges = _.map(newGraphData?.edges, item => {
          const updateItem = itemsKV?.[item?.uid];
          if (updateItem) return updateItem;
          return item;
        });
      }
    }
    // console.log(newGraphData, '更新图');
    const group = autoUpdateGroup(newGraphData, groupList);
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
        (res, { task_id }) => (task_id ? [...res, task_id] : res),
        [] as number[]
      )
    );
    const unUsed = _.filter(used_task, id => !curUsedTaskId.includes(id));
    if (!unUsed.length) return;
    setInitOntoData({ ...initOntoData, used_task: curUsedTaskId });
    servicesCreateEntity.deleteEntityTask({ task_list: unUsed });
  };

  /** Header的操作 */
  // 添加点
  const headerAddData = (data: ItemAdd, from?: 'sql' | 'entity' | 'model' | string) => {
    setItemsAdd(data);
    if (from === 'entity') {
      const brush: GraphData = _.pick(brushSelectData, 'nodes', 'edges');

      if (data.type === 'node') {
        brush.nodes.push(...data.items);
      }
      if (data.type === 'edge') {
        brush.edges.push(...data.items);
      }
      const highlight = _.map([...brush.nodes, ...brush.edges], d => d.uid);
      setBrushSelectData({ ...brush, highlight });
    }
  };

  // 批量添加边类
  const onAddEdgesBatch = (data: any[]) => {
    setItemsAdd({ type: 'edge', items: data });
  };

  /** 详情的操作 */
  // 删除
  const detailDeleteData = (data: ItemDelete) => {
    setItemsDeleteIds(data);
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
    setOperationKey(key);

    // 打开侧边栏时 关闭点编辑页面
    if (key && itemSelected) {
      onChangeSelectedItem(undefined);
      resetCanvas();
    }
  };

  /** 汇总信息操作 */
  // 删除
  const onSummaryDelete = (data: ItemDelete) => {
    setItemsDeleteIds(data);
  };

  /** 任务列表的操作 */
  // 添加点或者边
  const taskListAddData = (data: GraphData[]) => {
    const nodes: any[] = [];
    const edges: any[] = [];
    _.forEach(data, item => {
      nodes.unshift(...item.nodes);
      edges.unshift(...item.edges);
    });
    Promise.resolve().then(() => {
      setItemsAdd({ type: 'node', items: nodes });
    });
    Promise.resolve().then(() => {
      setItemsAdd({ type: 'edge', items: edges });
    });
  };

  /**
   * 删除点或者边
   * @param data 点和边的id
   */
  const taskListDeleteData = (data: { nodes: string[]; edges: string[] }) => {
    const { nodes, edges } = data;
    Promise.resolve().then(() => {
      setItemsDeleteIds({ type: 'node', items: nodes });
    });
    Promise.resolve().then(() => {
      setItemsDeleteIds({ type: 'edge', items: edges });
    });
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
    if (ref.state?.checkData?.isIncorrect) {
      message.error(intl.get('createEntity.de'));
      return true;
    }
    if (!ref.formNameRef?.current) return false;
    let isErr = false;

    await ref.formNameRef.current.validateFields().catch(() => {
      isErr = true;
    });
    return isErr;
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
      (await servicesSubGraph.subGraphGetList({ graph_id: graphId, subgraph_name: '', return_all: 'True' })) || {};

    if (!res) {
      return Description && message.error(Description);
    }

    let groups = resetGroups(res, oldGroups || groupList);
    if (graph) {
      let curGraph = graph;
      if (isInit) {
        curGraph = initGraphGroup(graph, groups);
        setGraphData(curGraph);
      }
      groups = autoUpdateGroup(curGraph, groups);
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
    const params = {
      graph_id: graphId,
      ontology_id: ontologyId || initOntoData.ontology_id,
      name,
      entity: [],
      edge: []
    };
    try {
      const { res, ErrorCode, Description } = (await servicesSubGraph.subgraphAdd(params)) || {};
      if (res) {
        message.success(intl.get('createEntity.createGroupTip'));
        const newGraph = mergeBrushToGraph(
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
      Description && message.error(Description);
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
          message.success(intl.get('createEntity.updateGroupTip'));
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
          Description && message.error(Description);
        }
      } catch {
        // none
      }
    }
  };

  /**
   * 框选分组操作, 若是鼠标多选，直接覆盖，若是点击可取消
   * @param graph 框选的图数据
   * @param action 框选 | 点击
   */
  const onBrushSelect = (changedGraph: GraphData, action: 'brush' | 'click') => {
    const { targetGroup } = brushSelectData;
    if (action === 'click') {
      const { nodes, edges } = changeBrushClickData(brushSelectData, changedGraph);
      setBrushSelectData({ targetGroup, nodes, edges, highlight: undefined });
      return;
    }
    const brushed = graphPattern === 'default' ? { nodes: [], edges: [] } : brushSelectData;
    const select = mergeBrushSelect(brushed, changedGraph, graphData);
    const highlight = graphPattern === 'default' ? _.map([...select.nodes, ...select.edges], d => d.uid) : undefined;
    setBrushSelectData({ targetGroup, ...select, highlight });
  };

  /**
   * 为已有分组添加数据
   * @param group 指定的分组
   */
  const onGroupAdd = (group: GraphGroupItem) => {
    if (itemSelected || !['brushSelect', 'default'].includes(graphPattern)) {
      return;
    }
    setGraphPattern('brushSelect');
    const nodes = _.uniqBy([...brushSelectData.nodes, ...group.entity], d => d.uid);
    const edges = _.uniqBy([...brushSelectData.edges, ...group.edge], d => d.uid);
    const highlight = _.map([...nodes, ...edges], d => d.uid);
    setBrushSelectData({ targetGroup: group, nodes, edges, highlight });
  };

  /**
   * 分组菜单选择回调
   * @param type 选中类型
   * @param group 选中的分组
   * @param data 该分组中的图数据
   */
  const onGroupSelect = async (type: 'group' | 'node' | 'edge', group: GraphGroupItem, data: Record<string, any>) => {
    if (!['brushSelect', 'default'].includes(graphPattern)) return;
    if (itemSelected) {
      const isErr = await validateSelectItem();
      if (isErr) return;
    }
    setGroupTreeCheck({ group, data });
    if (type === 'group') {
      if (!(group.entity.length + group.edge.length)) {
        message.success(intl.get('createEntity.groupEmptyErr'));
      }
      const brushNodes = graphPattern === 'default' ? [] : brushSelectData.nodes;
      const brushEdges = graphPattern === 'default' ? [] : brushSelectData.edges;
      const nodes = _.uniqBy([...brushNodes, ...group.entity], d => d.uid);
      const edges = _.uniqBy([...brushEdges, ...group.edge], d => d.uid);
      const highlight = _.map([...nodes, ...edges], d => d.uid);
      setBrushSelectData({ targetGroup: group, nodes, edges, highlight });
      itemSelected && setItemSelected(undefined);
      return;
    }
    if (graphPattern === 'default') {
      setItemSelected(data);
    }
  };

  /**
   * 开启框选模式, 仅默认模式、无其他操作时, 可开启
   */
  const openBrushMode = () => {
    if (graphPattern === 'default' && !itemSelected && !operationKey) {
      setGraphPattern('brushSelect');
    }
  };

  /**
   * 退出框选分组模式
   */
  const onBrushExist = () => {
    setGraphPattern('default');
    setBrushSelectData({ nodes: [], edges: [], notRedraw: true });
    setGroupTreeCheck({ data: {} });
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

    const newGraph = mergeBrushToGraph(brushSelectData, graphData);
    const groups = autoUpdateGroup(newGraph, groupList);
    setGraphData(newGraph);
    setGroupList(groups);
    onBrushExist();
    message.success(intl.get('createEntity.addGroupTip'));
  };

  /**
   * 点击画布空白区域
   */
  const onCanvasClick = () => {
    graphPattern === 'default' && setBrushSelectData({ nodes: [], edges: [], notRedraw: true });
  };

  return (
    <div className="graphG6Root" style={{ background: `url(${netPng}) #f8f8f8` }}>
      <Header
        disabled={graphPattern === 'brushSelect'}
        osId={osId}
        dbType={dbType}
        graphId={graphId}
        graphData={graphData}
        graphName={graphName}
        ontologyId={ontologyId}
        graphPattern={graphPattern}
        ontology_id={initOntoData?.ontology_id}
        operationKey={operationKey}
        onAddEdgesBatch={onAddEdgesBatch}
        onChangePattern={onChangePattern}
        headerAddData={headerAddData}
        onChangeOperationKey={onChangeOperationKey}
        setIsLockGroupListener={setIsLockGroupListener}
        onAfterBuildTask={triggerTaskPolling}
        validateSelectItem={validateSelectItem}
      />
      <div style={{ overflow: 'hidden', height: 'calc(100vh - 62px - 56px)' }}>
        <CanvasG6
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
        />
      </div>
      {!!itemSelected && !itemSelected?.relations && (
        <div className="rightMenu">
          <NodeInfo
            ref={nodeInfoRef}
            dbType={dbType}
            nodes={graphData.nodes}
            edges={graphData.edges}
            selectedElement={itemSelected}
            groupList={groupList}
            used_task={initOntoData.used_task || []}
            setUsedTask={(task: number[]) => setInitOntoData({ ...initOntoData, used_task: task })}
            setSelectedElement={onChangeSelectedItem}
            onAddEdgesBatch={onAddEdgesBatch}
            detailUpdateData={detailUpdateData}
            detailDeleteData={detailDeleteData}
            onCreateGroup={openCreateGroupModal}
          />
        </div>
      )}
      {!!itemSelected && itemSelected?.relations && (
        <div className="rightMenu">
          <EdgeInfo
            ref={edgeInfoRef}
            dbType={dbType}
            nodes={graphData?.nodes}
            edges={graphData?.edges}
            selectedElement={itemSelected}
            groupList={groupList}
            detailUpdateData={detailUpdateData}
            setSelectedElement={onChangeSelectedItem}
            detailDeleteData={detailDeleteData}
            onCreateGroup={openCreateGroupModal}
          />
        </div>
      )}
      {operationKey === 'summaryInfo' && (
        <div className="rightMenu">
          <SummaryInfo
            graph={graphData}
            groupList={groupList}
            setSelectedElement={onChangeSelectedItem}
            onClose={() => onChangeOperationKey('')}
            onDelete={onSummaryDelete}
            onUpdateGraphData={onUpdateGraphData}
            onCreateGroup={openCreateGroupModal}
          />
        </div>
      )}

      {/* 存在接口轮询, 关闭时不销毁组件 */}
      <div className="rightMenu" style={{ display: operationKey === 'taskList' ? undefined : 'none' }}>
        <TaskList
          visible={operationKey === 'taskList'}
          nodes={graphData.nodes}
          edges={graphData.edges}
          ontologyId={ontologyId || initOntoData?.ontology_id}
          used_task={initOntoData.used_task || []}
          taskPollingFlag={taskPollingFlag}
          taskListAddData={taskListAddData}
          taskListDeleteData={taskListDeleteData}
          onClose={() => onChangeOperationKey('')}
          setUsedTask={(task: number[]) => setInitOntoData({ ...initOntoData, used_task: task })}
        />
      </div>

      <GroupMenus
        graphId={graphId}
        groupList={groupList}
        selectedData={groupTreeCheck}
        operateGroup={brushSelectData.targetGroup}
        onAdd={onGroupAdd}
        onSelect={onGroupSelect}
        onDelete={() => queryGroups(graphData)}
        onCreate={openBrushMode}
        onEdit={group => setGroupOperation({ visible: true, type: 'edit', group })}
      />
      <GroupOpModal {...groupOperation} onOk={onAfterOp} onCancel={closeCreateGroupModal} />
      <BrushSelectDialog
        visible={graphPattern === 'brushSelect'}
        nodeLen={brushSelectData.nodes?.length}
        edgeLen={brushSelectData.edges?.length}
        onOk={onBrushConfirmAdd}
        onCancel={onBrushExist}
      />
      <HelpTips visible={current === 2} />
      <Footer
        prev={prev}
        next={next}
        graphId={graphId}
        ontologyId={ontologyId}
        graphData={graphData}
        groupList={groupList}
        initOntoData={initOntoData}
        dataInfoRef={!!itemSelected && !itemSelected?.relations ? nodeInfoRef.current : edgeInfoRef.current}
        onCheckErr={onCheckErr}
      />
    </div>
  );
};

export default (props: any) => {
  const isMounted = useRef(false);
  if (props.current !== 2 && !isMounted.current) return null;
  isMounted.current = true;
  return <GraphG6 {...props} />;
};
