/**
 * 定时任务
 * @Author Eden
 * @Version 1.0
 * @Date 2021/12/27
 */

import { API } from '../api';
import apiService from '@/utils/axios-http/oldIndex';

/**
 * @description 获取定时任务
 */
const timerGet = async data => await apiService.axiosGetData(API.timerGet, data);

/**
 * @description 获取编辑的定时任务的数据
 */
const timerGetInfo = async data => await apiService.axiosGetData(API.timerGetInfo, data);

/**
 * @description 删除定时任务
 */
const timerDelete = async (graph_id, data) => await apiService.axiosPost(`${API.timerDelete}/${graph_id}`, data);

/**
 * @description 创建定时任务
 */
const timerCreate = async (graph_id, data) => await apiService.axiosPost(`${API.timerCreate}/${graph_id}`, data);

/**
 * @description 编辑定时任务
 */
const timerUpdate = async (graph_id, data) => await apiService.axiosPost(`${API.timerUpdate}/${graph_id}`, data);

/**
 * @description 定时任务开关
 */
const timerSwitch = async (graph_id, data) => await apiService.axiosPost(`${API.timerSwitch}/${graph_id}`, data);

export default {
  timerGet,
  timerGetInfo,
  timerDelete,
  timerCreate,
  timerUpdate,
  timerSwitch
};
