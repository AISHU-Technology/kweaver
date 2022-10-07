import React from 'react';
import { Tooltip } from 'antd';
import type { TooltipProps } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import './baseTipStyle.less';

export type BaseTipProps = TooltipProps & {
  iconClassName?: string;
  autoMaxWidth?: boolean;
};

/**
 * @param iconClassName 问号图标类名
 * @param autoMaxWidth 不限制最大宽度
 */
const BaseTip = (props: BaseTipProps) => {
  const { overlayClassName, iconClassName, autoMaxWidth, ...tipProps } = props;
  return (
    <Tooltip
      {...tipProps}
      overlayClassName={classNames('ad-explain-tip', overlayClassName, { 'auto-max': autoMaxWidth })}
    >
      <QuestionCircleOutlined className={classNames('ad-question-icon', iconClassName)} />
    </Tooltip>
  );
};

export default BaseTip;
