import { useRef } from 'react';

const useDebounce = (func: any, wait = 300, immediate = false) => {
  const { current } = useRef<any>(null);

  return function (...args: any) {
    if (current.timer) {
      clearTimeout(current.timer);
    }

    if (immediate) {
      const start = !current.timer;

      current.timer = setTimeout(() => {
        current.timer = null;
      }, wait);

      if (start) func.apply(...args);
    } else {
      current.timer = setTimeout(() => {
        func.apply(...args);
      }, wait);
    }
  };
};

export { useDebounce };
