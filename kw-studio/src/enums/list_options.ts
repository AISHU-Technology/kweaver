/**
 * 写列表时常用的一些常量或方法
 */

export const PAGE_SIZE = 10;

// 建议前端直接用这两个字段，直接适配antd，传给后端时再转换
export const DESCEND = 'descend' as const;
export const ASCEND = 'ascend' as const;
export const sorter2sorter = (key: string) =>
  ({
    desc: 'descend',
    asc: 'ascend',
    ascend: 'asc',
    descend: 'desc'
  }[key] || key);

// 有些图标本身图形占比不同，导致相同size的图标排列时高低不齐，通过css调整偏移量
export const offsetY = (y = -1) => ({ transform: `translateY(${y}px)` });
