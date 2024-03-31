import _ from 'lodash';

const getRandomString = (length: number) => {
  let result = '';
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ~!@#$%^&*()_+{}|:<>?-=[];,./';
  for (let i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
};

const getRuleString = (chars: string, isAdmin: boolean) => {
  let result = '';
  const step = isAdmin ? 25 : 27;
  _.forEach(chars, (item, index) => {
    if (index % step === 0) result += item;
  });
  return result;
};

export { getRandomString, getRuleString };
