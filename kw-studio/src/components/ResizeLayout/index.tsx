import React, { useRef, useState, useEffect } from 'react';
import classnames from 'classnames';
import IconFont from '@/components/IconFont';

import './style.less';

const contentRight = {
  top: 0,
  right: 0,
  width: 300,
  height: '100%',
  borderLeft: '2px solid var(--kw-line-color)'
};
const barRight = { top: 0, left: -1, width: 3, height: '100%', cursor: 'col-resize' };
const contentBottom = {
  right: 0,
  bottom: 0,
  height: 300,
  width: '100%',
  borderTop: '2px solid var(--kw-line-color)'
};
const barBottom = { top: -1, left: 0, height: 3, width: '100%', cursor: 'row-resize' };
const style = {
  right: { content: contentRight, bar: barRight, cursor: 'col-resize' },
  bottom: { content: contentBottom, bar: barBottom, cursor: 'row-resize' }
};

type ResizeLayoutType = {
  placement?: 'right' | 'bottom';
  isAll?: boolean;
  children: React.ReactNode;
  onClose: () => void;
};
const ResizeLayout = (props: ResizeLayoutType) => {
  const { placement = 'right', children } = props;
  const { onClose } = props;
  const drawerRef = useRef<any>(null);

  const [client, setClient] = useState({ width: 0, height: 0 });
  const [position, setPosition] = useState<any>({});
  const [isResize, setIsResize] = useState(false);

  useEffect(() => {
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  useEffect(() => {
    switch (placement) {
      case 'right':
        if (client.width <= 30 && client.width !== 0) onClose();
        break;
      case 'bottom':
        if (client.height <= 30 && client.height !== 0) onClose();
        break;
      default:
        break;
    }
  }, [isResize, client.width, client.height]);

  const onMouseDown = (e: any) => {
    setIsResize(true);
    const width = drawerRef?.current?.clientWidth;
    const height = drawerRef?.current?.clientHeight;
    switch (placement) {
      case 'right':
        setClient({ ...client, width });
        setPosition({ startX: e.pageX, startY: e.pageY });
        break;
      case 'bottom':
        setClient({ ...client, height });
        setPosition({ startX: e.pageX, startY: e.pageY });
        break;
      default:
        break;
    }
  };

  const onMouseMove = (e: any) => {
    if (!isResize) return;
    const startX = position?.startX;
    const startY = position?.startY;
    const endX = e?.pageX;
    const endY = e?.pageY;
    switch (placement) {
      case 'right':
        drawerRef?.current?.style?.setProperty('width', `${client.width - (endX - startX)}px`, 'important');
        break;
      case 'bottom':
        drawerRef?.current?.style?.setProperty('height', `${client.height - (endY - startY)}px`, 'important');
        break;
      default:
        break;
    }
  };

  const onMouseUp = () => {
    setIsResize(false);
    const width = drawerRef?.current?.clientWidth || 1;
    const height = drawerRef?.current?.clientHeight || 1;
    setClient({ width, height });
  };

  return (
    <div className="resizeLayoutRoot" onMouseMove={onMouseMove} onMouseUp={onMouseUp}>
      <div
        className={classnames('mask', { maskEventsNone: !isResize, maskEventsAuto: isResize })}
        style={{ cursor: style?.[placement]?.cursor }}
      >
        <div ref={drawerRef} className="content" style={style?.[placement]?.content || {}}>
          <div
            className="operatingBar"
            style={style?.[placement]?.bar || {}}
            onMouseUp={onMouseUp}
            onMouseDown={onMouseDown}
          />
          {children}
        </div>
      </div>
    </div>
  );
};

export default (props: any) => {
  const { isOpen, ...other } = props;
  if (!isOpen) return null;
  return <ResizeLayout {...other} />;
};
