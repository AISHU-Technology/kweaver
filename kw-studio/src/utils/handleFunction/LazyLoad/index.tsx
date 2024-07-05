import { lazy } from 'react';

const lazyLoad = (componentPath: string) => {
  // 🙅‍♂️webpack中不能使用完全动态的 import 语句
  const path = componentPath.replace('@/pages', '');
  // 🙆‍♂️import() 必须至少包含一些关于模块的路径信息。
  return lazy(() => import(`@/pages${path}`));
};

export { lazyLoad };
