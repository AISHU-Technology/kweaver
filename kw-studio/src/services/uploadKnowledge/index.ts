/**
 * 上传知识网络 相关接口
 * @author Jason.ji
 * @date 2022/04/14
 *
 */

import { API } from '@/services/api';
import apiService from '@/utils/axios-http/oldIndex';

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
  token?: string; // 可不传
  graphIds: any[];
  identifyId: string;
  task_id?: string;
}) => await apiService.axiosPost(API.uploadKnowledge, data);

// 获取过滤的关联知识网络
const taskGetRelationKN = async () => await apiService.axiosGet(API.taskGetRelationKN);

// 继续上传
const uploadContinue = async (data: { id: string }) => await apiService.axiosPost(API.uploadContinue, data);

// 开启或关闭知识图谱是否上传
// const graphToUpload = async (data: { graph_ids: any[]; to_be_uploaded: 0 | 1 }) =>
const graphToUpload = async (data: { graph_ids: any[] }) =>
  await apiService.axiosPost(API.graphToUpload, data);

export default {
  uploadServiceCreate,
  uploadServiceUpdate,
  uploadServiceDelete,
  uploadServiceGet,
  uploadServiceTaskGet,
  uploadKnowledge,
  taskGetRelationKN,
  uploadContinue,
  graphToUpload
};
