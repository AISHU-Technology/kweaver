import React, { useCallback } from 'react';
import _ from 'lodash';

import ColorSelect from '../ColorSelect';
import ColorFillAndStroke from './ColorFillAndStroke';

const Color = (props: any) => {
  const { modalType, updateData, isFillAndStroke } = props || {};
  const { onChange } = props;

  const { fillColor = '', strokeColor = '' } = updateData || {};

  const onChangeColor = useCallback(
    _.debounce(({ type, data }: any) => {
      const { r, g, b, a } = data?.rgb || data?.data?.rgb;
      onChange({ [type]: `rgba(${r},${g},${b},${a})` });
    }, 200),
    [JSON.stringify(updateData)]
  );

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
