import { useRef } from 'react';

/**
 * @description 防抖函数
 * @param {function} func 函数
 * @param {number} wait 延迟
 * @param {boolean} immediate 是否立即执行
 */
function debounce(func, wait = 300, immediate = false) {
  const current = {};

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

export {
  debounce, // 类组件
  useDebounce // 函数组件
};
