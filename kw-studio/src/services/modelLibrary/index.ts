import { API } from '../api';
import apiService from '@/utils/axios-http/buildAxios';

/** 模型上传完成协议（覆盖） */
export interface ModelEndUploadType {
  name: string;
  size: number;
  key: string;
  file_suffix: string;
  tags?: string[];
  model_id?: number;
  description?: string;
}
const modelEndUpload = async (data: ModelEndUploadType) => {
  return await apiService.axiosPost(API.modelEndUpload, data);
};
export interface ModelInitMultiUploadType {
  name: string;
  size: number;
  file_suffix: string;
  tags?: string[];
  model_id?: number;
  description?: string;
}
/** 开始上传大模型协议（覆盖） */
const modelInitMultiUpload = async (data: ModelInitMultiUploadType) => {
  return await apiService.axiosPost(API.modelInitMultiUpload, data);
};

export interface ModelUploadPartType {
  key: string;
  parts: number;
  upload_id: string;
  model_id?: number;
}
/** 大模型分块上传协议（覆盖） */
const modelUploadPart = async (data: ModelUploadPartType) => {
  return await apiService.axiosPost(API.modelUploadPart, data);
};

export interface ModelCompletePartType {
  part_infos: { [key: string]: string };
  upload_id: string;
  key: string;
  model_id?: number;
}
/** 大模型分块上传完成协议（覆盖） */
const modelCompletePart = async (data: ModelCompletePartType) => {
  return await apiService.axiosPost(API.modelCompletePart, data);
};
export interface ModelDeleteType {
  model_ids: number[];
}
/** 模型删除协议 */
const modelDelete = async (data: ModelDeleteType) => {
  return await apiService.axiosPost(API.modelDelete, data);
};
export interface ModelHealthUpdateType {
  model_id: string;
  name: string;
  tags: string[];
  description: string;
}
/** 编辑模型仓库 */
const modelUpdate = async (data: ModelHealthUpdateType) => {
  return await apiService.axiosPost(API.modelUpdate, data);
};

export interface ModelGetType {
  page: string;
  size: string;
  rule: string;
  order: string;
  perm: string; // 模型权限
  name_key_word?: string;
  tag_key_word?: string;
}
/** 获取模型仓库列表 */
const modelGet = async (data: ModelGetType) => {
  return await apiService.axiosGet(API.modelGet, data);
};

/** 获取模型的tags */
const modelGetTags = async () => {
  return await apiService.axiosGet(API.modelGetTags, {});
};

export interface ModelOsDownloadType {
  model_id: string;
}
/** 模块下载协议 */
const modelOsDownload = async (data: ModelOsDownloadType) => {
  return await apiService.axiosGet(API.modelOsDownload, data);
};

/** 服务健康检查  */
const modelHealthReady = async () => {
  return await apiService.axiosGet(API.modelHealthReady, {});
};

/** 服务存活检查 */
const modelHealthAlive = async () => {
  return await apiService.axiosGet(API.modelHealthAlive, {});
};

export default {
  modelEndUpload,
  modelInitMultiUpload,
  modelUploadPart,
  modelCompletePart,
  modelDelete,
  modelUpdate,
  modelGet,
  modelGetTags,
  modelOsDownload,
  modelHealthReady,
  modelHealthAlive
};
