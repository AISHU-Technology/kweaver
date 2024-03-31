/**
 * 认知搜索配置图谱
 * @author Jason.ji
 * @date 2022/05/13
 *
 */

import React, { useEffect, useRef, useState } from 'react';
import G6 from '@antv/g6';
import type { Graph } from '@antv/g6';
import _ from 'lodash';
import { Switch } from 'antd';
import intl from 'react-intl-universal';
import IconFont from '@/components/IconFont';
import { drawCircle, onJudgementEdges } from './assistFunction';
import gridBg from '@/assets/images/background_point.png';
import { registerIconNode } from '@/utils/antv6';
import './style.less';

export interface ConfigGraphProps {
  viewOnly?: boolean;
  graphData: Record<string, any>;
  highlightData?: any[];
  markData?: any[];
  nodeScope?: any[];
  nodeRes?: any[];
  edgeScope?: any[];
  ableEdges?: any[];
  onCheck?: (
    checked: boolean,
    item: Record<string, any>,
    type: 'node-result' | 'node-scope' | 'edge-scope' | string
  ) => void;
  setNodeScope?: any;
  setNodeRes?: any;
  setHighlight?: any;
  setHighNodes?: any;
  setEdgeScope?: any;
  setGraphMes: any;
  notHaveEdges?: any;
}
interface CardState {
  data: Record<string, any>;
  visible: boolean;
  type: 'node' | 'edge' | string;
}

const NODE_RES = 'node-result';
const NODE_SCOPE = 'node-scope';
const EDGE_SCOPE = 'edge-scope';
const ACTIVE_BG_CIRCLE = 'active-bg-circle';
const ACTIVE_BG_LINE = 'active-bg-line';
const getCenter = (point1: any, point2: any) => {
  return { x: (point1.x + point2.x) / 2, y: (point1.y + point2.y) / 2 };
};

