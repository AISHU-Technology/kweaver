/**
 * 任务管理请求
 * @Author liang.zhiqiang@eisoo.com
 * @Version 1.0
 * @Date 2020/8/10
 */
import { API } from '../api';
import apiService from '@/utils/axios-http';

/**
 * 获取账号列表
 * @param {int} page 请求`页码`
 * @param {int} size 请求`每页条数`
 *  * @param {string} status 请求`状态`
 *  * @param {string} sort 请求`排序`
 *  * @param {string} name 请求`模糊搜索字段`
 */
// eslint-disable-next-line max-params
const taskGet = async (id, data, loop = false) => {
  if (loop) {
    return await apiService.axiosGetData(`${API.taskGet}/${id}`, data, { headers: { loop: '1' } });
  }
  return await apiService.axiosGetData(`${API.taskGet}/${id}`, data);
};

/**
 * 运行任务
 * @param {*} id
 */
const taskCreate = async (id, data) => await apiService.axiosPost(`${API.taskCreate}/${id}`, data);

/**
 * 终止任务
 * @param {*} id
 */
const taskStop = async id => await apiService.axiosPost(`${API.taskStop}/${id}`);

/**
 * 删除任务
 * @param {*} id
 */
const taskDelete = async (id, body) =>
  await apiService.axiosDelete(`${API.taskDelete}/${id}`, { data: { task_ids: body } });

/**
 * 获取任务进度
 */
const taskGetProgress = async (id, loop = false) => {
  if (loop) {
    return await apiService.axiosGet(`${API.taskGetProgress}/${id}`, { headers: { loop: '1' } });
  }
  return await apiService.axiosGet(`${API.taskGetProgress}/${id}`);
};

/**
 * 获取详情
 */
const taskGetDetail = async id => await apiService.axiosGet(`${API.taskGetDetail}/${id}`);

/**
 * 删除图谱
 */
const graphDelByIds = async data => await apiService.axiosPost(API.graphDelByIds, data);

/**
 * 获取图谱知识量统计
 */
const graphGetCount = async graph_id => await apiService.axiosGet(`${API.graphGetCount}/${graph_id}`);

export default {
  taskGet,
  taskCreate,
  taskStop,
  taskDelete,
  taskGetProgress,
  taskGetDetail,
  graphDelByIds,
  graphGetCount
};
