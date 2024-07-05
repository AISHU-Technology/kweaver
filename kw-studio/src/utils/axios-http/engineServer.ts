import axios from 'axios';
import intl from 'react-intl-universal';
import { message } from 'antd';
import { kwCookie } from '@/utils/handleFunction';
import customParamsSerializer from './customParamsSerializer';

const { CancelToken } = axios;
const sources: Record<any, any> = {};

const service = axios.create({ baseURL: '/', timeout: 20000, paramsSerializer: customParamsSerializer });

service.interceptors.request.use(
  config => {
    const urlList = JSON.stringify(config.url) + JSON.stringify(config.data);

    config.cancelToken = new CancelToken(cancel => (sources[urlList] = cancel));

    const kwLang = kwCookie.get('kwLang');

    config.headers['Content-Type'] = 'application/json; charset=utf-8';
    config.headers['Accept-Language'] = kwLang === 'en-US' ? 'en-US' : 'zh-CN';

    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

type RequestType = { url: string; data: any; config: any; method: 'get' | 'post' | 'delete' | 'put' };
const request = ({ url, data, config, method }: RequestType): any => {
  const body = method === 'get' ? { params: data, ...config } : Array.isArray(data) ? [...data] : { ...data };
  return new Promise((resolve, reject) => {
    service[method](url, body, config)
      .then(response => {
        if (response) resolve(response?.data);
      })
      .catch(error => {
        const { data = {}, config: __config, status } = error.response || {};
        const { Description } = data || {};
        if (error.message === '取消请求') return;
        if (data?.Description?.includes('timeout') || error.message.includes('timeout')) {
          message.error(intl.get('exploreGraph.timeoutTip'));
          return reject(error.response);
        }

        if (status === 502) {
          message.error(intl.get('global.getwayError'));
          return;
        }

        if (status === 401) {
          return reject(error.response);
        } else if (status === 500) {
          if (Description && !config?.isHideMessage) message.error(Description);
          return reject({ type: 'message', config: error?.response?.__config, response: error?.response?.data });
        } else if (status === 503) {
          message.error('服务器暂不可用，请稍后再试');
        } else if (status === 504) {
          message.error(intl.get('global.gatewayTimeout'));
        } else {
          if (Description && !config?.isHideMessage) message.error(Description);
          return reject(error.response?.data);
        }
      });
  });
};

const axiosGet = (url: string, data?: any, config = {}) => {
  return request({ url, data, config, method: 'get' });
};

const axiosDelete = (url: string, data: any, config = {}) => {
  return request({ url, data, config, method: 'delete' });
};

const axiosPost = (url: string, data: any, config = {}) => {
  return request({ url, data, config, method: 'post' });
};

const axiosPut = (url: string, data: any, config = {}) => {
  return request({ url, data, config, method: 'put' });
};

export default { sources, axiosGet, axiosDelete, axiosPost, axiosPut };
