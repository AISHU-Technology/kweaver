/**
 * 写列表时常用的一些常量或方法
 */
export const PAGE_SIZE = 10;

export const DESCEND = 'descend' as const;
export const ASCEND = 'ascend' as const;
export const sorter2sorter = (key: string) =>
  ({
    desc: 'descend',
    asc: 'ascend',
    ascend: 'asc',
    descend: 'desc'
  }[key] || key);

export const offsetY = (y = -1) => ({ transform: `translateY(${y}px)` });
