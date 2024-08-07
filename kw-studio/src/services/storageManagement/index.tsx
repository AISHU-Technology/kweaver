import { API } from '../api';
import apiService from '@/utils/axios-http/oldIndex';

/**
 * @description 获取单条数据配置源
 */
const graphDBGetById = async (id: number) => await apiService.axiosGetData(API.graphDBGetById, { id });

/**
 * @description 创建存储
 */
const graphDBCreate = async (data: any) => await apiService.axiosPost(API.graphDBCreate, data);

/**
 * @description 删除存储
 */
const graphDBDelete = async (id: number) => await apiService.axiosPost(API.graphDBDelete, id);

/**
 * @description 编辑存储
 */
const graphDBUpdate = async (data: any) => await apiService.axiosPost(API.graphDBUpdate, data);

/**
 * @description 测试连接
 */
const graphDBTest = async (data: any) => await apiService.axiosPost(API.graphDBTest, data);

/**
 * @description 根据ID获取当前存储的图谱
 */
const graphDBGetGraphById = async (data: any) => await apiService.axiosGetData(API.graphDBGetGraphById, data);

/**
 * @description 获取索引列表
 */
const openSearchGet = async (data: any) => await apiService.axiosGetData(API.openSearchGet, data);

/**
 * 根据id获取单条索引
 */
const openSearchGetById = async (id: number) => await apiService.axiosGetData(API.openSearchGetById, { id });

/**
 * 新建索引
 */
const openSearchCreate = async (data: any) => await apiService.axiosPost(API.openSearchCreate, data);

/**
 * 删除索引
 */
const openSearchDelete = async (id: number) => await apiService.axiosPost(API.openSearchDelete, id);

/**
 * 编辑索引
 */
const openSearchUpdate = async (data: any) => await apiService.axiosPost(API.openSearchUpdate, data);

/**
 * 测试连接
 */
const openSearchTest = async (data: any) => await apiService.axiosPost(API.openSearchTest, data);

export default {
  graphDBGetById,
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
