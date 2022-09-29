/**
 * 数字千分位展示
 * @param {Number | String} num 数字
 * @returns 1234 --> 1,234 | 1234.5555 --> 1,234.555
 */
const numToThousand = num => {
  if (typeof num === 'string' && !/^\d+$/.test(numStr)) {
    return;
  }

  const numStr = `${num}`;
  const [integer, decimal] = numStr.split('.'); // 小数位不转化
  const postfix = decimal ? `.${decimal}` : '';
  const number = `${String(integer).replace(/\d{1,3}(?=(\d{3})+$)/g, s => `${s},`)}${postfix}`;

  return number;
};

export default numToThousand;
