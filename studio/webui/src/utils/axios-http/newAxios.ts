import axios from 'axios';
import _ from 'lodash';
import Cookie from 'js-cookie';
import intl from 'react-intl-universal';
import { message } from 'antd';

import { localStore, sessionStore } from '@/utils/handleFunction';

const service = axios.create({ baseURL: '/', timeout: 20000 });
service.interceptors.request.use(
  config => {
    const anyDataLang = Cookie.get('anyDataLang');
    const sessionidCookie = Cookie.get('sessionid') || '';
    const sessionidStorage = sessionStore.get('sessionid') || '';
    const uuid = Cookie.get('uuid');

    if (sessionidCookie && sessionidCookie !== sessionidStorage) {
      sessionStore.set('sessionid', sessionidCookie);
      window.location.reload();
    }

    if (uuid) config.headers.uuid = uuid;
    if (sessionidCookie) config.headers.sessionid = sessionidCookie;
    config.headers['Content-Type'] = 'application/json; charset=utf-8';
    config.headers['Accept-Language'] = anyDataLang === 'en-US' ? 'en-US' : 'zh-CN';

    // 上传文件配置，必传 type：file
    if (config?.data?.type === 'file') {
      config.headers['Content-Type'] = 'multipart/form-data';
      const formData = new FormData();
      const { type, ...elseData } = config.data;
      for (const key in elseData) {
        if (elseData?.hasOwnProperty(key)) {
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

type RequestType = {
  url: string;
  data: any;
  config: any;
  method: 'get' | 'post' | 'delete' | 'put';
};
const request = ({ url, data, config, method }: RequestType): any => {
  const body = method === 'get' ? { params: data } : { data };
  return new Promise((resolve, reject) => {
    service[method](url, Object.assign(body, config))
      .then(response => {
        if (response) resolve(response.data);
      })
      .catch(error => {
        const { config = {}, data = {}, status } = error.response || {};
        const { errorcode, description } = data || {};

        if (data?.description?.includes('timeout')) {
          message.error([intl.get('createEntity.timeOut')]);
          return reject(error.response);
        }
        if (status === 401) {
          Cookie.remove('sessionid');
          Cookie.remove('uuid');
          localStore.remove('userInfo');

          if (errorcode === 'Gateway.AdminResetAccess.LoginInfoMatchError') {
            setTimeout(() => window.location.replace('/login'), 2000);
            return reject(error.response);
          }

          message.error([intl.get('login.loginOutTip')]);
          setTimeout(() => window.location.replace('/login'), 2000);
        } else if (status === 500 || status === 403) {
          if (errorcode || config?.url?.includes('/api/builder/v1/graph/output')) return reject(error.response);
          if (errorcode === 'Gateway.PlatformAuth.AuthError') message.error('认证失败');
        } else if (status === 400) {
          return reject({ type: 'message', config: error?.response?.config, response: error?.response?.data });
        } else {
          if (description) message.error(description);
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
