/**
 * 基于antd再封装的搜索框
 * 中文输入时默认劫持onChange事件, 中文输入结束才触发onChange
 *
 */

import React, { useRef, forwardRef, useImperativeHandle, useCallback, useMemo } from 'react';
import { Input } from 'antd';
import type { InputProps } from 'antd';
import classNames from 'classnames';
import IconFont from '@/components/IconFont';
import './style.less';
import _ from 'lodash';

export interface SearchInputProps extends InputProps {
  onIconClick?: Function; // 点击icon回调
  onClear?: Function; // 清空搜索框回调
  autoWidth?: boolean; // width: 100%
  iconPosition?: 'start' | 'end'; // 搜索图标的位置, 前 | 后
  debounce?: boolean; // 是否启用防抖， 默认不启用
  debounceWait?: number; // 防抖的延迟时间，默认 300 ms
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
    ...otherProps
  } = props;
  const inputRef = useRef<any>();
  const isCompos = useRef(false); // 标记键盘输入法

  // 转发ref
  useImperativeHandle(ref, () => inputRef.current);

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

  // 输入开始开始
  const handleStart = () => {
    isCompos.current = true;
  };

  // 输入法结束
  const handleEnd = (e: any) => {
    isCompos.current = false;
    onChange?.(e);
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
      ref={inputRef}
      allowClear
      className={classNames('kw-search-input', className, { 'input-w-272': !autoWidth })}
      onChange={e => {
        // 在react 16中事件会进入事件池，事件执行完毕，会从事件池中移除绑定的事件，导致异步函数中获取不到e, 故使用e.persist()，阻止事件被移除的行为
        // 这个缺点在react 17中已被优化，故未来升级到react 17 + 的话，就无需再调用e.persist()了
        debounce && e.persist();
        handleChange(e);
      }}
      onPressEnter={onPressEnter}
      onCompositionStart={handleStart}
      onCompositionEnd={handleEnd}
      {...iconConfig}
      {...otherProps}
    />
  );
};

const SearchInput = forwardRef(SearchInputFunc);
SearchInput.displayName = 'SearchInput';
export default SearchInput;
