import { useRef } from 'react';

const useThrottle = (func: any, wait: number) => {
  const { current } = useRef<any>(null);

  return function (...args: any) {
    if (!current.timer) {
      current.timer = setTimeout(() => {
        current.timer = null;
        func.apply(...args);
      }, wait);
    }
  };
};

export { useThrottle };
