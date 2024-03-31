import axios from 'axios';

import _ from 'lodash';
import Cookie from 'js-cookie';
import intl from 'react-intl-universal';
import { message } from 'antd';
import { API } from '@/services/api';

import { kwCookie, localStore, sessionStore } from '@/utils/handleFunction';

// 取消请求的信号数据
const requestCancelToken: Record<string, Function> = {};
const { CancelToken } = axios;

const service = axios.create({ baseURL: '/', timeout: 20000 });

service.interceptors.request.use(
  config => {
    const kwLang = kwCookie.get('kwLang');

    // 登录接口，不需要加token
    config.headers['Content-Type'] = 'application/json; charset=utf-8';
    config.headers['Accept-Language'] = kwLang === 'en-US' ? 'en-US' : 'zh-CN';

    config.cancelToken = new CancelToken(cancel => {
      requestCancelToken[config.url!] = cancel;
    });

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
        if (axios.isCancel(error)) {
          return reject({
            code: -200,
            description: '请求已取消'
          });
        }
        const { data = {}, config: __config, status } = error.response || {};
        const { ErrorCode, Description } = data || {};

        if (data?.Description?.includes('timeout')) {
          message.error(intl.get('createEntity.timeOut'));
          return reject(error.response);
        }

        if (status === 401) {
          if (ErrorCode === 'Gateway.Common.NoDataPermissionError') {
            message.error(intl.get('configSys.notAuth'));
            window.location.replace('/home');
          }
          if (ErrorCode === 'Gateway.Common.RequestIllegalError') {
            message.error(intl.get('configSys.notAuth'));
            window.location.replace('/home');
          }
        } else if (status === 500) {
          if (Description && !config?.isHideMessage) message.error(Description);
          return reject({ type: 'message', config: error?.response?.__config, response: error?.response?.data });
        } else if (status === 503) {
          message.error('服务器暂不可用，请稍后再试');
          return reject(error.response);
        } else if (status === 504) {
          message.error(intl.get('global.gatewayTimeout'));
          return reject(error.response);
        } else {
          if (Description && !config?.isHideMessage) message.error(Description);
          return reject(error.response);
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

export default { axiosGet, axiosDelete, axiosPost, axiosPut };

/**
 * 取消请求, 若不传参则取消所有
 * @param url 取消的api
 */
export const cancelRequest = (url?: string | string[]) => {
  if (!url) return Object.values(requestCancelToken).forEach(cancel => cancel());
  const urls = typeof url === 'string' ? [url] : url;
  urls.forEach(key => {
    requestCancelToken[key]?.();
  });
};
