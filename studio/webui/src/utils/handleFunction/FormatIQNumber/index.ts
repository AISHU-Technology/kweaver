/**
 * 领域智商相关的数字显示, 整数千分位, 小数补充两位小数
 * @param num 数字
 * @returns 1234 --> 1,234 | 1.00 --> 1 | 1.2 --> 1.20
 */
export const formatIQNumber = (num?: number | string) => {
  if (typeof num === 'undefined' || num < 0) return '--';

  const [integer, decimal] = String(num).split('.');
  const integerStr = Number(integer).toLocaleString();

  if (!decimal || /^0+$/.test(decimal)) return integerStr;
  const decimalStr = decimal.length > 2 ? decimal.slice(0, 2) : `${decimal}${'0'.repeat(2 - decimal.length)}`;
  return `${integerStr}.${decimalStr}`;
};
