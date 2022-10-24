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
        <p>{intl.get('intelligence.missingTip1')}</p>
        <p>{intl.get('intelligence.missingTip2')}</p>
      </>
    }
  />
);

export default MissingTip;
