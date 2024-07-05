import React from 'react';
import _ from 'lodash';

import ColorSelect from '../ColorSelect';
import ColorFillAndStroke from './ColorFillAndStroke';

const Color = (props: any) => {
  const { modalType, fillColor, strokeColor, isFillAndStroke } = props || {};
  const { onChange } = props;

  const onChangeColor = ({ type, data }: any) => {
    const { r, g, b, a } = data?.rgb || data?.data?.rgb;
    onChange({ [type]: `rgba(${r},${g},${b},${a})` });
  };

  return (
    <div className="colorRoot">
      {isFillAndStroke ? (
        <ColorFillAndStroke fillColor={fillColor} strokeColor={strokeColor} onChangeColor={onChangeColor} />
      ) : (
        <ColorSelect
          value={strokeColor}
          onChangeColor={(data: any) => {
            data.type = modalType === 'node' ? 'fillColor' : 'strokeColor';
            onChangeColor(data);
          }}
        />
      )}
    </div>
  );
};

export default Color;
