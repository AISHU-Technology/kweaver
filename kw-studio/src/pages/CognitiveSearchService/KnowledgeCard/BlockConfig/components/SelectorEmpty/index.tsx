import React from 'react';
import { Empty } from 'antd';
import intl from 'react-intl-universal';
import kongImg from '@/assets/images/kong.svg';

const SelectorEmpty = (props: any) => {
  return <Empty image={kongImg} description={intl.get('global.noData')} />;
};

export default SelectorEmpty;
