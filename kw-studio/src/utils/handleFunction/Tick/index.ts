/**
 * 间隔delay毫秒重复执行times次函数
 * @param func 执行函数
 * @param delay 间隔
 * @param times 执行次数
 */
export const tick = (func: any, delay = 16, times = 1) => {
  let _times = times;
  const timer = setInterval(() => {
    func?.();
    _times--;
    !_times && clearInterval(timer);
  }, delay);
};
