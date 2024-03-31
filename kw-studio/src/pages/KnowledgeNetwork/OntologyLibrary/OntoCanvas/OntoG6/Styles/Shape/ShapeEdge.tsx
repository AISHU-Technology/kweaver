import React from 'react';
import classnames from 'classnames';

import './style.less';

const ShapeEdge = (props: any) => {
  const { value } = props;
  const { onChange } = props;
  return (
    <div className="shapeEdgeRoot">
      <div
        className={classnames('type', { selected: value === 'line' })}
        onClick={() => {
          onChange('line');
        }}
      >
        <div className="line" />
      </div>
      {/* <div
        className={classnames('type', { selected: value === 'polyline' })}
        onClick={() => {
          onChange('polyline');
        }}
      >
        <div className="polyline">
          <div className="polyline1" />
          <div className="polyline2" />
          <div className="polyline3" />
        </div>
      </div> */}
      <div
        className={classnames('type', { selected: value === 'cubic' })}
        onClick={() => {
          onChange('cubic');
        }}
      >
        <div className="cubic">
          <div className="cubic1" />
          <div className="cubic2" />
        </div>
      </div>
    </div>
  );
};

export default ShapeEdge;
