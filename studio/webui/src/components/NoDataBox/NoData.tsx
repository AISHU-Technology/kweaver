import React, { memo } from 'react';
import classNames from 'classnames';

export interface NoDataProps {
  className?: string;
  imgSrc: React.ImgHTMLAttributes<HTMLImageElement>['src'];
  imgAlt?: React.ImgHTMLAttributes<HTMLImageElement>['alt'];
  desc: React.ReactNode;
}

const NoData = (props: NoDataProps) => {
  const { className, imgSrc, imgAlt = 'nodata', desc } = props;

  return (
    <div className={classNames('ad-mt-9 ad-mb-9', className)} style={{ textAlign: 'center' }}>
      <img src={imgSrc} alt={imgAlt} className="ad-tip-img" />
      <div className="ad-c-text">{desc}</div>
    </div>
  );
};

export default memo(NoData);
