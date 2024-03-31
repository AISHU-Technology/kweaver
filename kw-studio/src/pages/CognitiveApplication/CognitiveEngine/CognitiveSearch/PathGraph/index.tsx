/**
 * 路径图
 * 自左向右层次布局，仅展示，支持缩放、拖拽
 * @author Jason.ji
 * @date 2022/06/15
 *
 */

import React, { memo, useEffect, useRef, useState } from 'react';
import G6 from '@antv/g6';
import _ from 'lodash';
import type { Graph } from '@antv/g6';
import HOOKS from '@/hooks';
import IconFont from '@/components/IconFont';
import gridBg from '@/assets/images/background_point.png';
import { registerIconNode } from '@/utils/antv6';
import './style.less';

export interface PathGraphProps {
  graphData: Record<string, any>;
  markData?: any[];
  onSingleClick?: (e: any) => void;
}

const PathGraph: React.FC<PathGraphProps> = ({
  graphData, // 图数据
  markData, // 标记数据
  onSingleClick // 严格单击事件
}) => {
  const canvasRef = useRef<any>(); // 画布渲染容器
  const onSingleClickDebounceRef = useRef<any>(); // 闭包问题，缓存函数引用
  const graph = useRef<Graph>(); // g6实例
  const [nodesShow, setNodesShow] = useState<any>();
  const onSingleClickDebounce = HOOKS.useDebounce(onSingleClick, 300, true);
  onSingleClickDebounceRef.current = onSingleClickDebounce;

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (!graphData.nodes) return;
    graph.current?.changeSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
    graph.current?.changeData({ ...graphData });
    graph.current?.refresh();

    const legendMap = _.reduce(
      graphData?.nodes,
      (res, node) => {
        if (res[node.tag]) return res;
        res[node.tag] = _.pick(node, 'tag', 'color');
        return res;
      },
      {} as Record<string, { tag: string; color: string }>
    );
    setNodesShow(_.values(legendMap));
  }, [graphData]);

  // 标记实体变化
  useEffect(() => {
    if (!markData || !graphData.nodes) return;

    setTimeout(() => {
      onZoomChange('move');
    }, 0);
  }, [markData]);

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
            formatText: (model: any) => {
              const pro = model?.default_property;
              return pro?.v || (pro?.value as string);
            },
            offset: 20
          },
          {
            type: 'edge-tooltip',
            formatText: model => {
              return model.name as string;
            },
            offset: 20
          }
        ]
      },
      layout: {
        type: 'dagre',
        rankdir: 'RL',
        nodesep: 40,
        ranksep: 40
      },
      defaultNode: {
        type: 'icon-node',
        size: [28, 28],
        style: {
          stroke: '#fff',
          lineWidth: 3
        },
        labelCfg: {
          position: 'top',
          style: {
            fill: '#000'
          }
        }
      },
      defaultEdge: {
        size: 1,
        color: '#000',
        labelCfg: {
          autoRotate: true,
          refY: 5,
          style: {
            fill: '#000'
          }
        }
      }
    });

    graph.current.get('canvas').set('localRefresh', false); // TODO 关闭局部渲染, 用于解决渲染阴影问题, 对渲染性能有影响
    graph.current.read({
      nodes: graphData.nodes || [],
      edges: graphData.edges || []
    });

    // 事件监听
    graph.current.on('click', e => {
      onSingleClickDebounceRef.current?.(e);
    });
  };

  // 画布缩放等操作
  const onZoomChange = (type: 'move' | 'add' | 'reduce') => {
    if (type === 'move') {
      graph.current?.zoomTo(1);
      markData?.[0] && graph.current?.focusItem(markData[0]);
    } else {
      const offset = type === 'add' ? 0.3 : -0.3;

      graph.current?.zoomTo(graph.current?.getZoom() + offset, {
        x: canvasRef.current.clientWidth / 2,
        y: canvasRef.current.clientHeight / 2
      });
    }
  };

  return (
    <div className="cognitive-path-graph" ref={canvasRef} style={{ backgroundImage: `url(${gridBg})` }}>
      {/* 节点展示 */}
      <div className="node-box">
        <div className="node-message kw-flex">
          {nodesShow?.map((item: any, index: any) => {
            const { color, tag } = item;
            return (
              <div className="kw-center" key={index}>
                <span
                  style={{
                    display: 'inline-block',
                    width: '10px',
                    height: '10px',
                    background: color,
                    borderRadius: '50%'
                  }}
                  className="kw-mr-1"
                ></span>
                <span className="kw-mr-8 kw-ellipsis node-name-show" title={tag}>
                  {tag}
                </span>
              </div>
            );
          })}
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
    </div>
  );
};

export * from './assistFunction';
export default memo(PathGraph);
