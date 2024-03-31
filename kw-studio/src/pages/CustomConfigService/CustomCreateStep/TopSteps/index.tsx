/**
 * 顶部步骤条
 */

import React, { memo } from 'react';
import intl from 'react-intl-universal';
import HOOKS from '@/hooks';
import AdSteps from '@/components/AdSteps';
import AdExitBar from '@/components/AdExitBar/AdExitBar';

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
  const language = HOOKS.useLanguage();

  // 所有步骤条标题
  const titleList = [{ title: intl.get('customService.jsonFile') }, { title: intl.get('customService.publish') }];

  return (
    // <div className="cognitive-top-steps-root kw-align-center">
    //   <div className="left-extra">
    //     <Button onClick={onExit} type="text" className="kw-pl-6">
    //       <LeftOutlined />
    //       <span>{intl.get('global.exit')}</span>
    //     </Button>
    //     <div className="t-name kw-c-header kw-ellipsis" title={title}>
    //       {title}
    //     </div>
    //   </div>
    //   <div className="kw-flex-item-full-width kw-center kw-pr-5">
    //     <AdSteps items={titleList} current={step} />
    //   </div>

    // </div>
    <div className="kw-border-b">
      <AdExitBar
        style={{ height: 48, border: 0 }}
        onExit={onExit}
        title={title}
        extraContent={<AdSteps items={titleList} current={step} />}
      />
    </div>
  );
};

export default memo(TopSteps);
