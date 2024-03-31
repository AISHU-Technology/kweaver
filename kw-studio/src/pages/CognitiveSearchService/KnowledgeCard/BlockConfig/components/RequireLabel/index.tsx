import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import './style.less';

export interface RequireLabelProps {
  className?: string;
  label: React.ReactNode;
}

const RequireLabel = (props: RequireLabelProps) => {
  const { className, label } = props;
  return <div className={classNames(className, 'c-require-label kw-mb-2')}>{label}</div>;
};

export default RequireLabel;
