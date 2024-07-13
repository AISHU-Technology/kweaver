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
import { MessageArgsProps, message } from 'antd';
import Cookie from 'js-cookie';
import intl from 'react-intl-universal';

import HELPER from '../helper';
import { kwCookie, localStore, sessionStore } from '@/utils/handleFunction';
import { API } from '@/services/api';
import { ReactChild, ReactFragment, ReactPortal } from 'react';

const { CancelToken } = axios;

const sources: any = {};

const service = axios.create({
  baseURL: '/',
  timeout: 20000
});

service.interceptors.request.use(
  config => {
    const request = JSON.stringify(config.url) + JSON.stringify(config.data);

    config.cancelToken = new CancelToken(cancel => {
      sources[request] = cancel;
    });

    const kwLang = kwCookie.get('kwLang');
    config.headers['Accept-Language'] = kwLang === 'en-US' ? 'en-US' : 'zh-CN';
    config.headers['Content-Type'] = 'application/json; charset=utf-8';

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
    return Promise.reject(error);
  }
);

service.interceptors.response.use(
  response => {
    return response;
  },
  error => {
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

    const { status, data = {} } = error.response;
    const curCode = `${data.Code || data.ErrorCode || data.code || ''}`;

    if (status === 500) {
      if (error.response.config.url.includes('/api/builder/v1/graph/output')) {
        return error.response;
      }
      if (error.response.config.url.includes('/api/builder/v1/lexicon/export')) {
        return error.response;
      }

      if (curCode === 'Gateway.PlatformAuth.AuthError') {
        message.error(data.Description);
      }
      if (curCode === 'Gateway.Common.RequestIllegalError') {
        message.error(data.Description);
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

const request = (
  url: any,
  params: {},
  config: {},
  method: 'get' | 'post' | 'put' | 'delete' | 'patch' | 'head' | 'options'
) => {
  return new Promise((resolve, reject) => {
    service[method](url, params, Object.assign({}, config))
      .then(
        (response: { data: any }) => {
          response && resolve(response.data);
        },
        (err: any) => {
          if (err.Cancel) {
            message.error(err);
          } else {
          }
        }
      )
      .catch((err: any) => {
        reject(err);
      });
  });
};

const axiosGet = (url: any, params?: any, config = {}): Promise<any> => {
  return request(url, params, config, 'get');
};

const axiosGetData = (url: any, params: any, config = {}): Promise<any> => {
  url = url + HELPER.formatQueryString(params);
  return request(url, config, config, 'get');
};

const axiosDelete = (url: any, params?: any, config = {}): Promise<any> => {
  return request(url, params, config, 'delete');
};

const axiosPost = (url: any, params: any, config = {}): Promise<any> => {
  return request(url, params, config, 'post');
};

const axiosPut = (url: any, params: any, config = {}): Promise<any> => {
  return request(url, params, config, 'put');
};

export default { sources, axiosGet, axiosGetData, axiosDelete, axiosPost, axiosPut };
