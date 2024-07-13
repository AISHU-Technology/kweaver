import { API } from '../api';
import apiService from '@/utils/axios-http/buildAxios';

/** 获取图谱本体信息 */
const graphGetInfoOnto = async (data: any) => {
  return await apiService.axiosGet(API.graphGetInfoOnto, data);
};

/** 获取图谱基本信息 */
const graphGetInfoBasic = async (data: any) => {
  return await apiService.axiosGet(API.graphGetInfoBasic, data);
};

/** 获取图谱的数量信息 */
const graphGetInfoCount = async (data: any) => {
  return await apiService.axiosGet(API.graphGetInfoCount, data);
};

/** 获取图谱中的点或边的配置详情 */
const graphGetInfoDetail = async (data: any) => {
  return await apiService.axiosGet(API.graphGetInfoDetail, data);
};

export default {
  graphGetInfoOnto,
  graphGetInfoBasic,
  graphGetInfoCount,
  graphGetInfoDetail
};
