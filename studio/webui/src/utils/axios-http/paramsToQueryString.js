import _ from 'lodash';

const objectToStringify = data => {
  return data.constructor === Object ? JSON.stringify(data) : data;
};

const paramsToQueryString = params => {
  if (params.constructor !== Object) return params;

  const keys = _.keys(params);

  if (keys.length === 0) return '';

  const query = _.map(keys, key => {
    const value = objectToStringify(params[key]);
    return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
  }).join('&');

  return `?${query}`;
};

export default paramsToQueryString;
