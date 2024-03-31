import { useRef } from 'react';

function useDebounce(func, wait = 300, immediate = false) {
  const { current } = useRef({});

  return function (...args) {
    if (current.timer) {
      clearTimeout(current.timer);
    }

    if (immediate) {
      const start = !current.timer;

      current.timer = setTimeout(() => {
        current.timer = null;
      }, wait);

      if (start) func.apply(this, args);
    } else {
      current.timer = setTimeout(() => {
        func.apply(this, args);
      }, wait);
    }
  };
}

export { useDebounce };
