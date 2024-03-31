import { produce, Draft, freeze } from 'immer';
import { useState, useCallback, useRef } from 'react';
import _ from 'lodash';

export type GetStateAction<S> = () => S;
export type DraftFunction<S> = (draft: Draft<S>) => void;
export type Updater<S> = (arg: S | DraftFunction<S>) => void;
export type ImmerHook<S> = [S, Updater<S>, GetStateAction<S>];

type ImmerStateFunc = <S = any>(initialValue: S | (() => S)) => ImmerHook<S>;

/**
 * 与 useState 用法一致，多出了一个 getLatestState 方法
 * getLatestState方法可以获取到最新的state
 * 使用场景：
 * 需要生成不可直接通过引用改变复杂数据的state，例如：useContext 创建不可变的store
 * 解决 react hook 过时闭包导致拿不到 useState 中最新的 state 问题，
 * 例如：使用第三方库绑定的事件中，用到了state，当state更新后，绑定的第三方库的事件中获取不到更新后的state
 * @param initialState
 */
const useImmerState: ImmerStateFunc = initialValue => {
  const [value, setValue] = useState(() =>
    // @ts-ignore
    freeze(typeof initialValue === 'function' ? initialValue() : initialValue, true)
  );

  const latestStateRef = useRef(value);
  latestStateRef.current = value; // 储存最新的state

  const setState = useCallback(updater => {
    if (typeof updater === 'function') setValue(produce(updater));
    else setValue(freeze(updater));
  }, []);

  const getLatestState = useCallback(() => latestStateRef.current, []);

  return [value, setState, getLatestState];
};

export default useImmerState;
