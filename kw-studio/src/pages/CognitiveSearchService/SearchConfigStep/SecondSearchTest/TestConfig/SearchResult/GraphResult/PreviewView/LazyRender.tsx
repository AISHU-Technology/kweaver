import React, { useRef } from 'react';

/**
 * Carousel初始化时会一次性渲染所有轮播组件, 造成卡顿
 * 采用懒加载的方式, 首次加载只选染可见的轮播组件
 */
const LazyRender = (props: { ready: boolean; children: React.ReactElement }) => {
  const isMount = useRef(false);
  if (!props.ready && !isMount.current) return null;
  isMount.current = true;
  return props.children;
};

export default LazyRender;
