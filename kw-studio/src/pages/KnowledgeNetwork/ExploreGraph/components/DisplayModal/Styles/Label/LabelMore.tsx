import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Radio, Select } from 'antd';
import { DownOutlined } from '@ant-design/icons';

import ColorSelect from '../ColorSelect';

import './style.less';

// 顶部（默认）、底部、左侧、右侧、中间
const POSITIONS = [
  { value: 'top', label: intl.get('exploreGraph.style.top') },
  { value: 'bottom', label: intl.get('exploreGraph.style.bottom') },
  { value: 'left', label: intl.get('exploreGraph.style.left') },
  { value: 'right', label: intl.get('exploreGraph.style.right') },
  { value: 'center', label: intl.get('exploreGraph.style.center') }
];

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
  const { labelFill, showLabels, position } = value;

  const [radio, setRadio] = useState('show');
  const onChangeRadio2 = (e: any) => {
    const value = e.target.value;
    if (value === radio) return;
    setRadio(value);
    const newShowLabels = _.map(showLabels, item => ({ ...item, isChecked: value === 'show' }));
    onChange({ showLabels: newShowLabels });
  };
  useEffect(() => {
    const isShow = _.find(value?.showLabels, item => item?.isChecked);
    if (isShow) {
      setRadio('show');
    } else {
      setRadio('notShow');
    }
  }, [JSON.stringify(value)]);

  const onChangeColor = (data: any) => {
    const { r, g, b, a } = data?.rgb || data?.data?.rgb;
    onChange({ labelFill: `rgba(${r},${g},${b},${a})` });
  };

  const onChangePosition = (value: string) => {
    onChange({ position: value });
  };

  return (
    <div className="labelMoreRoot">
      <Radio value="show" checked={radio === 'show'} onChange={onChangeRadio2}>
        <div>{intl.get('exploreGraph.style.displayText')}</div>
      </Radio>
      <div className="kw-pl-6">
        <SelectColor type="labelFill" label="文字颜色" color={labelFill || '#000000'} onChangeColor={onChangeColor} />
        <div className="kw-mt-2">
          <div className="kw-mb-2">{intl.get('exploreGraph.style.location')}</div>
          <Select
            options={POSITIONS}
            value={position}
            style={{ width: '100%', height: 34 }}
            getPopupContainer={trigger => trigger.parentElement}
            onChange={onChangePosition}
          />
        </div>
      </div>
      <Radio className="kw-mt-3" value="notShow" checked={radio === 'notShow'} onChange={onChangeRadio2}>
        <div>{intl.get('exploreGraph.style.doNotDisplayText')}</div>
      </Radio>
    </div>
  );
};

export default LabelMore;
