/* eslint-disable max-lines */
import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import _ from 'lodash';
import G6, { type Graph as G6Graph } from '@antv/g6';

import IconPreRender from '@/components/IconPreRender';
import HOOKS from '@/hooks';
import { isDef } from '@/utils/handleFunction';
import { registerEdgeAdd, toolTipWorkFlow, registerCheckedEdge, registerIconNode } from '@/utils/antv6';
import {
  onNodeClick,
  onEdgeClick,
  removeState,
  changeItemState,
  changeBrushSelectState,
  addShadowByNode
} from './activate';
import { uniqNodeId, uniqEdgeId, constructGraphData, getSelectedStyles, handleParallelEdges } from '../assistant';
import { registerNodeHoverBehavior, registerEdgeHoverBehavior } from './registerHoverBehavior';

import MenuBox, { MenuConfig } from './MenuBox';

import { GraphData, BrushData } from '../types/data';
import { GraphPattern, OperationKey } from '../types/keys';
import { ItemAdd, ItemDelete, ItemUpdate, UpdateGraphData, ItemSelected } from '../types/update';
import './style.less';

let timer: any = null;
const brushSelectMode = {
  type: 'brush-select',
  trigger: 'shift',
  brushStyle: {
    fill: 'rgba(18, 110, 227, 0.04)',
    stroke: '#126EE3'
  },
  /**
   * 框选后自动添加的state, 这里随意指定, 指定后G6内部将不会控制内置`selected`状态
   * 后续手动控制`selected`状态及样式, 使其更`受控`, 否则其他事件可能会导致`selected`被清除
   */
  selectedState: 'xxx_selected'
};
const graphLayout = {
  linkCenter: true,
  modes: {
    // 默认可框选, 但完整的分组交互在`brushSelect`模式下处理
    default: [brushSelectMode, 'drag-canvas', 'zoom-canvas', 'drag-node', 'hover-node', 'hover-edge'],
    addEdge: ['add-edge', 'drag-canvas', 'zoom-canvas', 'drag-node', 'hover-node', 'hover-edge'],
    brushSelect: [brushSelectMode, 'drag-canvas', 'zoom-canvas', 'drag-node']
  },
  layout: {
    type: 'force',
    linkDistance: 200, // 可选，边长
    nodeStrength: -100, // 可选
    edgeStrength: 1, // 可选
    collideStrength: 1, // 可选
    preventOverlap: true,
    alpha: 0.8, // 可选
    alphaDecay: 0.028, // 可选
    alphaMin: 0.01 // 可选
  },
  defaultNode: {
    type: 'icon-node',
    style: { cursor: 'pointer', stroke: 'white', lineWidth: 3 },
    labelCfg: { position: 'top', offset: 7, style: { fill: '#000' } }
  },
  defaultEdge: {
    size: 1,
    color: '#000',
    style: { cursor: 'pointer', lineAppendWidth: 30 },
    loopCfg: { cursor: 'pointer', position: 'top', dist: 100 },
    labelCfg: { cursor: 'pointer', autoRotate: true, refY: 7, style: { fill: '#000' } }
  }
};

interface TGraph extends G6Graph {
  keyboard?: Record<string, any> & { ctrlKey: boolean; shiftKey: boolean };
}

export interface CanvasG6Ref {
  graph?: TGraph;
}

export interface CanvasG6Props {
  current: number; // 当前步骤
  graphData: GraphData; // 图数据
  graphPattern: GraphPattern; // 图模式
  itemsAdd: ItemAdd; // 添加的数据
  itemsUpdate: ItemUpdate; // 更新的数据
  itemSelected: ItemSelected; // 选择的数据
  itemsDelete: ItemDelete; // 删除的数据
  brushSelectData: BrushData; // 框选数据
  resetFlag?: any; // 触发重置画布的监听信号
  onChangePattern: (pattern: GraphPattern) => void; // 切换模式回调
  onUpdateGraphData: (data: UpdateGraphData) => void; // 更新图数据回调
  onChangeOperationKey: (key: OperationKey) => void; // 更改右侧面板回调
  onChangeSelectedItem: (data?: ItemSelected) => void; // 选择的数据变化回调
  onBrushSelect: (graph: BrushData, action: 'brush' | 'click' | 'multiClick') => void; // 框选回调
  validateSelectItem?: () => Promise<boolean>; // 校验编辑的点
  onCanvasClick: () => void; // 点击空白画布
}

