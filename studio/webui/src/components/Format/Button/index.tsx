import React from 'react';
import classnames from 'classnames';
import { Button as AntdButton } from 'antd';

import { ButtonType } from '../type';

import './style.less';

const SIZE = {
  large: 'ad-format-button-large',
  middle: 'ad-format-button-middle',
  small: 'ad-format-button-small',
  smallest: 'ad-format-button-smallest'
};

const Button = (props: ButtonType) => {
  const { size = 'middle', children, className, ...othersProps } = props;
  const extendSize = SIZE[size as keyof typeof SIZE] || '';
  return (
    <AntdButton className={classnames('ad-format-button', extendSize, className)} {...othersProps}>
      {children}
    </AntdButton>
  );
};

export default Button;
