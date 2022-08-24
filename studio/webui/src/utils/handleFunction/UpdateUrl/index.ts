/**
 * 更新url地址，但不重载界面
 * @param url 更新的url
 * @param record 是否保存history记录
 */
export const updateUrl = (url: string, record = true) => {
  const method = record ? 'pushState' : 'replaceState';
  window.history[method]({}, '', url);
};
