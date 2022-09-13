import { API } from '../api';
import apiService from '@/utils/axios-http/newAxios';

const graphGetInfoOnto = async (data: any) => await apiService.axiosGet(API.graphGetInfoOnto, data);
const graphGetInfoBasic = async (data: any) => await apiService.axiosGet(API.graphGetInfoBasic, data);
const graphGetInfoCount = async (data: any) => await apiService.axiosGet(API.graphGetInfoCount, data);
const graphGetInfoDetail = async (data: any) => await apiService.axiosGet(API.graphGetInfoDetail, data);

export default {
  graphGetInfoOnto,
  graphGetInfoBasic,
  graphGetInfoCount,
  graphGetInfoDetail
};
