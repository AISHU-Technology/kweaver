let domCache: HTMLSpanElement | null = null;
const getLengthFromString = (str: string, size?: number, mix?: number) => {
  const base = mix || 0;
  const fontSize = size || 14;

  if (!domCache) {
    domCache = document.createElement('span');
    domCache.style.display = 'inline-block';
    domCache.setAttribute(
      'style',
      `position: fixed; z-index: -999; visibility: hidden; display: inline-block; font-size: ${fontSize}px; font-family: sans-serif;`
    );
    document.body.appendChild(domCache);
  }
  domCache.innerHTML = str;
  const width = domCache.clientWidth;
  return width + base;
};

export default getLengthFromString;
