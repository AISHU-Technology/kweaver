import React, { useMemo, useState, useEffect } from 'react';
import classnames from 'classnames';
import { LeftOutlined, CloseOutlined } from '@ant-design/icons';

import Format from '@/components/Format';
import DragLine from '@/components/DragLine';

import './style.less';

export const LeftDrawerTitle = (props: any) => {
  const { title, visible = true } = props;
  const { onGoBack, onCloseLeftDrawer } = props;
  if (!visible) return null;
  return (
    <div className="kw-space-between kw-border-b" style={{ height: 56 }}>
      <div className="kw-align-center">
        {onGoBack && <LeftOutlined className="kw-mr-2" onClick={onGoBack} />}
        <Format.Title level={22}>{title}</Format.Title>
      </div>
      <CloseOutlined className="kw-pointer" onClick={onCloseLeftDrawer} />
    </div>
  );
};

type LeftDrawerType = {
  title?: React.ReactNode;
  scaling?: boolean;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  padding?: boolean; // 默认padding: 0 24px;
  onGoBack?: () => void;
  onCloseLeftDrawer?: () => void;
  style?: any;
  className?: string;
  children?: React.ReactNode;
  responseScaling?: boolean;
};
const LeftDrawer = (props: LeftDrawerType) => {
  const { style, className, children, padding = true } = props;
  const {
    title,
    scaling,
    responseScaling = false,
    width = style?.width || 440,
    minWidth = 440,
    maxWidth = 1000
  } = props;
  const { onGoBack, onCloseLeftDrawer } = props;
  const [scalingWidth, setScalingWidth] = useState(width);
  const onWidthDrag = (offset: number) => {
    const x = scalingWidth + offset;
    const curWidth = x > maxWidth ? maxWidth : x < minWidth ? minWidth : x;
    setScalingWidth(curWidth);
  };

  useEffect(() => {
    if (typeof scaling === 'boolean' && !scaling) {
      setScalingWidth(width);
    }
  }, [scaling]);

  // 子组件是否响应宽度伸缩而重新渲染，如果响应有性能消耗
  const child = responseScaling
    ? React.Children.map(children, (item: any) => {
        if (!item) return null;
        return React.cloneElement(item);
      })
    : children;

  return (
    <div
      className={classnames('leftDrawerRoot', className)}
      style={{ ...style, ...(scaling ? { width: scalingWidth } : {}), ...(padding ? { padding: '0 24px' } : {}) }}
    >
      {title && (
        <LeftDrawerTitle title={title} visible={!!title} onGoBack={onGoBack} onCloseLeftDrawer={onCloseLeftDrawer} />
      )}
      {scaling && <DragLine className="dragLine" style={{ left: scalingWidth - 5 }} onChange={onWidthDrag} />}
      {child}
    </div>
  );
};

export default LeftDrawer;
