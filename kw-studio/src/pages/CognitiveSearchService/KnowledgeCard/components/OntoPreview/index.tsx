import React, { useState, useEffect, useRef } from 'react';
import G6 from '@antv/g6';
import type { Graph } from '@antv/g6';
import { registerIconNode } from '@/utils/antv6';
import { Tooltip, Button } from 'antd';
import { CloseOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import _ from 'lodash';
import HOOKS from '@/hooks';
import Format from '@/components/Format';
import IconFont from '@/components/IconFont';
import G6Tooltip from './G6Tooltip';
import { parseOntoToGraph } from './utils';
import './style.less';

const convertToPercentage = (rate: number) => {
  let percentage = Number(rate.toFixed(2)) * 100;
  if (percentage > 398) percentage = 400;
  return `${percentage.toFixed(0)}%`;
};

export interface OntoPreviewProps {
  className?: string;
  visible?: boolean;
  ontoData?: any;
  onClose?: () => void;
}

const OntoPreview = (props: OntoPreviewProps) => {
  const { className, ontoData, onClose } = props;
  const containerRef = useRef<HTMLDivElement>(null); // 画布渲染容器
  const graph = useRef<Graph>(); // g6实例
  const [zoom, setZoom] = useState(1);
  const forceUpdate = HOOKS.useForceUpdate();

  useEffect(() => {
    drawGraph();
    const resizeHandle = () =>
      graph.current?.changeSize(containerRef.current!.clientWidth, containerRef.current!.clientHeight);
    window.addEventListener('resize', resizeHandle);
    return () => window.removeEventListener('resize', resizeHandle);
  }, []);

  useEffect(() => {
    if (!ontoData?.entity) return;
    const graphData = parseOntoToGraph(ontoData);
    graph.current?.changeData(graphData);
  }, [ontoData]);

  const drawGraph = () => {
    registerIconNode();
    graph.current = new G6.Graph({
      container: containerRef.current!,
      linkCenter: true,
      modes: {
        default: [
          'drag-canvas', // 整体移动
          'zoom-canvas', // 缩放
          'drag-node' // 节点拖拽
        ]
      },
      layout: {
        type: 'force',
        linkDistance: 250,
        nodeStrength: 100,
        edgeStrength: 1,
        collideStrength: 1,
        preventOverlap: true,
        nodeSpacing: 50,
        alpha: 0.8,
        alphaDecay: 0.028,
        alphaMin: 0.01
      },
      defaultNode: {
        type: 'icon-node',
        size: 40,
        style: {
          stroke: '#fff',
          lineWidth: 3
        },
        labelCfg: {
          position: 'top'
        }
      },
      defaultEdge: {
        size: 1,
        labelCfg: {
          refY: 7,
          autoRotate: true
        }
      }
    });
    graph.current.get('canvas').set('localRefresh', false);
    graph.current.read({ nodes: [], edges: [] });
    forceUpdate(); // 创建图实例后刷新, 让tooltip能够监听到
  };

  /**
   * 缩放
   * @param id 操作的id标识
   */
  const onChangeZoom = (id: string) => {
    const toRatio = id === 'reset' ? 1 : id === 'reduce' ? Math.max(zoom - 0.05, 0.05) : Math.min(zoom + 0.05, 4);
    graph.current?.zoomTo(toRatio);
    graph.current?.fitCenter();
    setZoom(toRatio);
  };

  /**
   * 点击顶部工具栏
   * @param id 操作的id标识
   */
  const onToolClick = (id: string) => {
    if (['reset', 'reduce', 'add'].includes(id)) {
      return onChangeZoom(id);
    }
    if (id === 'locate') {
      graph.current?.fitView(0, { onlyOutOfViewPort: true, direction: 'y' });
    }
    if (id === 'fitView') {
      graph.current?.fitView(0);
    }
    if (id === 'fitCenter') {
      graph.current?.fitView(0, { onlyOutOfViewPort: true, direction: 'x' });
    }
    const curZoom = graph.current?.getZoom();
    curZoom && setZoom(curZoom);
  };

  const TOOLBARS = [
    {
      // 缩小
      id: 'reduce',
      tip: intl.get('exploreGraph.zoomIn'),
      icon: <MinusOutlined style={{ fontSize: 16 }} />,
      disabled: Number(zoom.toFixed(2)) <= 0.05
    },
    {
      // 重置缩放
      id: 'reset',
      tip: intl.get('exploreGraph.resetZoom'),
      text: <span style={{ display: 'inline-block', minWidth: 54 }}>{convertToPercentage(zoom)}</span>
    },
    {
      // 放大
      id: 'add',
      tip: intl.get('exploreGraph.zoomOut'),
      icon: <PlusOutlined style={{ fontSize: 16 }} />,
      disabled: Number(zoom.toFixed(2)) >= 3.9
    },
    {
      // 定位
      id: 'locate',
      tip: intl.get('exploreGraph.locate'),
      icon: 'icon-dingwei1'
    },
    {
      // 自适应
      id: 'fitView',
      tip: intl.get('exploreGraph.adaptation'),
      icon: 'icon-fenxi'
    },
    {
      // 视图居中
      id: 'fitCenter',
      tip: intl.get('exploreGraph.viewCenter'),
      icon: 'icon-mubiao'
    }
  ];

  return (
    <div className={classNames(className, 'knw-card-onto-preview kw-pl-6 kw-pr-6')}>
      <div className="kw-flex-column kw-h-100">
        <div className="kw-space-between" style={{ borderBottom: '1px solid var(--kw-line-color)' }}>
          <Format.Title>{intl.get('knowledge.entity')}</Format.Title>
          <div className="close-mask kw-pointer" onClick={onClose}>
            <CloseOutlined />
          </div>
        </div>
        <div ref={containerRef} className="kw-flex-item-full-height" style={{ position: 'relative' }}>
          <div className="toolbar-box">
            {_.map(TOOLBARS, item => {
              const { id, icon, disabled, tip, text } = item;
              const iconSpan = typeof icon === 'string' ? <IconFont type={icon} /> : icon;
              return (
                <Tooltip key={id} title={tip} placement="top">
                  <Button type="link" className="tool-icon-btn" disabled={disabled} onClick={() => onToolClick(id)}>
                    {!!icon && iconSpan}
                    {text}
                  </Button>
                </Tooltip>
              );
            })}
          </div>
          <G6Tooltip graph={graph.current!} graphId={ontoData.kg_id} />
        </div>
      </div>
    </div>
  );
};

export default (props: OntoPreviewProps) => (props.visible ? <OntoPreview {...props} /> : null);
