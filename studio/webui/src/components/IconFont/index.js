/**
 * @description 使用antd封装iconfont
 */

import { createFromIconfontCN } from '@ant-design/icons';
import lineIconfont from '@/assets/font/lineIconfont.js';
import colorIconfont from '@/assets/font/colorIconfont.js';

const IconFont = createFromIconfontCN({
  scriptUrl: [
    lineIconfont, // 线条风格icon
    colorIconfont // 彩色风格icon
  ]
});

export default IconFont;
