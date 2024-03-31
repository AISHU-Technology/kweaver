/* eslint-disable */
import axios from 'axios';
import _ from 'lodash';
import { message } from 'antd';
import Cookie from 'js-cookie';
import intl from 'react-intl-universal';

import { encodeAppKey } from '@/utils/crypto/sha256';
import { kwCookie, sessionStore } from '@/utils/handleFunction';
import { getParam, localStore } from '@/utils/handleFunction';
import customParamsSerializer from './customParamsSerializer';
import { API } from '@/services/api';

const { CancelToken } = axios;

const sources: Record<any, any> = {};

const service = axios.create({
  baseURL: '/',
  paramsSerializer: customParamsSerializer, //自定义序列化参数函数
  timeout: 20000 // 超时取消请求
});

// 请求拦截处理
service.interceptors.request.use(
  config => {
    const request = JSON.stringify(config.url) + JSON.stringify(config.data);

    config.cancelToken = new CancelToken(cancel => {
      sources[request] = cancel;
    });

    // 修改 header 信息 token， 这些信息来自cookie
    const kwLang = kwCookie.get('kwLang');

    config.headers['Content-Type'] = 'application/json; charset=utf-8';
    config.headers['Accept-Language'] = kwLang === 'en-US' ? 'en-US' : 'zh-CN';

    // open api 请求头处理
    const { pid, id, apiToken } = getParam(['pid', 'id', 'apiToken']);

    // 是否为认证 openAPI 的方式
    if (apiToken) {
      //认证的方式
      config.url = config?.url?.replace('/open/', '/kgservice/');
      apiToken && (config.headers.apiToken = apiToken);
      pid && (config.headers.pid = pid);
      id && (config.headers.id = id);
    } else {
      // appkey加密的方式
      const appid = getParam('appid') || config?.params?.appid || '';
      let timestamp = new Date().valueOf().toString();
      timestamp = timestamp.substr(0, 10);

      // 获取参数
      const params: any = [];

      _.forEach(Object.keys(config?.params || {}), key => {
        if (Array.isArray(config.params[key])) {
          _.forEach(config.params[key], value => {
            params.push(`${String(key)}=${value}`);
          });
        } else {
          params.push(`${String(key)}=${String(config.params[key])}`);
        }
      });

      let query = config.method === 'get' ? params?.join('&') : JSON.stringify(config.data);

      // open api需要加密appkey
      const appkey = encodeAppKey(appid, timestamp, query);
      appkey && (config.headers.appkey = appkey);
      appid && (config.headers.appid = appid);
      config.headers.timestamp = timestamp;
    }

    /** 天津加参数的需求 */
    const { preApi, productId, authorization, fromSource } = getParam([
      'preApi',
      'productId',
      'authorization',
      'fromSource'
    ]);
    if (preApi && productId && authorization && fromSource) {
      config.url = `${preApi}${config.url}`;
      config.headers.Authorization = authorization;
      config.headers['from-source'] = fromSource;
      delete config.headers.appid;
    }

    // 上传文件配置，必传 type：file
    if (config?.data?.type === 'file') {
      config.headers['Content-Type'] = 'multipart/form-data;';
      const formData = new FormData();
      const { type, ...elseData } = config.data;
      for (let key in elseData) {
        if (elseData.hasOwnProperty(key)) {
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
    // 异常处理
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

type RequestType = {
  url: string;
  data: any;
  config: any;
  method: 'get' | 'post' | 'delete' | 'put';
};

const request = ({ url, data = {}, config, method }: RequestType): any => {
  /** 天津加参数的需求  */
  const { preApi, productId, authorization, fromSource } = getParam([
    'preApi',
    'productId',
    'authorization',
    'fromSource'
  ]);
  if (preApi && productId && authorization && fromSource) {
    data.productId = productId;
  }
  /** 天津加参数的需求 */

  const body = method === 'get' ? { params: data, ...config } : data;

  return new Promise((resolve, reject) => {
    service[method](url, body, Object.assign({}, config))
      .then(response => {
        if (response) resolve(response.data);
      })
      .catch(error => {
        const { config = {}, data = {}, status } = error.response || {};
        const { ErrorCode, Description } = data || {};

        if (data?.Description?.includes('timeout') || error.message.includes('timeout')) {
          message.error(intl.get('exploreGraph.timeoutTip'));
          return reject(error.response);
        }
        if (status === 403) {
          const { msg } = JSON.parse(data?.ErrorDetails?.[0]);
          message.error(msg);
          return reject({ type: 'message', config: error?.response?.config, response: error?.response?.data });
        } else if (status === 500) {
          if (ErrorCode === 'Gateway.PlatformAuth.AuthError') {
            const { msg } = JSON.parse(data?.ErrorDetails?.[0]);
            message.error(msg);
            return;
          }
          if (config?.url?.includes('/api/builder/v1/graph/output')) return reject(error.response);
          return reject({ type: 'message', config: error?.response?.config, response: error?.response?.data });
        } else if (status === 400) {
          return reject({ type: 'message', config: error?.response?.config, response: error?.response?.data });
        } else if (status === 503) {
          message.error('服务器暂不可用，请稍后再试');
        } else if (status === 504) {
          message.error(intl.get('global.gatewayTimeout'));
        } else {
          if (Description) message.error(Description);
          return reject(error.response);
        }
      });
  });
};

// get方法
const axiosGet = (url: string, data: any = {}, config = {}) => {
  return request({ url, data, config, method: 'get' });
};

// delete 方法
const axiosDelete = (url: string, data: any, config = {}) => {
  return request({ url, data, config, method: 'delete' });
};

// post方法
const axiosPost = (url: string, data: any, config = {}) => {
  return request({ url, data, config, method: 'post' });
};

// put方法
const axiosPut = (url: string, data: any, config = {}) => {
  return request({ url, data, config, method: 'put' });
};

export default { sources, axiosGet, axiosDelete, axiosPost, axiosPut };
