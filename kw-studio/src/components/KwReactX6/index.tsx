import React, { CSSProperties, forwardRef, PropsWithChildren, useEffect, useImperativeHandle, useRef } from 'react';
import classnames from 'classnames';
import ReactDOM from 'react-dom/client';
import type { Graph as IGraph } from '@antv/x6';
import { Selection } from '@antv/x6-plugin-selection';
import { Graph as GraphX6, Cell, Node, Edge, NodeView, EdgeView, Markup } from '@antv/x6';

import { KwX6Edge, KwX6RelationEndNode, KwX6RelationStartNode } from '@/components/KwReactX6/utils/constants';
import HOOKS from '@/hooks';
import { stringSeparator1, stringSeparator2 } from '@/enums';
import KwX6ToolBar from '@/components/KwReactX6/KwX6ToolBar';
import X6LabelSelect from '@/components/KwReactX6/X6LabelSelect';
import X6StartPointPort from '@/components/KwReactX6/X6StartPointPort';

import registerX6Node from './utils/registerX6Node';
import registerX6Edges from './utils/registerX6Edge';
import registerX6Connector from './utils/registerX6Connector';
import registerX6PortLayout from './utils/registerX6PortLayout';
import './style.less';

const { useDeepCompareEffect } = HOOKS;

const X6Types = ['erGraph'] as const;

type X6Type = (typeof X6Types)[number];

interface KwReactX6Props {
  type?: X6Type;
  toolBar?: boolean;
  readOnly?: boolean;
  className?: string;
  style?: CSSProperties;
  data?: Array<Node.Metadata | Edge.Metadata>;

  onViewMounted?: (graphX6: IGraph) => void;
  onEdgeRemoved?: (graphX6: IGraph, edge: Edge<Edge.Properties>) => void;
  onEdgeSelectedChange?: (graphX6: IGraph, selectedEdges?: Edge[]) => void;
  onEdgeDeleteBtnClick?: (graphX6: IGraph, edge: Edge<Edge.Properties>) => void;
  onEdgeClick?: (graphX6: IGraph, params: EdgeView.EventArgs['edge:click']) => void;
  onNodeClick?: (graphX6: IGraph, params: NodeView.EventArgs['node:click']) => void;
  onNodeMouseUp?: (graphX6: IGraph, params: NodeView.EventArgs['node:mouseup']) => void;
  onEdgeLabelSelectChange?: (value: string, edge?: Edge<Edge.Properties>, graph?: IGraph) => void;
  onEdgeConnected?: (graphX6: IGraph, edge: Edge<Edge.Properties>, edges: Edge<Edge.Properties>[]) => void;

  onBlankClick?: (graphX6: IGraph) => void;
  onBlankMouseUp?: (graphX6: IGraph) => void;

  onValidateMagnet?: (magnet: Element) => boolean;
  onValidateEdge?: (edge: Edge<Edge.Properties>) => boolean;
}

export interface X6RefProps {
  graphX6?: IGraph;
}

