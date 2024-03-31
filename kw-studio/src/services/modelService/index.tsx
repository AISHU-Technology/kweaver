import { API } from '../api';
import apiService from '@/utils/axios-http/oldIndex';

/** 获取模型服务列表 */
const getModelServiceList = async (data: {
  name?: string;
  mPodName?: string;
  status?: number;
  page: number;
  size: number;
  orderField: string;
  orderType: string;
}) => await apiService.axiosGetData(API.getModelServiceList, data);

export default { getModelServiceList };
