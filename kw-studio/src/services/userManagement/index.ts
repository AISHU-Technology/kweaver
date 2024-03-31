/**
 * 本体库管理请求
 * @Author liang.zhiqiang@eisoo.com
 * @Version 1.0
 * @Date 2020/8/10
 */
import { API } from '@/services/api';
import apiService from '@/utils/axios-http/oldIndex';

/**
 * 获取账号列表
 * @param page 请求`页码`
 * @param size 请求`每页条数`
 * @param status 请求`状态`
 * @param sort 请求`排序`
 * @param name 请求`模糊搜索字段`
 */
type AccountsFunc = (data: {
  page?: number;
  size?: number;
  status?: number;
  sort?: string;
  name?: string;
  type?: number;
  id?: any;
  todesc?: number;
  desc?: any;
}) => Promise<any>;

const registrationPost: AccountsFunc = async data => await apiService.axiosPost(API.registrationPost, data);

/**
 * 验证激活状态激活
 */
const registrationGet = async (id: number) => await apiService.axiosGetData(API.registrationGet, { Uuid: id });

/**
 * (新)查询用户列表接口
 * @param page 分页
 * @param size 分页数量
 * @param orderField 排序字段
 * @param orderType 升降序
 * @param name 用户名名模糊查询
 * @param status	账号状态，0-全部，1-可用，2-不可用，3-未激活
 * @param roleId 角色列表，为空表示全部
 * @param isExcludeRole 查询时是否排除roleId的用户，0-不排除 1-排除
 */
export type UserListGetType = {
  page: number;
  size: number;
  name?: string;
  roleId?: number;
  excludeUsers?: string;
};
const userListGet = async (data: UserListGetType, headers: { isExcludeRole: number }) =>
  await apiService.axiosGetData(API.userListGet, data, { headers });

export default {
  registrationPost,
  registrationGet,
  userListGet
};
