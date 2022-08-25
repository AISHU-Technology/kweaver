import { renderHook, act } from '@testing-library/react-hooks';
import { useDebounce } from './index';

describe('useDebounce', () => {
  jest.useFakeTimers();

  it('should be defined', () => {
    expect(useDebounce).toBeDefined();
  });

  it('should debounce', () => {
    const test = jest.fn();
    const immediateTest = jest.fn();
    const arg1 = '第一次调用';
    const arg2 = '第二次调用';
    const mockDebounce = renderHook(() => useDebounce(test, 20)).result.current;
    const mockImmediate = renderHook(() => useDebounce(immediateTest, 20, true)).result.current;

    act(() => {
      mockDebounce(arg1);
      mockDebounce(arg2);
    });

    jest.runAllTimers();
    expect(test).toHaveBeenCalledTimes(1);
    expect(test.mock.calls[0][0]).toBe(arg2);

    act(() => {
      mockImmediate(arg1);
      mockImmediate(arg2);
    });

    jest.runAllTimers();
    expect(immediateTest).toHaveBeenCalledTimes(1);
    expect(immediateTest.mock.calls[0][0]).toBe(arg1);
    jest.useRealTimers();
  });
});
