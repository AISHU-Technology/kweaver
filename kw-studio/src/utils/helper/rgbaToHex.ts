import _ from 'lodash';
interface ColorObj {
  r: number;
  g: number;
  b: number;
  a?: number;
}

/**
 * rgba颜色字符串转化为16进制颜色字符串
 * @param rgba rgba颜色字符串
 * @returns 16进制颜色字符串
 */
export const rgbaToHex = (rgba: string | ColorObj) => {
  const colorObj = parseRgbaColor(rgba);
  return toHexString(colorObj);
};

/**
 * rgba颜色字符串解析为颜色对象
 * @param color 颜色字符串
 */
const parseRgbaColor = (color: string | ColorObj) => {
  if (typeof color !== 'string' && _.has(color, 'r')) {
    return color;
  }
  const arr = (color as string).match(/(\d(\.\d+)?)+/g) || [];
  const res = arr.map((s: string) => parseInt(s, 10));
  return {
    r: res[0],
    g: res[1],
    b: res[2],
    a: parseFloat(arr[3])
  };
};

/**
 * 颜色对象转化为16进制颜色字符串
 * @param colorObj 颜色对象
 */
const toHexString = (colorObj: ColorObj) => {
  const { r, g, b, a = 1 } = colorObj;
  return `#${toHex(r)}${toHex(g)}${toHex(b)}${a === 1 ? '' : toHex(Math.floor(a * 255))}`;
};

/**
 * 255颜色值转16进制颜色值
 * @param n 255颜色值
 */
const toHex = (n: number) => `${n > 15 ? '' : 0}${n.toString(16)}`;
