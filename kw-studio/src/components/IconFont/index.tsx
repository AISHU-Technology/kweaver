import { createFromIconfontCN } from '@ant-design/icons';
import lineIconfont from '@/assets/font/lineIconfont.js';
import colorIconfont from '@/assets/font/colorIconfont.js';
import graphIconFont from '@/assets/graphIcons/iconfont.js';
import twotoneIconFont from '@/assets/font/twotoneIconfont.js';
import menuIconFont from '@/assets/font/menuIconfont.js';

const IconFont = createFromIconfontCN({
  scriptUrl: [lineIconfont, colorIconfont, graphIconFont, twotoneIconFont, menuIconFont]
});

export default IconFont;
