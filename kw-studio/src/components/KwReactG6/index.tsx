import _ from 'lodash';
import classNames from 'classnames';
import G6, { G6GraphEvent } from '@antv/g6';
import type { Graph, INode, IEdge } from '@antv/g6';
import KwResizeObserver from '@/components/KwResizeObserver';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

import registerLineLine from '@/pages/KnowledgeNetwork/OntologyLibrary/OntoCanvas/OntoG6/OntoCanvasG6/registerLineLine';
import registerLineLoop from '@/pages/KnowledgeNetwork/OntologyLibrary/OntoCanvas/OntoG6/OntoCanvasG6/registerLineLoop';
import registerNodeCircle from '@/pages/KnowledgeNetwork/OntologyLibrary/OntoCanvas/OntoG6/OntoCanvasG6/registerNodeCircle';
import registerLineQuadratic from '@/pages/KnowledgeNetwork/OntologyLibrary/OntoCanvas/OntoG6/OntoCanvasG6/registerLineQuadratic';
import registerItemHoverBehavior from '@/pages/KnowledgeNetwork/KnowledgeGraph/Workflow/KnowledgeMap/KMLeftContainer/OntologyG6/registerItemHoverBehavior';

import HOOKS from '@/hooks';
import { registerToolTip } from '@/utils/antv6';
import { generateG6GraphDataByOntologyData } from '@/components/KwReactG6/utils';

import './style.less';
import {
  ResizeProps,
  KwReactG6Props,
  KwReactG6RefProps,
  ReactG6EdgeDataProps,
  ReactG6NodeDataProps,
  ReactG6GraphDataProps
} from './types';
import KwG6ToolBar from './KwG6ToolBar';

const { useDeepCompareEffect, useLatestState } = HOOKS;

/**
 * 用于统一系统内部所有需要展示本体的地方
 * 第一步：组件默认接受的data是后端返回的本体数据（一个具有entity和edge两个属性的对象）
 * 第二步：组件内部会先将后端返回的本体数据处理成G6可以渲染的数据，第一步的原始数据会存在节点或边的_sourceData属性身上
 * 第三步：组件的各种事件，返回的节点或边数据，全是第二步经过处理之后的数据
 */
