/* eslint-disable */
/**
 * axios 二次封装
 * @ Author tian.yuanfeng@eisoo.com
 * @ version 3.0.7
 * @ Date 2019/3/7
 *
 * 遗留问题，在路由切换的时候，取消之前页面的请求
 */

import axios from 'axios';
import _ from 'lodash';
import { message } from 'antd';
import Cookie from 'js-cookie';
import intl from 'react-intl-universal';

import changeUrl from './changeUrl';
import paramsToQueryString from './paramsToQueryString';

// 请求列表
const requestList = [];

// 取消列表
const { CancelToken } = axios;

const sources = {};

const service = axios.create({
  baseURL: '/',
  timeout: 20000 // 超时取消请求
});

// 请求拦截处理
service.interceptors.request.use(
  config => {
    // 添加时间戳
    config.url = changeUrl(config.url);

    const request = JSON.stringify(config.url) + JSON.stringify(config.data);

    config.cancelToken = new CancelToken(cancel => {
      sources[request] = cancel;
    });

    // 请求处理
    if (requestList.includes(request)) {
      // 重复
      sources[request]('取消重复请求');
    } else {
      // 不重复
      requestList.push(request);
    }

    // 修改 header 信息 token， 这些信息来自cookie
    const anyDataLang = Cookie.get('anyDataLang');

    config.headers['Accept-Language'] = anyDataLang === 'en-US' ? 'en-US' : 'zh-CN';
    config.headers['Cache-Control'] = 'no-store';
    config.headers['Content-Type'] = 'application/json; charset=utf-8';

    // 上传文件配置，必传 type：file
    if (config?.data?.type === 'file') {
      config.headers['Content-Type'] = 'multipart/form-data';
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
    const request = JSON.stringify(response.config.url) + JSON.stringify(response.config.data);

    // 获取响应后，请求列表里面去除这个值
    requestList.splice(
      requestList.findIndex(item => item === request),
      1
    );

    return response;
  },
  error => {
    // 取消请求
    if (axios.isCancel(error)) {
      requestList.length = 0;

      return {
        Code: -200,
        message: '取消请求',
        cause: '取消请求'
      };
    }

    if (error.message.includes('timeout')) {
      if (_.last(requestList).includes('engine/v1/explore/path')) {
        message.error(intl.get('searchGraph.explorationTimeOut'));
        return error;
      }
      message.error([intl.get('createEntity.timeOut')]);

      return error;
    }
    const { status, data: { Code, ErrorCode, code } = {} } = error.response;
    const curCode = `${Code || ErrorCode || code || ''}`;

    if (status === 500 || status === 403) {
      if (curCode || error.response.config.url.includes('api/builder/v1/graph/output')) {
        return error.response;
      }

      if (error.response.config.url.includes('api/builder/v1/lexicon/export')) {
        return error.response;
      }

      if (curCode === 'Gateway.PlatformAuth.AuthError') {
        message.error('认证失败');
      }
    } else {
      message.error(error && (error.message || error.Message));
      return error;
    }
  }
);

// axios 对请求的处理
const request = (url, params, config, method) => {
  return new Promise((resolve, reject) => {
    service[method](url, params, Object.assign({}, config))
      .then(
        response => {
          response && resolve(response.data);
        },
        err => {
          if (err.Cancel) {
            message.error(err);
          } else {
          }
        }
      )
      .catch(err => {
        reject(err);
      });
  });
};

// get方法
const axiosGet = (url, params, config = {}) => {
  return request(url, params, config, 'get');
};

// get方法 带参数
const axiosGetData = (url, params, config = {}) => {
  url = url + paramsToQueryString(params);
  return request(url, undefined, config, 'get');
};

// delete 方法
const axiosDelete = (url, params, config = {}) => {
  return request(url, params, config, 'delete');
};

// post方法
const axiosPost = (url, params, config = {}) => {
  return request(url, params, config, 'post');
};

// put方法
const axiosPut = (url, params, config = {}) => {
  return request(url, params, config, 'put');
};

export default { sources, axiosGet, axiosGetData, axiosDelete, axiosPost, axiosPut };

// EngineServer.ErrNebulaStatsErr
