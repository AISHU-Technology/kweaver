import React, { useRef, useState, useEffect } from 'react';
import _ from 'lodash';
import G6, { type Graph as G6Graph } from '@antv/g6';

import HOOKS from '@/hooks';
import { registerEdgeAdd, toolTipWorkFlow, registerCheckedEdge, registerModelNode } from '@/utils/antv6';
import { onNodeClick, onEdgeClick, removeState, changeItemState, changeBrushSelectState } from './activate';
import { uniqNodeId, uniqEdgeId, constructGraphData, getSelectedStyles, handleParallelEdges } from '../assistant';

import { GraphData, BrushData } from '../types/data';
import { GraphPattern, OperationKey } from '../types/keys';
import { ItemAdd, ItemDelete, ItemUpdate, UpdateGraphData, ItemSelected } from '../types/update';
import './style.less';

let timer: any = null;
const brushSelectMode = {
  type: 'brush-select',
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
    default: [brushSelectMode, 'drag-canvas', 'zoom-canvas', 'drag-node'],
    addEdge: ['add-edge', 'drag-canvas', 'zoom-canvas', 'drag-node'],
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
    type: 'circle',
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

export interface CanvasG6Props {
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
  onBrushSelect: (graph: GraphData, action: 'brush' | 'click') => void; // 框选回调
  validateSelectItem?: () => Promise<boolean>; // 校验编辑的点
  onCanvasClick: () => void; // 点击空白画布
}

const CanvasG6 = (props: CanvasG6Props) => {
  const graph = useRef<G6Graph>();
  const graphContainer = useRef<HTMLDivElement>(null);
  const isRendered = useRef(false);
  const selfProps = useRef<CanvasG6Props>(props);
  selfProps.current = props; // 缓存整个props引用, 解决闭包问题

  const {
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

  // 图谱初始化
  useEffect(() => {
    drawGraph();
    const resize = () => {
      if (!graph.current || !graphContainer.current) return;
      graph.current?.changeSize(graphContainer.current.clientWidth, graphContainer.current.clientHeight);
    };
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
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
    const { type, items } = itemsAdd;
    if (type === 'node') addGraphNode(items);
    if (type === 'edge') addGraphEdge(items);
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
        if (_sourceData.uid === itemSelected?.uid) selfProps.current.onChangeSelectedItem({ ...itemSelected, ...d });
        const newSourceData = { ..._sourceData, ...d };
        nodes.push(newSourceData);
        graph.current?.updateItem(item, { label: d.alias, style: { fill: d.color }, _sourceData: newSourceData });
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
        graph.current?.updateItem(item, { type, style, label: d?.alias, color: d?.color, _sourceData: newSourceData });
      });
    }
    selfProps.current.onUpdateGraphData({
      operation: 'update',
      updateData: { type, items: type === 'node' ? nodes : type === 'edge' ? edges : [...nodes, ...edges] }
    });
  }, [JSON.stringify(itemsUpdate)]);

  // 添加节点
  const addGraphNode = (items: any[]) => {
    // 获取最大点位，来确定新添加点的位置
    const maxPoint = { x: window.innerWidth / 2 - 100, y: window.innerHeight / 2 + 36 };
    _.forEach(graph.current?.getNodes(), d => {
      const item = d.getModel();
      if (item.x! > maxPoint.x) maxPoint.x = item.x!;
      if (item.y! > maxPoint.y) maxPoint.y = item.y!;
    });

    const nodes: any[] = [];
    _.forEach(items, (item, i: number) => {
      const { uid = uniqNodeId(), name, alias, color: rColor, colour } = item;
      const newNodeData: any = {
        ...item,
        uid,
        name,
        alias: alias || name,
        color: rColor || colour,
        source_table: [],
        properties_index: ['name'],
        properties: [['name', 'string']]
      };
      if (item.x) newNodeData.x = item.x;
      if (item.y) newNodeData.y = item.y;
      if (item.source_table) newNodeData.source_table = item.source_table;
      if (item.task_id) newNodeData.task_id = item.task_id;
      if (item.properties) newNodeData.properties = item.properties;
      if (item.properties_index) newNodeData.properties_index = item.properties_index;
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
        _sourceData: newNodeData
      });
    });

    if (nodes.length === 1 && !nodes[0]?.name) {
      onNodeClick(graph.current!, nodes[0]);
      selfProps.current.onChangeSelectedItem({ ...nodes[0], eventType: 'click' });
    }
    selfProps.current.onUpdateGraphData({ operation: 'add', updateData: { type: 'node', items: nodes } });
  };

  /**
   * 添加边类
   * WARMING 在处理平行边情况时, 使用的是边的模型数据作比对, 用G6内置的processParallelEdges函数处理
   * 直接修改了模型数据的引用, 最终重绘时显示正常, 实际上未调用update方法, 这是比较hack的修改方式
   * @param items 新的边数据
   * @param type 如果存在表示是 `新建边`, 否则是批量建边
   */
  const addGraphEdge = (items: any[], type?: string) => {
    const edgesModel = _.map(graph.current?.getEdges(), d => d.getModel());
    if (type === 'update') {
      const item = items[0];
      const edge = graph.current?.findById(item.uid);
      if (!edge) return;
      handleParallelEdges([item, ...edgesModel]);
      const { color, name, alias, source, target } = item;
      const isLoop = source === target;
      graph.current?.updateItem(edge, {
        ...item,
        label: alias || name,
        style: { endArrow: { fill: color, path: G6.Arrow.triangle(8, 10, isLoop ? 0 : 10) } },
        stateStyles: { selected: { ...getSelectedStyles('edge') } },
        _sourceData: item
      });
      onEdgeClick(graph.current!, item);
      selfProps.current.onChangeSelectedItem(item);
      selfProps.current.onUpdateGraphData({ operation: 'add', updateData: { type: 'edge', items: [item] } });
      // graph.current?.refresh();
      return;
    }
    const edges: any = [];
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
        properties_index: ['name'],
        properties: [['name', 'string']]
      };
      if (item.relations) newEdgeData.relations = item.relations;
      if (item.properties) newEdgeData.properties = item.properties;
      if (item.properties_index) newEdgeData.properties_index = item.properties_index;
      edges.push(newEdgeData);
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
    // graph.current?.refresh();
    selfProps.current.onUpdateGraphData({ operation: 'add', updateData: { type: 'edge', items: edges } });
  };

  const drawGraph = () => {
    registerEdgeAdd('add-edge', addGraphEdge);
    registerCheckedEdge();
    registerModelNode('model-circle');
    graph.current = new G6.Graph({
      plugins: [toolTipWorkFlow()],
      container: graphContainer.current || '',
      ...graphLayout
    });

    graph.current?.get('canvas').set('localRefresh', false);
    graph.current?.render();

    graph.current.on('beforelayout', () => {
      setIsLoading(true);
    });
    graph.current.on('afterlayout', () => {
      // graph.current.fitView(40, { onlyOutOfViewPort: true, direction: 'y' });
      timer = setTimeout(() => setIsLoading(false), 200);
    });
    graph.current.on('node:click', async (data: any) => {
      // console.log('点类click', data);
      const editingItem = selfProps.current.itemSelected;
      if (editingItem) {
        const isErr = await selfProps.current.validateSelectItem?.();
        if (isErr) return;
      }
      const mode = graph.current?.getCurrentMode();
      if (mode === 'addEdge') return;
      const item = data?.item?.getModel();
      if (mode === 'default') {
        onNodeClick(graph.current!, item?._sourceData);
        const curData = _.find(selfProps.current.graphData.nodes, node => node.uid === item?._sourceData.uid);
        selfProps.current.onChangeSelectedItem({ ...(curData || item?._sourceData), eventType: 'click' });
      }
      if (mode === 'brushSelect') {
        selfProps.current.onBrushSelect({ nodes: [item._sourceData], edges: [] }, 'click');
      }
    });
    graph.current.on('edge:click', async (data: any) => {
      // console.log('边类click', data);
      const editingItem = selfProps.current.itemSelected;
      if (editingItem) {
        const isErr = await selfProps.current.validateSelectItem?.();
        if (isErr) return;
      }
      const mode = graph.current?.getCurrentMode();
      if (mode === 'addEdge') return;
      const item = data?.item?.getModel();
      if (mode === 'default') {
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
      // console.log('框选', selectedItems);
      const { nodes, edges } = selectedItems;
      if (!select || !(nodes.length + edges.length)) return;
      const nodesData = nodes.map((shape: any) => shape.getModel()._sourceData);
      const edgesData = edges.map((shape: any) => shape.getModel()._sourceData);
      selfProps.current.onBrushSelect({ nodes: nodesData, edges: edgesData }, 'brush');
    });
    graph.current.on('canvas:click', async e => {
      selfProps.current.onCanvasClick();
      // console.log('空白', e);
      const editingItem = selfProps.current.itemSelected;
      if (editingItem) {
        const isErr = await selfProps.current.validateSelectItem?.();
        if (isErr) return;
      }
      if (graph.current?.getCurrentMode() === 'brushSelect') return;
      // console.log('点击空白');
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
  };

  return (
    <div className="canvasG6G6Root">
      <div className="graphContainer" ref={graphContainer} id="graphDetail" />
    </div>
  );
};

export default CanvasG6;
