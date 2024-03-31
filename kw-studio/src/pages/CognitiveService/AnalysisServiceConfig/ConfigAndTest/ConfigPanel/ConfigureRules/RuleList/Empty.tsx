import React from 'react';
import intl from 'react-intl-universal';
import kongImg from '@/assets/images/kong.svg';

export default function Empty(props: { onAddRuleGroup: () => void }) {
  const { onAddRuleGroup } = props;
  return (
    <div className="empty-wrapper">
      <img src={kongImg} alt="no data" className="kw-tip-img" />
      <div className="kw-center">
        <span className="kw-c-text">{intl.get('exploreGraph.emptyRuleText')?.split('|')[0]}</span>
        <span className="kw-c-primary kw-pointer" onClick={onAddRuleGroup}>
          {intl.get('exploreGraph.emptyRuleText')?.split('|')[1]}
        </span>
        <span className="kw-c-text">{intl.get('exploreGraph.emptyRuleText')?.split('|')[2]}</span>
      </div>
    </div>
  );
}
