import React from 'react';
import intl from 'react-intl-universal';
import NoData from './NoData';
import noResImg from '@/assets/images/noResult.svg';

export default function NoResult() {
  return <NoData imgSrc={noResImg} desc={intl.get('global.noResult')} />;
}
