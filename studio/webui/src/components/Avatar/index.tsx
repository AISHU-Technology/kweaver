import React from 'react';

import './style.less';

const AvatarName = (props: { str: string; style?: any }) => {
  const { str, style } = props;
  return (
    <div className="avatarNameRoot" style={style}>
      {str.substring(0, 1)}
    </div>
  );
};

export default AvatarName;
