import React from 'react';
import _ from 'lodash';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import { TChatInfo } from '../../types';

export interface MoreInfoProps {
  className?: string;
  data?: TChatInfo[number];
}

const MoreInfo = (props: MoreInfoProps) => {
  const { className, data } = props;
  if (!data || !Object.keys(data).includes('time')) return null;
  if (data.role !== 'ai' || data.status !== 'stop') return null;
  return (
    <div className={classNames(className, 'kw-pt-1 kw-pb-1 kw-c-subtext')} style={{ fontSize: 12 }}>
      <span>{intl.get('prompt.token1')}</span>
      <span>&nbsp;{Number(data?.time)?.toFixed?.(2)}&nbsp;</span>
      <span>{intl.get('prompt.token2')}&nbsp;Token&nbsp;</span>
      <span>{data?.token_len}</span>
      <span>·&nbsp;</span>
      <span>{data?.timestamp}</span>
    </div>
  );
};

export default MoreInfo;
