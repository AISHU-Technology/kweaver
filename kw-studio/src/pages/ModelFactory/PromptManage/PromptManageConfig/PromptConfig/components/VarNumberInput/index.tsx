import React from 'react';
import { InputNumber } from 'antd';
import type { InputNumberProps } from 'antd';
import classNames from 'classnames';
import { isDef } from '@/utils/handleFunction';

export interface VarNumberInputProps extends InputNumberProps {
  int?: boolean;
}

const VarNumberInput = (props: VarNumberInputProps) => {
  const { int, className, onBlur, ...otherProps } = props;

  const handleBlur: React.FocusEventHandler<HTMLInputElement> = e => {
    onBlur?.(e);
    const { defaultValue, max, min, value } = otherProps;
    const inputValue = e.target.value;
    const number = int ? parseInt(inputValue) : parseFloat(inputValue);
    if (isNaN(number)) {
      const correctValue: any = isDef(value) ? value : defaultValue;
      otherProps.onChange?.(correctValue);
    } else {
      let newValue: any = number;
      if (isDef(max) && newValue > max!) {
        newValue = max;
      }
      if (isDef(min) && newValue < min!) {
        newValue = min;
      }
      otherProps.onChange?.(newValue);
    }
  };

  return <InputNumber {...otherProps} className={classNames(className)} onBlur={handleBlur} />;
};

export default VarNumberInput;
