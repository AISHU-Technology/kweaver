/**
 * 重复率
 */
import React from 'react';
import intl from 'react-intl-universal';
import BaseTip from '../BaseTip';

const RepeatRateTip = () => (
  <BaseTip
    autoMaxWidth
    title={
      <>
        <div>{intl.get('intelligence.repeatTip1')}</div>
        <div>{intl.get('intelligence.repeatTip2')}</div>
      </>
    }
  />
);

export default RepeatRateTip;
