/**
 * 顶部步骤条
 */

import React, { memo } from 'react';
import { LeftOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import KwSteps from '@/components/KwSteps';
import ExplainTip from '@/components/ExplainTip';
import KwExitBar from '@/components/KwExitBar';

import './style.less';

export interface TopStepsProps {
  step?: number;
  onExit?: () => void;
}

const TopSteps = (props: TopStepsProps) => {
  const { step = 0, onExit } = props;

  // 所有步骤条标题
  const titleList = [
    { title: intl.get('cognitiveSearch.qaKwvConfig.intentConfig') },
    { title: intl.get('cognitiveSearch.qaKwvConfig.graphConfig') },
    { title: intl.get('cognitiveSearch.answersOrganization.answersOrganization') }
  ];
  return (
    <div className="qaKwvancedConfigStep">
      <KwExitBar
        style={{ height: 48, border: 0 }}
        onExit={onExit}
        exitText={intl.get('global.back')}
        title={
          <div className="t-name kw-c-header kw-ellipsis" title={intl.get('cognitiveSearch.qaKwvConfig.qaKwvConfig')}>
            {intl.get('cognitiveSearch.qaKwvConfig.qaKwvConfig')}
            <ExplainTip title={intl.get('cognitiveSearch.qaKwvConfig.tip')} />
          </div>
        }
        extraContent={<KwSteps items={titleList} current={step} />}
      />
    </div>
  );
};

export default memo(TopSteps);
