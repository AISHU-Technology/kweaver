/**
 * 判断dom里面的文本是否已经超出所在dom的宽度
 * 应用场景：文本溢出显示不全时，弹出tooltip, 没有溢出则不弹出tooltip
 * @param element dom 元素
 */
export const textOverflow = (element: HTMLElement): boolean => {
  const domWidth = element.getBoundingClientRect().width;
  const range = document.createRange();
  range.setStart(element, 0);
  range.setEnd(element, element.childNodes.length);
  const actualWidth = range.getBoundingClientRect().width;
  return actualWidth > domWidth;
};