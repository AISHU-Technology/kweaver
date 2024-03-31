import React from 'react';
import { LoadingOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import './style.less';

export interface LoadingMaskProps {
  classname?: string;
  style?: React.CSSProperties;
  loading: boolean;
}

/**
 * loading状态，有一层遮罩防止点击, 外层需指定position：relative, 全覆盖
 */
const LoadingMask = (props: LoadingMaskProps) => {
  const { classname, style, loading } = props;

  return loading ? (
    <div className={classNames('c-loading-mask', classname)} style={style}>
      <LoadingOutlined className="c-l-icon" />
    </div>
  ) : null;
};

export default LoadingMask;
