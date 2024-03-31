import React from 'react';
import { TwitterPicker, SketchPicker } from 'react-color';

import { COLORS_CARD } from '@/enums';

import './style.less';

const COLORS = COLORS_CARD.getColor();
COLORS.push('#ffffff');

const ColorSelect = (props: any) => {
  const { value } = props;
  const { onChangeColor } = props;

  const onChange = (data: any) => {
    onChangeColor({ type: 'color', data });
  };

  return (
    <div className="colorSelectRoot">
      <TwitterPicker
        className="twitterPicker"
        width="100%"
        triangle="hide"
        color={value}
        colors={COLORS}
        onChange={onChange}
      />
      <SketchPicker className="sketchPicker" width="454px" color={value} onChange={onChange} />
    </div>
  );
};

export default ColorSelect;
