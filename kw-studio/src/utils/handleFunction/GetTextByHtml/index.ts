/**
 * 去掉富文本所有的html标记, 仅返回文本内容
 * @param htmlStr 字符串类型的html数据
 */
export const getTextByHtml = (htmlStr: string | undefined | null = '') => {
  if (typeof htmlStr !== 'string') return '';
  return htmlStr.replace(/<[^>]+>/g, '');
};
