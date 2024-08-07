/**
 * 顶部步骤条
 */

import React, { memo } from 'react';
import intl from 'react-intl-universal';
import KwSteps from '@/components/KwSteps';
import KwExitBar from '@/components/KwExitBar';
import './style.less';

// 文字图标
const NumIcon = ({ number }: { number: number }) => <span className="kw-center">{number}</span>;

export interface TopStepsProps {
  step?: number;
  title?: string;
  isHideStep?: boolean;
  onExit?: () => void;
}

const TopSteps = (props: TopStepsProps) => {
  const { step = 0, title = '', isHideStep, onExit } = props;

  // 所有步骤条标题
  const titleList = [
    { title: intl.get('cognitiveSearch.dataConfig') },
    { title: intl.get('cognitiveSearch.mode') },
    { title: intl.get('cognitiveSearch.publishing') }
  ];

  return (
    <div className="cognitiveSearch-top-steps-root">
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
