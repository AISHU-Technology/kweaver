/**
 * loading图标
 * @author Jason.ji
 * @date 2022/01/12
 *
 */

import React, { memo } from 'react';
import loadingSvg from '@/assets/images/jiazai.svg';
import './style.less';

const AdSpin = props => {
  const { className, style, size, desc } = props;

  return (
    <div className={`ad-spin ${className}`} style={{ ...style }}>
      <img className="spin-img" style={{ width: size }} src={loadingSvg} alt="loading" />

      {desc && <p className="spin-desc">{desc}</p>}
    </div>
  );
};

AdSpin.defaultProps = {
  className: '',
  style: {}
};

export default memo(AdSpin);
