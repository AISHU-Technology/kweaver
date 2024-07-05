import React from 'react';
import { Tooltip } from 'antd';
import classNames from 'classnames';
import type { TooltipProps } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { isDef } from '@/utils/handleFunction';
import './style.less';

export type BaseTipProps = TooltipProps & {
  iconClassName?: string;
  autoMaxWidth?: boolean;
  type?: 'KNW_SOURCE' | 'KNW_TOTAL_SOURCE' | 'QUALITY_SOURCE' | 'DOMAIN_IQ' | 'MISSING' | 'REPEAT_RATE' | 'DEFAULT';
};

/**
 * @param iconClassName 问号图标类名
 * @param autoMaxWidth 不限制最大宽度
 */
const BaseTip = (props: BaseTipProps) => {
  const { overlayClassName, iconClassName, autoMaxWidth, children, ...tipProps } = props;
  return (
    <Tooltip
      {...tipProps}
      overlayClassName={classNames('c-explain-tip', overlayClassName, { 'auto-max': autoMaxWidth })}
    >
      {isDef(children) ? (
        children
      ) : (
        <QuestionCircleOutlined className={classNames('c-question-icon kw-c-subtext kw-pointer', iconClassName)} />
      )}
    </Tooltip>
  );
};

export default BaseTip;
