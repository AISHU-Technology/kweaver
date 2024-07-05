import React from 'react';
import intl from 'react-intl-universal';
import NoData from './NoData';
import emptyImg from '@/assets/images/empty.svg';

export default function NoContent(props: { desc: string }) {
  const { desc = intl.get('global.noContent') } = props;

  return <NoData imgSrc={emptyImg} desc={desc} />;
}
