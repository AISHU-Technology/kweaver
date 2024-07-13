import { useState } from 'react';

interface Options<T> {
  defaultValue?: T;
  valuePropName?: string;
  defaultPropName?: string;
  trigger?: string;
}

export default function useControllableValue<T>(props: Record<string, any>, options: Options<T>) {
  const { defaultValue, defaultPropName = 'defaultValue', valuePropName = 'value', trigger = 'onChange' } = options;

  const value = props[valuePropName];
  const [state, setState] = useState<T | undefined>(() => props[defaultPropName] || defaultValue);

  const handleSetState = (e: T, ...args: any[]) => {
    if (!(valuePropName in props)) {
      setState(e);
    }

    props[trigger]?.(e, ...args);
  };

  return [value || state, handleSetState] as const;
}
