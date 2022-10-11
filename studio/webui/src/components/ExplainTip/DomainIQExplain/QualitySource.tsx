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
        <p>{intl.get('intelligence.qualitySourceTip1')}</p>
        <p>{intl.get('intelligence.qualitySourceTip2')}</p>
      </>
    }
  />
);

export default QualitySource;
