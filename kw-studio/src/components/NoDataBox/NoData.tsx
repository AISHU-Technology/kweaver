import React, { memo } from 'react';
import classNames from 'classnames';

export interface NoDataProps {
  className?: string;
  style?: React.CSSProperties;
  imgSrc: React.ImgHTMLAttributes<HTMLImageElement>['src'];
  imgAlt?: React.ImgHTMLAttributes<HTMLImageElement>['alt'];
  desc: React.ReactNode;
}

const NoData = (props: NoDataProps) => {
  const { className, style = {}, imgSrc, imgAlt = 'nodata', desc } = props;
  const cssStyles = { textAlign: 'center' as React.CSSProperties['textAlign'], ...style };
  return (
    // <div className={classNames('kw-empty-box kw-mt-9 kw-mb-9', className)} style={cssStyles}>
    <div className={classNames('kw-empty-box kw-mb-9', className)} style={cssStyles}>
      <img src={imgSrc} alt={imgAlt} className="kw-tip-img" />
      <div className="kw-c-text-lower kw-mt-3">{desc}</div>
    </div>
  );
};

export default memo(NoData);
