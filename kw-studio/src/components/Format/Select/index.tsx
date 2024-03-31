import React from 'react';
import classnames from 'classnames';
import { Select as AntdSelect } from 'antd';

import { SelectType } from '../type';

import './style.less';

const SIZE = {
  large: 'kw-format-select-large',
  middle: 'kw-format-select-middle',
  small: 'kw-format-select-small'
};

const Select = (props: SelectType) => {
  const { size = 'large', children, className, ...othersProps } = props;
  const extendSize = SIZE[size as keyof typeof SIZE] || '';
  return (
    <AntdSelect className={classnames('kw-format-select', extendSize, className)} {...othersProps}>
      {children}
    </AntdSelect>
  );
};

export default Select;
