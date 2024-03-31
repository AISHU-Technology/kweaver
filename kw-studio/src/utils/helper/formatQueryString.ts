import _ from 'lodash';

const isObject = (obj: any) => Object.prototype.toString.call(obj) === '[object Object]';

const objectToStringify = (data: any) => {
  return isObject(data) ? JSON.stringify(data) : data;
};

const formatQueryString = (params: any) => {
  if (!isObject(params)) return params;

  const keys = _.keys(params);

  if (keys.length === 0) return '';

  const query = _.map(keys, key => {
    const value = objectToStringify(params[key]);
    return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
  }).join('&');

  return `?${query}`;
};

export default formatQueryString;
