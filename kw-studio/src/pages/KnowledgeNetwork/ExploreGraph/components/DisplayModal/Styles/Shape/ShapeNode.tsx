import React from 'react';
import classnames from 'classnames';

import './style.less';

const nodeType: any = {
  circle: 'customCircle',
  rect: 'customRect'
};
const ShapeNode = (props: any) => {
  const { value } = props;
  const { onChange } = props;

  const _value = nodeType[value] ? nodeType[value] : value;

  return (
    <div className="shapeNodeRoot">
      <div
        className={classnames('type', { selected: _value === 'customCircle' })}
        onClick={() => {
          onChange('customCircle');
        }}
      >
        <div className="circle" />
      </div>
      <div
        className={classnames('type', { selected: _value === 'customRect' })}
        onClick={() => {
          onChange('customRect');
        }}
      >
        <div className="rect" />
      </div>
      <div
        className={classnames('type', { selected: _value === 'customDiamond' })}
        onClick={() => {
          onChange('customDiamond');
        }}
      >
        <div className="diamond" />
      </div>
    </div>
  );
};

export default ShapeNode;
