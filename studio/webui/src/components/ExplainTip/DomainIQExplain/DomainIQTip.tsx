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
        <p>{intl.get('intelligence.domainIQTip1')}</p>
        <p>{intl.get('intelligence.domainIQTip2')}</p>
      </>
    }
  />
);

export default DomainIQTip;
