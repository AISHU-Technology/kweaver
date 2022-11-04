/**
 * 认知搜索配置图谱
 */

import React, { useEffect, useRef, useState } from 'react';
import G6 from '@antv/g6';
import type { Graph } from '@antv/g6';
import { Switch } from 'antd';
import intl from 'react-intl-universal';
import IconFont from '@/components/IconFont';
import { drawMark } from './assistFunction';
import gridBg from '@/assets/images/net.png';
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
  onCheck // 配置开关回调
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
    const setOpacity = (item: any) => {
      const { id } = item;
      const opacity = highlightData.includes(id) ? 1 : 0.2;

      graph.current?.updateItem(id, {
        style: { opacity },
        labelCfg: { style: { opacity } }
      });
    };

    [...nodes, ...edges].forEach(setOpacity);
  }, [highlightData]);

  // 标记实体变化
  useEffect(() => {
    if (!markData || !graphData.nodes) return;

    addMark(markData, graphData.nodes);
  }, [markData]);

  useEffect(() => {
    cache.current = { switchCard };
  }, [switchCard]);

  // 初始化画布
  const init = () => {
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
        nodeStrength: 1500,
        nodeSize: 40,
        preventOverlap: 40,
        gravity: 10,
        minMovement: 0.5,
        maxIteration: 800,
        damping: 0.7,
        maxSpeed: 1000,
        coulombDisScale: 0.005
      },
      defaultNode: {
        type: 'circle',
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

    graph.current.get('canvas').set('localRefresh', false);
    graph.current.read({ nodes: [], edges: [] });

    // 点击整个画布
    graph.current.on('click', e => {
      if (e.item || viewOnly) return;

      removeBgShape();
      setSwitchCard({ data: {}, visible: false, type: '' });
    });

    // 点击节点
    graph.current.on('node:click', e => {
      if (viewOnly) return;

      const node = e.item?.getModel() || {};
      const preId = cache.current.switchCard?.data?.id;

      if (node.id === preId) return;

      const data = { data: node, visible: true, type: 'node' };
      setSwitchCard(data);
      setCardPosition(data);
      addBgCircle(e);
    });

    // 点击边
    graph.current.on('edge:click', e => {
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
    graph.current.on('wheelzoom', e => {
      setCardPosition(cache.current.switchCard);
    });

    // 拖拽画布
    graph.current.on('drag', e => {
      setCardPosition(cache.current.switchCard);
      addBgLine();
    });
  };

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
   * 添加星星标记
   * @param marks 标记数据
   * @param nodes 实体点数据
   */
  const addMark = (marks: any[], nodes: any[]) => {
    nodes.forEach(item => {
      const { id } = item;
      const isDelete = !marks.includes(id);

      drawMark(graph.current!, id, isDelete, { cursor: viewOnly ? undefined : 'pointer' });
    });
  };

  /**
   * 添加背景光环
   * @param e g6节点实例
   */
  const addBgCircle = (e: any) => {
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
      zIndex: -1,
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

  /**
   * 画布缩放等操作
   * @param type 移动到中心 | 放大 | 缩小
   */
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

      <div ref={cardRef} className={`switch-box ${!switchCard.visible && 'hide'}`}>
        <div className="switch-row">
          <span className="row-text">{intl.get('searchConfig.searchScope')}</span>
          <Switch
            size="small"
            disabled={switchCard.type === 'edge' && !ableEdges.includes(switchCard.data.name)}
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
              disabled={!nodeScope.includes(switchCard.data.name)}
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
