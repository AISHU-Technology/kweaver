import React from 'react';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import './style.less';

export interface ComponentCardProps {
  className?: string;
  img?: string;
  title?: string;
  disabled?: boolean;
  allowAdd?: boolean;
  onAdd?: () => void;
}

const ComponentCard = (props: ComponentCardProps) => {
  const { className, img, title, allowAdd, onAdd } = props;
  return (
    <div className={classNames(className, 'card-component-item')}>
      <div className="card-img kw-center kw-mb-2 kw-p-1">
        <img src={img} alt={title} />
        {allowAdd && (
          <div className="mask-btn kw-pointer" onClick={onAdd}>
            <span>{intl.get('global.add')}</span>
          </div>
        )}
      </div>
      <div className="kw-c-subtext" style={{ textAlign: 'center' }}>
        {title}
      </div>
    </div>
  );
};

export default ComponentCard;
