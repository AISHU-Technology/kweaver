import apiService from '@/utils/axios-http/oldIndex';
import { API } from '@/services/api';

/**
 * 添加dbapi
 * @param {Object} data 请求`data`
 */
const DBApiAdd = async data => await apiService.axiosPost(API.DBApiAdd, data);

/**
 * 发布dbapi
 * @param {Object} data 请求`data`
 */
const DBApiPublish = async data => await apiService.axiosPost(API.DBApiPublish, data);

/**
 * 取消发布dbapi
 * @param {Object} data 请求`data`
 */
const DBApiUnpublish = async data => await apiService.axiosPost(API.DBApiUnpublish, data);

/**
 * 删除dbapi
 * @param {Object} data 请求`data`
 */
const DBApiRemove = async data => await apiService.axiosPost(API.DBApiRemove, data);

/**
 * dbapi列表
 * @param {Object} data 请求`data`
 */
const DBApiList = async data => await apiService.axiosPost(API.DBApiList, data);

/**
 * dbapi列表
 * @param {Object} data 请求`data`
 */
const DBApiInfo = async data => await apiService.axiosPost(API.DBApiInfo, data);

export default {
  DBApiAdd,
  DBApiPublish,
  DBApiUnpublish,
  DBApiRemove,
  DBApiList,
  DBApiInfo
};
