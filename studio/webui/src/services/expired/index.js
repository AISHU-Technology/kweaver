import apiService from '@/utils/axios-http';
import { API } from '../api';

/**
 *@description 获取密码长度
 *
 */
const pwSizeGet = async () => await apiService.axiosGet(API.pwSizeGet);

/**
 * @description 重置密码
 */
const pwReset = async data => await apiService.axiosPost(API.pwReset, data);

/**
 * @description 忘记密码重置
 */
const pwPut = async data => await apiService.axiosPost(API.pwPut, data);

export default { pwSizeGet, pwReset, pwPut };
