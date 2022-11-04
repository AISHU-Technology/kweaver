/**
 * 对需要高亮的内容进行处理
 * @param {string} value 需要高亮的属性字符串
 */
const showHighLight = value => {
  let copyValue = value.replace(/<([^>]+)>/g, '&lt;$1&gt;');

  copyValue = copyValue.replace(/&/g, '<em>&</em>');
  copyValue = copyValue.replace(/@-highlight-content-start-@/g, '<span class="hl-text">');
  copyValue = copyValue.replace(/@-highlight-content-end-@/g, '</span>');

  return copyValue;
};

/**
 * @description 判断每一行属性标签是否超出2行，超出则显示省略号...
 */
 const boolRowEllipsis = () => {
  const result = [];
  const elements = document.querySelectorAll('.normal-search-result-list .pro-tags');

  elements.forEach(el => result.push(el.scrollHeight > 64));

  return result;
};

export { showHighLight, boolRowEllipsis };
