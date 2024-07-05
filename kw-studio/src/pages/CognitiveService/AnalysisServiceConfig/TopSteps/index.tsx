/**
 * 顶部步骤条
 */
import React, { memo } from 'react';
import intl from 'react-intl-universal';
import KwSteps from '@/components/KwSteps';
import KwExitBar from '@/components/KwExitBar';

export interface TopStepsProps {
  step?: number;
  title?: string;
  isHideStep?: boolean;
  onExit?: () => void;
}

const TopSteps = (props: TopStepsProps) => {
  const { step = 0, title = '', onExit } = props;

  // 所有步骤条标题
  const titleList = [
    { title: intl.get('analysisService.baseInfoT') },
    { title: intl.get('analysisService.testT') },
    { title: intl.get('analysisService.PublishT') }
  ];

  return (
    <div className="kw-border-b">
      <KwExitBar
        style={{ height: 48, border: 0 }}
        onExit={onExit}
        title={title}
        extraContent={<KwSteps items={titleList} current={step} />}
      />
    </div>
  );
};

export default memo(TopSteps);
