import { useRef } from 'react';

function useThrottle(func, wait) {
  const { current } = useRef({});

  return function (...args) {
    if (!current.timer) {
      current.timer = setTimeout(() => {
        current.timer = null;
        func.apply(this, args);
      }, wait);
    }
  };
}

export { useThrottle };
