import { act } from 'react-dom/test-utils';
import type { ReactWrapper } from 'enzyme';

const globalTimeout = global.setTimeout;

/**
 * 函数组件等待hook执行完毕
 * @param timeout 等待时间 ms
 */
const sleep = async (timeout = 0) => {
  await act(async () => {
    await new Promise(resolve => globalTimeout(resolve, timeout));
  });
};

/**
 * 触发组件props上的函数, 仅适用于enzyme.mount渲染的组件
 * @param wrap enzyme组件包装器
 * @param funcName 函数名
 * @param arg 函数的参数
 */
const triggerPropsFunc = (wrap: ReactWrapper<any>, funcName: string, ...arg: any) => {
  wrap.invoke(funcName)(...arg);
};

export { act, sleep, triggerPropsFunc };
