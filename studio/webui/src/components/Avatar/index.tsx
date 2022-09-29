import React from 'react';
import './style.less';

export interface AvatarNameProps {
  str: string;
  style?: React.CSSProperties;
  color?: string;
  size?: number;
}

const AvatarName: React.FC<AvatarNameProps> = ({ str = '', color, size = 40, style = {} }) => {
  const propsToStyles: React.CSSProperties = { width: size, height: size };

  if (color) {
    Object.assign(propsToStyles, {
      color: `${color}`,
      background: `${`${color}15`}`,
      border: `1px solid ${`${color}10`}`
    });
  }

  return (
    <div className="avatarNameRoot" style={{ ...propsToStyles, ...style }}>
      {str.slice(0, 1)}
    </div>
  );
};

export default AvatarName;
