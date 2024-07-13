import { Input } from 'antd';
import classNames from 'classnames';
import type { InputProps } from 'antd';
import type { TextAreaProps } from 'antd/lib/input';
import React, { useRef, forwardRef, useState, useEffect } from 'react';

export type ComposInputProps = {
  useAntd?: boolean;
  textarea?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement> &
  InputProps &
  TextAreaProps;

const ComposInput: React.ForwardRefRenderFunction<any, ComposInputProps> = (props, ref) => {
  const {
    useAntd = false,
    textarea,
    className,
    value = '',
    onChange: onOriginChange,
    onCompositionStart: onOriginCompositionStart,
    onCompositionEnd: onOriginCompositionEnd,
    ...other
  } = props;
  const isCompos = useRef(false);
  const [innerValue, setInnerValue] = useState(value);

  useEffect(() => {
    setInnerValue(value);
  }, [value]);

  const handleChange = (e: any) => {
    setInnerValue(e.target.value);
    if (isCompos.current) return;
    e.persist();
    onOriginChange?.(e);
  };

  const handleStart = (e: any) => {
    isCompos.current = true;
    e.persist();
    onOriginCompositionStart?.(e);
  };

  const handleEnd = (e: any) => {
    isCompos.current = false;
    e.persist();
    onOriginCompositionEnd?.(e);
    onOriginChange?.(e);
  };

  const Component = textarea ? Input.TextArea : Input;

  return useAntd ? (
    <Component
      ref={ref}
      {...other}
      value={innerValue}
      className={classNames(className, 'compos-input')}
      onChange={handleChange}
      onCompositionStart={handleStart}
      onCompositionEnd={handleEnd}
    />
  ) : (
    <input
      ref={ref}
      {...other}
      value={innerValue}
      className={classNames(className, 'compos-input kw-ellipsis')}
      onChange={handleChange}
      onCompositionStart={handleStart}
      onCompositionEnd={handleEnd}
    />
  );
};

export default forwardRef(ComposInput);
