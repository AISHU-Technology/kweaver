import React from 'react';
import { Tooltip } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import classNames from 'classnames';

const ErrorTip = (props: { className?: string }) => {
  return (
    <Tooltip
      title={intl.get('exploreGraph.hasDeleteTip')}
      // getPopupContainer={triggerNode => triggerNode.parentElement!}
    >
      <ExclamationCircleOutlined className={classNames(props.className, 'kw-c-error')} />
    </Tooltip>
  );
};

export default ErrorTip;
