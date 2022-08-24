import { useRef } from 'react';

/**
 * @description 节流函数
 * @param {function} func 回调函数
 * @param {number} wait 延迟
 */
function throttle(func, wait) {
  let timer;

  return function (...args) {
    if (!timer) {
      timer = setTimeout(() => {
        timer = null;
        func.apply(this, args);
      }, wait);
    }
  };
}

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

export {
  throttle, // 类组件
  useThrottle // 函数组件
};