const KwReactG6 = forwardRef<KwReactG6RefProps, KwReactG6Props>((props, ref) => {
  const prefixCls = 'kw-react-g6';
  const {
    className,
    style,
    data,
    selectedItem,
    onItemSelect,
    onNodeClick,
    onEdgeClick,
    onCanvasClick,
    onNodeDragend,
    toolVisible = true
  } = props;
  const g6Container = useRef<HTMLDivElement>(null);
  const graph = useRef<Graph | null>(null);
  const [g6Init, setG6Init] = useState<boolean>(false);
  const [graphData, setGraphData] = useLatestState<ReactG6GraphDataProps>({ nodes: [], edges: [] });
  const [activeItem, setActiveItem] = useState<Array<ReactG6NodeDataProps | ReactG6EdgeDataProps>>([]);
  const selectedIsControl = 'selectedItem' in props;

  useImperativeHandle(ref, () => ({
    graphInstance: graph.current!,
    highlightNode,
    highlightEdge,
    clearHighlightItem: removeG6ItemState
  }));

  useEffect(() => {
    mounted();
    return () => {
      unMount();
    };
  }, []);

  /**
   * 本体数据转化为G6可渲染的数据格式
   */
  useDeepCompareEffect(() => {
    const g6Data = generateG6GraphDataByOntologyData(data);
    setGraphData(g6Data);
  }, [data]);

  /**
   * 更新图谱数据源
   */
  useDeepCompareEffect(() => {
    if (g6Init) {
      const newGraphG6Data = _.cloneDeep(graphData);
      // @ts-ignore
      graph.current?.changeData(newGraphG6Data);
    }
  }, [graphData, g6Init]);

  /** 元素的选中  受控 */
  useEffect(() => {
    if (selectedItem) {
      setActiveItem(selectedItem);
    }
  }, [selectedItem]);

  useEffect(() => {
    handleHighlightItem();
  }, [activeItem]);

  const mounted = () => {
    initG6GraphConfig();
  };

  const unMount = () => {
    handleRemoveEvents();
    graph.current?.destroy();
  };

  /**
   * 初始化G6的配置
   */
  const initG6GraphConfig = () => {
    registerItemHoverBehavior('hover-item');
    registerNodeCircle('customCircle');
    registerLineLine('customLine');
    registerLineLoop('customLoop');
    registerLineQuadratic('customQuadratic');
    graph.current = new G6.Graph({
      linkCenter: true,
      container: g6Container.current!,
      modes: { default: ['drag-canvas', 'zoom-canvas', 'drag-node', 'activate-node', 'activate-edge', 'hover-item'] },
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
    registerToolTip(graph, false);
  };

  /**
   * 绑定G6相关事件
   */
  const handleBindEvents = () => {
    graph.current?.on('node:click', handleNodeClick);
    graph.current?.on('edge:click', handleEdgeClick);
    graph.current?.on('canvas:click', handleCanvasClick);
    graph.current?.on('node:dragend', handleNodeDragend);
    graph.current?.on('afterchangedata', handleChangeDataComplete);
  };

  /**
   * 解绑G6相关事件
   */
  const handleRemoveEvents = () => {
    graph.current?.off('node:click', handleNodeClick);
    graph.current?.off('edge:click', handleEdgeClick);
    graph.current?.off('canvas:click', handleCanvasClick);
    graph.current?.off('node:dragend', handleNodeDragend);
    graph.current?.off('afterchangedata', handleChangeDataComplete);
  };

  /**
   * 调用 graph.changeData 之后会执行的时间
   * @param evt
   */
  const handleChangeDataComplete = (_: G6GraphEvent) => {
    setTimeout(() => {
      graph.current?.fitCenter();
    }, 300);
  };

  const handleNodeClick = (evt: G6GraphEvent) => {
    const nodeData = _.cloneDeep(evt.item.getModel()) as ReactG6NodeDataProps;
    onNodeClick?.({ nodeData, nodeInstance: evt.item as INode, graphInstance: graph.current! });
    if (selectedIsControl) {
      onItemSelect?.({ itemData: [nodeData], graphInstance: graph.current! });
    } else {
      setActiveItem([nodeData]);
    }
  };

  const handleEdgeClick = (evt: G6GraphEvent) => {
    const edgeData = _.cloneDeep(evt.item.getModel()) as ReactG6EdgeDataProps;
    onEdgeClick?.({ edgeData, edgeInstance: evt.item as IEdge, graphInstance: graph.current! });
    if (selectedIsControl) {
      onItemSelect?.({ itemData: [edgeData], graphInstance: graph.current! });
    } else {
      setActiveItem([edgeData]);
    }
  };

  const handleCanvasClick = () => {
    onCanvasClick?.({ graphData, graphInstance: graph.current! });
    removeG6ItemState();
    if (selectedIsControl) {
      onItemSelect?.({ itemData: [], graphInstance: graph.current! });
    } else {
      setActiveItem([]);
    }
  };

  const handleNodeDragend = (evt: G6GraphEvent) => {
    const nodeData = _.cloneDeep(evt.item.getModel()) as ReactG6NodeDataProps;
    onNodeDragend?.({ nodeData, nodeInstance: evt.item as INode, graphInstance: graph.current! });
  };

  /**  G6画布自适应窗口 */
  const g6GraphResize = _.debounce(({ width, height }: ResizeProps) => {
    if (graph.current && g6Container.current) {
      graph.current.changeSize(width, height);
      graph.current?.fitCenter();
    }
  }, 300);

  /**
   * 高亮节点 (如果是模型的节点的话，则会高亮整个模型)
   */
  const highlightNode = (nodeData: ReactG6NodeDataProps) => {
    removeG6ItemState();
    const edges = graph.current!.getEdges();
    const nodes = graph.current!.getNodes();
    let allHideItems = [...edges, ...nodes].filter(item => item._cfg?.id !== nodeData.id);
    if (nodeData._sourceData.model) {
      allHideItems = allHideItems.filter(item => {
        const dataModel = item.getModel() as ReactG6NodeDataProps;
        return dataModel._sourceData.model !== nodeData._sourceData.model;
      });
    }
    allHideItems.forEach(item => {
      graph.current!.setItemState(item, '_hide', true);
    });
    graph.current!.setItemState(nodeData.id, 'selected', true);
  };

  /**
   * 高亮边以及边的起点和终点(如果是模型的边话，则会高亮整个模型)
   */
  const highlightEdge = (edgeData: ReactG6EdgeDataProps) => {
    removeG6ItemState();
    const edges = graph.current!.getEdges();
    const nodes = graph.current!.getNodes();
    const sourceNodeId = edgeData?._sourceData.startId;
    const targetNodeId = edgeData?._sourceData.endId;
    const edgeId = edgeData.id!;
    const selectedIds = [edgeId, sourceNodeId, targetNodeId];
    let allHideItems = [...edges, ...nodes].filter(item => !selectedIds.includes(item._cfg?.id as string));
    if (edgeData._sourceData.model) {
      allHideItems = allHideItems.filter(item => {
        const dataModel = item.getModel() as ReactG6NodeDataProps | ReactG6EdgeDataProps;
        return dataModel._sourceData.model !== edgeData._sourceData.model;
      });
    }
    allHideItems.forEach(item => {
      graph.current!.setItemState(item, '_hide', true);
    });
    graph.current!.setItemState(edgeId, '_active', true);
  };

  /**
   * 高亮选中的元素
   */
  const handleHighlightItem = () => {
    if (activeItem.length === 0) return;
    const item = activeItem[0];
    if (item._sourceData.entity_id) {
      highlightNode(item as ReactG6NodeDataProps);
    }
    if (item._sourceData.edge_id) {
      highlightEdge(item as ReactG6EdgeDataProps);
    }
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

  return (
    <KwResizeObserver onResize={g6GraphResize}>
      <div style={style} className={classNames(prefixCls, className)}>
        <div style={{ width: '100%', height: '100%' }} ref={g6Container} />
        {toolVisible && <KwG6ToolBar style={{ bottom: 20, right: 24 }} graph={graph.current!} />}
      </div>
    </KwResizeObserver>
  );
});

export type { KwReactG6Props, KwBackEndOntologyDataProps } from './types';
export default KwReactG6;
