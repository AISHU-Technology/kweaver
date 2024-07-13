import apiService from '@/utils/axios-http/oldIndex';
import { API } from '@/services/api';

/**
 * @description 获取ldap配置
 */
const getLDAP = async () => await apiService.axiosGet(API.getLDAP);

/**
 * @description 添加或修改ldap配置
 */
const saveLDAP = async (data: any) => await apiService.axiosPost(API.saveLDAP, data);

/**
 * @description ldap连接测试
 */
const accessTest = async (data: any) => await apiService.axiosPost(API.accessTest, data);

/**
 * @description 查询ldap用户
 */
const searchUser = async (filter: any) => await apiService.axiosGetData(API.searchUser, { filter });

/**
 * @description 同步
 */
const synchronization = async (data: any) => await apiService.axiosPost(API.synchronization, data);

export default {
  getLDAP,
  saveLDAP,
  accessTest,
  searchUser,
  synchronization
};
