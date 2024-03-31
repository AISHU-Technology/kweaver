import type { Dispatch, SetStateAction } from 'react';
import { useState, useRef, useCallback } from 'react';

type GetStateAction<S> = () => S;

type LatestStateFunc = <S>(initialState: S) => [S, Dispatch<SetStateAction<S>>, GetStateAction<S>];

/**
 * 与 useState 用法一致，多出了一个 getLatestState 方法
 * getLatestState方法可以获取到最新的state
 * 使用场景：
 * 解决 react hook 过时闭包导致拿不到 useState 中最新的 state 问题，
 * 例如：使用第三方库绑定的事件中，用到了state，当state更新后，绑定的第三方库的事件中获取不到更新后的state
 * @param initialState
 */
const useLatestState: LatestStateFunc = initialState => {
  const [state, setState] = useState(initialState);
  const latestStateRef = useRef(state);
  latestStateRef.current = state; // 储存最新的state
  // 利用闭包特性，再次创建闭包，返回最新的state
  const getLatestState = useCallback(() => latestStateRef.current, []);
  return [state, setState, getLatestState];
};

export default useLatestState;