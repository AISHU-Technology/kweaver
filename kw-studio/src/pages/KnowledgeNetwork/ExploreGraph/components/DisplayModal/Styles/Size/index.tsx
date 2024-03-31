import React from 'react';
import { Radio } from 'antd';

import './style.less';

const MAX_SIZE = 48;
const SIZES_NODE = [
  { size: 16, label: '0.25x', offset: (MAX_SIZE - 16) / 2 },
  { size: 24, label: '0.5x', offset: (MAX_SIZE - 24) / 2 },
  { size: 36, label: '1x', offset: (MAX_SIZE - 36) / 2 },
  { size: 48, label: '2x', offset: (MAX_SIZE - 48) / 2 },
  { size: 64, label: '4x', offset: (MAX_SIZE - 64) / 2 }
];

const SIZES_EDGE = [
  { size: 0.75, label: '0.25x' },
  { size: 2, label: '0.5x' },
  { size: 3, label: '1x' },
  { size: 5, label: '2x' },
  { size: 10, label: '4x' }
];

const nodeStyle = (data: { size: number; offset: number }): any => {
  const { size, offset } = data;
  return {
    customRect: { width: size, height: size, marginRight: offset },
    customCircle: { width: size, height: size, borderRadius: size, marginRight: offset }
  };
};

const SOURCE: any = {
  node: SIZES_NODE,
  edge: SIZES_EDGE
};

const Size = (props: any) => {
  const { value, modalType, shapeType, disabled } = props;
  const { onChange } = props;

  return (
    <div className="sizeNodeRoot">
      <Radio.Group
        className="sizeRadioGroup"
        value={value}
        disabled={disabled}
        onChange={(e: any) => onChange(e.target.value)}
      >
        {(SOURCE[modalType] || []).map((item: any) => {
          const { size, label, offset } = item;
          let style = {};
          if (modalType === 'node') style = nodeStyle({ size, offset })?.[shapeType];
          if (modalType === 'edge') style = { width: 72, height: size };
          return (
            <Radio key={size} className="sizeRadio" value={size}>
              <div className="sizeContent">
                <div>{label}</div>
                <div className="sign" style={style} />
              </div>
            </Radio>
          );
        })}
      </Radio.Group>
    </div>
  );
};

export default Size;
