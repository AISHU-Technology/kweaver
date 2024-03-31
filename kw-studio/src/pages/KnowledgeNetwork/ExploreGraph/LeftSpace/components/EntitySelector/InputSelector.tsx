import React, { useState, useRef } from 'react';
import { CloseCircleFilled } from '@ant-design/icons';
import classNames from 'classnames';
import ComposInput from '@/components/ComposInput';
import { onPreventMouseDown } from './assistant';
import IconFont from '@/components/IconFont';

const SingleSelector = (props: any) => {
  const { readOnly, value, placeholder, onInputChange, onFocus, onBlur, onClear, onClick } = props;
  const inputRef = useRef<any>();
  const [isFocused, setIsFocused] = useState(false);

  /**
   * 聚焦
   */
  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  /**
   * 失焦
   */
  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  /**
   * 清除
   */
  const handleClear = (e: any) => {
    e.stopPropagation();
    onClear?.();
    onInputChange?.(undefined);
  };

  /**
   * 聚焦输入框
   */
  const focusInput = () => {
    inputRef.current?.focus();
  };

  return (
    <div className={classNames('select-input-wrap', { focused: isFocused })} onClick={focusInput}>
      <div className="flex-wrap kw-align-center kw-h-100">
        <ComposInput
          ref={inputRef}
          className="c-input"
          placeholder={placeholder}
          readOnly={readOnly}
          value={value}
          onChange={e => onInputChange?.(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onClick={onClick}
        />
        {value ? (
          <CloseCircleFilled
            className={classNames('clear-icon kw-ml-2', 'kw-mr-2')}
            onClick={handleClear}
            onMouseDown={onPreventMouseDown}
          />
        ) : (
          <IconFont
            type="icon-searchvid"
            className={classNames('clear-icon kw-ml-2', 'kw-mr-2')}
            onClick={() => onInputChange?.(inputRef?.current?.value)}
          />
        )}
      </div>
    </div>
  );
};

export default SingleSelector;
