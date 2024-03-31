import axios from 'axios';
import { kwCookie, sessionStore } from '@/utils/handleFunction';

// 取消列表
const sources: Record<string, Function> = {};
const { CancelToken } = axios;

const service: any = axios.create({
  baseURL: '/',
  timeout: 60000 // 超时取消请求
});

// 请求头处理
service.interceptors.request.use(
  (config: any) => {
    const request = JSON.stringify(config.url) + JSON.stringify(config.data);

    config.cancelToken = new CancelToken(cancel => {
      sources[request] = cancel;
    });

    const kwLang = kwCookie.get('kwLang');
    config.headers['Accept-Language'] = kwLang === 'en-US' ? 'en-US' : 'zh-CN';
    config.headers['Content-Type'] = 'application/json; charset=utf-8';
    return config;
  },
  (error: any) => {
    // 异常处理
    return Promise.reject(error);
  }
);

// 响应处理
service.interceptors.response.use(
  (response: any) => {
    return response;
  },
  (error: any) => {
    // 取消请求
    if (axios.isCancel(error)) {
      return {
        status: -200,
        statusText: '请求已取消',
        data: '请求已取消'
      };
    }

    return error.response;
  }
);

// axios 对请求的处理
type RequestParams = (data: {
  method: string;
  url: string;
  params?: Record<string, any>;
  config?: Record<string, any>;
}) => any;
const request: RequestParams = ({ method, url, params, config = {} }) => {
  return new Promise((resolve, reject) => {
    service
      .request({
        method,
        url,
        ...config,
        [method === 'get' ? 'params' : 'data']: { ...params }
      })
      .then(
        (response: any) => {
          resolve(response);
        },
        (err: any) => {
          reject(err);
        }
      )
      .catch((err: any) => {
        reject(err);
      });
  });
};

/**
 * 取消请求, 若不传参则取消所有
 * @param url 取消的url
 */
const cancelRequest = (url?: string | string[]) => {
  if (!url) return Object.values(sources).forEach(cancel => cancel());

  const urls = typeof url === 'string' ? [url] : url;
  Object.entries(sources).forEach(([key, cancel]) => urls.some(u => key.includes(u)) && cancel());
};

export { sources, request, cancelRequest };
