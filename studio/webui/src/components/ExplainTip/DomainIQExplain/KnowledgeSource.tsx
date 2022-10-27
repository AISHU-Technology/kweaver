/**
 * 知识量得分
 */
import React from 'react';
import intl from 'react-intl-universal';
import BaseTip from '../BaseTip';

const logStyles = {
  display: 'inline-block',
  transform: 'translateY(4px) scale(0.8)',
  fontSize: 12
};

const KnowledgeSource = () => (
  <BaseTip
    autoMaxWidth
    title={
      <>
        <p>{intl.get('intelligence.knwSourceTip1')}</p>
        <p>
          {intl.get('intelligence.knwSourceTip2')}
          <span style={{ ...logStyles }}>10</span>
          {intl.get('intelligence.knwSourceTip3')}
        </p>
      </>
    }
  />
);

export default KnowledgeSource;
