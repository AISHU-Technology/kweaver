/**
 * 顶部步骤条
 */

import React, { memo } from 'react';
import { LeftOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import AdSteps from '@/components/AdSteps';
import ExplainTip from '@/components/ExplainTip';
import AdExitBar from '@/components/AdExitBar/AdExitBar';

import './style.less';

export interface TopStepsProps {
  step?: number;
  onExit?: () => void;
}

const TopSteps = (props: TopStepsProps) => {
  const { step = 0, onExit } = props;

  // 所有步骤条标题
  const titleList = [
    { title: intl.get('cognitiveSearch.qaAdvConfig.intentConfig') },
    { title: intl.get('cognitiveSearch.qaAdvConfig.graphConfig') },
    { title: intl.get('cognitiveSearch.answersOrganization.answersOrganization') }
  ];
  return (
    <div className="qaAdvancedConfigStep">
      <AdExitBar
        style={{ height: 48, border: 0 }}
        onExit={onExit}
        exitText={intl.get('global.back')}
        title={
          <div className="t-name kw-c-header kw-ellipsis" title={intl.get('cognitiveSearch.qaAdvConfig.qaAdvConfig')}>
            {intl.get('cognitiveSearch.qaAdvConfig.qaAdvConfig')}
            <ExplainTip title={intl.get('cognitiveSearch.qaAdvConfig.tip')} />
          </div>
        }
        extraContent={<AdSteps items={titleList} current={step} />}
      />
    </div>
  );
};

export default memo(TopSteps);
