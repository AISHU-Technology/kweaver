/**
 * 顶部步骤条
 */

import React, { memo } from 'react';
import { Button } from 'antd';
import { CheckOutlined, LeftOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import HOOKS from '@/hooks';
import './style.less';

// 文字图标
const NumIcon = ({ number }: { number: number }) => <span className="kw-center">{number}</span>;

export interface TopStepsProps {
  step?: number;
  title?: string;
  isHideStep?: boolean;
  exitText?: string;
  onExit?: () => void;
}

const TopSteps = (props: TopStepsProps) => {
  const { step = 0, title = '', isHideStep, exitText, onExit } = props;
  const language = HOOKS.useLanguage();

  // 所有步骤条标题
  const titleList = [
    intl.get('cognitiveSearch.dataConfig'),
    intl.get('cognitiveSearch.mode'),
    intl.get('cognitiveSearch.publishing')
  ];

  return (
    <div className="cognitive-top-steps-root kw-align-center">
      <div className="left-extra">
        <Button onClick={onExit} type="text" className="kw-pl-6">
          <LeftOutlined />
          <span>{exitText || intl.get('global.exit')}</span>
        </Button>
        <div className="t-name kw-c-header kw-ellipsis" title={title}>
          {title}
        </div>
      </div>
      <div className="steps-box kw-center">
        {!isHideStep &&
          titleList.map((title, index) => {
            const isFinish = index < step;
            const isProgress = index === step;

            return (
              <div
                key={title}
                className={`step-item ${isFinish && 'finish'} ${isProgress && 'progress'} ${
                  language === 'en-US' && 'en-step'
                }`}
              >
                <span className="status-icon">
                  {isFinish ? (
                    <CheckOutlined
                      className={classNames('check-icon', isFinish || isProgress ? 'kw-c-primary' : 'kw-c-subtext')}
                    />
                  ) : (
                    <NumIcon number={index + 1} />
                  )}
                </span>
                <span className="step-title">{title}</span>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default memo(TopSteps);
