import React, { useState } from 'react';
import { InputNumber, Input } from 'antd';
import _ from 'lodash';
import intl from 'react-intl-universal';
import StyleInput from '../StyleInput';
import classNames from 'classnames';
import './style.less';

const Length = (props: any) => {
  const { className, style, value, onChange, readOnly } = props;
  const [focused, setFocused] = useState(false);
  const [number, setNumber] = useState(() => String(value));

  const debounceChange = _.debounce(value => {
    onChange(value);
  }, 300);

  return (
    <StyleInput
      label={intl.get('exploreGraph.style.length')}
      className={classNames(className, 'onto-style-length')}
      style={style}
      showArrow={false}
      focused={focused}
      readOnly={readOnly}
      renderInput={
        <div className="kw-flex">
          <Input
            // defaultValue={value}
            // min={0}
            // controls={false}
            value={number}
            bordered={false}
            readOnly={readOnly}
            onChange={e => {
              let value = e.target.value;
              if (value && value !== '0' && !/^[1-9]\d*$/.test(value)) {
                return;
              }
              if (value === '0') {
                value = '1';
              }
              if (parseInt(value) > 50) {
                value = '50';
              }
              setNumber(value);
              debounceChange(parseInt(value) || 1);
            }}
            style={{ flex: 1, minWidth: 0, padding: 0 }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
          <span style={{ lineHeight: '30px' }}>{intl.get('exploreGraph.style.lenCount')}</span>
        </div>
      }
    />
  );
};

export default Length;
