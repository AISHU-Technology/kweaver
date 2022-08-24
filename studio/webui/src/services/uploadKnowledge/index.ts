/**
 * 上传知识网络 相关接口
 * @author Jason.ji
 * @date 2022/04/14
 *
 */

import { API } from '@/services/api';
import apiService from '@/utils/axios-http';

// 新建上传服务
const uploadServiceCreate = async (data: { ip: string; token: string }) =>
  await apiService.axiosPost(API.uploadServiceCreate, data);

// 编辑上传服务
const uploadServiceUpdate = async (data: { id: number; ip: string; token: string }) =>
  await apiService.axiosPost(API.uploadServiceUpdate, data);

// 删除上传服务
const uploadServiceDelete = async (data: { ids: number[] }) =>
  await apiService.axiosPost(API.uploadServiceDelete, data);

// 查询上传服务列表
const uploadServiceGet = async (data: any) => await apiService.axiosGetData(API.uploadServiceGet, data);

// 查询上传记录列表
const uploadServiceTaskGet = async ({ knId, ...elseData }: any) => {
  const getData = elseData;
  if (knId) getData.knId = knId;
  return await apiService.axiosGetData(API.uploadServiceTaskGet, getData);
};

// 上传知识网络
const uploadKnowledge = async (data: {
  knId: number;
  ip: string;
  token: string;
  graphIds: any[];
  identifyId: string;
}) => await apiService.axiosPost(API.uploadKnowledge, data);

// 获取过滤的关联知识网络
const taskGetRelationKN = async () => await apiService.axiosGet(API.taskGetRelationKN);

export default {
  uploadServiceCreate,
  uploadServiceUpdate,
  uploadServiceDelete,
  uploadServiceGet,
  uploadServiceTaskGet,
  uploadKnowledge,
  taskGetRelationKN
};
