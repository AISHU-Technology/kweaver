import React, { forwardRef, useEffect, useState, useImperativeHandle, useRef } from 'react';
import type { InputProps } from 'antd';
import { Input } from 'antd';
import classNames from 'classnames';
import IconFont from '@/components/IconFont';
import './style.less';
import _ from 'lodash';

export interface SearchInputProps extends InputProps {
  onIconClick?: Function;
  onClear?: Function;
  autoWidth?: boolean;
  iconPosition?: 'start' | 'end';
  debounce?: boolean;
  debounceWait?: number;
}

const SearchInputFunc: React.ForwardRefRenderFunction<unknown, SearchInputProps> = (props, ref) => {
  const {
    className = '',
    autoWidth,
    iconPosition = 'start',
    onChange,
    onPressEnter,
    onIconClick,
    onClear,
    debounce = false,
    debounceWait = 300,
    value,
    ...otherProps
  } = props;
  const inputRef = useRef<any>();
  const isCompos = useRef(false); // 标记键盘输入法

  const [inputValue, setInputValue] = useState<string | number | readonly string[]>('');

  useEffect(() => {
    if (value) {
      setInputValue(value);
    }
  }, []);

  // 转发ref
  useImperativeHandle(ref, () => ({
    input: inputRef.current.input,
    setValue: (value: any) => {
      setInputValue(value);
    }
  }));

  const onDebounceChange = _.debounce((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e);
  }, debounceWait);

  // 输入框变化
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isCompos.current) return;

    debounce ? onDebounceChange(e) : onChange?.(e);

    // TODO antd没有暴露清除按钮的事件回调, 但清除时会触发onChange
    if (e.type === 'click' && !e.target.value) {
      setTimeout(() => {
        handleClear(e);
      }, 0);
    }
  };

  // 点击前缀搜索图标, 默认触发回车搜索
  const onPrefixClick = (e: any) => {
    onIconClick ? onIconClick(e) : onPressEnter?.(e);
  };

  // 处理清空输入框事件, 默认触发回车搜索
  const handleClear = (e: any) => {
    onClear ? onClear(e) : onPressEnter?.(e);
  };

  const iconConfig = {
    [iconPosition === 'start' ? 'prefix' : 'suffix']: (
      <IconFont type="icon-sousuo" className="s-input-icon" onClick={onPrefixClick} />
    )
  };
  return (
    <Input
      allowClear
      ref={inputRef}
      value={inputValue}
      className={classNames('kw-search-input', className, { 'input-w-272': !autoWidth })}
      onChange={e => {
        handleChange(e);
        setInputValue(e.target.value);
      }}
      onPressEnter={onPressEnter}
      {...iconConfig}
      {...otherProps}
    />
  );
};

const SearchInput = forwardRef(SearchInputFunc);
SearchInput.displayName = 'SearchInput';
export default SearchInput;
