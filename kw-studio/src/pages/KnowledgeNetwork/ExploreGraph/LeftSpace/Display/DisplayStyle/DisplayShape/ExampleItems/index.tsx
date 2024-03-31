import React from 'react';

import IconFont from '@/components/IconFont';

import './style.less';

const CircleA = () => {
  return (
    <div className="exampleItemCircle">
      <div className="circle">
        <IconFont type="graph-model" style={{ fontSize: 20 }} />
      </div>
      文本示例
    </div>
  );
};

const CircleB = () => {
  return (
    <div className="exampleItemCircle">
      <div className="circle circleLarge">
        <IconFont type="graph-model" style={{ fontSize: 20 }} />
        文本
      </div>
    </div>
  );
};

const RectA = () => {
  return (
    <div className="exampleItemRect">
      <IconFont type="graph-model" style={{ color: '#118bed', fontSize: 24, marginRight: 8 }} />
      文本示例
    </div>
  );
};

const RectB = () => {
  return (
    <div className="exampleItemRect">
      <div className="sign" />
      <IconFont type="graph-model" style={{ color: '#118bed', fontSize: 24, marginRight: 8 }} />
      文本示例
    </div>
  );
};

export { CircleA, CircleB, RectA, RectB };
