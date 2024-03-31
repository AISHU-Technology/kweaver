import React, { CSSProperties } from 'react';
import classNames from 'classnames';
import FileIcon from '@/components/FileIcon';

interface DataListItemDisabledProps {
  className?: string;
  style?: CSSProperties;
  name: string;
  selectedDS?: any;
}

const DataListItemDisabled: React.FC<DataListItemDisabledProps> = props => {
  const { className, style, name, selectedDS } = props;
  const prefixCls = 'data-list-item-disabled';
  const newStyle: CSSProperties = {
    height: 32,
    background: '#f5f5f5',
    cursor: 'not-allowed',
    ...style
  };
  return (
    <div
      className={classNames(prefixCls, className, 'kw-border-form-item kw-align-center kw-pl-3')}
      style={newStyle}
      title={name}
    >
      <FileIcon type="sheet" size={16} className="kw-mr-2" dataSource={selectedDS?.data_source} />
      <span className="kw-flex-item-full-width kw-ellipsis">{name}</span>
    </div>
  );
};

export default DataListItemDisabled;
