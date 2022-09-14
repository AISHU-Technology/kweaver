/**
 * 存储管理
 * @Author Haiyan
 * @Date 2022/03/34
 */

import { API } from '../api';
import apiService from '@/utils/axios-http/newAxios';

/**
 * @description 获取单条数据配置源
 */
const graphDBGetById = async id => await apiService.axiosGet(API.graphDBGetById, { id });

/**
 * @description 数据源存储列表
 */
const graphDBGetList = async data => await apiService.axiosGet(API.graphDBGetList, data);

/**
 * @description 创建存储
 */
const graphDBCreate = async data => await apiService.axiosPost(API.graphDBCreate, data);

/**
 * @description 删除存储
 */
const graphDBDelete = async id => await apiService.axiosPost(API.graphDBDelete, id);

/**
 * @description 编辑存储
 */
const graphDBUpdate = async data => await apiService.axiosPost(API.graphDBUpdate, data);

/**
 * @description 测试连接
 */
const graphDBTest = async data => await apiService.axiosPost(API.graphDBTest, data);

/**
 * @description 根据ID获取当前存储的图谱
 */
const graphDBGetGraphById = async data => await apiService.axiosGet(API.graphDBGetGraphById, data);

/**
 * @description 获取索引列表
 */
const openSearchGet = async data => await apiService.axiosGet(API.openSearchGet, data);

/**
 * 根据id获取单条索引
 */
const openSearchGetById = async id => await apiService.axiosGet(API.openSearchGetById, { id });

/**
 * 新建索引
 */
const openSearchCreate = async data => await apiService.axiosPost(API.openSearchCreate, data);

/**
 * 删除索引
 */
const openSearchDelete = async id => await apiService.axiosPost(API.openSearchDelete, id);

/**
 * 编辑索引
 */
const openSearchUpdate = async data => await apiService.axiosPost(API.openSearchUpdate, data);

/**
 * 测试连接
 */
const openSearchTest = async data => await apiService.axiosPost(API.openSearchTest, data);

export default {
  graphDBGetById,
  graphDBGetList,
  graphDBCreate,
  graphDBDelete,
  graphDBUpdate,
  graphDBTest,
  graphDBGetGraphById,
  openSearchGet,
  openSearchGetById,
  openSearchCreate,
  openSearchDelete,
  openSearchUpdate,
  openSearchTest
};
