import React, { useEffect, useRef } from 'react';

export type ResizeProps = {
  width: number;
  height: number;
};

interface AdResizeObserverProps {
  onResize?: (data: ResizeProps) => void;
}

/**
 * 监听 children dom元素的尺寸变化
 * 注意：
 * children 必须只有一个父节点
 * @param children
 * @param onResize
 * @constructor
 */
const AdResizeObserver: React.FC<AdResizeObserverProps> = ({ children, onResize }) => {
  const resizeObserverRef = useRef<ResizeObserver>();
  const domRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    createResizeObserver();
    return () => {
      destroyResizeObserver();
    };
  }, []);

  const createResizeObserver = () => {
    resizeObserverRef.current = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      onResize && onResize({ width, height });
    });
    resizeObserverRef.current?.observe(domRef.current as Element);
  };

  const destroyResizeObserver = () => {
    resizeObserverRef.current?.disconnect();
  };

  return React.cloneElement(children as React.ReactElement, {
    ref: domRef
  });
};

export default AdResizeObserver;
