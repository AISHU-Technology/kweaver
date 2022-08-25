import { act } from 'react-dom/test-utils';

const globalTimeout = global.setTimeout;

// 函数组件等待hook执行完毕
const sleep = async (timeout = 0) => {
  await act(async () => {
    await new Promise(resolve => globalTimeout(resolve, timeout));
  });
};

export {
  act,
  sleep
};
