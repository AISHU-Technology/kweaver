const wrapperTitle = (str: any) => {
  if (typeof str !== 'string') return '';

  return str.replace(/(.{30})/g, '$1\n');
};

export { wrapperTitle };
