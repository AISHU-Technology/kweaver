/**
 * @description 系统配置接口信息
 * @author Eden
 * @date 2021/03/29
 */

import apiService from '@/utils/axios-http/oldIndex';
import { API } from '@/services/api';

/**
 * @description 获取ldap配置
 */
const getLDAP = async () => await apiService.axiosGet(API.getLDAP);

/**
 * @description 添加或修改ldap配置
 */
const saveLDAP = async data => await apiService.axiosPost(API.saveLDAP, data);

/**
 * @description ldap连接测试
 */
const accessTest = async data => await apiService.axiosPost(API.accessTest, data);

/**
 * @description 查询ldap用户
 */
const searchUser = async filter => await apiService.axiosGetData(API.searchUser, { filter });

/**
 * @description 同步
 */
const synchronization = async data => await apiService.axiosPost(API.synchronization, data);

export default {
  getLDAP,
  saveLDAP,
  accessTest,
  searchUser,
  synchronization
};
