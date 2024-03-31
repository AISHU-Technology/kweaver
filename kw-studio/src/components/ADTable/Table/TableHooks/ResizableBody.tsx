/* eslint-disable no-empty-pattern */
import React, { type FC, type ThHTMLAttributes, memo, useEffect, useRef } from 'react';
import { Table, Tag, Space, Dropdown, Tooltip, Menu } from 'antd';
import { Resizable, type ResizeCallbackData } from 'react-resizable';
import { useSafeState } from './utils/useSafeState';
import { isString } from './utils';
import { type ColumnOriginType } from './useAntdResizableHeader';
import intl from 'react-intl-universal';

import Format from '@/components/Format';

import './index.css';

type ComponentProp = {
  onResize: (width: number) => void;
  onMount: (width: number) => void;
  onResizeStart?: (width: number) => void;
  onResizeEnd?: (width: number) => void;
  triggerRender: number;
  width: number;
  minWidth: number;
  maxWidth: number;
} & ColumnOriginType<any> &
  ThHTMLAttributes<HTMLTableCellElement>;

const ResizableBody: FC<ComponentProp> = props => {
  const { width, minWidth, maxWidth, children } = props;

  const [resizeWidth, setResizeWidth] = useSafeState<number>(0);

  useEffect(() => {
    if (width) {
      setResizeWidth(width);
    }
  }, [setResizeWidth, width]);

  const onSelfResize = ({}, data: ResizeCallbackData) => {
    setResizeWidth(data.size.width);
  };

  return (
    <Resizable
      className="resizable-box"
      width={resizeWidth}
      minConstraints={[minWidth, 0]}
      maxConstraints={[maxWidth, 0]}
      height={0}
      handle={
        <div
          className="resizable-handler"
          onClick={e => {
            e.stopPropagation();
          }}
        >
          <div className="resizable-line" />
        </div>
      }
      draggableOpts={{ enableUserSelectHack: false }}
      onResize={onSelfResize}
    >
      <td {...props}>{children}</td>
    </Resizable>
  );
};

export default memo(ResizableBody);
