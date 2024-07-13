/**
 * 获取文件后缀, 即文件类型
 * @param {string} fileName 文件名
 */
const getPostfix = (fileName: string) => {
  if (typeof fileName !== 'string') return '';
  const splitList = fileName.split('.');
  if (splitList.length > 1) return splitList.pop()?.toLowerCase() || '';
  return '';
};

export { getPostfix };
