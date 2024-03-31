import apiService from '@/utils/axios-http/oldIndex';
import { API } from '@/services/api';

/**
 * 获取函数列表
 * @param data
 * @returns
 */
const functionList = async (data: {
  knw_id: number | string;
  page: number;
  size: number;
  order_field?: string;
  order_type?: string;
  search?: string;
  language?: string;
}) => await apiService.axiosGetData(API.functionList, data);

/**
 * 查询函数的具体信息
 * @param data
 * @returns
 */
const functionInfo = async (data: { function_id: number }) => await apiService.axiosGetData(API.functionInfo, data);

/**
 * 新建函数
 * @param data
 * @returns
 */
const functionCreate = async (data: {
  knw_id: number;
  name: string;
  language: string;
  code: string;
  description: string;
  parameters: Array<any>;
}) => await apiService.axiosPost(API.functionCreate, data);

/**
 * 编辑函数
 * @param data
 * @returns
 */
const functionEdit = async (data: {
  function_id: number | string;
  knw_id: number | string;
  name: string;
  language: string;
  code: string;
  description: string;
  parameters: Array<any>;
}) => await apiService.axiosPost(API.functionEdit, data);

/**
 * 删除函数
 * @param data
 * @returns
 */
const functionDelete = async (data: {}) => await apiService.axiosPost(API.functionDelete, data);

export default {
  functionCreate,
  functionDelete,
  functionEdit,
  functionList,
  functionInfo
};
