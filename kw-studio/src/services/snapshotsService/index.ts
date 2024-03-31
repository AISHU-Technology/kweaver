import { API } from '@/services/api';
import apiService from '@/utils/axios-http/buildAxios';

import { OPEN_API } from '@/services/openApi';
import openApiService from '@/utils/axios-http/openApiRequest';

// 是否是iframe页面
const isIframe = () => window.location.pathname.includes('iframe');
/**
 * 通过 Id 获取指定快照的信息
 * @param {number} s_id - 服务id
 * @param {number} kg_id - 图谱id
 */
const snapshotsGetById = async (s_id: number, kg_id: number) => {
  if (isIframe()) {
    return await openApiService.axiosGet(OPEN_API.openSnapshotsGetById(s_id), { kg_id });
  }
  return await apiService.axiosGet(API.snapshotsGetById(s_id), { kg_id });
};

// 获取快照列表
export type OpenGetSnapshotsListType = {
  kg_id: number; // 图谱id
  service_id: string; // 服务id
  page?: number; // 页数，默认1
  size?: number; // 每页数量，默认20
  query?: string; // 搜索关键字,根据快照名模糊匹配
  appid?: boolean; // 是否走open 不传默认不是
};
const snapshotsGetList = async (data: OpenGetSnapshotsListType) => {
  if (isIframe()) {
    return await openApiService.axiosGet(OPEN_API.openSnapshotsGetList, data);
  }
  return await apiService.axiosGet(API.snapshotsGetList, data);
};

// 新增快照
export type OpenPostSnapshotsCreateType = {
  kg_id: number; // 图谱id
  service_id: string; // 服务id
  snapshot_name: string; // 快照名  同服务下不可重名，长度50，不可包含特殊字符
  snapshot_body: string; // 快照内容，长度上限2^32 字符
  snapshot_info?: number; // 快照描述长度150
};
const snapshotsPostCreate = async (data: OpenPostSnapshotsCreateType) => {
  if (isIframe()) {
    return await openApiService.axiosPost(OPEN_API.openSnapshotsPostCreate, data);
  }
  return await apiService.axiosPost(API.snapshotsPostCreate, data);
};

// 编辑快照, 快照内容不能改
export type OpenPostSnapshotsUpdateType = {
  kg_id: number; // 图谱id
  snapshot_name: string; // 快照名  同服务下不可重名，长度50，不可包含特殊字符
  snapshot_info?: string; // 快照描述长度150
};
const snapshotsPostUpdate = async (s_id: number, data: OpenPostSnapshotsUpdateType) => {
  if (isIframe()) {
    return await openApiService.axiosPost(OPEN_API.openSnapshotsPostUpdate(s_id), data);
  }
  return await apiService.axiosPost(API.snapshotsPostUpdate(s_id), data);
};

// 删除快照
const snapshotsPostDelete = async (s_id: number, data: any) => {
  if (isIframe()) {
    return await openApiService.axiosPost(OPEN_API.openSnapshotsPostDelete(s_id), data);
  }
  return await apiService.axiosPost(API.snapshotsPostDelete(s_id), data);
};

const snapshotsService = {
  snapshotsGetById,
  snapshotsGetList,
  snapshotsPostCreate,
  snapshotsPostUpdate,
  snapshotsPostDelete
};

export default snapshotsService;
