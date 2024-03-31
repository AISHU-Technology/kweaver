import { API } from '../api';
import rbacService from '@/utils/axios-http/studioAxios';

/**
 * 获取机器码
 */
const getDeviceCode = async () => {
  return await rbacService.axiosGet(API.getDeviceCode);
};

/**
 * 添加许可证
 * @param data // 许可证列表
 */
const licenseAdd = async (data: any) => {
  return await rbacService.axiosPost(API.licenseAdd, data, { isHideMessage: true });
};

/**
 * 删除许可证
 * @param data // 许可证id
 */

const deleteRemove = async (data: any) => {
  return await rbacService.axiosPost(API.deleteRemove, data, { isHideMessage: true });
};

/**
 * 激活许可证
 */
export type ActivateAndCapacityType = {
  id: number; // 许可证id
  deviceCode: string; // 机器码
  activationCode: string; // 激活码
};
const licenseActivate = async (data: ActivateAndCapacityType) => {
  return await rbacService.axiosPost(API.licenseActivate, data, { isHideMessage: true });
};

/**
 * 获取知识量
 */
const graphCountAll = async () => {
  return await rbacService.axiosGet(API.graphCountAll);
};

/**
 * 服务标识
 */
export enum SERVICE_LICENSE_TYPE {
  KNOWLEDGE_NETWORK_STUDIO = '1',
  COGNITIVE_APPLICATION_STUDIO = '2',
  MODEL_FACTORY = '3',
  APP_FACTORY = '4'
}
/**
 * 查询服务激活状态
 */
const getServiceLicenseStatus = async (type: SERVICE_LICENSE_TYPE) => {
  return await rbacService.axiosGet(API.getServiceLicenseStatus, { type });
};

const serviceLicense = {
  getDeviceCode,
  licenseAdd,
  deleteRemove,
  licenseActivate,
  graphCountAll,
  getServiceLicenseStatus
};

export default serviceLicense;
