import React from 'react';
import classNames from 'classnames';
import IconFont from '@/components/IconFont';
import './style.less';

export interface DataRowProps {
  className?: string;
  title?: string;
  label?: string; // 输入框显示的值
  value?: string; // 最终复制的值
  onCopy?: (value: string) => void;
}

const DataRow = (props: any) => {
  const { className, title, label, value, onCopy } = props;
  return (
    <div className={classNames(className, 'kw-c-header')}>
      <div className="kw-mb-2">{title}</div>
      <div className="value-input kw-align-center kw-pl-3 kw-pr-3">
        <div className="kw-flex-item-full-width kw-ellipsis">{label || value}</div>
        <IconFont className="kw-ml-2" type="icon-copy" onClick={() => onCopy?.(value)} />
      </div>
    </div>
  );
};

export default DataRow;
