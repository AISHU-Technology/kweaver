import React from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Radio, Select, InputNumber } from 'antd';

import ColorSelectInput from '../ColorSelect/ColorSelectInput';

// 顶部（默认）、底部、左侧、右侧、中间
const POSITIONS = [
  { value: 'top', label: intl.get('exploreGraph.style.top') },
  { value: 'bottom', label: intl.get('exploreGraph.style.bottom') },
  { value: 'left', label: intl.get('exploreGraph.style.left') },
  { value: 'right', label: intl.get('exploreGraph.style.right') },
  { value: 'center', label: intl.get('exploreGraph.style.center') }
];

const CONFIG = {
  LABEL_FILL: true,
  POSITION: true,
  LABEL_LENGTH: true
};

const LabelSetting = (props: any) => {
  const { value, config = CONFIG, shapeType, disabledPosition } = props;
  const { onChange } = props;
  const { position, labelFill = '#000', labelType = 'adapt', labelLength, labelFixLength } = value;

  const onUpdateSetting = (key: string) => (_value: string | boolean) => {
    onChange({ [key]: _value });
  };

  const onChangeSelected = (value: string) => {
    onUpdateSetting('position')(value);
  };

  const onChangeInput = (data: any) => {
    onUpdateSetting(data.key)(data.value);
  };

  const onSearch = _.debounce(data => {
    onChangeInput(data);
  }, 300);

  const onChangeColor = (data: any) => {
    const { r, g, b, a } = data?.data?.rgb;
    const rgba = `rgba(${r},${g},${b},${a})`;
    onUpdateSetting('labelFill')(rgba);
  };

  const onChangeLabelType = (e: any) => {
    const value = e.target.value;
    onUpdateSetting('labelType')(value);
  };

  return (
    <div>
      {config.LABEL_FILL && (
        <ColorSelectInput
          className="kw-mt-2"
          type="labelFill"
          label={intl.get('exploreGraph.style.textColor')}
          color={labelFill}
          onChangeColor={onChangeColor}
        />
      )}

      {config.POSITION && (
        <div className="kw-mt-6">
          <div className="kw-mb-2">{intl.get('exploreGraph.style.location')}</div>
          <Select
            options={POSITIONS}
            value={position}
            disabled={disabledPosition}
            style={{ width: '100%', height: 34 }}
            onChange={onChangeSelected}
          />
        </div>
      )}
      {config.LABEL_LENGTH && (
        <div className="kw-mt-6">
          <div className="kw-mb-2">{intl.get('exploreGraph.style.textLength')}</div>
          <Radio.Group value={labelType} onChange={onChangeLabelType}>
            <Radio value="adapt">
              <div>{intl.get('exploreGraph.style.adaptiveLength')}</div>
            </Radio>
            <div className="kw-align-center">
              <InputNumber
                className="kw-ml-6 kw-mt-2"
                min={0}
                controls={false}
                defaultValue={labelLength}
                disabled={labelType === 'fixed'}
                style={{ height: 34, width: 'calc(100% - 24px)' }}
                onChange={value => onSearch({ key: 'labelLength', value })}
              />
            </div>
            <Radio className="kw-mt-4" value="fixed" disabled={shapeType !== 'customRect' || position !== 'center'}>
              <div>{intl.get('exploreGraph.style.fixedLength')}(PX)</div>
            </Radio>
            <InputNumber
              className="kw-ml-6 kw-mt-2"
              min={1}
              controls={false}
              defaultValue={labelFixLength}
              disabled={labelType === 'adapt'}
              style={{ height: 34, width: 'calc(100% - 24px)' }}
              onChange={value => onSearch({ key: 'labelFixLength', value })}
            />
          </Radio.Group>
        </div>
      )}
    </div>
  );
};

export default LabelSetting;
