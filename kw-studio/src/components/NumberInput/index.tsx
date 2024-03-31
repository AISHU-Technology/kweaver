import React, { useCallback, useState, useEffect } from 'react';
import { InputNumber } from 'antd';
import type { InputNumberProps } from 'antd';
import { isDef } from '@/utils/handleFunction';

interface NumberInputProps extends InputNumberProps {
  defaultValue?: number;
  onBlur?: (value: any) => void;
}

const NumberInput = (props: NumberInputProps) => {
  const { min, max, value: _value, defaultValue, onChange, onBlur, ...rest } = props;

  useEffect(() => {
    if (!isDef(props.value)) return;
    setValue(props.value);
  }, [props.value]);

  // 初始化输入框的值
  const [value, setValue] = useState<any>(_value || defaultValue);

  // 格式化输入框的值，只允许输入整数
  const formatNumber = useCallback((value?: any) => {
    if (value) {
      const intValue = parseInt(String(value), 10);
      if (!isNaN(intValue)) {
        return String(intValue);
      }
    }
    return '';
  }, []);

  // 解析输入框的值，转换为整数
  const parseNumber = useCallback((value?: any) => {
    if (value) {
      const intValue = parseInt(String(value), 10);
      if (!isNaN(intValue)) {
        return intValue;
      }
    }
    return undefined;
  }, []);

  // 处理输入框值改变事件
  const handleChange = useCallback(
    (value?: number | string) => {
      if (typeof value === 'number') {
        setValue(value);
        if (onChange) {
          onChange(value);
        }
      }
    },
    [onChange]
  );

  // 处理输入框失去焦点事件
  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const intValue = parseNumber(inputValue);
      if (intValue !== undefined) {
        let newValue: any = intValue;
        if (max !== undefined && newValue > max) {
          newValue = max;
        }
        if (min !== undefined && newValue < min) {
          newValue = min;
        }
        setValue(newValue);
        onChange?.(newValue);
        if (onBlur) {
          onBlur(newValue);
        }
      } else {
        // 输入不合法时恢复为默认值或最小值
        const value: any = isDef(defaultValue) ? defaultValue : isDef(min) ? min : props.value;
        setValue(value);
        onChange?.(value);
        if (onBlur) {
          onBlur(value);
        }
      }
    },
    [min, max, defaultValue, parseNumber, onBlur]
  );

  return (
    <InputNumber
      {...rest}
      value={value}
      min={min}
      max={max}
      formatter={formatNumber}
      parser={parseNumber}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
};

export default NumberInput;
