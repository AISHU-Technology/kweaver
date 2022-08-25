import apiService from '@/utils/axios-http';
import { API } from '@/services/api';

/**
 * @description 获取身份
 */
const getIdentity = async () => await apiService.axiosGet(API.getIdentity);

/**
 * @description 获取用户的图谱权限列表
 */
const getAllPrivate = async id => await apiService.axiosGetData(API.getAllPrivate, { account_id: id });

/**
 * @description 修改用户权限
 */
const postAccountPrivate = async body => await apiService.axiosPost(API.postAccountPrivate, body);

/**
 * 获取拥有此图谱的用户列表
 */
const getGraphPrivate = async ({ id, value, page, proId, size }) =>
  await apiService.axiosGetData(API.getGraphPrivate, { kg_id: id, property_id: proId, value, page, size });

/**
 * 删除图谱权限用户
 */
const deletePrivate = async body => await apiService.axiosDelete(API.deletePrivate, { data: body });

/**
 * 修改图谱权限用户
 */
const putPrivate = async body => await apiService.axiosPut(API.putPrivate, body);

/**
 * 获取非在此图谱当中的用户(支持模糊搜索，添加成员使用)
 */
const getAccNotGraph = async ({ id, value, size, page }) =>
  await apiService.axiosGetData(API.getAccNotGraph, { kg_id: id, value, page, size });

/**
 * 指定图谱批量添加成员权限
 */
const postAddMember = async data => await apiService.axiosPost(API.postAddMember, data);

/**
 * 查询图谱权限
 * @param {Number} id 图谱id
 * @param {Number} type 类型 { 1: 本体, 2: 数据源, 3: 图谱}
 */
const queryAuth = async (id, type) => await apiService.axiosGetData(API.queryAuth, { kg_id: id, type });

export default {
  getIdentity,
  getAllPrivate,
  postAccountPrivate,
  getGraphPrivate,
  deletePrivate,
  getAccNotGraph,
  putPrivate,
  postAddMember,
  queryAuth
};
