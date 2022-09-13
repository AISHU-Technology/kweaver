import { renderHook, act } from '@testing-library/react-hooks';
import { useThrottle } from './index';

describe('useThrottle', () => {
  jest.useFakeTimers();

  it('should be defined', () => {
    expect(useThrottle).toBeDefined();
  });

  it('should throttle', () => {
    const test = jest.fn();
    const arg1 = '第一次调用';
    const arg2 = '第二次调用';
    const mockThrottle = renderHook(() => useThrottle(test, 20)).result.current;

    act(() => {
      mockThrottle(arg1);
      mockThrottle(arg2);
    });

    jest.runAllTimers();
    expect(test).toHaveBeenCalledTimes(1);
    expect(test.mock.calls[0][0]).toBe(arg1);
    jest.useRealTimers();
  });
});
