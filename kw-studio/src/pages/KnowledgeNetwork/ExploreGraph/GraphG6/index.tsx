/* eslint-disable max-lines */
// @ts-nocheck
import React, { useRef, useState, useEffect, useCallback } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { message } from 'antd';

import HOOKS from '@/hooks';
import { GRAPH_LAYOUT, GRAPH_CONFIG } from '@/enums';
import { getParam } from '@/utils/handleFunction';
import IconPreRender from '@/components/IconPreRender';
import servicesExplore from '@/services/explore';
import { tipModalFunc } from '@/components/TipModal';

import DisplayModal, { getDefaultConfig } from '../components/DisplayModal';
import TipModal from '../components/TipModel';
import registerEdgeAdd from './registerEdgeAdd';
import registerLayoutDrag from './registerLayoutDrag';
import registerLineLine from './registerLineLine';
import registerLineLoop from './registerLineLoop';
import registerLineQuadratic from './registerLineQuadratic';
import registerLinePolyline from './registerLinePolyline';
import registerNodeCircle from './registerNodeCircle';
import registerNodeDiamond from './registerNodeDiamond';
import registerNodeRect from './registerNodeRect';
import registerNodeText from './registerNodeText';
import registerTreeNodeRect from './registerTreeNodeRect';
import registerGroupBehavior from './subGroup/registerGroupBehavior';
import registerPathBehavior from './subGroup/registerPathBehavior';
import { registerApis } from './registerApis';
import { registerSubGroup } from './subGroup/register';

import { onChangeConfig, registerGraphEvent, registerLegend, registerToolTip } from './utils';
import { parseCommonResult } from '../LeftSpace/components/ResultPanel';

import LayoutDagre from './Layout/Dagre';
import ForceFree from './Layout/Force';
import LayoutFree from './Layout/Free';
import LayoutTree from './Layout/Tree';
import MenuBox from './MenuBox';
import CanvasMenu from './MenuBox/CanvasMenu';
import NodeMenu from './MenuBox/NodeMenu';
import EdgeMenu from './MenuBox/EdgeMenu';
import SubGroupMenu from './MenuBox/SubGroupMenu';
import SlicedOperateModal from '../LeftSpace/Sliced/OperateModal';

import './style.less';

