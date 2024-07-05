import { API } from '@/services/api';
import apiService from '@/utils/axios-http/oldIndex';

const uploadServiceCreate = async (data: { ip: string; token: string }) =>
  await apiService.axiosPost(API.uploadServiceCreate, data);

const uploadServiceUpdate = async (data: { id: number; ip: string; token: string }) =>
  await apiService.axiosPost(API.uploadServiceUpdate, data);

const uploadServiceDelete = async (data: { ids: number[] }) =>
  await apiService.axiosPost(API.uploadServiceDelete, data);

const uploadServiceGet = async (data: any) => await apiService.axiosGetData(API.uploadServiceGet, data);

const uploadServiceTaskGet = async ({ knId, ...elseData }: any) => {
  const getData = elseData;
  if (knId) getData.knId = knId;
  return await apiService.axiosGetData(API.uploadServiceTaskGet, getData);
};

const uploadKnowledge = async (data: {
  knId: number;
  ip: string;
  token?: string;
  graphIds: any[];
  identifyId: string;
  task_id?: string;
}) => await apiService.axiosPost(API.uploadKnowledge, data);

const taskGetRelationKN = async () => await apiService.axiosGet(API.taskGetRelationKN);

const uploadContinue = async (data: { id: string }) => await apiService.axiosPost(API.uploadContinue, data);

const graphToUpload = async (data: { graph_ids: any[] }) => await apiService.axiosPost(API.graphToUpload, data);

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
