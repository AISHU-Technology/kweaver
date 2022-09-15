/**
 * 模拟类组件forceUpdate的hook
 */
import { useReducer } from 'react';

export default function useForceUpdate() {
  const [, forceUpdate] = useReducer(x => x + 1, 0);

  return forceUpdate;
}
