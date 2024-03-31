import axios from 'axios';
import _ from 'lodash';
import Cookie from 'js-cookie';
import intl from 'react-intl-universal';
import { message } from 'antd';
import { API } from '@/services/api';

import { kwCookie, localStore, sessionStore } from '@/utils/handleFunction';

const service = axios.create({ baseURL: '/', timeout: 20000 });

service.interceptors.request.use(
  config => {
    const kwLang = kwCookie.get('kwLang');
    config.headers['Content-Type'] = 'application/json; charset=utf-8';
    config.headers['Accept-Language'] = kwLang === 'en-US' ? 'en-US' : 'zh-CN';
    // 上传文件配置，必传 type：file
    if (config?.data?.type === 'file') {
      config.headers['Content-Type'] = 'multipart/form-data';
      const formData = new FormData();
      const { type, ...elseData } = config.data;
      for (const key in elseData) {
        if (Object.prototype.hasOwnProperty.call(elseData, key)) {
          const item = elseData[key];
          if (key === 'file' && Array.isArray(item)) {
            _.forEach(elseData[key], d => formData.append('file', d));
          } else {
            formData.append(key, item);
          }
        }
      }
      config.data = formData;
    }

    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截处理
service.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    // 取消请求
    if (axios.isCancel(error)) {
      return { Code: -200, message: '取消请求', cause: '取消请求' };
    }
    if (error.message.includes('timeout')) {
      message.error([intl.get('createEntity.timeOut')]);
    }

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
          message.error([intl.get('createEntity.timeOut')]);
          return reject(error.response);
        }
        if (status === 401) {
          return reject(error.response);
        } else if (status === 500) {
          if (ErrorCode || config?.url?.includes('/api/builder/v1/graph/output')) return reject(error.response);
          if (ErrorCode === 'Gateway.PlatformAuth.AuthError') message.error('认证失败');
        } else if (status === 400) {
          return reject({ type: 'message', config: error?.response?.config, response: error?.response?.data });
        } else if (status === 503) {
          message.error('服务器暂不可用，请稍后再试');
        } else if (status === 504) {
          message.error(intl.get('global.gatewayTimeout'));
        } else {
          if (Description) message.error(Description || 'Error');
          return reject(error.response);
        }
      });
  });
};

const axiosGet = (url: string, data: any, config = {}) => {
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
