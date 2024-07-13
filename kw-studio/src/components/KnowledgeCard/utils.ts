/**
 * 获取显示的标题, 当前语言为空, 则从剩余的语言中取
 * @param title 标题数据
 * @param language 当前语言
 */
export const getTitle = (title: any, language: string) => {
  let text = '';
  const transKey: any = {
    'zh-cn': 'zh-CN',
    'en-us': 'en-US',
    'zh-tw': 'zh-TW'
  };

  text = title?.[language] || title?.[transKey[language]];
  if (text) return text;
  Object.values(title || {}).some((value: any) => {
    value && (text = value);
    return !!value;
  });
  return text;
};
