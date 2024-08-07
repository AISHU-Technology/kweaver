import { API } from '../api';
import apiService from '@/utils/axios-http/oldIndex';
import builderService from '@/utils/axios-http/buildAxios';

/**
 * 获取账号列表
 * @param {int} page 请求`页码`
 * @param {int} size 请求`每页条数`
 *  * @param {string} status 请求`状态`
 *  * @param {string} sort 请求`排序`
 *  * @param {string} name 请求`模糊搜索字段`
 */
// eslint-disable-next-line max-params
const taskGet = async (id: number, data: any, loop = false) => {
  if (loop) {
    return await apiService.axiosGetData(`${API.taskGet}/${id}`, data, { headers: { loop: '1' } });
  }
  return await apiService.axiosGetData(`${API.taskGet}/${id}`, data);
};

/**
 * 运行任务
 * @param {*} id
 */
const taskCreate = async (id: number, data: any) => await apiService.axiosPost(`${API.taskCreate}/${id}`, data);

/**
 * 终止任务
 * @param {*data} 内容为graph_id或者task_id，分别表示终止该图谱下所有任务和终止某个任务。传参只能为两者之一，不能两个参数都传。
 */
const taskStop = async (data: any) => await apiService.axiosPost(API.taskStop, data);

/**
 * 删除任务
 * @param {*} id
 */
const taskDelete = async (id: number, body: any) =>
  await apiService.axiosPost(`${API.taskDelete}/${id}`, { task_ids: body });

/**
 * 获取任务进度
 */
const taskGetProgress = async (id: any, loop = false) => {
  if (loop) {
    return await apiService.axiosGet(`${API.taskGetProgress}/${id}`, { headers: { loop: '1' } });
  }
  return await apiService.axiosGet(`${API.taskGetProgress}/${id}`);
};

/**
 * 删除图谱
 */
const graphDelByIds = async (data: any) => await apiService.axiosPost(API.graphDelByIds, data);

const getSubTaskByParentTaskId = (task_id: number, param: any) =>
  builderService.axiosGet(`${API.taskGet}/detail/${task_id}`, param);

export default {
  taskGet,
  taskCreate,
  taskStop,
  taskDelete,
  taskGetProgress,
  graphDelByIds,
  getSubTaskByParentTaskId
};
