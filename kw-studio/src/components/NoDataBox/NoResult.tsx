import React from 'react';
import intl from 'react-intl-universal';
import NoData, { NoDataProps } from './NoData';
import emptyImg from '@/assets/images/empty.svg';

export default function NoResult(props: NoDataProps) {
  return <NoData {...props} imgSrc={emptyImg} desc={intl.get('global.noResult')} />;
}
