/**
 * 显示id, 小于4位数补充0
 * 1 --> 0001
 * 12345 --> 12345
 * @param id
 */
export const formatID = (id: number | string) => {
  if (!id) return '';
  return String(id).length >= 4 ? id : `${new Array(4 - String(id).length).fill(0).join('')}${id}`;
};
