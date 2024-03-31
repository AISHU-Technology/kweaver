import React, { useRef, useEffect, useState, useMemo } from 'react';
import G6 from '@antv/g6';
import _ from 'lodash';
import HOOKS from '@/hooks';
import IconFont from '@/components/IconFont';
import intl from 'react-intl-universal';
import { MinusOutlined, PlusOutlined, LoadingOutlined } from '@ant-design/icons';

import { Button } from 'antd';
import serviceGraphDetail from '@/services/graphDetail';
import { registerIconNode } from '@/utils/antv6';
import type { Graph } from '@antv/g6';
import { drawCircle, registerToolTip } from './assistFunction';

import './style.less';

let timer: any = null;

const convertToPercentage = (rate: number) => {
  let percentage = Number(rate.toFixed(2)) * 100;
  if (percentage > 398) percentage = 400;
  return `${percentage.toFixed(0)}%`;
};

const ConfigGraph = (props: any) => {
  const { graphData, checkEntity, nodeAll, setOperateType, setSelectedNode, graphUnderClassify } = props;
  const forceUpdate = HOOKS.useForceUpdate();
  const canvasRef = useRef<any>(null);
  const cacheItem = useRef<any>({});
  const graph = useRef<Graph | any>();
  const [isLoading, setIsLoading] = useState(false);
  const zoom = useMemo(() => {
    return cacheItem.current.zoom || 1;
  }, [cacheItem.current.zoom]);

  useEffect(() => {
    return () => {
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    init();
    const resizeHandle = () => graph.current?.changeSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
    window.addEventListener('resize', resizeHandle);

    return () => window.removeEventListener('resize', resizeHandle);
  }, []);

  useEffect(() => {
    if (!graphData?.nodes) return;
    const handleEntities = _.map(checkEntity, (item: any) => item?.split('(')?.[1]?.split(')')?.[0]);
    // 选中的实体类标记的变化
    _.map(nodeAll, (item: any) => {
      const idDelete = !handleEntities.includes(item);
      drawCircle(graph.current, item, idDelete);
    });
  }, [checkEntity, nodeAll]);

  useEffect(() => {
    if (!graphData?.nodes) return;
    graph.current?.changeSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
    graph.current?.changeData({ ...graphData });
    graph.current?.refresh();
    registerToolTip(graph, setSelectedNode, setOperateType, graphUnderClassify);
    graph.current.__onGetZoom = getZoom;
  }, [graphData]);

  /**
   * 更新画布缩放
   */
  const getZoom = () => {
    const newZoom = graph.current.getZoom();
    if (cacheItem.current.zoom > newZoom) {
      onChangeZoom('-', newZoom);
    } else {
      onChangeZoom('+', newZoom);
    }
  };

  const graphOperateTitle = [
    {
      // 缩小 toFixed 四舍五入 <5%禁止
      id: 'zoom',
      tip: intl.get('exploreGraph.zoomIn'),
      iconChange: true,
      icon: <MinusOutlined className="btn-icon" />,
      disabled: Number(zoom.toFixed(2)) <= 0.05,
      onClick: () => onChangeZoom('-', zoom)
    },
    {
      // 重置缩放
      id: 'zoom',
      tip: intl.get('exploreGraph.resetZoom'),
      text: convertToPercentage(zoom),
      icon: 'icon-xiala',
      onClick: () => onChangeZoom('100', zoom)
    },
    {
      // 放大 >=390禁止
      id: 'zoom',
      tip: intl.get('exploreGraph.zoomOut'),
      icon: 'icon-Add',
      disabled: Number(zoom.toFixed(2)) >= 3.9,
      onClick: () => onChangeZoom('+', zoom)
    },
    {
      // 定位
      id: 'locate',
      tip: intl.get('exploreGraph.locate'),
      icon: 'icon-dingwei1',
      onClick: () => {
        const nodes = graphData?.nodes;
        const edges = graphData?.edges;
        if (nodes?.length === 1) {
          // 移动图 使得item对其到视口中心
          graph.current.focusItem(nodes[0]);
        } else if (edges?.length === 1) {
          graph.current.focusItem(edges[0]);
        } else {
          graph.current.fitView(0, { onlyOutOfViewPort: true, direction: 'y' });
        }
        const zoom = graph.current.getZoom();
        onChangeData(zoom);
      }
    },
    {
      // 自适应
      id: 'fitView',
      tip: intl.get('exploreGraph.adaptation'),
      icon: 'icon-fenxi',
      onClick: () => {
        graph?.current?.fitView(0);
        // getZoom()获取当前的缩放比例
        const zoom = graph.current.getZoom();
        onChangeData(zoom);
      }
    },
    {
      // 视图居中
      id: 'fitCenter',
      tip: intl.get('exploreGraph.viewCenter'),
      icon: 'icon-mubiao',
      onClick: () => {
        graph.current.fitView(0, { onlyOutOfViewPort: true, direction: 'x' });
        const zoom = graph.current.getZoom();
        onChangeData(zoom);
      }
    }
  ];

  /**
   * 操作图谱 放大-缩小-重置
   */
  const onChangeZoom = (type: string, scale: number) => {
    if (type === '-') {
      // Math.max()返回最大的那个
      const toRatio = Math.max(scale - 0.05, 0.05);
      // 缩放视口到一个固定的比例
      graph.current.zoomTo(toRatio);
      graph.current.fitCenter();
      onChangeData(toRatio);
    }
    if (type === '+') {
      const toRatio = Math.min(scale + 0.05, 4);
      graph.current.zoomTo(toRatio);
      graph.current.fitCenter();
      onChangeData(toRatio);
    }
    if (type === '100') {
      // 平移到画布中心将对齐到画布中心，但不缩放
      graph.current.zoomTo(1);
      graph.current.fitCenter();
      onChangeData(1);
    }
  };

  /**
   * 当前操作数据更新
   */
  const onChangeData = (data: number) => {
    cacheItem.current.zoom = data;
    forceUpdate();
  };

  /**
   * 画布初始
   */
  const init = () => {
    registerIconNode();
    graph.current = new G6.Graph({
      container: canvasRef.current || '',
      linkCenter: true,
      modes: {
        default: ['drag-canvas', 'zoom-canvas', 'drag-node', 'brush-select']
      },
      layout: {
        type: 'gForce',
        linkDistance: 300,
        nodeStrength: 2000, // 节点之间的作用力，正数代表斥力，负数代表引力
        nodeSize: 40,
        preventOverlap: true, // 防止节点间碰撞
        gravity: 10, // 中心力大小，指所有节点被吸引到 center 的力。数字越大，布局越紧凑
        minMovement: 0.5, // 当一次迭代的平均移动长度小于该值时停止迭代。数字越小，布局越收敛，所用时间将越长
        maxIteration: 800, // 最大迭代次数。当迭代次数超过该值，但平均移动长度仍然没有达到 minMovement，也将强制停止迭代
        damping: 0.7, // 阻尼系数，取值范围 [0, 1]。数字越大，速度降低得越慢
        maxSpeed: 4000, // 一次迭代的最大移动长度
        coulombDisScale: 0.005 // 库伦系数，斥力的一个系数，数字越大，节点之间的斥力越大
      },
      defaultNode: {
        type: 'icon-node',
        size: [40, 40],
        style: {
          stroke: '#fff',
          lineWidth: 3,
          cursor: 'pointer'
        },
        labelCfg: {
          position: 'top',
          style: {
            fill: '#000',
            cursor: 'pointer'
          }
        }
      },
      defaultEdge: {
        size: 1,
        color: '#000',
        style: {
          cursor: 'pointer'
        },

        labelCfg: {
          autoRotate: true,
          refY: 7,
          style: {
            fill: '#000',
            cursor: 'pointer'
          }
        }
      }
    });

    graph.current.on('beforelayout', () => {
      setIsLoading(true);
    });

    graph.current.on('afterlayout', () => {
      graph.current?.fitView(0, { onlyOutOfViewPort: true, direction: 'y' });
      timer = setTimeout(() => setIsLoading(false), 700);
    });

    graph.current.get('canvas').set('localRefresh', false);
    graph.current.read({ nodes: [], edges: [] });
  };

  return (
    <div className="search-config-graph-loading">
      {isLoading && (
        <div className="loading">
          <LoadingOutlined style={{ fontSize: 30 }} />
        </div>
      )}
      <div className="kw-center kw-pt-6">
        {_.map(graphOperateTitle, (item: any, index: any) => {
          const iconShow = item?.text ? (
            item?.text
          ) : item?.iconChange ? (
            item.icon
          ) : (
            <IconFont type={item.icon} className="btn-icon" />
          );
          return (
            <Button className="btn-width" title={item.tip} key={index} onClick={item.onClick} disabled={item?.disabled}>
              {iconShow}
            </Button>
          );
        })}
      </div>

      <div className="full-config-graph" ref={canvasRef}></div>
    </div>
  );
};

export default ConfigGraph;
