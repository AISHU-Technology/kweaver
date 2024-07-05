import React from 'react';
import classnames from 'classnames';
import { Input as AntdInput } from 'antd';
import { InputType } from '../type';
import './style.less';

const SIZE = {
  large: 'kw-format-input-large',
  middle: 'kw-format-input-middle',
  small: 'kw-format-input-small'
};

const Input = (props: InputType) => {
  const { size = 'middle', className, ...othersProps } = props;
  const extendSize = SIZE[size as keyof typeof SIZE] || '';
  return <AntdInput className={classnames('kw-format-input', extendSize, className)} {...othersProps} />;
};

export default Input;
