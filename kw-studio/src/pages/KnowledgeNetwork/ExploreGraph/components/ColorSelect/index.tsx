import React, { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import { SketchPicker } from 'react-color';
import { Radio, Space } from 'antd';
import { DownOutlined } from '@ant-design/icons';

import './style.less';

type ColorProps = {
  color: string;
  isGrey?: boolean;
  setColor: (color: any) => void;
};
const ColorSelect = (props: ColorProps) => {
  const { color, isGrey, setColor } = props;
  const [colorPicker, setColorPicker] = useState(false);
  const [radioKey, setValue] = useState(color);

  useEffect(() => {
    if (isGrey) {
      setValue('grey');
    } else {
      setValue(color);
    }
  }, [color, isGrey]);
  const onChangeRadio = (value: string) => {
    setValue(value);
    if (value === 'grey') {
      setColor({ color, isGrey: true });
    } else {
      setColor({ color, isGrey: false });
    }
  };

  const changeColor = (color: any) => {
    setColor({ color: color?.hex, isGrey: false });
  };

  return (
    <div className="colorSelectRoot">
      <Radio.Group onChange={e => onChangeRadio(e?.target?.value)} value={radioKey}>
        <Space direction="vertical">
          <Radio value="grey">{intl.get('exploreGraph.ashSetting')}</Radio>
          <Radio value={color}>
            <>
              <div
                className="kw-align-center color-label"
                onClick={e => {
                  e.stopPropagation();
                  setColorPicker(!colorPicker);
                }}
              >
                <div className="color-icon kw-mr-2" style={{ background: color || '#50A06A' }}></div>
                {color || '#50A06A'}
                <DownOutlined className="kw-ml-5" style={{ color: 'rgba(0,0,0,0.65)' }} />
              </div>
              {colorPicker ? (
                <div className="color-select-picker">
                  <div
                    className="cover"
                    onClick={() => {
                      setColorPicker(false);
                    }}
                  />
                  <SketchPicker className="color-plate" color={color} onChange={c => changeColor(c)} />
                </div>
              ) : null}
            </>
          </Radio>
        </Space>
      </Radio.Group>
    </div>
  );
};

export default ColorSelect;
