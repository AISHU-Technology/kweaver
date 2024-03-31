import { API } from '../api';
import { OPEN_API } from '@/services/openApi';
import apiService from '@/utils/axios-http/buildAxios';
import openApiService from '@/utils/axios-http/openApiRequest';

// 是否是iframe页面
const isIframe = () => window.location.pathname.includes('iframe');

/** 获取图谱本体信息 */
const graphGetInfoOnto = async (data: any) => {
  if (isIframe()) {
    return await openApiService.axiosGet(OPEN_API.openGraphGetInfoOnto, data);
  }
  return await apiService.axiosGet(API.graphGetInfoOnto, data);
};

/** 获取图谱基本信息 */
const graphGetInfoBasic = async (data: any) => {
  if (isIframe()) {
    return await openApiService.axiosGet(OPEN_API.openGraphGetInfoBasic, data);
  }
  return await apiService.axiosGet(API.graphGetInfoBasic, data);
};

/** 获取图谱的数量信息 */
const graphGetInfoCount = async (data: any) => {
  if (isIframe()) {
    return await openApiService.axiosGet(OPEN_API.openGraphGetInfoCount, data);
  }
  return await apiService.axiosGet(API.graphGetInfoCount, data);
};

/** 获取图谱中的点或边的配置详情 */
const graphGetInfoDetail = async (data: any) => {
  if (isIframe()) {
    return await openApiService.axiosGet(OPEN_API.openGraphGetInfoDetail, data);
  }
  return await apiService.axiosGet(API.graphGetInfoDetail, data);
};

export default {
  graphGetInfoOnto,
  graphGetInfoBasic,
  graphGetInfoCount,
  graphGetInfoDetail
};
