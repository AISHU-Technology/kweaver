/**
 * 数字千分位展示
 * @param {Number | String} num 数字
 * @returns 1234 --> 1,234
 */
const numToThousand = num => {
  const numStr = `${num}`;

  if (!/^\d+$/.test(numStr)) {
    return;
  }

  const number = numStr.toString().replace(/\d{1,3}(?=(\d{3})+$)/g, s => `${s},`);

  return number;
};

export default numToThousand;