const ConfigGraph: React.FC<ConfigGraphProps> = ({
  viewOnly = false, // 仅查看
  graphData, // 图谱渲染数据
  highlightData, // 高亮数据
  markData, // 标记星星的数据
  nodeScope = [], // 点类搜索范围
  nodeRes = [], // 点类结果范围
  edgeScope = [], // 边类搜索范围
  ableEdges = [], // 可配置的边
  onCheck, // 配置开关回调
  setNodeScope,
  setNodeRes,
  setEdgeScope,
  setHighlight,
  setHighNodes,
  setGraphMes,
  notHaveEdges
}) => {
  const canvasRef = useRef<any>(); // 画布渲染容器
  const graph = useRef<Graph>(); // g6实例
  const cardRef = useRef<any>(); // 开关卡片dom
  const cache = useRef<Record<string, any>>({}); // 缓存state, 绕过hooks依赖
  const lineRef = useRef<any>();
  const [switchCard, setSwitchCard] = useState<CardState>({ data: {}, visible: false, type: '' }); // 开关卡片

  useEffect(() => {
    init();

    const resizeHandle = () => graph.current?.changeSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
    window.addEventListener('resize', resizeHandle);

    return () => window.removeEventListener('resize', resizeHandle);
  }, []);

  useEffect(() => {
    if (!graphData.nodes) return;
    graph.current?.changeSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
    graph.current?.changeData({ ...graphData });
    graph.current?.refresh();
    onZoomChange('move');
  }, [graphData]);

  // 高亮变化
  useEffect(() => {
    if (!highlightData) return;

    const { nodes = [], edges = [] } = graphData;
    const newEdges = edges?.filter((item: any) => highlightData.includes(item.name));
    const edgeId = newEdges?.map((item: any) => item?.id);
    const newHighlightData = highlightData.filter((i: any) => !newEdges.includes(i));
    const newHighData = [...newHighlightData, ...edgeId];
    const setOpacity = (item: any) => {
      const { id } = item;
      const opacity = newHighData?.includes(id) ? 1 : 0.2;

      graph.current?.updateItem(id, {
        style: { opacity },
        labelCfg: { style: { opacity } }
      });
    };

    [...nodes, ...edges].forEach(setOpacity);
  }, [highlightData]);

  // 圈圈变化 根据选中的起点和结果（终点）
  useEffect(() => {
    if (!markData || !graphData.nodes) return;
    addCircle(graphData);
  }, [highlightData]);

  useEffect(() => {
    cache.current = { switchCard };
  }, [switchCard]);

  // 初始化画布
  const init = () => {
    registerIconNode();
    graph.current = new G6.Graph({
      container: canvasRef.current,
      linkCenter: true,
      modes: {
        default: [
          'drag-canvas', // 整体移动
          'zoom-canvas', // 缩放
          'drag-node', // 节点拖拽
          {
            type: 'tooltip',
            formatText: model => {
              return model.alias as string;
            },
            offset: 20
          },
          {
            type: 'edge-tooltip',
            formatText: model => {
              return model.alias as string;
            },
            offset: 20
          }
        ]
      },
      layout: {
        type: 'gForce',
        linkDistance: 300,
        nodeStrength: 1500, // 节点之间的作用力，正数代表斥力，负数代表引力
        nodeSize: 40,
        preventOverlap: 40, // 防止节点间碰撞
        gravity: 10, // 中心力大小，指所有节点被吸引到 center 的力。数字越大，布局越紧凑
        minMovement: 0.5, // 当一次迭代的平均移动长度小于该值时停止迭代。数字越小，布局越收敛，所用时间将越长
        maxIteration: 800, // 最大迭代次数。当迭代次数超过该值，但平均移动长度仍然没有达到 minMovement，也将强制停止迭代
        damping: 0.7, // 阻尼系数，取值范围 [0, 1]。数字越大，速度降低得越慢
        maxSpeed: 1000, // 一次迭代的最大移动长度
        coulombDisScale: 0.005 // 库伦系数，斥力的一个系数，数字越大，节点之间的斥力越大
      },
      defaultNode: {
        type: 'icon-node',
        size: [40, 40],
        style: {
          stroke: '#fff',
          lineWidth: 3,
          cursor: viewOnly ? undefined : 'pointer'
        },
        labelCfg: {
          position: 'top',
          style: {
            fill: '#000',
            cursor: viewOnly ? undefined : 'pointer'
          }
        }
      },
      defaultEdge: {
        size: 1,
        color: '#000',
        style: {
          cursor: viewOnly ? undefined : 'pointer'
        },
        labelCfg: {
          autoRotate: true,
          refY: 5,
          style: {
            fill: '#000',
            cursor: viewOnly ? undefined : 'pointer'
          }
        }
      }
    });

    graph.current.get('canvas').set('localRefresh', false); // TODO 关闭局部渲染, 用于解决渲染阴影问题, 对渲染性能有影响
    graph.current.read({ nodes: [], edges: [] });

    // 开启事件监听
    // 点击整个画布
    graph.current.on('canvas:click', (e: any) => {
      if (e.item || viewOnly) return;

      removeBgShape();
      setSwitchCard({ data: {}, visible: false, type: '' });
    });

    // 点击节点
    graph.current.on('node:contextmenu', (e: any) => {
      e.preventDefault();
      if (viewOnly) return;

      const node = e.item?.getModel() || {};
      const preId = cache.current.switchCard?.data?.id;

      if (node.id === preId) return;

      const data = { data: node, visible: true, type: 'node' };
      setSwitchCard(data);
      setCardPosition(data);
      addBgCircle(e, 'click');
    });

    // 点击边
    graph.current.on('edge:contextmenu', (e: any) => {
      e.preventDefault();
      if (viewOnly) return;

      const edge = e.item?.getModel() || {};
      const preId = cache.current.switchCard?.data?.id;

      if (edge.id === preId) return;

      const data = { data: edge, visible: true, type: 'edge' };
      setSwitchCard(data);
      setCardPosition(data);
      addBgLine(e);
    });

    // 滚轮缩放
    graph.current.on('wheelzoom', (e: any) => {
      setCardPosition(cache.current.switchCard);
    });

    // 拖拽画布
    graph.current.on('drag', (e: any) => {
      setCardPosition(cache.current.switchCard);
      addBgLine();
    });

    graph.current.on('nodeselectchange', ({ selectedItems, select }: any) => {
      if (!select) return;
      const { nodes, edges } = selectedItems;
      // 选中点的name名称处理
      const nodeAllNames = _.map(nodes, (item: any) => {
        const preId = cache.current.switchCard?.data?.id;

        if (item.getModel().id === preId) return;
        const data = { data: item.getModel(), visible: false, type: 'node' };
        setSwitchCard(data);
        addBgCircle(item, 'brush'); // 高亮的点添加外圈
        return item.getModel().name;
      });
      setHighNodes(nodeAllNames); // 高亮的点
      setNodeRes(nodeAllNames);
      setNodeScope(nodeAllNames);
      // 选中的边
      const edgeAllNames = _.map(edges, (item: any) => {
        const preId = cache.current.switchCard?.data?.id;

        if (item.getModel().id === preId) return;
        return item.getModel().name;
      });
      setEdgeScope(edgeAllNames);
    });
  };
  useEffect(() => {
    const { sourceAndTarget } = onJudgementEdges(graph);
    setGraphMes(graph.current);
  }, []);

  /**
   * 设置卡片位置
   * @param card 卡片状态
   */
  const setCardPosition = (card: CardState) => {
    const { data, visible, type } = card;

    if (!visible) return;

    const point = type === 'node' ? data : getCenter(data.startPoint, data.endPoint);
    const { x = -9999, y = -9999 } = graph.current?.getCanvasByPoint(point.x, point.y) || {};
    cardRef.current.style.left = `${x + 14}px`;
    cardRef.current.style.top = `${y + 14}px`;
  };

  /**
   * 添加右上角圆圈标记
   */
  const addCircle = (graphData: any) => {
    const nodes = graphData.nodes;
    if (!highlightData) return;
    // 都不在nodes的点 也就是被关掉的点
    const notExist = nodes.filter((t: any) => {
      return !nodeScope.includes(t.id) && !nodeRes.includes(t.id);
    });
    // nodeScope 和 nodeRes 相同的
    const sameNodes = nodeScope.filter((item: any) => {
      return nodeRes.includes(item);
    });

    // 去重后的搜索结果 蓝色
    const notNodes = nodeScope.filter((item: any) => {
      return !nodeRes.includes(item);
    });

    // 去重后的搜索起点 红色
    const notRes = nodeRes.filter((item: any) => {
      return !nodeScope.includes(item);
    });

    sameNodes.forEach((n: any) => {
      drawCircle(graph.current!, n, 'l(0) 0:#126ee3 0.5:#126ee3 0.5:#F5222D 1:#F5222D', {
        cursor: viewOnly ? undefined : 'pointer'
      });
    });

    notNodes.forEach((m: any) => {
      drawCircle(graph.current!, m, '#126ee3', {
        cursor: viewOnly ? undefined : 'pointer'
      });
    });

    notRes.forEach((m: any) => {
      drawCircle(graph.current!, m, '#F5222D', {
        cursor: viewOnly ? undefined : 'pointer'
      });
    });

    notExist.forEach((l: any) => {
      drawCircle(graph.current!, l.name, '', {
        cursor: viewOnly ? undefined : 'pointer'
      });
    });
  };

  /**
   * 添加背景光环
   * @param e g6节点实例
   */
  const addBgCircle = (e: any, type: string) => {
    const group = e.item.getContainer();
    const node = e.item.getModel();

    removeBgShape();
    group.addShape('circle', {
      id: ACTIVE_BG_CIRCLE,
      attrs: {
        x: 0,
        y: 0,
        r: 34,
        fill: node.color,
        fillOpacity: 0.2
      },
      zIndex: -9,
      draggable: true
    });
    group.sort();
    group.toFront();
  };

  /**
   * 删除背景图形(光环 | 线条)
   */
  const removeBgShape = () => {
    const { visible, data, type } = cache.current.switchCard;
    lineRef.current = undefined;

    if (!visible) return;

    const oldGroup = graph.current?.findById(data.id)?.getContainer();
    const oldBg = oldGroup?.findById(type === 'node' ? ACTIVE_BG_CIRCLE : ACTIVE_BG_LINE);
    oldBg && oldGroup?.removeChild(oldBg);
  };

  /**
   * 添加背景线条
   * @param e g6图形实例, 传参新增, 不传参更新
   */
  const addBgLine = (e?: any) => {
    if (!e && !lineRef.current) return;

    // 已存在, 更新
    if (!e && lineRef.current) {
      const group = lineRef.current.item.getContainer();
      const edgeShape = lineRef.current.item.getKeyShape();
      const line = group.findById(ACTIVE_BG_LINE);
      line && line.attr('path', edgeShape.attr('path'));
      return;
    }

    removeBgShape();
    const group = e.item.getContainer();
    const edgeShape = e.item.getKeyShape();
    lineRef.current = e;
    group.addShape({
      type: 'path',
      attrs: {
        path: edgeShape.attr('path'),
        opacity: 0.2,
        stroke: edgeShape.attr('stroke'),
        lineWidth: 14
      },
      id: ACTIVE_BG_LINE
    });
  };

  // 画布缩放等操作
  const onZoomChange = (type: 'move' | 'add' | 'reduce') => {
    if (type === 'move') {
      switchCard.visible
        ? graph.current?.focusItem(switchCard.data.id)
        : graph.current?.fitView(20, { onlyOutOfViewPort: true, ratioRule: 'max' });
    } else {
      const offset = type === 'add' ? 0.3 : -0.3;

      graph.current?.zoomTo(graph.current?.getZoom() + offset, {
        x: canvasRef.current.clientWidth / 2,
        y: canvasRef.current.clientHeight / 2
      });
    }

    setCardPosition(switchCard);
  };

  /**
   * 开关切换
   * @param checked 开 | 关
   * @param type 范围 | 结果
   */
  const handleCheck = (checked: boolean, type: 'scope' | 'res') => {
    const { data, type: dataType } = switchCard;
    onCheck?.(checked, data, dataType === 'node' ? (type === 'scope' ? NODE_SCOPE : NODE_RES) : EDGE_SCOPE);
  };

  return (
    <div className="cognitive-simple-graph" ref={canvasRef} style={{ backgroundImage: `url(${gridBg})` }}>
      {/* 缩放起点、结果颜色球 */}
      <div className="view-start-result kw-flex kw-ml-8">
        <div className="kw-center">
          {intl.get('searchConfig.searchStart')}：<div className="view-start-circle"></div>
        </div>
        <div className="kw-center">
          {intl.get('searchConfig.searchRes')}：<div className="view-result-circle"></div>
        </div>
        <div className="kw-center">
          {intl.get('searchConfig.searchResAndStart')}：<div className="view-common-circle"></div>
        </div>
      </div>
      {/* 缩放等按钮 */}
      <div className="view-tool">
        <div className="tool-item move-wrap" onClick={() => onZoomChange('move')}>
          <IconFont type="icon-dingwei" className="move-icon" />
        </div>
        <div className="tool-item add-icon" onClick={() => onZoomChange('add')}>
          +
        </div>
        <div className="tool-item reduce-icon" onClick={() => onZoomChange('reduce')}>
          -
        </div>
      </div>

      {/* 开关卡片 */}
      <div ref={cardRef} className={`switch-box ${!switchCard.visible && 'hide'}`}>
        <div className="switch-row">
          <span className="row-text">
            {switchCard.type === 'node' ? intl.get('searchConfig.searchStart') : intl.get('searchConfig.searchScope')}
          </span>
          <Switch
            size="small"
            disabled={switchCard.type === 'node' && notHaveEdges.includes(switchCard.data.name)}
            checked={
              switchCard.type === 'node'
                ? nodeScope.includes(switchCard.data.name)
                : edgeScope.includes(switchCard.data.name)
            }
            onChange={bool => handleCheck(bool, 'scope')}
          />
        </div>

        {switchCard.type === 'node' && (
          <div className="switch-row">
            <span className="row-text">{intl.get('searchConfig.searchRes')}</span>
            <Switch
              size="small"
              disabled={notHaveEdges.includes(switchCard.data.name)}
              checked={nodeRes.includes(switchCard.data.name)}
              onChange={bool => handleCheck(bool, 'res')}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfigGraph;
