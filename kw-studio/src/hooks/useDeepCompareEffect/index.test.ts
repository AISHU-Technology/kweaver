import { renderHook, act } from '@testing-library/react-hooks';
import { useState } from 'react';
import useDeepCompareEffect from './index';

describe('useDeepCompareEffect', () => {
  it('test deep compare', async () => {
    const hook = renderHook(() => {
      const [x, setX] = useState(0);
      const [y, setY] = useState({});
      const [z, setZ] = useState({});
      useDeepCompareEffect(() => {
        setX(x => x + 1);
      }, [y, z]);
      return { x, setY, setZ };
    });
    expect(hook.result.current.x).toBe(1);
    await act(async () => {
      hook.result.current.setY({});
      hook.result.current.setZ({});
    });
    expect(hook.result.current.x).toBe(1);
    await act(async () => {
      hook.result.current.setY({ name: '第一个引用类型数据变更了' });
    });
    expect(hook.result.current.x).toBe(2);
    await act(async () => {
      hook.result.current.setZ({});
    });
    expect(hook.result.current.x).toBe(2);
    await act(async () => {
      hook.result.current.setZ({ name: '第二个引用类型数据变更了' });
    });
    expect(hook.result.current.x).toBe(3);
  });
});
