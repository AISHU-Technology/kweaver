/**
 * G6使用iconfont时, 首次渲染可能无法加载css资源导致icon无法正常渲染
 * https://github.com/antvis/Graphin/blob/master/packages/graphin/src/behaviors/FontPaint.tsx
 */
import React from 'react';

const IconPaint = (props: { graph: any }) => {
  const { graph } = props;
  React.useEffect(() => {
    if (!graph) return;
    const timer = setTimeout(() => {
      graph.getNodes?.()?.forEach((node: any) => {
        graph.setItemState?.(node, 'normal', true);
      });
      graph.paint?.();
    }, 666); // 若不生效则增加延迟
    return () => {
      clearTimeout(timer);
    };
  }, [graph]);
  return null;
};

export default IconPaint;
