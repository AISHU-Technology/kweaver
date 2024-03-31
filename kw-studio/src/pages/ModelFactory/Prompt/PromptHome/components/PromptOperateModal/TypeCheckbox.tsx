import React from 'react';
import classNames from 'classnames';
import _ from 'lodash';

import IconFont from '@/components/IconFont';

import { PROMPT_TYPES } from '../../enums';
import './style.less';

export interface TypeCheckboxProps {
  className?: string;
  style?: React.CSSProperties;
  value?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
}

const TypeCheckbox = (props: TypeCheckboxProps) => {
  const { className, style, value, disabled, onChange } = props;

  return (
    <div className={classNames(className, 'prompt-op-checkbox kw-space-between', { disabled })} style={style}>
      {PROMPT_TYPES.map(item => {
        return (
          <div
            key={item.key}
            className={classNames('type-checkbox kw-p-3 kw-pointer', { checked: value === item.key })}
            onClick={() => !disabled && onChange?.(item.key)}
          >
            <div className="kw-align-center kw-mb-2">
              <IconFont type={item.icon} className="kw-mr-2" style={{ fontSize: 16 }} />
              <div>{item.label}</div>
            </div>
            <div className="kw-c-subtext kw-ellipsis-2" style={{ lineHeight: '18px', fontSize: 12 }}>
              {item.desc}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TypeCheckbox;
