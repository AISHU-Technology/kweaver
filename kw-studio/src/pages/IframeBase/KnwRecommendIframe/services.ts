// @ts-ignore
import axios from 'axios';
// @ts-ignore
import type { Method } from 'axios';
// @ts-ignore
import _ from 'lodash';
import { OPEN_API } from '@/services/openApi';
import { encodeAppKey } from '@/utils/crypto/sha256';

/**
 * 生成get请求加密参数
 * WARNING get请求加密, 参数不能用encodeURIComponent编码后加密, 因为后端是解码后再加密, 会导致前后端不一致
 */
const parseParams = (params?: Record<string, any>) => {
  if (!params) return '';
  const paramsStr = Object.entries(params).reduce((res, [key, value], index) => {
    return `${res + (index ? '&' : '')}${key}=${value}`;
  }, '');
  return typeof paramsStr === 'string' ? paramsStr : '';
};

// axios 对请求的处理
type RequestParams = (data: {
  method: Method;
  url: string;
  params?: Record<string, any>;
  header: { appid: string };
}) => any;
const request: RequestParams = ({ method, url, params, header }) => {
  const timestamp = String(~~(+new Date() / 1000));
  const paramsStr = method === 'get' ? parseParams(params) : JSON.stringify(params);
  const appkey = encodeAppKey(header.appid, timestamp, paramsStr);
  const headers = { appid: header.appid, appkey, timestamp };
  return new Promise((resolve, reject) => {
    axios
      .request({
        method,
        url,
        headers,
        [method === 'get' ? 'params' : 'data']: { ...params },
        timeout: 10000
      })
      .then(
        (response: any) => {
          resolve(response?.data);
        },
        (err: any) => {
          reject(err.response);
        }
      )
      .catch((err: any) => {
        reject(err.response);
      });
  });
};

/**
 * 知识卡片搜索
 * @param params 参数
 * @param header appid请求头
 */
const searchTest = async (params: any, header: any) => {
  return await request({ method: 'post', url: OPEN_API.openSearchTest(params.service_id), params, header });
};

/** 根据文档gns获取知识点接口 */
const knowledgePointPost = async (params: { service_id: string; gns: string }, header: any) => {
  return await request({
    method: 'post',
    url: OPEN_API.openKnowledgePointPost(params.service_id),
    params: _.pick(params, 'gns'),
    header
  });
};

/** 获取实体链接接口 */
const entityLinkGet = async (params: { config_name: string }, header: any) => {
  return await request({
    method: 'get',
    url: OPEN_API.openKnowledgePointPost(params.config_name),
    header
  });
};

const services = {
  searchTest,
  knowledgePointPost,
  entityLinkGet
};

export default services;
