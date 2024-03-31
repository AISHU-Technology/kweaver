import React, { memo, useEffect, useRef } from 'react';
import G6, { type Graph } from '@antv/g6';
import { registerIconNode, MODEL_ICON } from '@/utils/antv6';

let isRender = false;
const STYLES = {
  position: 'fixed',
  left: '-200vw',
  top: '-200vh'
} as const;

/**
 * G6使用iconfont时, 首次渲染可能无法加载css资源导致icon无法正常渲染
 * 使用该组件进行预渲染, 在使用到的地方引用该组件即可
 */
const IconPreRender = () => {
  const graph = useRef<Graph>();
  const container = useRef<HTMLDivElement>();

  useEffect(() => {
    if (isRender) return;
    drawGraph();
  }, []);

  const drawGraph = () => {
    registerIconNode();
    graph.current = new G6.Graph({
      container: container.current!,
      width: 20,
      height: 20,
      layout: {
        type: 'force'
      },
      defaultNode: {
        type: 'icon-node'
      }
    });
    const testData: any = {
      nodes: [{ id: 'test', icon: MODEL_ICON }],
      edges: []
    };
    graph.current.data(testData);
    graph.current.render();
    isRender = true;
  };

  return <div ref={container as any} style={{ ...STYLES }}></div>;
};

export default memo(IconPreRender);
