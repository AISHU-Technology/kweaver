import React, { memo } from 'react';

import loadingSvg from '@/assets/images/jiazai.svg';

import './style.less';

interface KwSpinProps {
  size?: number,
  desc?: string,
  className?: string,
  style?: Record<string,any>
}

const KwSpin = (props: KwSpinProps) => {
  const { className, style, size, desc } = props;

  return (
    <div className={`kw-spin ${className}`} style={{ ...style }}>
      <img className="spin-img" style={{ width: size }} src={loadingSvg} alt="loading" />

      {desc && <div className="spin-desc">{desc}</div>}
    </div>
  );
};

export default memo(KwSpin);
