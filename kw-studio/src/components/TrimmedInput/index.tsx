/** input输入框允许输入空格，但头尾空格都不保留 */
import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import type { InputProps } from 'antd';
import { Input } from 'antd';

const TrimmedInput = (props: InputProps) => {
  const { value: initialValue, onChange, onPressEnter, ...restProps } = props;
  const [inputValue, setInputValue] = useState<any>(initialValue || '');

  useEffect(() => {
    setInputValue(initialValue);
  }, [initialValue]);

  const handleBlur = (e: any) => {
    const trimmedValue = inputValue?.trim();
    setInputValue(trimmedValue);
    onChange?.(trimmedValue);
  };

  const handleChange = (e: any) => {
    setInputValue(e?.target?.value);
    onChange?.(e?.target?.value);
  };

  const handlePressEnter = (e: any) => {
    const trimmedValue = inputValue?.trim();
    setInputValue(trimmedValue);
    onChange?.(trimmedValue);
    onPressEnter?.(trimmedValue);
  };

  return (
    <Input
      value={inputValue}
      onBlur={handleBlur}
      onChange={handleChange}
      {...restProps}
      onPressEnter={handlePressEnter}
    />
  );
};

export default TrimmedInput;
