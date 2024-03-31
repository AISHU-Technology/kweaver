/**
 * 拖拽拉伸线条(可选择按钮是否需要)
 */
import React, { useRef } from 'react';
import IconFont from '../IconFont';

export interface DragLineProps {
  className?: string; // dragLine name
  switchName?: string; // switch name
  style?: React.CSSProperties;
  onStart?: () => void;
  onEnd?: (x: number, y: number) => void;
  /**
   * 位置发生变化的回调
   * x, y 是 拖拽结束时 相对于 拖拽起始位置 的偏移量
   */
  onChange?: (x: number, y: number) => void;
  showIcon?: boolean; // Whether to display the drag icon, hidden by default
  onDragOperate?: () => void; // drag Operation
  switchStyle?: React.CSSProperties; // Collapse | Expand button style
}

const DragLine = (props: DragLineProps) => {
  const { className, style, onChange, onStart, onEnd, showIcon, onDragOperate, switchName, switchStyle } = props;
  const startPosition = useRef({ x: 0, y: 0 });
  const currentPosition = useRef({ x: 0, y: 0 });

  const onDragStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onStart?.();
    document.addEventListener('mousemove', onDragging);
    document.addEventListener('mouseup', onDragEnd);
    startPosition.current = { x: e.pageX, y: e.pageY };
  };

  const onDragging = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const offsetX = e.pageX - startPosition.current.x;
    const offsetY = e.pageY - startPosition.current.y;
    currentPosition.current = { x: offsetX, y: offsetY };
    onChange?.(offsetX, offsetY);
  };

  const onDragEnd = (e: MouseEvent) => {
    document.removeEventListener('mousemove', onDragging);
    document.removeEventListener('mouseup', onDragEnd);
    onEnd?.(currentPosition.current.x, currentPosition.current.y);
    startPosition.current = { x: 0, y: 0 };
  };

  return (
    <>
      <div className={className} style={style} onMouseDown={onDragStart} />
      {showIcon ? (
        <IconFont className={switchName} style={switchStyle} type="icon-tuozhuai" onClick={() => onDragOperate?.()} />
      ) : null}
    </>
  );
};

export default DragLine;
