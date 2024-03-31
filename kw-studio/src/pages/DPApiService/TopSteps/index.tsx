/**
 * 顶部步骤条
 */

import React, { memo, useContext } from 'react';
import { Button } from 'antd';
import { CheckOutlined, LeftOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import AdSteps from '@/components/AdSteps';

import HOOKS from '@/hooks';
import './style.less';
import { DpapiDataContext } from '../dpapiData';
export interface TopStepsProps {
  step?: number;
  pageAction?: string;
  isHideStep?: boolean;
  onExit?: () => void;
}

const TopSteps = (props: TopStepsProps) => {
  const { step = 0, isHideStep, onExit, pageAction } = props;
  const language = HOOKS.useLanguage();
  // @ts-ignore
  const { data, dispatch } = useContext(DpapiDataContext);
  const { basicData } = data.toJS();
  const title = pageAction === 'create' ? intl.get('dpapiService.createService') : basicData.name;

  // 所有步骤条标题
  const titleList = [{ title: intl.get('dpapiService.SQLsetting') }, { title: intl.get('dpapiService.publishAPI') }];
  return (
    <div className="cognitive-top-steps-root kw-align-center">
      <div className="left-extra">
        <Button onClick={onExit} type="text" className="kw-pl-6">
          <LeftOutlined />
          <span>{intl.get('global.exit')}</span>
        </Button>
        <div className="t-name kw-c-header kw-ellipsis" title={title}>
          {title}
        </div>
      </div>
      <div className="kw-flex-item-full-width kw-center kw-pr-5" style={{ marginRight: 294 }}>
        <AdSteps items={titleList} current={step} />
      </div>
    </div>
  );
};

export default memo(TopSteps);
