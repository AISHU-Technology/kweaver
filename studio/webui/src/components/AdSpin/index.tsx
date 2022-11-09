import React, { memo } from 'react';
import classNames from 'classnames';
import loadingSvg from '@/assets/images/jiazai.svg';
import './style.less';

interface AdSpinProps {
  className?: string;
  style?: React.CSSProperties;
  size?: number;
  desc?: string;
}

const AdSpin: React.FC<AdSpinProps> = props => {
  const { className, style = {}, size, desc } = props;

  return (
    <div className={classNames('ad-spin', className)} style={{ ...style }}>
      <img className="spin-img" style={{ width: size }} src={loadingSvg} alt="loading" />
      {desc && <p className="spin-desc">{desc}</p>}
    </div>
  );
};

export default memo(AdSpin);
