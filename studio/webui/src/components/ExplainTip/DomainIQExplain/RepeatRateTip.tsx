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
        <p>{intl.get('intelligence.repeatTip1')}</p>
        <p>{intl.get('intelligence.repeatTip2')}</p>
      </>
    }
  />
);

export default RepeatRateTip;