const CanvasG6: React.ForwardRefRenderFunction<CanvasG6Ref, CanvasG6Props> = (props, ref) => {
  const graph = useRef<TGraph>();
  const graphContainer = useRef<HTMLDivElement>(null);
  const isRendered = useRef(false);
  const selfProps = useRef<CanvasG6Props>(props);
  selfProps.current = props; // 缓存整个props引用, 解决闭包问题
  const [menuConfig, setMenuConfig] = useState<MenuConfig>({} as MenuConfig); // 右键菜单
  const closeMenu = () => setMenuConfig({} as MenuConfig); // 关闭右键菜单

  const {
    current,
    graphData,
    graphPattern,
    itemsAdd,
    itemsDelete,
    itemsUpdate,
    itemSelected,
    brushSelectData,
    resetFlag = 0
  } = props;
  const [isLoading, setIsLoading] = useState(false);

  useImperativeHandle(ref, () => ({
    graph: graph.current
  }));

  // 图谱初始化
  useEffect(() => {
    drawGraph();

    // 画布宽高自适应
    const resize = () => {
      if (!graph.current || !graphContainer.current) return;
      graph.current.changeSize(graphContainer.current.clientWidth, graphContainer.current.clientHeight);
    };
    window.addEventListener('resize', resize);

    // 仅禁用画布的默认右键菜单
    const preventMenu = (e: MouseEvent) => e.preventDefault();
    graphContainer.current?.addEventListener('contextmenu', preventMenu);

    return () => {
      window.removeEventListener('resize', resize);
      graphContainer.current?.removeEventListener('contextmenu', preventMenu);
    };
  }, []);

  // 仅第一次取回数据时自动更新
  useEffect(() => {
    if (isRendered.current || !graphData.nodes?.length) {
      return;
    }
    isRendered.current = true;
    const data = constructGraphData(graphData);
    graph.current?.changeData(data);
    return () => clearTimeout(timer);
  }, [graphData]);

  // 监听键盘操作
  useEffect(() => {
    const keydownListener = (e: KeyboardEvent) => {
      const { ctrlKey, shiftKey, key, target } = e;
      if (!graph.current) return;
      if (!(target as HTMLElement)?.contains(graphContainer.current)) return;
      const { itemSelected, brushSelectData, graphPattern } = selfProps.current;
      const { onChangeSelectedItem, onUpdateGraphData, onBrushSelect } = selfProps.current;
      const { keyboard = {} } = graph.current;
      const curKey = key.toUpperCase();
      graph.current.keyboard = { ...keyboard, ctrlKey, shiftKey, [curKey]: true };

      // 全选
      if (graph.current.keyboard.ctrlKey && graph.current.keyboard.A) {
        e.preventDefault();
        const nodes = _.map(graph.current.getNodes(), (shape: any) => shape.getModel()._sourceData);
        const edges = _.map(graph.current.getEdges(), (shape: any) => shape.getModel()._sourceData);
        selfProps.current.onBrushSelect({ nodes, edges }, 'brush');
      }

      // 删除
      if (graph.current.keyboard.DELETE) {
        if (itemSelected) {
          graph.current.removeItem(itemSelected.uid);
          onChangeSelectedItem();
          changeBrushSelectState(graph.current!, undefined, true);
          onUpdateGraphData({
            operation: 'delete',
            updateData: { type: itemSelected.relations ? 'edge' : 'node', items: [itemSelected.uid] }
          });
          rePaintEdges();
          return;
        }
        const { nodes, edges } = brushSelectData;
        const selectedIds = _.map([...nodes, ...edges], d => d.uid);
        selectedIds.forEach(item => graph.current!.removeItem(item));
        onUpdateGraphData({ operation: 'delete', updateData: { type: 'all', items: selectedIds } });
        onBrushSelect({ nodes: [], edges: [], notRedraw: graphPattern !== 'brushSelect' }, 'brush');
        graphPattern !== 'brushSelect' && changeBrushSelectState(graph.current!, undefined, true);
        rePaintEdges();
      }
    };
    const keyupListener = (e: KeyboardEvent) => {
      if (!graph.current) return;
      const { keyboard = {} } = graph.current;
      const { ctrlKey, shiftKey, key } = e;
      const newKey = _.omit(keyboard, `${key.toUpperCase()}`);
      graph.current.keyboard = { ...newKey, ctrlKey, shiftKey };
    };
    window.addEventListener('keydown', keydownListener);
    window.addEventListener('keyup', keyupListener);
    return () => {
      window.removeEventListener('keydown', keydownListener);
      window.removeEventListener('keyup', keyupListener);
    };
  }, [current]);

  /** 切换模式：默认模式、添加边、添加点 */
  useEffect(() => {
    if (!graph.current) return;
    graph.current.setMode(graphPattern);
  }, [graphPattern]);

  useEffect(() => {
    if (!graph.current || !['default', 'brushSelect'].includes(graphPattern) || brushSelectData.notRedraw) return;
    changeBrushSelectState(graph.current, brushSelectData);
  }, [brushSelectData, graphPattern]);

  // 重置画布状态, 外部触发
  HOOKS.useUpdateEffect(() => {
    if (!graph.current) return;
    changeBrushSelectState(graph.current, undefined, true);
  }, [resetFlag]);

  /** 添加节点或者边类 */
  useEffect(() => {
    if (_.isEmpty(itemsAdd)) return;
    const { type, items, from } = itemsAdd;
    if (type === 'node') addGraphNode(items, from);
    if (type === 'edge') addGraphEdge(items, undefined, from);
    closeMenu();
  }, [itemsAdd]);

  useEffect(() => {
    if (!graph.current || graph.current?.getCurrentMode() === 'addEdge') return;
    // 操作节点时移除框选模式
    const brushBehaviors = itemSelected ? 'brush-select' : brushSelectMode;
    graph.current[itemSelected ? 'removeBehaviors' : 'addBehaviors']([brushBehaviors], 'default');
    if (!itemSelected || itemSelected?.eventType === 'click') return;

    // 外部选中
    (itemSelected.relations ? onEdgeClick : onNodeClick)(graph.current, itemSelected);
    graph.current.focusItem(itemSelected.uid);
  }, [JSON.stringify(itemSelected)]);

  /** 删除节点和边 */
  useEffect(() => {
    if (_.isEmpty(itemsDelete?.items) || !graph.current) return;
    const { type, items = [] } = itemsDelete;
    _.forEach(items, id => graph.current!.removeItem(id));
    selfProps.current.onChangeSelectedItem();
    selfProps.current.onUpdateGraphData({ operation: 'delete', updateData: { type, items } });
    removeState(graph.current);
    changeItemState(graph.current, itemSelected);
    rePaintEdges();
  }, [itemsDelete]);

  /** 修改数据 */
  useEffect(() => {
    if (_.isEmpty(itemsUpdate)) return;
    const { type, items = [] } = itemsUpdate;
    const nodes: any[] = [];
    const edges: any[] = [];

    if (type === 'node' || type === 'all') {
      _.forEach(items, d => {
        const item = graph.current?.find('node', (node: any) => node.getModel()?.id === d.uid);
        if (!item) return;
        const _sourceData = item.getModel()?._sourceData;
        const newSourceData = { ..._sourceData, ...d };
        nodes.push(newSourceData);
        graph.current?.updateItem(item, {
          label: d.alias,
          icon: d.icon,
          style: { fill: d.color },
          _sourceData: newSourceData
        });
        if (_sourceData.uid === itemSelected?.uid) {
          selfProps.current.onChangeSelectedItem({ ...itemSelected, ...d });
          // WARMING 自定义节点更新时会重绘节点导致阴影丢失, 所以阴影也要重绘
          addShadowByNode(graph.current!, _sourceData.uid);
        }
      });
      selfProps.current.onUpdateGraphData({ operation: 'update', updateData: { type: 'node', items: nodes } });
    }
    if (type === 'edge' || type === 'all') {
      _.forEach(items, d => {
        const item = graph.current?.find('edge', (edge: any) => edge.getModel()?.id === d.uid);
        if (!item) return;
        const _sourceData = item.getModel()?._sourceData;
        if (_sourceData.uid === itemSelected?.uid) selfProps.current.onChangeSelectedItem({ ...itemSelected, ...d });
        const newSourceData = { ..._sourceData, ...d };
        edges.push(newSourceData);

        const type = item?._cfg?.currentShape;
        const isLine = _sourceData?.source !== _sourceData?.target;
        const style = {
          endArrow: { fill: d?.color, path: G6.Arrow.triangle(8, 10, isLine ? 10 : 0) }
        };
        graph.current?.updateItem(item, {
          type,
          style,
          label: d?.alias,
          color: d?.color,
          icon: d.icon,
          _sourceData: newSourceData
        });
      });
    }
    selfProps.current.onUpdateGraphData({
      operation: 'update',
      updateData: { type, items: type === 'node' ? nodes : type === 'edge' ? edges : [...nodes, ...edges] }
    });
  }, [JSON.stringify(itemsUpdate)]);

  /**
   * 边类被删除后处理平行边, 可能存在曲线恢复直线的情况
   */
  const rePaintEdges = () => {
    const edgesModel = _.map(graph.current?.getEdges(), d => d.getModel());
    handleParallelEdges(edgesModel);
    graph.current?.refresh();
  };

  // 添加节点
  const addGraphNode = (items: any[], from?: string) => {
    // 获取最大点位，来确定新添加点的位置
    const maxPoint = { x: window.innerWidth / 2 - 100, y: window.innerHeight / 2 + 36 };
    _.forEach(graph.current?.getNodes(), d => {
      const item = d.getModel();
      if (item.x! > maxPoint.x) maxPoint.x = item.x!;
      if (item.y! > maxPoint.y) maxPoint.y = item.y!;
    });

    const nodes: any[] = [];
    _.forEach(items, (item, i: number) => {
      const { uid = uniqNodeId(), name, alias, color: rColor, colour, icon } = item;
      const newNodeData: any = {
        ...item,
        uid,
        name,
        alias: alias || name,
        color: rColor || colour,
        icon,
        source_table: [],
        properties_index: [],
        properties: [['', 'string']]
      };
      if (item.x) newNodeData.x = item.x;
      if (item.y) newNodeData.y = item.y;
      if (item.source_table) newNodeData.source_table = item.source_table;
      if (item.task_id) newNodeData.task_id = item.task_id;
      if (item.properties) newNodeData.properties = item.properties;
      if (item.properties_index) newNodeData.properties_index = item.properties_index;
      if (!item.default_tag) newNodeData.default_tag = newNodeData.properties[0]?.[0];
      const { color, x = maxPoint.x + (i + 1) * 100, y = (maxPoint.y + (i + 1) * 36) / 2 } = newNodeData;
      nodes.push(newNodeData);
      graph.current?.addItem('node', {
        x,
        y,
        id: uid,
        size: 36,
        label: alias || name,
        style: { fill: color },
        stateStyles: { selected: { ...getSelectedStyles('node') } },
        icon,
        _sourceData: newNodeData
      });
    });
    if (nodes.length === 1 && !nodes[0]?.name) {
      const selectCreatedNode = () => {
        onNodeClick(graph.current!, nodes[0]);
        selfProps.current.onChangeSelectedItem({ ...nodes[0], eventType: 'click' });
      };

      // WARMING 未知bug, 空画布首次创建点无法添加阴影
      if (!selfProps.current.graphData.nodes.length) {
        graph.current?.paint();
        setTimeout(() => {
          selectCreatedNode();
        }, 0);
      } else {
        selectCreatedNode();
      }
    }
    selfProps.current.onUpdateGraphData({ operation: 'add', updateData: { type: 'node', items: nodes } });
    if (selfProps.current.itemSelected || selfProps.current.graphPattern === 'brushSelect') return;
    if (from === 'task') {
      selfProps.current.onBrushSelect({ nodes, edges: [] }, 'brush');
    }
  };

  /**
   * 添加边类
   * WARMING 在处理平行边情况时, 使用的是边的模型数据作比对, 用G6内置的processParallelEdges函数处理
   * 直接修改了模型数据的引用, 最终重绘时显示正常, 实际上未调用update方法, 这是比较hack的修改方式
   * @param items 新的边数据
   * @param type 如果存在表示是 `新建边`, 否则是批量建边
   * @param from 来源
   */
  const addGraphEdge = (items: any[], type?: string, from?: string) => {
    const edgesModel = _.map(graph.current?.getEdges(), d => d.getModel());
    if (type === 'update') {
      const item = items[0];
      const edge = graph.current?.findById(item.uid);
      if (!edge) return;
      handleParallelEdges([item, ...edgesModel]);
      const { color, icon, name, alias, source, target } = item;
      const isLoop = source === target;
      graph.current?.updateItem(edge, {
        ...item,
        label: alias || name,
        icon,
        style: { endArrow: { fill: color, path: G6.Arrow.triangle(8, 10, isLoop ? 0 : 10) } },
        stateStyles: { selected: { ...getSelectedStyles('edge') } },
        _sourceData: item
      });
      onEdgeClick(graph.current!, item);
      selfProps.current.onChangeSelectedItem(item);
      selfProps.current.onUpdateGraphData({ operation: 'add', updateData: { type: 'edge', items: [item] } });
      return;
    }
    const edges: any[] = [];
    const nodeIds: any[] = [];
    _.forEach(items, item => {
      const { startId, endId, name, alias, color, startName, endName, uid = uniqEdgeId() } = item;
      const newEdgeData = {
        ...item,
        id: uid,
        uid,
        name,
        color,
        alias: alias || name,
        label: alias || name,
        target: endId,
        source: startId,
        relations: [startName, name, endName],
        properties_index: [],
        properties: []
      };
      if (item.relations) newEdgeData.relations = item.relations;
      if (item.properties) newEdgeData.properties = item.properties;
      if (item.properties_index) newEdgeData.properties_index = item.properties_index;
      edges.push(newEdgeData);
      nodeIds.push(startId, endId);
    });
    handleParallelEdges([...edges, ...edgesModel]);
    _.forEach(edges, edge => {
      const { color, startId, endId } = edge;
      const isLoop = startId === endId;
      graph.current?.addItem('edge', {
        ...edge,
        style: { endArrow: { fill: color, path: G6.Arrow.triangle(8, 10, isLoop ? 0 : 10) } },
        stateStyles: { selected: { ...getSelectedStyles('edge') } },
        _sourceData: edge
      });
    });
    selfProps.current.onUpdateGraphData({ operation: 'add', updateData: { type: 'edge', items: edges } });
    // 选中添加的边
    if (selfProps.current.itemSelected || selfProps.current.graphPattern === 'brushSelect' || !nodeIds.length) return;
    if (from === 'edge' || from === 'task') {
      const nodes = _.filter(selfProps.current.graphData.nodes, n => nodeIds.includes(n.uid));
      selfProps.current.onBrushSelect({ nodes, edges }, 'brush');
    }
  };

  /**
   * 初始化画布
   */
  const drawGraph = () => {
    registerEdgeAdd('add-edge', addGraphEdge);
    registerCheckedEdge();
    registerIconNode();
    registerNodeHoverBehavior('hover-node');
    registerEdgeHoverBehavior('hover-edge');
    graph.current = new G6.Graph({
      plugins: [toolTipWorkFlow()],
      container: graphContainer.current || '',
      ...graphLayout
    });

    graph.current.get('canvas').set('localRefresh', false);
    graph.current.data({ nodes: [], edges: [] });
    graph.current.render();
    graph.current.on('beforelayout', () => {
      setIsLoading(true);
    });
    graph.current.on('afterlayout', () => {
      timer = setTimeout(() => setIsLoading(false), 200);
    });
    graph.current.on('node:click', async (data: any) => {
      const editingItem = selfProps.current.itemSelected;
      if (editingItem) {
        const isErr = await selfProps.current.validateSelectItem?.();
        if (isErr) return;
      }
      const mode = graph.current?.getCurrentMode();
      if (mode === 'addEdge') return;
      const item = data?.item?.getModel();
      if (mode === 'default') {
        // 多选
        const { shiftKey, ctrlKey } = graph.current?.keyboard || {};
        if (!selfProps.current.itemSelected && (shiftKey || ctrlKey)) {
          selfProps.current.onBrushSelect({ nodes: [item._sourceData], edges: [] }, 'multiClick');
          return;
        }

        // 正常点击
        onNodeClick(graph.current!, item?._sourceData);
        const curData = _.find(selfProps.current.graphData.nodes, node => node.uid === item?._sourceData.uid);
        selfProps.current.onChangeSelectedItem({ ...(curData || item?._sourceData), eventType: 'click' });
      }
      if (mode === 'brushSelect') {
        selfProps.current.onBrushSelect({ nodes: [item._sourceData], edges: [] }, 'click');
      }
    });
    graph.current.on('edge:click', async (data: any) => {
      const editingItem = selfProps.current.itemSelected;
      if (editingItem) {
        const isErr = await selfProps.current.validateSelectItem?.();
        if (isErr) return;
      }
      const mode = graph.current?.getCurrentMode();
      if (mode === 'addEdge') return;
      const item = data?.item?.getModel();
      if (mode === 'default') {
        // 多选
        const { shiftKey, ctrlKey } = graph.current?.keyboard || {};
        if (!selfProps.current.itemSelected && (shiftKey || ctrlKey)) {
          selfProps.current.onBrushSelect({ nodes: [], edges: [item._sourceData] }, 'multiClick');
          return;
        }

        // 正常点击
        onEdgeClick(graph.current!, item?._sourceData);
        const curData = _.find(selfProps.current.graphData.edges, edge => edge.uid === item?._sourceData.uid);
        selfProps.current.onChangeSelectedItem({ ...(curData || item?._sourceData), eventType: 'click' });
      }
      if (mode === 'brushSelect') {
        const sourceNode = data?.item?.getSource()?.getModel();
        const targetNode = data?.item?.getTarget()?.getModel();
        const nodes = _.uniqBy([sourceNode?._sourceData, targetNode._sourceData], d => d.uid);
        selfProps.current.onBrushSelect({ nodes, edges: [item._sourceData] }, 'click');
      }
    });
    graph.current.on('nodeselectchange', ({ selectedItems, select }: any) => {
      closeMenu();
      const { nodes, edges } = selectedItems;
      if (!select || !(nodes.length + edges.length)) return;
      const nodesData = nodes.map((shape: any) => shape.getModel()._sourceData);
      const edgesData = edges.map((shape: any) => shape.getModel()._sourceData);
      selfProps.current.onBrushSelect({ nodes: nodesData, edges: edgesData }, 'brush');
    });
    graph.current.on('canvas:click', async e => {
      closeMenu();
      selfProps.current.onCanvasClick();
      const editingItem = selfProps.current.itemSelected;
      if (editingItem) {
        const isErr = await selfProps.current.validateSelectItem?.();
        if (isErr) return;
      }
      if (graph.current?.getCurrentMode() === 'brushSelect') return;
      selfProps.current.onChangeSelectedItem();
      selfProps.current.onChangeOperationKey('');
      selfProps.current.onChangePattern('default');
      removeState(graph.current!);
      changeItemState(graph.current!, itemSelected);
    });
    graph.current.on('aftermodechange', e => {
      // 切换正常模式后删除 `错误` 的边
      if (graph.current?.getCurrentMode() === 'default') {
        const edgeShapes = graph.current?.getEdges();
        const wrongEdge = _.find(edgeShapes, shape => {
          return !shape._cfg?.targetNode;
        });
        wrongEdge && graph.current.removeItem(wrongEdge);
      }
    });
    graph.current.on('contextmenu', (e: any) => {
      if (e?.item) {
        setMenuConfig({ x: e.canvasX, y: e.canvasY, shape: e.item });
      } else {
        closeMenu();
      }
    });
    graph.current.on('drag', () => {
      closeMenu();
    });
    graph.current.on('wheelzoom', () => {
      closeMenu();
    });
  };

  /**
   * 右键删除
   */
  const onDeleteByMenu = async () => {
    closeMenu();
    const { nodes, edges } = brushSelectData;
    const { shape } = menuConfig;
    const type = shape.getType();
    const { id } = shape.getModel();
    id === itemSelected?.uid && props.onChangeSelectedItem();
    const selectedIds = _.map([...nodes, ...edges], d => d.uid);

    if (!selectedIds.includes(id)) {
      graph.current!.removeItem(id);
      props.onUpdateGraphData({ operation: 'delete', updateData: { type, items: [id] } });
      rePaintEdges();
      return;
    }
    selectedIds.forEach(item => graph.current!.removeItem(item));
    props.onUpdateGraphData({ operation: 'delete', updateData: { type: 'all', items: selectedIds } });
    props.onBrushSelect({ nodes: [], edges: [], notRedraw: true }, 'brush');
    graphPattern !== 'brushSelect' && changeBrushSelectState(graph.current!, undefined, true);
    rePaintEdges();
  };

  return (
    <div className="flow3-canvasG6G6Root">
      <IconPreRender />
      <div className="graphContainer" ref={graphContainer} id="graphDetail" />
      {isDef(menuConfig.x) && (
        <MenuBox key={menuConfig.x} menuConfig={menuConfig} graphContainer={graphContainer} onDelete={onDeleteByMenu} />
      )}
    </div>
  );
};

export default forwardRef(CanvasG6);
