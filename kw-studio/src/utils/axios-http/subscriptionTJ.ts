import axios from 'axios';
import _ from 'lodash';
import Cookie from 'js-cookie';
import intl from 'react-intl-universal';
import { message } from 'antd';

import { kwCookie, localStore, sessionStore } from '@/utils/handleFunction';

const service = axios.create({ baseURL: '/', timeout: 20000 });
service.interceptors.request.use(
  config => {
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
        } else if (status === 504) {
          message.error(intl.get('global.gatewayTimeout'));
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
