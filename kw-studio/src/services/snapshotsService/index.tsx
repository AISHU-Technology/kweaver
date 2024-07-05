import { API } from '@/services/api';
import apiService from '@/utils/axios-http/buildAxios';

/**
 * 通过 Id 获取指定快照的信息
 * @param {number} s_id - 服务id
 * @param {number} kg_id - 图谱id
 */
const snapshotsGetById = async (s_id: number, kg_id: number) => {
  return await apiService.axiosGet(API.snapshotsGetById(s_id), { kg_id });
};

export type OpenGetSnapshotsListType = {
  kg_id: number;
  service_id: string;
  page?: number;
  size?: number;
  query?: string;
  appid?: boolean;
};
const snapshotsGetList = async (data: OpenGetSnapshotsListType) => {
  return await apiService.axiosGet(API.snapshotsGetList, data);
};

export type OpenPostSnapshotsCreateType = {
  kg_id: number;
  service_id: string;
  snapshot_name: string;
  snapshot_body: string;
  snapshot_info?: number;
};
const snapshotsPostCreate = async (data: OpenPostSnapshotsCreateType) => {
  return await apiService.axiosPost(API.snapshotsPostCreate, data);
};

export type OpenPostSnapshotsUpdateType = {
  kg_id: number;
  snapshot_name: string;
  snapshot_info?: string;
};
const snapshotsPostUpdate = async (s_id: number, data: OpenPostSnapshotsUpdateType) => {
  return await apiService.axiosPost(API.snapshotsPostUpdate(s_id), data);
};

const snapshotsPostDelete = async (s_id: number, data: any) => {
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
