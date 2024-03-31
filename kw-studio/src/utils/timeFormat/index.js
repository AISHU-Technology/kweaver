const timeFormat = (time = +new Date()) => {
  const date = new Date(time * 1000 + 8 * 3600 * 1000);

  return date.toJSON().substr(0, 19).replace('T', ' ');
};

const timeFormat2 = (time = +new Date()) => {
  const date = new Date(time * 1000 + 8 * 3600 * 1000);

  return date.toJSON().substr(0, 10);
};

export default { timeFormat, timeFormat2 };
