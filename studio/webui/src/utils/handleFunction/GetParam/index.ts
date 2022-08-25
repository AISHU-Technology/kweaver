/**
 * @description 获取url中的参数
 * @param {string} name 参数名
 */
function getParam(name: string): string;
function getParam(name: string[]): Record<string, string>;
function getParam(name: string | string[]) {
  if (!window) return '';

  let paramsObj: Record<string, string> = {};

  if (URLSearchParams) {
    paramsObj = Object.fromEntries(new URLSearchParams(window.location.search).entries());
  } else {
    const reg = /[?&]([^=&#]+)=([^=&#]*)/g;
    window.location.search.replace(reg, (_, $1, $2) => {
      paramsObj[$1] = decodeURIComponent($2);
      return _;
    });
  }

  if (typeof name === 'string') return paramsObj[name] || '';

  return paramsObj;
}

export { getParam };
