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

import HELPER from '../helper';
import { kwCookie, localStore, sessionStore } from '@/utils/handleFunction';
import { API } from '@/services/api';

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
    const request = JSON.stringify(config.url) + JSON.stringify(config.data);

    config.cancelToken = new CancelToken(cancel => {
      sources[request] = cancel;
    });

    // 修改 header 信息 token， 这些信息来自cookie
    const kwLang = kwCookie.get('kwLang');
    config.headers['Accept-Language'] = kwLang === 'en-US' ? 'en-US' : 'zh-CN';
    config.headers['Content-Type'] = 'application/json; charset=utf-8';

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
      return {
        Code: -200,
        message: '取消请求',
        cause: '取消请求'
      };
    }

    if (error.message.includes('timeout')) {
      message.error([intl.get('createEntity.timeOut')]);

      return error;
    }

    const { status, data: { Code, ErrorCode, Description, code } = {} } = error.response;
    const curCode = `${Code || ErrorCode || code || ''}`;

    if (status === 500) {
      if (error.response.config.url.includes('/api/builder/v1/graph/output')) {
        return error.response;
      }
      if (error.response.config.url.includes('/api/builder/v1/lexicon/export')) {
        return error.response;
      }

      if (curCode === 'Gateway.PlatformAuth.AuthError') {
        message.error(Description);
      }
      if (curCode === 'Gateway.Common.RequestIllegalError') {
        message.error(Description);
      }
      return error.response;
    } else if (status === 503) {
      message.error('服务器暂不可用，请稍后再试');
    } else if (status === 504) {
      message.error(intl.get('global.gatewayTimeout'));
    } else {
      return error?.response;
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
  url = url + HELPER.formatQueryString(params);
  return request(url, config, config, 'get');
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
