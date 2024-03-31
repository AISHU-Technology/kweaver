import React from 'react';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import './style.less';

export interface DeployStatusIconProps {
  className?: string;
}

const DeployStatusIcon = (props: any) => {
  const { className, status } = props;
  return (
    <div className={classNames(className, 'kw-align-center')} style={{ display: 'inline-flex' }}>
      <div className={classNames('prompt-status-icon kw-mr-2', status ? 'kw-bg-success' : 'kw-bg-watermark')} />
      <span style={{ whiteSpace: 'nowrap' }}>
        {status ? intl.get('modelService.published') : intl.get('modelService.unpublished')}
      </span>
    </div>
  );
};

export default DeployStatusIcon;
