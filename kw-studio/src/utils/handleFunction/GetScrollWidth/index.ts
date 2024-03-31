// 计算滚动条宽度
export const getScrollWidth = () => {
  const outDiv = document.createElement('div');
  const innerDiv = document.createElement('div');

  outDiv.style.cssText = 'position: absolute; left: -9999px; width: 100px; height: 100px; overflow: scroll;';
  outDiv.appendChild(innerDiv);
  document.body.appendChild(outDiv);
  const width = outDiv.offsetWidth - innerDiv.offsetWidth;

  outDiv.remove();
  innerDiv.remove();

  return width;
};
