import React from 'react';
import classnames from 'classnames';
import Format from '@/components/Format';

export interface HeaderModalProps {
  children?: React.ReactNode;
  title: string | React.ReactNode; // 标题
  className?: string;
}

const Header = (props: HeaderModalProps) => {
  const { title, className } = props;

  return (
    <div className={classnames('kw-universal-modal-header', className)}>
      {title ? (
        typeof title !== 'string' ? (
          <div className="kw-pt-4 kw-pl-6 kw-format-text-no-height-3 kw-format-strong-6 kw-c-header">{title}</div>
        ) : (
          <Format.Title level={3} className="kw-mt-4 kw-ml-6 kw-format-text-no-height-3">
            {title}
          </Format.Title>
        )
      ) : null}
    </div>
  );
};

export default (props: any) => {
  const { visible = true, ...other } = props;
  if (!visible) return null;
  return <Header {...other} />;
};
