import _ from 'lodash';
// 自定义序列化参数函数
const customParamsSerializer = (params: any) => {
  if (_.isEmpty(params)) return '';
  return _.map(Object.entries(params), ([key, value]: any) => {
    if (Array.isArray(value)) {
      return value.map(v => `${encodeURIComponent(key)}=${encodeURIComponent(v)}`).join('&');
    }
    return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
  }).join('&');
};

export default customParamsSerializer;
