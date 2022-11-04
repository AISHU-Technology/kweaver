import numeral from 'numeral';

const isNumberAndParseInt = (num: string | number) => {
  if (typeof num === 'number') return num;
  if (!/^[0-9]/.test(num)) {
    console.warn('Function isNumberAndParseInt \n 参数:number 必须为数字');
    return 0;
  }
  return parseInt(num, 10);
};

/**
 * helper 格式化文件大小
 * @param {Number} size
 * @return 1B, 1KB, 1MB, 1GB
 */
const formatFileSize = (size: number) => {
  if (typeof size !== 'number' || size === 0 || !size) return '-';

  if (size < 1024) return `${size} B`;

  const sizeKB = Math.floor(size / 1024);
  if (sizeKB < 1024) return `${sizeKB} KB`;

  const sizeMB = Math.floor(sizeKB / 1024);
  if (sizeMB < 1024) return `${sizeMB} MB`;

  const sizeGB = Math.floor(sizeMB / 1024);
  return `${sizeGB} GB`;
};

/**
 * helper 格式化短数字
 * @param {Number} num
 * @return 1,000  23,500  1,043,212
 */
const formatNumberWithComma = (num: number) => {
  const _number = isNumberAndParseInt(num);

  return numeral(_number).format(0, 0);
};

/**
 * helper 格式化长数字
 * @param {Number} num
 * @return 1千,1万
 */
const formatNumberWithSuffix = (num: number) => {
  const number = isNumberAndParseInt(num);
  let result = '';
  if (number < 1000) result = numeral(number).format(0, 0);
  if (number >= 1000 && number < 10000) result = `${numeral(number / 1000).format(0, 0)}千`;
  if (number >= 10000 && number < 10000000) result = `${numeral(number / 10000).format(0, 0)}万`;
  if (number >= 10000000 && number < 100000000) result = `${numeral(number / 10000000).format(0, 0)}千万`;
  if (number >= 100000000 && number < 100000000000) result = `${numeral(number / 100000000).format(0, 0)}亿`;
  if (number >= 100000000000 && number < 1000000000000) result = `${numeral(number / 100000000000).format(0, 0)}千亿`;
  if (number >= 1000000000000) result = `${numeral(number / 1000000000000).format(0, 0)}兆`;
  return result;
};
formatNumberWithSuffix.limit = 1000;

export { isNumberAndParseInt, formatFileSize, formatNumberWithComma, formatNumberWithSuffix };
