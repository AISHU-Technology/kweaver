/**
 * 数据质量得分
 */
import React from 'react';
import intl from 'react-intl-universal';
import BaseTip from '../BaseTip';

const QualitySource = () => (
  <BaseTip
    autoMaxWidth
    title={
      <>
        <div>{intl.get('intelligence.qualitySourceTip1')}</div>
        <div>{intl.get('intelligence.qualitySourceTip2')}</div>
      </>
    }
  />
);

export default QualitySource;
