import React from 'react';
import { CloseOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import Format from '@/components/Format';
import './style.less';

export interface HeaderProps {
  className?: string;
  title?: React.ReactNode;
  allowClose?: boolean;
  onClose?: () => void;
}

const Header = (props: HeaderProps) => {
  const { className, title, allowClose = false, onClose } = props;
  return (
    <div className={classNames(className, 'knw-card-config-header kw-space-between')}>
      <Format.Title>{title}</Format.Title>
      {allowClose && (
        <div className="close-mask kw-pointer" onClick={onClose}>
          <CloseOutlined />
        </div>
      )}
    </div>
  );
};

export default Header;
