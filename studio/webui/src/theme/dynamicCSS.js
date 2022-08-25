/**
 * 动态css主题
 */

const containerCache = new Map(); // 容器缓存
const MARK_KEY = 'ad-theme-ky'; // 样式节点标记

/**
 * 添加css, 插入head标签
 * @param {String} css 样式
 */
const injectCSS = css => {
  const container = document.querySelector('head') || document.body;
  const styleNode = document.createElement('style');

  styleNode.innerHTML = css;
  container.appendChild(styleNode);

  return styleNode;
};

/**
 * 更新css
 * @param {String} css css样式字符串
 * @param {String} key 样式节点标记
 */
function updateCSS(css, key = MARK_KEY) {
  const container = document.querySelector('head') || document.body;

  // 初次设置css
  if (!containerCache.has(container)) {
    const placeholderStyle = injectCSS('');
    const { parentNode } = placeholderStyle;

    containerCache.set(container, parentNode);
    parentNode.removeChild(placeholderStyle);
  }

  const existNode = Array.from(containerCache.get(container).children).find(
    node => node.tagName === 'STYLE' && node[MARK_KEY] === key
  );

  if (existNode) {
    existNode.innerHTML !== css && (existNode.innerHTML = css);

    return existNode;
  }

  const newNode = injectCSS(css);

  newNode[MARK_KEY] = key;

  return newNode;
}

// 使用
// updateCSS(
//   `
//  :root {
//    --color: blue;
//  }
//  `,
//   'dynamic-theme-key'
// );

export { updateCSS };
