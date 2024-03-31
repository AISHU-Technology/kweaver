/**
 * 缺失率
 */
import React from 'react';
import intl from 'react-intl-universal';
import BaseTip from '../BaseTip';

const MissingTip = () => (
  <BaseTip
    autoMaxWidth
    title={
      <>
        <div>{intl.get('intelligence.missingTip1')}</div>
        <div>{intl.get('intelligence.missingTip2')}</div>
      </>
    }
  />
);

export default MissingTip;