const KwReactX6 = forwardRef<X6RefProps, PropsWithChildren<KwReactX6Props>>((props, ref) => {
  const {
    className,
    style,
    data = [],
    type = 'erGraph',
    toolBar = true,
    readOnly = false,
    onEdgeConnected,
    onEdgeSelectedChange,
    onEdgeRemoved,
    onViewMounted,
    onEdgeLabelSelectChange,
    onEdgeDeleteBtnClick,
    onNodeMouseUp,
    onBlankMouseUp,
    onValidateMagnet,
    onValidateEdge,
    onBlankClick
  } = props;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const graphX6 = useRef<IGraph>();
  const x6GraphStateDataRef = useRef({
    selectedEdges: [] as Edge[]
  });

  useImperativeHandle(ref, () => ({
    graphX6: graphX6.current
  }));

  useEffect(() => {
    mounted();
    return () => {
      unMount();
    };
  }, []);

  useDeepCompareEffect(() => {
    if (type === 'erGraph') {
      updateErGraphX6Data();
    }
  }, [data, type]);

  /**
   * 组件挂载
   */
  const mounted = () => {
    registerCustomElement();
    initX6Graph();
    handleBindEvents();
  };

  /**
   * 组件卸载
   */
  const unMount = () => {
    setTimeout(() => {
      handleRemoveEvents();
      graphX6.current?.dispose();
    }, 0);
  };

  /**
   * 绑定事件
   */
  const handleBindEvents = () => {
    graphX6.current?.on('edge:mouseenter', edgeMouseEnter);
    graphX6.current?.on('edge:mouseleave', edgeMouseLeave);
    graphX6.current?.on('edge:click', edgeClick);
    graphX6.current?.on('edge:connected', edgeConnected);
    graphX6.current?.on('edge:selected', edgeSelected);
    graphX6.current?.on('edge:unselected', edgeUnSelected);
    graphX6.current?.on('edge:removed', edgeRemoved);
    graphX6.current?.on('view:mounted', viewMounted);
    graphX6.current?.on('node:mouseup', nodeMouseUp);
    graphX6.current?.on('blank:mouseup', blankMouseUp);
    graphX6.current?.on('blank:click', blankClick);
  };

  /**
   * 移除事件
   */
  const handleRemoveEvents = () => {
    graphX6.current?.off('edge:mouseenter', edgeMouseEnter);
    graphX6.current?.off('edge:mouseleave', edgeMouseLeave);
    graphX6.current?.off('edge:click', edgeClick);
    graphX6.current?.off('edge:connected', edgeConnected);
    graphX6.current?.off('edge:selected', edgeSelected);
    graphX6.current?.off('edge:unselected', edgeUnSelected);
    graphX6.current?.off('edge:removed', edgeRemoved);
    graphX6.current?.off('view:mounted', viewMounted);
    graphX6.current?.off('node:mouseup', nodeMouseUp);
    graphX6.current?.off('blank:mouseup', blankMouseUp);
    graphX6.current?.off('blank:click', blankClick);
  };

  /**
   * 画布空白点击事件
   */
  const blankClick = () => {
    onBlankClick?.(graphX6.current!);
  };

  /**
   * 画布空白区域的鼠标抬起事件
   */
  const blankMouseUp = () => {
    onBlankMouseUp?.(graphX6.current!);
  };

  /**
   * 节点鼠标抬起事件
   */
  const nodeMouseUp = (args: NodeView.EventArgs['node:mouseup']) => {
    onNodeMouseUp?.(graphX6.current!, args);
  };

  /**
   * 节点挂载到视图上
   */
  const viewMounted = () => {
    onViewMounted && onViewMounted(graphX6.current!);
  };

  /**
   * 边移除事件
   */
  const edgeRemoved = ({ edge }: any) => {
    onEdgeRemoved?.(graphX6.current!, edge);
  };

  const edgeMouseEnter = ({ edge }: EdgeView.EventArgs['edge:mouseenter']) => {
    const edgeData = edge.getData();
    if (edgeData?.deleteBtnVisible !== false && !readOnly) {
      edge.addTools([
        {
          name: 'button-remove',
          args: {
            distance: -40,
            onClick({ cell }: any) {
              graphX6.current?.removeCell(cell);
              onEdgeDeleteBtnClick?.(graphX6.current!, cell);
            }
          }
        }
      ]);
    }

    const sourceNode = edge.getSourceCell();
    const sourceCellPortId = edge.getSourcePortId();
    const targetNode = edge.getTargetCell();
    const targetCellPortId = edge.getTargetPortId();
    sourceNode?.updateData({
      hoveField: sourceCellPortId?.includes(stringSeparator2)
        ? sourceCellPortId?.split(stringSeparator2)[1]
        : sourceCellPortId?.split(stringSeparator1)[1]
    });
    targetNode?.updateData({
      hoveField: targetCellPortId?.includes(stringSeparator2)
        ? targetCellPortId?.split(stringSeparator2)[1]
        : targetCellPortId?.split(stringSeparator1)[1]
    });
  };

  const edgeMouseLeave = ({ edge }: EdgeView.EventArgs['edge:mouseleave']) => {
    if (edge.hasTool('button-remove')) {
      edge.removeTool('button-remove');
    }

    const sourceNode = edge.getSourceCell();
    const targetNode = edge.getTargetCell();
    sourceNode?.updateData({
      hoveField: ''
    });
    targetNode?.updateData({
      hoveField: ''
    });
  };

  const edgeClick = () => {};

  /**
   * 边连接完成事件
   * @param edge
   */
  const edgeConnected = (params: EdgeView.EventArgs['edge:connected']) => {
    const { edge } = params;
    if (type === 'erGraph') {
      edge.attr({
        line: {
          stroke: '#C2C8D5',
          strokeDasharray: ''
        }
      });
    }
    const allEdges = graphX6.current?.getEdges() ?? [];
    onEdgeConnected?.(graphX6.current!, edge, allEdges);
  };

  /**
   * 边选中事件
   */
  const edgeSelected = ({ edge }: { edge: Edge }) => {
    x6GraphStateDataRef.current.selectedEdges.push(edge);
    edgeSelectedChange();
  };

  /**
   * 边取消选中事件
   */
  const edgeUnSelected = ({ edge }: { edge: Edge }) => {
    x6GraphStateDataRef.current.selectedEdges = x6GraphStateDataRef.current.selectedEdges.filter(
      item => item.id !== edge.id
    );
    edgeSelectedChange();
  };

  /**
   * 边选中的值变化事件
   */
  const edgeSelectedChange = () => {
    onEdgeSelectedChange?.(graphX6.current!, x6GraphStateDataRef.current.selectedEdges);
  };

  /**
   * 注册自定义元素 （边 节点, 连接桩布局 等）
   */
  const registerCustomElement = () => {
    if (type === 'erGraph') {
      registerErGraphCustomElement();
    }
  };

  /**
   * 注册ER图的相关自定义元素
   */
  const registerErGraphCustomElement = () => {
    registerX6Connector();
    registerX6Edges();
    registerX6PortLayout();
    registerX6Node();
  };

  /**
   * 实例化X6
   */
  const initX6Graph = () => {
    (window as any).__x6_instances__ = [];
    if (type === 'erGraph') {
      initX6ErGraph();
    }
    (window as any).__x6_instances__.push(graphX6.current);
  };

  /**
   * 实例化ER 图
   */
  const initX6ErGraph = () => {
    graphX6.current = new GraphX6({
      container: containerRef.current!,
      async: false,
      panning: true,
      mousewheel: true,
      highlighting: {
        magnetAdsorbed: {
          name: 'stroke',
          args: {
            padding: 4,
            attrs: {
              stroke: '#126EE3',
              strokeWidth: 1
            }
          }
        }
      },
      autoResize: true,
      connecting: {
        snap: true,
        highlight: true,
        allowBlank: false,
        allowLoop: false,
        allowNode: false,
        allowEdge: false,
        allowMulti: 'withPort',
        validateMagnet({ magnet }) {
          if (readOnly) {
            return false;
          }
          if (onValidateMagnet) {
            return onValidateMagnet(magnet);
          }
          return true;
        },
        validateEdge({ edge }) {
          if (onValidateEdge) {
            return onValidateEdge(edge);
          }
          return true;
        },
        createEdge({ sourceCell }: any) {
          const sourceNodeConfigData = sourceCell.toJSON();
          if ([KwX6RelationStartNode, KwX6RelationEndNode].includes(sourceNodeConfigData.shape)) {
            return graphX6.current?.createEdge({
              attrs: {
                line: {
                  stroke: '#126EE3',
                  strokeDasharray: '5 5'
                }
              },
              zIndex: -1,
              label: {
                position: 0.5
              },
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
          return graphX6.current?.createEdge({
            shape: KwX6Edge,
            attrs: {
              line: {
                stroke: '#126EE3',
                strokeDasharray: '5 5'
              }
            },
            zIndex: -1
          });
        }
      },
      // @ts-ignore
      onEdgeLabelRendered: args => {
        const { selectors, edge } = args;
        const content = selectors.foContent as HTMLDivElement;
        if (content) {
          ReactDOM.createRoot(content).render(
            <X6LabelSelect
              disabled={readOnly}
              onChange={onEdgeLabelSelectChange}
              graphX6={graphX6.current}
              edge={edge.toJSON()}
            />
          );
        }
      },
      onPortRendered: args => {
        const selectors = args.contentSelectors;
        const container = selectors && selectors.foContent;
        if (container) {
          ReactDOM.createRoot(container).render(<X6StartPointPort />);
        }
      }
    });
    graphX6.current?.use(
      new Selection({
        enabled: true
      })
    );
  };

  /**
   * 更新ER 图X6数据
   */
  const updateErGraphX6Data = () => {
    const cells: Cell[] = [];
    data.forEach(item => {
      if (item.shape.startsWith('kw-x6-') && item.shape.endsWith('-node')) {
        cells.push(graphX6.current?.createNode(item) as Node);
      } else {
        cells.push(graphX6.current?.createEdge(item) as Edge);
      }
    });
    graphX6.current?.resetCells(cells);
  };
  const prefixCls = 'kw-x6';

  return (
    <div className={`${prefixCls}-wrapper ${prefixCls}-${type}`} style={{ width: '100%', height: '100%' }}>
      <div ref={containerRef} className={classnames(prefixCls, className)} style={style} />
      {toolBar && graphX6.current && <KwX6ToolBar style={{ bottom: 89, right: 38 }} graph={graphX6.current} />}
    </div>
  );
});

export default KwReactX6;
