import apiService from '@/utils/axios-http/engineServer';

import { API } from '@/services/api';

/**
 * 新建搜索配置
 */
const addCustom = async (body: any) => await apiService.axiosPost(API.addCustom, body, { isHideMessage: true });

/**
 * 编辑更新
 */
const updateCustom = async (body: any) => {
  return await apiService.axiosPost(API.updateCustom(body.service_id), body, { isHideMessage: true });
};

/**
 * 初始化
 */
const initialCustom = async (body: any) => {
  return await apiService.axiosPost(API.initialCustom, body);
};

/**
 * 自定义服务列表
 * @param body
 */
const customList = async (body: any) => {
  return await apiService.axiosGet(API.customList, body);
};

/**
 * 获取指定自定义服务
 */
const editCustom = async (body: any) => {
  return await apiService.axiosGet(API.editCustom(body));
};

/**
 * 测试
 */
const testCustom = async (body: any) => {
  return await apiService.axiosPost(API.testCustom(body.service_id, body?.env), body?.testData, {
    isHideMessage: true
  });
};

/**
 * 使用服务
 */
const usedService = async (body: any) => {
  return await apiService.axiosPost(API.usedService(body.service_id), body, { isHideMessage: true });
};

/**
 * 取消发布
 */
const cancelCustomPublish = async (body: any) =>
  await apiService.axiosPost(API.cancelCustomPublish(body.service_id), body);

/**
 * 删除指定服务
 */
const deleteCustomPublish = async (body: any) =>
  await apiService.axiosPost(API.deleteCustomPublish(body.service_id), body);

/**
 * 检查输入的json格式
 */
const checkValidity = async (body: any) => await apiService.axiosPost(API.checkValidity, body);

/**
 * 获取模板
 */
const getTemplate = async () => await apiService.axiosGet(API.getTemplate);

/**
 * 获取初始化状态
 */
const getStatus = async (body: any) => {
  return await apiService.axiosGet(API.getCustomServiceStatus(body.id, body.env));
};

const customService = {
  addCustom,
  updateCustom,
  initialCustom,
  customList,
  editCustom,
  testCustom,
  usedService,
  cancelCustomPublish,
  deleteCustomPublish,
  getTemplate,
  checkValidity,
  getStatus
};

export default customService;
