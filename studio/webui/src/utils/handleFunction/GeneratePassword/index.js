// 随机生成数字, ASCLL码：48~57
const randomNum = () => {
  return String.fromCharCode(Math.floor(Math.random() * 10) + 48);
};

// 随机生成大写字母, ASCLL码：65~90
const randomUpper = () => {
  return String.fromCharCode(Math.floor(Math.random() * 26) + 65);
};

// 随机生成小写字母, ASCLL码：97~122
const randomLower = () => {
  return String.fromCharCode(Math.floor(Math.random() * 26) + 97);
};

// 随机生成特殊字符
const randomSymbol = () => {
  const symbols = '~!@#$%^&*()_+{}":?><;.,';

  return symbols[Math.floor(Math.random() * symbols.length)];
};

const randomFunc = {
  lower: randomLower,
  upper: randomUpper,
  symbol: randomSymbol,
  number: randomNum
};
const defaultOptions = { lower: true, upper: true, symbol: false, number: true };

/**
 * 随机生成密码
 * @param {Number} length 密码长度
 * @param {Object} options 包含字符选项 { lower(小写字母): bool, upper(大写字母): bool, number(数字): bool, symbol(特殊字符): bool }
 */
const generatePassword = (length = 8, options = defaultOptions) => {
  let password = '';
  const { lower, upper, number, symbol } = options;
  const typesCount = !!lower + !!upper + !!number + !!symbol;

  if (!typesCount || !length) return '';

  const typesArr = Object.entries(options).reduce((res, [key, value]) => (value ? [...res, key] : res), []);

  for (let i = 0; i < length; i++) {
    for (let j = 0; j < typesArr.length; j++) {
      password += randomFunc[typesArr[j]]();
    }
  }

  return password.slice(0, length);
};

export default generatePassword;
