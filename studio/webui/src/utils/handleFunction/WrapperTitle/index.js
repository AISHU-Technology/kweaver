// title属性多于30字符添加换行，不然IE和Firefox显示有问题
const wrapperTitle = str => {
  if (typeof str !== 'string') return '';

  return str.replace(/(.{30})/g, '$1\n');
};

export { wrapperTitle };
