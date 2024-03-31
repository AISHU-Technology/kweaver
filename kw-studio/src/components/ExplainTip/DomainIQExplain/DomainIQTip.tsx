/**
 * 领域智商
 */
import React from 'react';
import intl from 'react-intl-universal';
import BaseTip from '../BaseTip';

const DomainIQTip = () => (
  <BaseTip
    autoMaxWidth
    title={
      <>
        <div>{intl.get('intelligence.domainIQTip1')}</div>
        <div>{intl.get('intelligence.domainIQTip2')}</div>
      </>
    }
  />
);

export default DomainIQTip;
