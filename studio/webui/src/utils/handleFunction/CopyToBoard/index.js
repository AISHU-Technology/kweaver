/**
 * 复制内容到剪贴板
 * @param {String} str 文字内容
 */
export const copyToBoard = str => {
  try {
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.style.cssText = 'position: absolute; left: -9999px; z-index: -1;';
    input.setAttribute('value', str);
    input.select();
    input.setSelectionRange(0, str.length);
    const isSuccess = document.execCommand('copy');
    input.remove();

    return isSuccess;
  } catch (err) {
    return false;
  }
};
