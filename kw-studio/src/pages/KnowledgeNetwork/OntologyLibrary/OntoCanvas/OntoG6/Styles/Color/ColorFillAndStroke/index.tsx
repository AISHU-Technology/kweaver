import React from 'react';
import intl from 'react-intl-universal';

import ColorSelectInput from '../../ColorSelect/ColorSelectInput';

import './style.less';

const ColorFillAndStroke = (props: any) => {
  const { fillColor, strokeColor } = props;
  const { onChangeColor } = props;

  return (
    <div className="colorFillAndStrokeRoot">
      <ColorSelectInput
        type="fillColor"
        panelClassName="selectColorPanelFill"
        label={intl.get('exploreGraph.style.fillColor')}
        color={fillColor}
        onChangeColor={onChangeColor}
      />
      <ColorSelectInput
        className="kw-mt-2"
        panelClassName="selectColorPanelStroke"
        type="strokeColor"
        label={intl.get('exploreGraph.style.strokeColor')}
        color={strokeColor}
        onChangeColor={onChangeColor}
      />
    </div>
  );
};

export default ColorFillAndStroke;
