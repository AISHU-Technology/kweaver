import React, { useRef } from 'react';
import IconFont from '@/components/IconFont';

export interface DragLineProps {
  className?: string;
  switchName?: string;
  style?: React.CSSProperties;
  onStart?: () => void;
  onEnd?: (x: number, y: number) => void;
  onChange?: (x: number, y: number) => void;
  showIcon?: boolean;
  onDragOperate?: () => void;
  switchStyle?: React.CSSProperties;
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

  const onDragEnd = () => {
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
