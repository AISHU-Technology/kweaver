import _ from 'lodash';

const findAncestorElement = (target: any, ancestor?: any) => {
  let start = target;
  let isExisted = false;
  while (start.tagName !== 'BODY' && start.tagName !== 'INPUT' && start.tagName !== 'TEXTAREA' && !isExisted) {
    if (start === ancestor) isExisted = true;
    start = start.parentNode;
  }
  return isExisted;
};

const registerGraphEvent = ({ graph, onChangeData, selectedItem }: any) => {
  let isTriggerSelected = false; // [by DATA-393924] 用于解决 nodeselectchange 和 drag 的事件顺序问题

  // 事件监听: 布局前
  graph.current.on('beforelayout', () => {
    onChangeData({ type: 'isLoading', data: true });
  });

  // 事件监听: 布局后
  graph.current.on('afterlayout', () => {
    const animateTime = setInterval(() => {
      const isAnimating = graph?.current.isAnimating() || false;
      if (isAnimating === true) return;

      if (!graph.current.__isNotFitView) {
        const direction = graph.current.__fitViewDirection || 'y';
        graph.current.fitView(0, { onlyOutOfViewPort: true, direction }, { easing: 'easeCubic', duration: 400 });
        graph.current.fitCenter({ easing: 'easeCubic', duration: 400 });
      }
      graph.current.__isNotFitView = false;
      onChangeData({ type: 'isLoading', data: false });
      graph.current.__onchangePathPoint(); // 改变将起点终点样式
      graph.current?.__refreshSubGroup();

      setTimeout(() => graph.current.__onGetZoom(), 500);
      onChangeData({ type: 'isLoading', data: false });
      clearInterval(animateTime);
    }, 10);
  });
  /** node 操作 */
  // 事件监听: 节点-拖拽开始
  graph.current.on('node:dragstart', (data: any) => {
    if (graph.current.__layoutKey === 'force') return;
    const { x, y, id } = data.item.getModel();
    graph.current.__moveBefore = { x, y, id };
    graph.current.__onSetMenuConfig(null); // 清除右键菜单
  });
  // 事件监听: 节点-拖拽
  graph.current.on('node:drag', (data: any) => {});
  // 事件监听: 节点-拖拽结束
  graph.current.on('node:dragend', (data: any) => {
    if (graph.current.__layoutKey === 'force') return;
    const { x, y, id } = data.item.getModel();
    const before = graph.current.__moveBefore;
    graph.current.__moveBefore = null;
    if (x === before.x && y === before.y) return;
    const redoStack = graph.current.graphStack.getRedoStack();
    redoStack.clear();
    graph.current.graphStack.pushStack('update', {
      after: { nodes: [{ x, y, id }] },
      before: { nodes: [before] }
    });
  });
  // 事件监听: 节点-双击
  graph.current.on('node:dblclick', (data: any) => {
    if (graph.current.__faker) return;
    if (graph.current.__isLoading) return;
    if (data.item._cfg.model.isMore) return;
    clearTimeout(graph.current.__timer);
    graph.current.__onDbClickNodes(data?.item?._cfg?.model);
  });
  // 事件监听: 节点-单击
  graph.current.on('node:click', (data: any) => {
    if (graph.current.__faker) return;
    if (data.item.__cannotSelected) {
      delete data.item.__cannotSelected;
      return;
    }
    clearTimeout(graph.current.__timer);
    graph.current.__timer = setTimeout(() => {
      const item = data.item;
      if (item._cfg.model.isMore) return graph.current.__onSetToSpread({ index: new Date().valueOf(), data: item });
      if (item._cfg.model.isAgencyNode) return;
      if (item._cfg.currentShape === 'nodeText' && graph.current.__isGroup) return;

      const states = item?.getStates();
      let selectedNodes = graph.current.findAllByState('node', 'selected');
      let selectedEdges = graph.current.findAllByState('edge', 'selected');
      if (graph.current?.__keyString === 'Shift' || graph.current?.__keyString === 'Control') {
        if (states?.includes('selected')) {
          selectedNodes = _.filter(selectedNodes, d => d._cfg.id !== item._cfg.id);
        } else {
          selectedNodes.push(item);
        }
      } else {
        selectedNodes = [item];
        selectedEdges = [];
      }

      const length = (selectedNodes?.length || 0) + (selectedEdges?.length || 0);
      onChangeData({ type: 'selected', data: { nodes: selectedNodes, edges: selectedEdges, length } });
    }, 300); // WARMING 用于区分双击, 间隔太小会和双击一起触发
  });
  // 事件监听: 节点-鼠标移入节点上方
  graph.current.on('node:mouseover', (data: any) => {
    const item = data.item;
    if (item._cfg.model.isMore) return;
    if (item._cfg.model.isAgencyNode) return;

    graph.current.setItemState(item, '_hover', true);
  });
  // 事件监听: 节点-鼠标移除
  graph.current.on('node:mouseout', (data: any) => {
    const item = data.item;
    if (item._cfg.model.isMore) return;
    if (item._cfg.model.isAgencyNode) return;

    const states = item?.getStates();
    if (!states?.includes('_hover')) return;
    graph.current.clearItemStates(item, '_hover', true);
  });
  /** edge 操作 */
  // 事件监听: 边-单击
  graph.current.on('edge:click', (data: any) => {
    if (graph.current.__faker) return;
    const item = data.item;
    if (graph.current.__isGroup) return; // 分组的时候无边事件
    if (item._cfg.model.isMore) return;

    const states = item?.getStates();
    let selectedNodes = graph.current.findAllByState('node', 'selected');
    let selectedEdges = graph.current.findAllByState('edge', 'selected');
    if (graph.current?.__keyString === 'Shift' || graph.current?.__keyString === 'Control') {
      if (states?.includes('selected')) {
        selectedEdges = _.filter(selectedEdges, d => d._cfg.id !== item._cfg.id);
      } else {
        selectedEdges.push(item);
      }
    } else {
      selectedNodes = [];
      selectedEdges = [item];
    }

    const length = (selectedNodes?.length || 0) + (selectedEdges?.length || 0);
    onChangeData({ type: 'selected', data: { nodes: selectedNodes, edges: selectedEdges, length } });
  });
  // 事件监听: 边-鼠标移入节点上方
  graph.current.on('edge:mouseover', (data: any) => {
    const item = data.item;
    if (item._cfg.model.isMore) return;

    graph.current.setItemState(item, '_hover', true);
  });
  // 事件监听: 边-鼠标移出
  graph.current.on('edge:mouseout', (data: any) => {
    const item = data.item;
    if (item._cfg.model.isMore) return;

    const states = item?.getStates();
    if (!states?.includes('_hover')) return;
    graph.current.clearItemStates(item, '_hover', true);
  });

  /** canvas 操作 */
  // 事件监听: 画布-单击
  graph.current.on('canvas:click', () => {
    graph.current.__onCancelSelected('all');
    graph.current.__onSetMenuConfig(null); // 清除右键菜单
    graph.current.__onSetGraphMode('default'); // 切换默认模式
    graph.current.__onCloseRightDrawer(); // 关闭右侧统计
  });
  // 事件监听: 画布-拖拽
  graph.current.on('canvas:dragstart', () => {
    graph.current.__onSetMenuConfig(null); // 清除右键菜单
  });
  // 事件监听: 画布-拖拽结束
  graph.current.on('canvas:dragend', () => {
    // [by DATA-393924]  选中后触发失焦, 此事件后于 nodeselectchange
    if (isTriggerSelected) {
      isTriggerSelected = false;
    } else {
      (document.activeElement as HTMLElement)?.blur();
    }
  });
  // 事件监听: 画布-缩放
  graph.current.on('wheelzoom', () => {
    graph.current.__onGetZoom();
    graph.current.__onSetMenuConfig(null); // 清除右键菜单
  });

  // 事件监听: 右键
  graph.current.on('contextmenu', (data: any) => {
    if (graph.current.__isLoading) return;
    graph.current.__onSetMenuConfig(null); // 清除右键菜单
    const type = data?.item?._cfg?.type;
    if (type === 'edge' && (graph.current.__isGroup || data.item._cfg.model.isMore)) return;
    if (type === 'node' && (data?.item?._cfg?.model?.isAgencyNode || data.item._cfg.model.isMore)) return;
    if (data?.item) {
      graph.current.__selectedNode = data.item;
      graph.current.__onSetMenuConfig({ x: data?.canvasX, y: data?.canvasY, type });
    } else {
      if (data.target?.cfg?.shapeType === 'subGroup') {
        // 子图形状不规则, data.canvasX坐标不准确, 根据clientX转换计算点击位置
        const point = graph.current.getPointByClient(data.clientX, data.clientY);
        const { x, y } = graph.current.getCanvasByPoint(point.x, point.y);
        return graph.current.__onSetMenuConfig({ x, y, type: 'subGroup', target: data.target });
      }
      graph.current.__onSetMenuConfig({ x: data?.canvasX, y: data?.canvasY, type: 'canvas' });
    }
  });

  // 事件监听: 元素选中
  graph.current.on('nodeselectchange', ({ selectedItems, select }: any) => {
    // [by DATA-393924] 选中不触发触发失焦
    isTriggerSelected = true;
    if (!select) {
      (document.activeElement as HTMLElement)?.blur();
      return;
    }
    const nodes = graph.current.findAllByState('node', 'selected');
    const edges = graph.current.findAllByState('edge', 'selected');
    const nodesKV = _.keyBy(nodes, '_cfg.id');
    const edgesKV = _.keyBy(edges, '_cfg.id');

    (selectedItems?.nodes || [])?.forEach((item: any) => {
      if (item._cfg.model?.isMore) return false;
      if (item._cfg.model?.isAgencyNode) return false;
      if (!nodesKV[item._cfg.id]) nodes.push(item);
    });
    (selectedItems?.edges || [])?.forEach((item: any) => {
      if (item._cfg.model?.isMore) return false;
      if (item._cfg.model?.isGroup) return false;
      if (item._cfg.model?.isAgencyNode) return false;
      if (!edgesKV[item._cfg.id]) edges.push(item);
    });

    const length = (nodes?.length || 0) + (edges.length || 0);
    onChangeData({ type: 'selected', data: { nodes, edges, length } });
  });

  // 事件监听: 键盘-按下
  graph.current.on('keydown', (data: any) => {
    const isHeaderButton = findAncestorElement(data.target, document.querySelector('.headerOperationRoot'));
    const isLeftSpaceDrawer = findAncestorElement(data.target, document.querySelector('.leftSpaceDrawer'));

    if (!data.target.contains(graph.current.getContainer()) && !isHeaderButton && !isLeftSpaceDrawer) return;
    if (data?.key === 'Shift') {
      if (graph?.current?.__keyString !== 'Shift') graph.current.__keyString = 'Shift';
    }
    if (data?.key === 'Control') {
      if (graph?.current?.__keyString !== 'Control') graph.current.__keyString = 'Control';
    }
    if (data?.key === 'Control') {
      // Control 和其他的按键配合使用
      if (graph.current?.__keysetGroup?.trigger !== 'Control') {
        graph.current.__keysetGroup = { trigger: 'Control' };
      }
    }

    if (data?.key === 'Backspace' || data?.key === 'Delete') {
      if (graph.current.__isLoading) return;
      const nodes = graph.current.findAllByState('node', 'selected');
      const edges = graph.current.findAllByState('edge', 'selected');
      const length = nodes?.length + edges?.length;
      onChangeData({ type: 'delete', data: { nodes, edges, length, tabKey: selectedItem.key } });
    }
    if ((data?.key === 'a' || data?.key === 'A') && graph.current?.__keysetGroup?.trigger === 'Control') {
      // 全选
      data.preventDefault();
      if (graph.current?.__keysetGroup?.combinedKey !== 'a') {
        graph.current.__keysetGroup = { trigger: 'Control', combinedKey: 'a' };
        graph.current.__onClickAll();
        graph.current.__onOpenRightDrawer('');
      }
    }
    if ((data?.key === '-' || data?.key === '_') && graph.current?.__keysetGroup?.trigger === 'Control') {
      data.preventDefault();
      // 缩小
      const zoom = graph.current.getZoom();
      const toRatio = Math.max(zoom - 0.05, 0.05);
      graph.current.zoomTo(toRatio);
      graph.current.fitCenter();
      onChangeData({ type: 'zoom', data: toRatio });
    }
    if ((data?.key === '=' || data?.key === '+') && graph.current?.__keysetGroup?.trigger === 'Control') {
      data.preventDefault();
      // 放大
      const zoom = graph.current.getZoom();
      const toRatio = Math.min(zoom + 0.05, 4);
      graph.current.zoomTo(toRatio);
      graph.current.fitCenter();
      onChangeData({ type: 'zoom', data: toRatio });
    }
  });
  // 事件监听: 键盘-释放
  graph.current.on('keyup', (data: any) => {
    if (data?.key === 'Shift') graph.current.__keyString = undefined;
    if (data?.key === 'Control') graph.current.__keyString = undefined;
    if (data?.key === 'Control') graph.current.__keysetGroup = undefined;
    if (data?.key === 'a' || data?.key === 'A') graph.current.__keysetGroup = { trigger: 'Control' };
  });

  /**
   * TODO 这里可能会影响其他的某些事件
   * [by DATA-393924] 阻止节点和画布的mousedown, 不让实体下拉框失焦, 以实现点击自动填充的逻辑
   */
  graph.current.on('node:mousedown', (event: any) => {
    event.preventDefault();
  });
  graph.current.on('canvas:mousedown', (event: any) => {
    event.preventDefault();
  });

  /**
   * 更新、删除节点时, 实时计算更新子图包裹轮廓
   */
  graph.current.on('afterupdateitem', (...arg: any) => {
    graph.current?.__refreshSubGroup();
  });
  graph.current.on('afterremoveitem', (...arg: any) => {
    graph.current?.__removeSubGroups();
  });

  /**
   * 选中子图的事件回调
   */
  graph.current.on('onSubGroupSelected', (subGroup: any) => {
    const info = subGroup.cfg.info;
    const nodes = _.filter(graph.current.getNodes(), node => {
      const visible = node.get('visible');
      const model = node.get('model');
      return _.includes(info.nodes, model.id) && visible;
    });
    const nodeMap = _.keyBy(nodes, n => n._cfg?.id);
    const edges = _.filter(graph.current.getEdges(), edge => {
      const visible = edge.get('visible');
      const model = edge.get('model');
      return _.includes(info.edges, model.id) && visible && nodeMap[model?.source] && nodeMap[model?.target];
    });
    onChangeData({ type: 'selected', data: { nodes, edges, length: nodes.length + edges.length } });
  });
};

export default registerGraphEvent;
