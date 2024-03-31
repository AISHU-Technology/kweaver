import React from 'react';

const RenderStep = (props: any) => {
  const { index, height } = props;
  return (
    <div className="kw-center" style={{ height: 32 + height, flexDirection: 'column' }}>
      <div
        className="kw-border kw-center"
        style={{ height: 32, width: 32, borderRadius: '50%', background: 'rgba(0,0,0,0.04)' }}
      >
        {index}
      </div>
      <div style={{ height, width: 1, background: 'rgba(0,0,0,0.1)' }} />
    </div>
  );
};
export default RenderStep;
