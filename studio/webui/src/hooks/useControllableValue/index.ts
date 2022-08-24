import { useState } from 'react';

interface Options<T> {
  defaultValue?: T;
  valuePropName?: string;
  defaultPropName?: string;
  trigger?: string;
}

export default function useControllableValue<T>(props: Record<string, any>, options: Options<T>) {
  const {
    defaultValue, // 默认值
    defaultPropName = 'defaultValue', // 父组件传入的默认值
    valuePropName = 'value', // 父组件的受控属性名
    trigger = 'onChange' // 更新state时需要触发的父组件函数
  } = options;

  const value = props[valuePropName]; // 父组件传入的值
  const [state, setState] = useState<T | undefined>(() => props[defaultPropName] || defaultValue); // 初始化

  const handleSetState = (e: T, ...args: any[]) => {
    // 如果没有valuePropName 证明是非受控组件
    if (!(valuePropName in props)) {
      setState(e);
    }

    props[trigger]?.(e, ...args);
  }

  return [value || state, handleSetState] as const;
}
