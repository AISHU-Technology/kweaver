import React from 'react';
import { TwitterPicker, SketchPicker } from 'react-color';
import { COLORS_CARD } from '@/enums';
import { rgbaToHex } from '@/utils/helper/rgbaToHex';
import './style.less';

const COLORS = COLORS_CARD.getColor();

const ColorSelect = (props: any) => {
  const { value, onChangeColor } = props;

  const handleChange = (color: any) => {
    const { r, g, b, a = 1 } = color.rgb;
    onChangeColor({
      ...color,
      hex: rgbaToHex(color.rgb),
      rgba: `rgba(${r},${g},${b},${a})`
    });
  };

  return (
    <div className="colorSelectRoot">
      <TwitterPicker
        className="twitterPicker"
        width="100%"
        triangle="hide"
        color={value}
        colors={COLORS}
        onChange={handleChange}
      />
      <SketchPicker className="sketchPicker" width="454px" color={value} onChange={handleChange} />
    </div>
  );
};

export default ColorSelect;
