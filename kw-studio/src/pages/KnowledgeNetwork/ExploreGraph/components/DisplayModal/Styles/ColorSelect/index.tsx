import React, { useState, useEffect } from 'react';
import { TwitterPicker, SketchPicker } from 'react-color';

import { COLORS_CARD } from '@/enums';

import './style.less';

const COLORS = COLORS_CARD.getColor();

const ColorSelect = (props: any) => {
  const { value } = props;
  const { onChangeColor } = props;

  const [color, setColor] = useState(value);
  useEffect(() => {
    if (value && !color) setColor(value);
  }, [value]);

  const onChange = (data: any) => {
    setColor(data?.rgb);
    onChangeColor({ type: 'color', data });
  };

  return (
    <div className="colorSelectRoot">
      <TwitterPicker
        className="twitterPicker"
        width="100%"
        triangle="hide"
        color={color}
        colors={COLORS}
        onChange={onChange}
      />
      <SketchPicker className="sketchPicker" width="454px" color={color} onChange={onChange} />
    </div>
  );
};

export default ColorSelect;
