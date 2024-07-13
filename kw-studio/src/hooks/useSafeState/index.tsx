import { useCallback, useState, useRef, useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';

type UseSafeStateFunc = <S = undefined>(initialState?: S) => [S | undefined, Dispatch<SetStateAction<S | undefined>>];

/**
 * 与 useState 用法一致
 * 组件卸载后异步回调内的 setState 不会执行
 * 解决因组件卸载后更新状态而导致的内存泄漏
 * 使用场景：在异步回调内需要更新state的情况下，使用该hook
 * @param initialState
 */
const useSafeState: UseSafeStateFunc = initialState => {
  const unmountedRef = useRef<boolean>(false);
  const [state, setState] = useState(initialState);

  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
    };
  }, []);

  const setCurrentState = useCallback((currentState: any) => {
    if (unmountedRef.current) return;
    setState(currentState);
  }, []);

  return [state, setCurrentState];
};

export default useSafeState;
