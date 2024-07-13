import classNames from 'classnames';
import React, { useMemo } from 'react';

import IconFont from '@/components/IconFont';

import './style.less';

export type KwKNIconProps = {
  type: string;
  size?: number;
  border?: boolean;
  fontSize?: number;
  className?: string;
  style?: React.CSSProperties;
};

export const KNIconList = [
  {
    icon: 'icon-color-zswl1',
    bgColor: 'rgba(250,219,20,0.06)',
    borderColor: 'rgba(250,219,20,0.15)',
    color: 'rgb(250,219,20)'
  },
  {
    icon: 'icon-color-zswl8',
    bgColor: 'rgba(255,133,1,0.06)',
    borderColor: 'rgba(255,133,1,0.15)',
    color: 'rgb(255,133,1)'
  },
  {
    icon: 'icon-color-zswl6',
    bgColor: 'rgba(247,89,89,0.06)',
    borderColor: 'rgba(247,89,89,0.15)',
    color: 'rgb(247,89,89)'
  },
  {
    icon: 'icon-color-zswl3',
    bgColor: 'rgba(247,89,171,0.06)',
    borderColor: 'rgba(247,89,171,0.15)',
    color: 'rgb(247,89,171)'
  },
  {
    icon: 'icon-color-zswl2',
    bgColor: 'rgba(146,84,222,0.06)',
    borderColor: 'rgba(146,84,222,0.15)',
    color: 'rgb(146,84,222)'
  },
  {
    icon: 'icon-color-zswl9',
    bgColor: 'rgba(18,110,227,0.06)',
    borderColor: 'rgba(18,110,227,0.15)',
    color: 'rgb(18,110,227)'
  },
  {
    icon: 'icon-color-zswl5',
    bgColor: 'rgba(1,150,136,0.06)',
    borderColor: 'rgba(1,150,136,0.15)',
    color: 'rgb(1,150,136)'
  },
  {
    icon: 'icon-color-zswl10',
    bgColor: 'rgba(19,194,194,0.06)',
    borderColor: 'rgba(19,194,194,0.15)',
    color: 'rgb(19,194,194)'
  },
  {
    icon: 'icon-color-zswl4',
    bgColor: 'rgba(82,196,26,0.06)',
    borderColor: 'rgba(82,196,26,0.15)',
    color: 'rgb(82,196,26)'
  },
  {
    icon: 'icon-color-zswl7',
    bgColor: 'rgba(140,140,140,0.06)',
    borderColor: 'rgba(140,140,140,0.15)',
    color: 'rgb(140,140,140)'
  }
];

const KwKNIcon: React.FC<KwKNIconProps> = props => {
  const { className, style = {}, type, size = 20, fontSize = 12, border = true } = props;

  const knowledgeNetIcon = useMemo(() => {
    const target = KNIconList.find(item => item.icon === type);
    if (target) {
      return target;
    }
    return {
      icon: 'icon-color-zswl7',
      bgColor: 'rgba(140,140,140,0.06)',
      borderColor: 'rgba(140,140,140,0.15)',
      color: 'rgb(140,140,140)'
    };
  }, [type]);

  const prefixCls = 'kw-kn-icon';
  const renderContent = () => {
    if (border) {
      const wrapperStyle = {
        width: size,
        height: size,
        background: knowledgeNetIcon.bgColor,
        border: `1px solid ${knowledgeNetIcon.borderColor}`,
        ...style
      };
      return (
        <div className={classNames(prefixCls, className, 'kw-center')} style={wrapperStyle}>
          <IconFont type={knowledgeNetIcon.icon} style={{ fontSize }} />
        </div>
      );
    }
    return <IconFont type={knowledgeNetIcon.icon} style={{ ...style, fontSize }} />;
  };

  return renderContent();
};

export default KwKNIcon;
