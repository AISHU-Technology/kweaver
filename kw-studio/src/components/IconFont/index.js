/**
 * @description 使用antd封装iconfont
 */

import { createFromIconfontCN } from '@ant-design/icons';
import lineIconfont from '@/assets/font/lineIconfont.js';
import colorIconfont from '@/assets/font/colorIconfont.js';
import graphIconFont from '@/assets/graphIcons/iconfont.js';
import twotoneIconFont from '@/assets/font/twotoneIconfont.js';
import menuIconFont from '@/assets/font/menuIconfont.js';

const IconFont = createFromIconfontCN({
  scriptUrl: [
    lineIconfont, // 线条风格icon
    colorIconfont, // 彩色风格icon
    graphIconFont, // 图谱icon
    twotoneIconFont, // 双色icon
    menuIconFont // 菜单icon
  ]
});

export default IconFont;
