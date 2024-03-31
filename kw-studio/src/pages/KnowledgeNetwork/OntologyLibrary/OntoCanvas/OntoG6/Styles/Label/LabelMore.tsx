import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import { Radio, Space } from 'antd';
import { DownOutlined } from '@ant-design/icons';

import ColorSelect from '../ColorSelect';

import './style.less';

const SelectColor = (props: any) => {
  const { type, color, label } = props;
  const { onChangeColor } = props;

  useEffect(() => {
    const modal = document.querySelector('.displayModalRoot');
    if (!modal) return;
    const close = (e: any) => {
      const colorSelectContainer = modal.querySelector('.colorSelectContainer');
      if (!e.target.contains(colorSelectContainer)) return;
      onCloseIsShowSelect();
    };
    modal.addEventListener('click', close);
    return () => {
      modal.removeEventListener('click', close);
    };
  }, []);

  const [isShowSelect, setIsShowSelect] = useState(false);
  const onOpenIsShowSelect = () => setIsShowSelect(true);
  const onCloseIsShowSelect = () => setIsShowSelect(false);

  return (
    <div className="kw-mt-2">
      <div className="kw-mb-2">{label}</div>
      <div
        className="colorSelectContainer"
        onClick={() => {
          if (isShowSelect) {
            onCloseIsShowSelect();
          } else {
            onOpenIsShowSelect();
          }
        }}
      >
        <div className="kw-align-center">
          <div className="demo" style={{ backgroundColor: color }} />
          <span>{color}</span>
        </div>
        <DownOutlined />
        {isShowSelect && (
          <div className="box">
            <ColorSelect
              value={color}
              onChangeColor={(data: any) => {
                data.type = type;
                onChangeColor(data);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

const LabelMore = (props: any) => {
  const { value } = props;
  const { onChange } = props;
  const { labelFill, showLabels } = value;

  const [radioValue, setRadioValue] = useState('show');
  useEffect(() => {
    const isShow = _.find(value?.showLabels, item => item?.isChecked);
    if (isShow) {
      setRadioValue('show');
    } else {
      setRadioValue('notShow');
    }
  }, [JSON.stringify(value)]);

  const onChangeRadio = (e: any) => {
    const radio = e.target.value;
    if (radio === radioValue) return;
    setRadioValue(radio);
    const newShowLabels = _.map(showLabels, item => ({ ...item, isChecked: radio === 'show' }));
    onChange({ showLabels: newShowLabels });
  };

  const onChangeColor = (data: any) => {
    const { r, g, b, a } = data?.rgb || data?.data?.rgb;
    onChange({ labelFill: `rgba(${r},${g},${b},${a})` });
  };

  return (
    <div className="labelMoreRoot">
      <Radio.Group value={radioValue} onChange={onChangeRadio}>
        <Space direction="vertical">
          <Radio value="show">
            <div> 显示文本</div>
            <div>
              <SelectColor
                type="labelFill"
                label="文字颜色"
                color={labelFill || '#000000'}
                onChangeColor={onChangeColor}
              />
            </div>
          </Radio>
          <Radio value="notShow">不显示文本</Radio>
        </Space>
      </Radio.Group>
    </div>
  );
};

export default LabelMore;
