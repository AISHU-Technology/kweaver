/**
 * enzyme无法渲染canvas，需要提供mock，以支持使用了G6的组件测试
 * devops构建环境无法安装jest-canvas-mock，直接引用其源码
 * git仓库：https://github.com/hustcc/jest-canvas-mock
 */

import mockWindow from './window';

// mock global window
if (typeof window !== 'undefined') {
  mockWindow(global.window);
}