type GraphG6Type = {
  selectedItem: any;
  configMenu?: any;
  onChangeData: (item: { type: string; data: any }) => void;
  onTriggerLoading: (loading: boolean) => void;
  onOpenLeftDrawer: (key: string) => void;
  onOpenRightDrawer: (key: string) => void;
  onCloseRightDrawer: (key: string) => void;
};
const isIframe = () => window.location.pathname.includes('iframe');
const GraphG6 = (props: GraphG6Type) => {
  const {
    configMenu,
    selectedItem,
    onChangeData,
    onTriggerLoading,
    onOpenLeftDrawer,
    onOpenRightDrawer,
    onCloseRightDrawer
  } = props;
  const graphContainer = useRef<HTMLDivElement>(null);
  const graph = useRef<any>();
  const canvas = useRef<any>();

  const [menuConfig, setMenuConfig] = useState<any>(null);
  const [graphMode, setGraphMode] = useState('default'); // 图模式
  const [toSpread, setToSpread] = useState({ index: 0, item: {} });
  const [sliceOperateInfo, setSliceOperateInfo] = useState({ visible: false, data: {} }); // 保存切片弹窗
  const backColor = GRAPH_CONFIG.BACKGROUND_COLOR?.[selectedItem?.graphConfig?.color];

  // 挂载, 把权限挂载到graph上
  if (graph.current) {
    graph.current.__hideTip = !!menuConfig;
    graph.current.__authorKgView = isIframe() ? true : selectedItem?.detail?.authorKgView;
  }

  /** 挂载属性和方法 */
  const mountGraph = () => {
    if (!graph.current) return;
    // 这里可能会存在闭包问题
    graph.current.__onGetZoom = getZoom; // 更新画布缩放值
    graph.current.__getLayerFromZoom = getLayerFromZoom; // 计算图谱所属的层级，用以判断节点的label、icon是否显示
    graph.current.__onDbClickNodes = onDbClickNodes; // 双击扩展查询
    graph.current.__onSetMenuConfig = setMenuConfig; // 设置右键元素
    graph.current.__onSetToSpread = setToSpread; // 点击更多
    graph.current.__onCancelSelected = onCancelSelected; // 取消选中的元素
    graph.current.__onSetGraphMode = setGraphMode; // 切换图模式
    graph.current.__onClickAll = onClickAll; // 选择全部
    graph.current.__onOpenRightDrawer = onOpenRightDrawer; // 打开右侧抽屉
    graph.current.__onCloseRightDrawer = onCloseRightDrawer; // 关闭右侧抽屉
    graph.current.__onchangePathPoint = changePathColor; // 路径起点终点颜色
    graph.current.__stopRender = () => canvas.current.changeData({ nodes: [], edges: [] }); // 停止渲染, 置空
    graph.current.__faker = selectedItem.faker;
    registerSubGroup(graph.current);
  };
  useEffect(() => {
    mountGraph();
    selectedItem.apis = registerApis(selectedItem);
    if (graph.current) graph.current.__configMenu = configMenu;
  }, [selectedItem, JSON.stringify(configMenu)]);

  /** 更新栈信息 */
  const onStackChange = () => {
    return Promise.resolve().then(() => {
      const stack = graph.current.graphStack.getStackData();
      const redoStack = stack?.redoStack;
      const undoStack = stack?.undoStack;
      const length = redoStack?.length + undoStack?.length;
      onChangeData({ type: 'stack', data: { redoStack, undoStack, length } });
    });
  };

  useEffect(() => {
    if (!canvas.current) return;

    canvas.current.Source = selectedItem?.graphData || { nodes: [], edges: [] };
    if (graph.current.__canvasRefresh === false) {
      graph.current.__canvasRefresh = true;
      return;
    }

    graph.current.__canvasRefresh = true;
    canvas.current.changeData(selectedItem?.graphData, {}, () => {
      _.forEach(graph.current.getNodes(), item => {
        const model = item.getModel();
        if (model._sourceData?.isLock) item.lock();
      });
    });
  }, [JSON.stringify(selectedItem?.graphData)]);

  // 画布背景色调整后边类的label背景色随之调整
  useEffect(() => {
    if (!canvas.current) return;
    canvas.current.DefaultStyle = { node: {}, edge: { labelBackgroundColor: backColor } };
    _.forEach(graph.current.getEdges(), item => {
      const sourceData = item.getModel()?._sourceData;
      if (!sourceData) return;
      item.update({ _sourceData: { ...sourceData, labelBackgroundColor: backColor } });
    });
  }, [JSON.stringify(selectedItem?.graphConfig?.color)]);

  // 移动图，使得 item 对齐到视口中心
  useEffect(() => {
    if (!selectedItem?.focusItem?._cfg) return;
    _.forEach(graph.current.getNodes(), item => {
      setOriginSize(item);
      graph.current.clearItemStates(item);
    });
    _.forEach(graph.current?.getEdges(), item => {
      setOriginSize(item);
      graph.current.clearItemStates(item);
    });

    graph.current.setItemState(selectedItem?.focusItem, '_focus', true);

    graph.current.focusItem(selectedItem?.focusItem, true, {
      easing: 'easeCubic',
      duration: 800
    });
  }, [selectedItem?.focusItem]);

  /** 渲染树型布局 */
  const renderTree = () => {
    registerNodeText('nodeText');
    registerLinePolyline('customPolyline');
    registerNodeCircle('customCircle');
    registerTreeNodeRect('customRect');
    registerNodeDiamond('customDiamond');
    registerGroupBehavior();
    registerPathBehavior(undefined, onChangeData);
    const sourceData = selectedItem?.graphData || { nodes: [], edges: [] };
    canvas.current = new LayoutTree({
      source: sourceData,
      cache: selectedItem?.graphStyle,
      config: selectedItem?.layoutConfig?.default,
      container: graphContainer.current
    });
  };
  /** 渲染层次布局 */
  const renderDagre = () => {
    registerEdgeAdd('add-edge', { explorePath });
    registerNodeCircle('customCircle');
    registerNodeRect('customRect');
    registerNodeDiamond('customDiamond');
    registerLineLine('customLine');
    registerLineLoop('customLineLoop');
    registerLineQuadratic('customLineQuadratic');
    registerGroupBehavior();
    registerPathBehavior(undefined, onChangeData);
    const sourceData = selectedItem?.graphData || { nodes: [], edges: [] };
    canvas.current = new LayoutDagre({
      source: sourceData,
      cache: selectedItem?.graphStyle,
      config: selectedItem?.layoutConfig?.default,
      container: graphContainer.current,
      defaultStyle: { node: {}, edge: { labelBackgroundColor: backColor } }
    });
  };

  /** 渲染力导布局 */
  const renderForce = () => {
    registerEdgeAdd('add-edge', { explorePath });
    registerNodeCircle('customCircle');
    registerNodeRect('customRect');
    registerNodeDiamond('customDiamond');
    registerLineLine('customLine');
    registerLineLoop('customLineLoop');
    registerLineQuadratic('customLineQuadratic');
    registerLayoutDrag('layoutDrag', { onChangeData });
    registerPathBehavior(undefined, onChangeData);
    const sourceData = selectedItem?.graphData || { nodes: [], edges: [] };
    canvas.current = new ForceFree({
      source: sourceData,
      cache: selectedItem?.graphStyle,
      config: selectedItem?.layoutConfig?.default,
      container: graphContainer.current,
      defaultStyle: { node: {}, edge: { labelBackgroundColor: backColor } }
    });
  };

  /** 渲染自由布局 */
  const renderFree = () => {
    registerEdgeAdd('add-edge', { explorePath });
    registerNodeCircle('customCircle');
    registerNodeRect('customRect');
    registerNodeDiamond('customDiamond');
    registerLineLine('customLine');
    registerLineLoop('customLineLoop');
    registerLineQuadratic('customLineQuadratic');
    registerGroupBehavior();
    registerPathBehavior(undefined, onChangeData);
    const sourceData = selectedItem?.graphData || { nodes: [], edges: [] };
    canvas.current = new LayoutFree({
      source: sourceData,
      cache: selectedItem?.graphStyle,
      config: selectedItem?.layoutConfig?.default,
      container: graphContainer.current,
      defaultStyle: { node: {}, edge: { labelBackgroundColor: backColor } }
    });
  };

  useEffect(() => {
    if (!canvas.current || _.isEmpty(selectedItem?.graphStyle)) return;
    canvas.current.Cache = selectedItem?.graphStyle;
    registerLegend.updateLegend(graph, selectedItem?.graphStyle?.node);
    // registerLegend(graph, selectedItem?.graphConfig?.hasLegend, selectedItem?.graphStyle?.node);
    // 给图谱 graph 挂载 Legend
  }, [JSON.stringify(selectedItem?.graphStyle)]);
  /** 切换布局 */
  useEffect(() => {
    if (canvas.current) canvas.current.removeEventListener();
    const key = selectedItem?.layoutConfig?.key;
    if (graph.current) graph.current.destroy();

    if (key === GRAPH_LAYOUT.TREE) {
      renderTree();
      graph.current = canvas.current.Graph;
      graph.current.__layoutKey = GRAPH_LAYOUT.TREE;
    } else if (key === GRAPH_LAYOUT.DAGRE) {
      renderDagre();
      graph.current = canvas.current.Graph;
      graph.current.__layoutKey = GRAPH_LAYOUT.DAGRE;
    } else if (key === GRAPH_LAYOUT.FORCE) {
      renderForce();
      graph.current = canvas.current.Graph;
      graph.current.__layoutKey = GRAPH_LAYOUT.FORCE;
    } else {
      renderFree();
      if (selectedItem?.layoutConfig?.initLayout === GRAPH_LAYOUT.FREE) {
        canvas.current.IsFirst = true;
        const _layout = selectedItem?.layoutConfig;
        delete _layout.initLayout;
        onChangeData({ type: 'layoutConfig', data: _layout });
      }
      graph.current = canvas.current.Graph;
      graph.current.__fitViewDirection = 'y';
      graph.current.__layoutKey = GRAPH_LAYOUT.FREE;
    }

    // 初始化之后, 如果有数据, 则立刻进行渲染
    if (!_.isEmpty(selectedItem?.graphData?.nodes)) {
      graph.current.__canvasRefresh = false;
      canvas.current.changeData(selectedItem?.graphData);
    }

    graph.current.graphStack.mount_onChange = onStackChange; // 给图谱的操作栈 graphStack 挂载监听函数
    onStackChange();
    mountGraph(); // 给图谱 graph 挂载属性和方法
    registerLegend(graph, selectedItem?.graphConfig?.hasLegend, selectedItem?.graphStyle?.node); // 给图谱 graph 挂载 Legend
    registerToolTip(graph); // 给图谱 graph 挂载 ToolTip
    registerGraphEvent({ graph, onChangeData, selectedItem }); // 给图谱 graph 挂载监听事件
    onChangeData({ type: 'graph', data: graph }); // 更新图谱列表中的图谱实例
  }, [selectedItem?.layoutConfig?.key]);

  // 初始化绘制图谱
  useEffect(() => {
    const resizeHandle = () => {
      const width = graphContainer.current?.clientWidth || 0;
      const height = graphContainer.current?.clientHeight || 0;
      graph.current?.changeSize(width, height);
    };
    window.addEventListener('resize', resizeHandle);
    // 仅禁用画布的默认右键菜单
    const preventMenu = (e: MouseEvent) => e.preventDefault();
    graphContainer.current?.addEventListener('contextmenu', preventMenu);
    return () => {
      window.removeEventListener('resize', resizeHandle);
      graphContainer.current?.removeEventListener('contextmenu', preventMenu);
    };
  }, []);

  /** 有数据添加时，修改 graphData */
  const onChangeGraphData_Add = () => {
    const graphData = selectedItem?.graphData;
    const oldNodesKV = _.keyBy(graphData?.nodes, 'id');
    const nodesKV: any = _.pick(oldNodesKV, 'groupTreeNodeTemp');
    const oldEdgesKV: any = _.keyBy(graphData?.edges, 'id');

    setTimeout(() => {
      _.forEach(graph.current.getNodes(), item => {
        const { x, y, id, size, isAgencyNode, _sourceData } = item.getModel();
        if (isAgencyNode) return;
        nodesKV[id] = { size, ..._sourceData, x, y };
      });
      _.forEach(graph.current.getEdges(), d => {
        const { id, _sourceData } = d.getModel();
        if (!id) return;
        if (!_sourceData) return;
        if (oldEdgesKV[id]) {
          oldEdgesKV[id] = { ...oldEdgesKV[id], ..._sourceData };
        } else {
          oldEdgesKV[id] = _sourceData;
        }
      });
      graph.current.__canvasRefresh = false;
      onChangeData({ type: 'graphData', data: { nodes: _.values(nodesKV), edges: _.values(oldEdgesKV) } });
    });
  };

  /** 有数据删除时，修改 graphData */
  const onChangeGraphData_Delete = ({ nodes, edges }: any) => {
    const graphData = selectedItem?.graphData;
    const oldNodesKV = _.keyBy(nodes, 'id');
    const oldEdgesKV = _.keyBy(edges, 'id');

    setTimeout(() => {
      _.forEach(graphData?.nodes || [], item => {
        if (oldNodesKV?.[item?.id]) item.isDelete = true;
      });
      _.forEach(graphData?.edges || [], item => {
        if (oldEdgesKV?.[item?.id]) item.isDelete = true;
      });
      const newNodes = _.filter(graphData?.nodes || [], item => {
        const isDelete = item.isDelete;
        delete item.isDelete;
        return !isDelete;
      });
      const newEdges = _.filter(graphData?.edges || [], item => {
        const isDelete = item.isDelete;
        delete item.isDelete;
        return !isDelete;
      });
      // graph.current.__canvasRefresh = false;
      onChangeData({ type: 'graphData', data: { nodes: newNodes, edges: newEdges } });
    });
  };

  const { hGap, vGap, limit, direction, isGroup, align, nodesep, ranksep, linkDistance, nodeStrength } =
    selectedItem?.layoutConfig?.default || {};
  HOOKS.useUpdateEffect(() => {
    canvas.current.Config = selectedItem?.layoutConfig?.default;
    canvas.current.changeConfig(selectedItem?.layoutConfig?.default);
  }, [hGap, vGap, direction, align, nodesep, ranksep, linkDistance, nodeStrength]);
  HOOKS.useUpdateEffect(() => {
    canvas.current.Config = selectedItem?.layoutConfig?.default;
    if (_.isEmpty(selectedItem?.graphData?.nodes)) return;
    canvas.current.changeData(selectedItem?.graphData || { nodes: [], edges: [] });
  }, [isGroup]);
  HOOKS.useUpdateEffect(() => {
    canvas.current.Config = selectedItem?.layoutConfig?.default;
    if (_.isEmpty(selectedItem?.graphData?.nodes)) return;
    const graphData = selectedItem?.graphData || { nodes: [], edges: [] };
    _.forEach(graphData.nodes, item => {
      item.limit = limit;
    });
    canvas.current.changeData(selectedItem?.graphData || { nodes: [], edges: [] });
  }, [limit]);

  /** 点击更多 */
  const groupLimit = useRef<any>({});
  useEffect(() => {
    if (toSpread.index === 0) return;
    const data = toSpread.data;
    const targetMore = data._cfg.model;
    if (targetMore.isGroup) {
      const graphShapes = selectedItem?.apis?.getGraphShapes();
      _.forEach(graphShapes?.nodes, d => {
        const item = d.getModel();
        if (!item.isMore) return;
        if (item.group === targetMore.group) {
          groupLimit.current[item.group] = item.limit + limit;
        } else {
          groupLimit.current[item.group] = item.limit;
        }
      });
      const graphData = selectedItem?.graphData || { nodes: [], edges: [] };
      canvas.current.changeData(graphData, { groupLimit: groupLimit.current });
    } else {
      const graphData = selectedItem?.graphData || { nodes: [], edges: [] };
      _.forEach(graphData.nodes, item => {
        if (item.id === targetMore.fatherId) item.limit = item.limit + limit || limit + limit;
      });
      canvas.current.changeData(graphData);
    }
  }, [toSpread.index]);

  /** 添加点 */
  const addItem = useCallback(
    _.debounce((addData, graphData) => {
      graph.current?.__removeSubGroups();
      canvas.current.add(addData, (nodes, edges) => {
        if (!graphData?.nodes?.length) onTriggerLoading(false);
        onChangeData({ type: 'add', data: {} });
        onChangeData({ type: 'selected', data: { nodes, edges, length: nodes.length + (edges?.length || 0) } });
        onChangeGraphData_Add();
      });
      setMenuConfig(null);
    }),
    []
  );
  useEffect(() => {
    if (_.isEmpty(selectedItem?.add)) return;
    if (_.isEmpty(selectedItem?.add?.nodes) && _.isEmpty(selectedItem?.add?.edges)) return;
    if (!selectedItem?.graphData?.nodes?.length) onTriggerLoading(true);
    addItem(selectedItem?.add, selectedItem?.graphData);
  }, [JSON.stringify(selectedItem?.add)]);

  // 删除元素
  useEffect(() => {
    if (!selectedItem?.delete) return;
    const nodes = selectedItem?.delete?.nodes;
    const edges = selectedItem?.delete?.edges;

    if (_.isEmpty(nodes) && _.isEmpty(edges)) return;
    canvas.current.delete({ nodes, edges }, (deleteData: any) => {
      getSelectedItems();
      onChangeGraphData_Delete(deleteData);
    });

    onChangeData({ type: 'delete', data: { nodes: [], edges: [], length: 0 } });
  }, [
    selectedItem?.delete?.length,
    selectedItem?.delete?.nodes?.[0]?._cfg?.id,
    selectedItem?.delete?.edges?.[0]?._cfg?.id
  ]);

  // 图例开关
  useEffect(() => {
    if (!graph.current) return;
    if (selectedItem?.graphConfig?.hasLegend) {
      registerLegend(graph, true, selectedItem?.graphStyle?.node);
    } else {
      const selectedLength = registerLegend.cleanSelected(graph);
      registerLegend.cancel(graph);
      if (selectedLength) {
        const graphShapes = selectedItem?.apis?.getGraphShapes();
        _.forEach(graphShapes?.nodes, item => graph.current.clearItemStates(item, '_shallow'));
        _.forEach(graphShapes?.edges, item => graph.current.clearItemStates(item, '_shallow'));
      }
    }
  }, [selectedItem?.graphConfig?.hasLegend]);

  // 给选中的数据加状态
  useEffect(() => {
    registerLegend.cleanSelected(graph);
    _.forEach(graph.current.getNodes(), item => {
      setOriginSize(item);
      graph.current.clearItemStates(item);
    });
    _.forEach(graph.current?.getEdges(), item => {
      setOriginSize(item);
      graph.current.clearItemStates(item);
    });
    _.forEach(selectedItem?.selected?.edges, item => {
      if (item._cfg) graph.current.setItemState(item, 'selected', true);
    });
    _.forEach(selectedItem?.selected?.nodes, item => {
      if (item._cfg) graph.current.setItemState(item, 'selected', true);
    });
  }, [selectedItem?.selected?.time]);

  /** 切换模式：默认模式、添加边、添加点 */
  useEffect(() => {
    if (!graph.current) return;
    graph.current.setMode(graphMode);
  }, [graphMode]);

  /** 外观设置 */
  useEffect(() => {
    if (_.isEmpty(selectedItem?.config)) return;
    onChangeConfig({
      graph,
      config: selectedItem?.config,
      graphData: selectedItem.graphData,
      layout: selectedItem?.layoutConfig,
      onChangeData
    });
  }, [JSON.stringify(selectedItem?.config)]);

  /** 外观设置 */
  useEffect(() => {
    if (selectedItem?.path?.changeStyle && selectedItem?.path?.byCanvas) {
      //
      const { start, end } = selectedItem?.path;

      const startItem = graph?.current?.findById(start?.id);
      const endItem = graph?.current?.findById(end?.id);
      graph.current?.clearItemStates(startItem);
      graph.current?.clearItemStates(endItem);
      graph.current.setItemState(startItem, '_path', true);
      graph.current.setItemState(endItem, '_path', true);
    }
  }, [selectedItem?.path?.changeStyle]);

  /** 渲染起点终点样式 */
  const changePathColor = () => {
    if (selectedItem?.path?.changeStyle) {
      const { start, end } = selectedItem?.path;

      const startItem = graph?.current?.findById(start?.id);
      const endItem = graph?.current?.findById(end?.id);
      if (!startItem || !endItem) return;
      graph.current?.clearItemStates(startItem);
      graph.current?.clearItemStates(endItem);
      graph.current.setItemState(startItem, '_path', true);
      graph.current.setItemState(endItem, '_path', true);

      if (!graph.current.renderGraph) {
        graph.current.renderGraph = 1;
        return;
      }
      if (graph.current.renderGraph === 1) {
        graph.current.renderGraph = 0;
        onChangeData({ type: 'path', data: { changeStyle: false } });
      }
    }
  };

  /** 更新选中数据 */
  const getSelectedItems = () => {
    Promise.resolve().then(() => {
      let nodes = graph.current.findAllByState('node', 'selected');
      let edges = graph.current.findAllByState('edge', 'selected');
      nodes = _.unionBy(nodes, d => d?._cfg?.id);
      edges = _.unionBy(edges, d => d?._cfg?.id);
      const length = nodes?.length + edges?.length;

      onChangeData({ type: 'selected', data: { nodes, edges, length } });
    });
  };

  const getLayerFromZoom = (oldZoom: number, newZoom: number) => {
    let layer = 3;
    if (oldZoom > 50 && newZoom <= 50) {
      layer = 1;
      _.forEach(graph.current.getNodes(), item => {
        item.getModel().layer = layer;
        item.refresh();
      });
      _.forEach(graph.current.getEdges(), item => {
        item.getModel().layer = layer;
        item.refresh();
      });
    }
    if ((oldZoom < 50 && newZoom >= 50) || (oldZoom > 80 && newZoom <= 80)) {
      layer = 2;
      _.forEach(graph.current.getNodes(), item => {
        item.getModel().layer = layer;
        item.refresh();
      });
      _.forEach(graph.current.getEdges(), item => {
        item.getModel().layer = layer;
        item.refresh();
      });
    }
    if (oldZoom < 80 && newZoom >= 80) {
      layer = 3;
      _.forEach(graph.current.getNodes(), item => {
        item.getModel().layer = layer;
        item.refresh();
      });
      _.forEach(graph.current.getEdges(), item => {
        item.getModel().layer = layer;
        item.refresh();
      });
    }

    return layer;
  };

  /** 更新画布缩放 */
  const getZoom = () => {
    const zoom = graph.current.getZoom();
    const oldZoom = selectedItem.zoom * 100;
    const newZoom = zoom * 100;
    const layer = getLayerFromZoom(oldZoom, newZoom);

    if (layer >= 3 && Math.floor(selectedItem.zoom || 1) !== Math.floor(zoom)) {
      _.forEach(graph.current.getNodes(), item => {
        item.getModel().zoom = zoom;
        item.refresh();
      });
    }
    onChangeData({ type: 'zoom', data: zoom });
  };

  /** 清空状态前 需要将 _focus 的大小复原 */
  const setOriginSize = (item: any) => {
    if (_.includes(item?.getStates(), '_focus')) {
      if (item?.getModel()?.type === 'circle') {
        const size = item?.getModel()?.size / 1.1; // 恢复居中之前的大小
        graph.current.updateItem(item, { size }, false);
      } else {
        const size = item?.getModel()?.size;
        graph.current.updateItem(item, { size: size / 1.1 }, false);
      }
    }
  };

  /** 探索路径 */
  const explorePath = data => {
    setGraphMode('default');
    onChangeData({ type: 'path', data: { ...data, direction: graph.current.direction, changeStyle: false } });
  };

  /** 画布中选择起点 */
  const onSetStartNode = (dir: string) => {
    setMenuConfig(null); // 关闭右键弹窗
    graph.current.direction = dir; // 保存路径的方向

    setTimeout(() => {
      graph.current.__selectedNode.__cannotSelected = true;
      graph?.current?.emit('node:click', { item: graph.current.__selectedNode }); // 开启建边模式后立即触发该点类
    }, 100);
  };

  /** 双击展开 */
  const onDbClickNodes = async node => {
    if (node?.type === 'nodeText') return;
    const customDblClick = _.find(configMenu?.node?.click, item => {
      return item.class === node?._sourceData?.class && item.doubleEvent && item.checked;
    });
    if (customDblClick) return onClickCustom(customDblClick); // 当自定义双击事件后替换为自定义的事件

    const hasDblClick = _.find(configMenu?.node?.dblClick, item => item.checked);
    if (hasDblClick?.func) return onClickCustom(hasDblClick);
    // 如果没有选中双击事件则不触发双击
    if (configMenu && !hasDblClick) return;

    if (!graph.current.__authorKgView) return;
    const id = selectedItem?.detail?.kg?.kg_id || getParam('graphId');
    if (!parseInt(id)) return;
    try {
      const data = { id: `${id}`, direction: 'positive', vids: [node.id], page: 1, size: -1, steps: 1 };
      onChangeData({ type: 'exploring', data: { isExploring: true } });
      const res = await servicesExplore.getNeighbors(data);
      onChangeData({ type: 'exploring', data: { isExploring: false } });
      if (!res?.res?.nodes?.length) return message.warning(intl.get('searchGraph.expandDblclickNull'));
      // 报错
      if (res?.res?.ErrorCode) return message.error(res?.res?.Description);
      if (res?.res) {
        const { graph } = parseCommonResult(res.res);
        if (res?.res?.length > 500) {
          confirm({ addNodes: graph.nodes, addEdges: graph.edges });
          return;
        }

        onChangeData({
          type: 'add',
          data: { ...graph, time: new Date().valueOf() }
        });
      }
    } catch (error) {
      onChangeData({ type: 'exploring', data: { isExploring: false } });
      if (error?.type === 'message') {
        const { Description } = error.response?.res || error.response;
        Description && message.error(Description);
      }
    }
  };

  /** 选中相同类 */
  const onSelectSameClass = () => {
    const item = graph.current.__selectedNode?.getModel()?._sourceData;
    const type = graph.current.__selectedNode?._cfg?.type;
    const graphShapes = selectedItem?.apis?.getGraphShapes();

    let items = type === 'node' ? graphShapes?.nodes : graphShapes?.edges;
    items = _.filter(items, d => d?.getModel()?._sourceData.class === item?.class);
    let data = { length: items.length || 0 };
    if (type === 'node') data = { nodes: items, edges: [], length: items.length || 0 };
    if (type === 'edge') data = { nodes: [], edges: items, length: items.length || 0 };

    onChangeData({ type: 'selected', data });
    onCloseMenu();
  };

  /** 移除选中点或边 */
  const onRemoveItem = () => {
    let nodes = selectedItem?.selected?.nodes || [];
    let edges = selectedItem?.selected?.edges || [];

    if (graph.current.__selectedNode?._cfg?.type === 'node') nodes.push(graph.current.__selectedNode);
    if (graph.current.__selectedNode?._cfg?.type === 'edge') edges.push(graph.current.__selectedNode);

    nodes = _.unionBy(nodes, d => d?._cfg?.id);
    edges = _.unionBy(edges, d => d?._cfg?.id);

    const length = (nodes?.length || 0) + (edges?.length || 0);
    onChangeData({ type: 'delete', data: { nodes, edges, length } });
    if (graph.current.getNodes()?.length === nodes?.length) {
      graph.current.__canvasRefresh = false;
    }

    onCloseMenu();
  };

  /** 隐藏选中点或边 */
  const onHideItem = () => {
    const itemCfg = graph.current.__selectedNode?._cfg;
    const graphData = selectedItem.apis.getGraphData({ filter: 'all' });
    const hidedNodeMap = _.keyBy(selectedItem.selected?.nodes, n => n?._cfg?.id);
    const hidedEdgeMap = _.keyBy(selectedItem.selected?.edges, e => e?._cfg?.id);
    if (itemCfg?.type === 'node') hidedNodeMap[itemCfg.id] = true;
    if (itemCfg?.type === 'edge') hidedEdgeMap[itemCfg.id] = true;
    const newNodes = _.map(graphData.nodes, d => {
      let hide = d.hide;
      if (hidedNodeMap[d.id]) {
        hide = true;
      }
      return { ...d, hide };
    });
    const newEdges = _.map(graphData.edges, d => {
      let hide = d.hide;
      if (hidedEdgeMap[d.id] || _.some(d.relation, id => hidedNodeMap[id])) {
        hidedEdgeMap[d.id] = true;
        hide = true;
      }
      return { ...d, hide };
    });
    _.forEach(graph.current.getNodes(), shape => {
      hidedNodeMap[shape?._cfg?.id] && shape?.hide();
    });
    _.forEach(graph.current.getEdges(), shape => {
      hidedEdgeMap[shape?._cfg?.id] && shape?.hide();
    });
    selectedItem?.graph?.current?.graphStack.pushStack('visible', {
      before: { ...graphData },
      after: { nodes: newNodes, edges: newEdges }
    });
    // graph.current.__canvasRefresh = false;
    onChangeData({ type: 'selected', data: { nodes: [], edges: [] } });
    onChangeData({ type: 'graphData', data: { nodes: newNodes, edges: newEdges } });
    setMenuConfig(null);
    selectedItem?.graph?.current?.__removeSubGroups();
  };

  /** 锁定 */
  const onLockNode = () => {
    let nodes = [...(selectedItem?.selected?.nodes || []), graph.current.__selectedNode];
    nodes = _.unionBy(nodes, d => d?._cfg?.id);
    const isLocked = graph.current?.__selectedNode?.hasLocked();
    const toStackBeforeNodes = [];
    const toStackAfterNodes = [];

    _.forEach(nodes, node => {
      const model = node?.getModel();
      if (!model) return;
      if (isLocked) {
        node.unlock();
        const _sourceData = model?._sourceData || {};
        toStackBeforeNodes.push({ id: model.id, _sourceData: { ..._sourceData, isLock: true } });

        const newData = { id: model.id, _sourceData: { ..._sourceData, isLock: false } };
        toStackAfterNodes.push(newData);
        graph.current.updateItem(node, newData);
      } else {
        node.lock();
        const _sourceData = model?._sourceData || {};
        toStackBeforeNodes.push({ id: model.id, _sourceData: { ..._sourceData, isLock: false } });

        const newData = { id: model.id, _sourceData: { ..._sourceData, isLock: true } };
        toStackAfterNodes.push(newData);
        graph.current.updateItem(node, newData);
      }
    });
    graph.current.graphStack.pushStack('update', {
      before: { nodes: toStackBeforeNodes, edges: [] },
      after: { nodes: toStackAfterNodes, edges: [] }
    });

    onCloseMenu();
  };

  /** 点击画布右键菜单功能 */
  const onClickCanvasMenu = (opType: any) => {
    const clearAll = async () => {
      if (selectedItem?.apis?.hasHided()) {
        const isOk = await tipModalFunc({
          iconChange: true,
          title: intl.get('global.tip'),
          content: intl.get('exploreGraph.hideTip')
        });
        if (!isOk) return;
      }
      const nodes = graph.current.getNodes();
      const edges = graph.current.getEdges();
      const length = (nodes?.length || 0) + (edges?.length || 0);
      onChangeData({ type: 'delete', data: { nodes, edges, length } });
    };
    switch (opType) {
      case 'clearAll':
        clearAll();
        break;
      case 'selectAll':
        onClickAll();
        break;
      case 'cancelAll':
        onCancelSelected('all');
        break;
      case 'cancelNode':
        onCancelSelected('node');
        break;
      case 'cancelEdge':
        onCancelSelected('edge');
        break;
      default:
        break;
    }
    onCloseMenu();
  };

  /** 选择全部 */
  const onClickAll = () => {
    const graphShapes = selectedItem?.apis?.getGraphShapes();
    const nodes = _.filter(graphShapes?.nodes, item => {
      if (item._cfg.model?.isMore) return false;
      if (item._cfg.model?.isAgencyNode) return false;
      return true;
    });
    const edges = _.filter(graphShapes?.edges, item => {
      if (item._cfg.model?.isMore) return false;
      if (item._cfg.model?.isGroup) return false;
      if (item._cfg.model?.isAgencyNode) return false;
      return true;
    });

    const length = (nodes?.length || 0) + (edges?.length || 0);
    onChangeData({ type: 'selected', data: { nodes, edges, length } });
  };

  /** 取消选中的元素 */
  const onCancelSelected = (type: any) => {
    const nodes = graph.current.findAllByState('node', 'selected');
    const edges = graph.current.findAllByState('edge', 'selected');

    if (type === 'all') {
      onChangeData({ type: 'selected', data: { nodes: [], edges: [], length: 0 } });
    }
    if (type === 'edge') {
      onChangeData({ type: 'selected', data: { nodes, edges: [], length: nodes.length || 0 } });
    }
    if (type === 'node') {
      onChangeData({ type: 'selected', data: { nodes: [], edges, length: edges.length || 0 } });
    }
  };

  /** 反选 */
  const onInvert = () => {
    const targetActive = _.includes(graph.current.__selectedNode?._cfg?.states, 'selected');
    let nodes = [];
    const graphShapes = selectedItem?.apis?.getGraphShapes();
    if (targetActive) {
      const selectedKV = _.keyBy(selectedItem?.selected || [], '_cfg.id');
      nodes = _.filter(graphShapes?.nodes, item => {
        if (item._cfg.model?.isMore) return false;
        const isActive = _.includes(item?._cfg?.states, 'selected');
        if (isActive) return false;
        if (selectedKV?.[item?._cfg?.id]) return false;
        return true;
      });
    } else {
      nodes = _.filter(graphShapes?.nodes, item => {
        if (item._cfg.model?.isMore) return false;
        if (item?._cfg.id === graph.current.__selectedNode?._cfg?.id) return false;
        const isActive = _.includes(item?._cfg?.states, 'selected');
        if (isActive) return false;
        return true;
      });
    }

    onChangeData({ type: 'selected', data: { nodes, edges: [], length: nodes.length || 0 } });
    onCloseMenu();
  };

  const onCloseMenu = (openAdv = false) => {
    onCloseRightDrawer();
    setMenuConfig(null);
  };
  const onChangeGraphMode = (key: string) => {
    setGraphMode(key);
  };

  /**
   * 数据量过大（超过500）提示
   * @param data 加入的数据
   */
  const confirm = async (data: { addNodes: any; addEdges: any }, func?: any) => {
    const { addNodes, addEdges } = data;
    onCloseMenu();
    const tipOk = await TipModal({});
    if (func && tipOk) return func();
    if (tipOk) {
      onChangeData({
        type: 'add',
        data: {
          nodes: addNodes,
          edges: addEdges,
          length: addEdges?.length + addNodes?.length,
          time: new Date().valueOf()
        }
      });
    }
  };

  /**
   * 右键点击自定义按钮
   * @param data
   */
  const onClickCustom = (data: any) => {
    const node = graph.current.__selectedNode?.getModel()?._sourceData;
    onCloseMenu();
    onChangeData({
      type: 'customRightClick',
      data: { visible: true, data: { ...data, node } }
    });
  };

  const [updateData, setUpdateData] = useState<any>({});
  const isVisibleDisplayModal = !_.isEmpty(updateData);
  const onOpenDisplayModal =
    ({ modalType, menuPosition }: { modalType: string; menuPosition: { x: number; y: number } }) =>
    (data: any) => {
      const {
        position = 'top',
        labelFill = '#000',
        labelType = 'adapt',
        labelLength = 15,
        labelFixLength = 160,
        showLabels
      } = data;
      const _data = {
        ...data,
        modalType,
        scope: 'one',
        position,
        labelFill,
        labelType,
        labelLength,
        labelFixLength,
        showLabels,
        menuPosition
      };
      if (data?.lineWidth) _data.size = data?.lineWidth;
      onCloseMenu();
      setUpdateData(_data);
    };
  const onCloseDisplayModal = () => setUpdateData({});
  const onUpdateStyle = (data: any) => {
    setUpdateData(data);
  };

  /**
   * 点击保存切片菜单
   * @param data 切片数据
   */
  const onSaveSliced = (data: any) => {
    setSliceOperateInfo({ visible: true, data });
  };

  /**
   * 样式弹窗需要屏幕坐标
   */
  const getClientXY = (position: { x: number; y: number }) => {
    const point = graph.current.getPointByCanvas(position.x, position.y);
    const client = graph.current.getClientByPoint(point.x, point.y);
    return client;
  };

  return (
    <div className="graphG6Root">
      <IconPreRender />
      <div className="graphContainer" ref={graphContainer} id="graphDetail" />
      {menuConfig?.x && (
        <MenuBox menuConfig={menuConfig} graphContainer={graphContainer}>
          {(position: { x: number; y: number }) => {
            if (menuConfig?.type === 'node') {
              return (
                <NodeMenu
                  config={configMenu?.node?.click}
                  onClickCustom={onClickCustom}
                  selectedItem={selectedItem}
                  selectedNode={graph.current.__selectedNode}
                  openTip={confirm}
                  onInvert={onInvert}
                  onLockNode={onLockNode}
                  onCloseMenu={onCloseMenu}
                  onRemoveItem={onRemoveItem}
                  onChangeData={onChangeData}
                  onSetStartNode={onSetStartNode}
                  onOpenLeftDrawer={onOpenLeftDrawer}
                  onSelectSameClass={onSelectSameClass}
                  onChangeGraphMode={onChangeGraphMode}
                  onOpenDisplayModal={onOpenDisplayModal({ modalType: 'node', menuPosition: getClientXY(position) })}
                  onSaveSliced={onSaveSliced}
                  onHideItem={onHideItem}
                />
              );
            }
            if (menuConfig?.type === 'edge') {
              return (
                <EdgeMenu
                  selectedItem={selectedItem}
                  config={configMenu?.edge}
                  onClickCustom={onClickCustom}
                  selectedNode={graph.current.__selectedNode}
                  onRemoveItem={onRemoveItem}
                  onSelectSameClass={onSelectSameClass}
                  onOpenDisplayModal={onOpenDisplayModal({ modalType: 'edge', menuPosition: getClientXY(position) })}
                  onSaveSliced={onSaveSliced}
                  onCloseMenu={onCloseMenu}
                  onOpenLeftDrawer={onOpenLeftDrawer}
                  onHideItem={onHideItem}
                />
              );
            }
            if (menuConfig?.type === 'canvas') {
              return (
                <CanvasMenu
                  config={configMenu?.canvas}
                  onClickCustom={onClickCustom}
                  selectedItem={selectedItem}
                  onClickCanvasMenu={onClickCanvasMenu}
                />
              );
            }
            if (menuConfig?.type === 'subGroup') {
              return (
                <SubGroupMenu
                  config={configMenu?.subgraph}
                  selectedItem={selectedItem}
                  targetShape={menuConfig.target}
                  onOpenLeftDrawer={onOpenLeftDrawer}
                  onSaveSliced={onSaveSliced}
                  onCloseMenu={onCloseMenu}
                  onChangeData={onChangeData}
                />
              );
            }
          }}
        </MenuBox>
      )}
      {isVisibleDisplayModal && (
        <DisplayModal
          config={getDefaultConfig({ rule: { visible: false } })}
          modalType={updateData.modalType}
          updateData={updateData}
          layoutType={selectedItem?.layoutConfig?.key}
          onCancel={onCloseDisplayModal}
          onChangeData={onChangeData}
          onUpdateStyle={onUpdateStyle}
        />
      )}
      <SlicedOperateModal
        {...sliceOperateInfo}
        selectedItem={selectedItem}
        onChangeData={onChangeData}
        onCancel={() => {
          setSliceOperateInfo({ visible: false, data: {} });
          setMenuConfig(null);
        }}
      />
    </div>
  );
};

export default GraphG6;
