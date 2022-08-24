/**
 * 登录请求
 * @Author liang.zhiqiang@eisoo.com
 * @Version 1.0
 * @Date 2020/5/7
 */
import apiService from '@/utils/axios-http';
import { API } from '../api';

/**
 * 发送登录信息
 * @param {Object} data 请求`data`
 */
const loginPost = async data => await apiService.axiosPost(API.loginPost, data);

const logoutPost = async () => await apiService.axiosPost(API.logoutPost);

/**
 * @description 登陆查询用户的来源
 */
const userSourceGet = async mail => await apiService.axiosGetData(API.userSourceGet, { mail });

export default { loginPost, logoutPost, userSourceGet };
