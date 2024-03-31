import React from 'react';

import { Tooltip } from 'antd';

import classNames from 'classnames';
import IconFont from '@/components/IconFont';

import './style.less';

export interface ApiButtonProps {
  className?: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  type?: string;
}

const ApiButton = (props: ApiButtonProps) => {
  const { className, onClick, type } = props;
  return (
    <Tooltip title={type ? 'API文档' : ''}>
      <div
        className={classNames('mf-api-btn', className)}
        onClick={e => {
          e.stopPropagation();
          onClick?.(e);
        }}
      >
        <span style={{ fontSize: 12 }}>RESTful API</span>
        <IconFont type="icon-zhuanfa_xiantiao" className="kw-ml-1" />
      </div>
    </Tooltip>
  );
};

export default ApiButton;
