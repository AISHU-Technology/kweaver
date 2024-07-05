import { localStore } from '@/utils/handleFunction';
import studioAxios from '@/utils/axios-http/studioAxios';
import builderService from '@/utils/axios-http/buildAxios';

import { API } from '../api';

/**
 * 查询授权
 * @param resource 资源标识，可以是一个url或其它
 * @param action 动作，GET、POST或其它
 */
const rbacAuth = async (data: { resource: string; action: string }) => {
  return await studioAxios.axiosPost(API.rbacAuth, data);
};

/** 查询数据权限列表
 * @param page 第几页，page>0
 * @param size 当前页显示数量，size>=-1，size=-1查询所有
 * @param name 用户名，模糊查询
 * @param dataType 数据类型：kn-知识网络 kg-知识图谱 lexicon-词库 ds-数据源
 * @param dataId 数据ID
 * @param subDataType 目前用于区分领域认知服务类型
 */
export type DataPermissionGetList = {
  page: number;
  size: number;
  name?: string;
  dataType: string;
  dataId: string;
  subDataType?: string;
};
const dataPermissionGetList = async (data: DataPermissionGetList) => {
  return await studioAxios.axiosGet(API.dataPermissionGetList, data);
};

/**
 * 分配数据权限
 * @param userId 用户ID
 * @param dataId 数据ID
 * @param dataType 数据类型，kn-知识网络 kg-知识图谱 lexicon-词库 ds-数据源
 * @param codes 权限编码列表
 * @param subDataType 目前用于区分领域认知服务类型
 */
export type DataPermissionAssignType = {
  userId: number;
  dataId: string;
  dataType: string;
  codes: any[];
  subDataType?: string;
}[];
const dataPermissionAssign = async (data: DataPermissionAssignType) => {
  return await studioAxios.axiosPost(API.dataPermissionAssign, data);
};

const dataPermissionAssignBuilder = (data: DataPermissionAssignType) =>
  builderService.axiosPost(API.dataPermissionAssignBuilder, data);

const dataUserList = async (data: any) => {
  return await studioAxios.axiosGet(API.dataUserList, data);
};
const rbacUserGetList = async (data: any) => {
  return await studioAxios.axiosGet(API.userGetList, data);
};

/**
 * 获取指定资源信息入参
 * @param permissionId 资源id
 */
export type getSourceInfoDataType = {
  permissionId: string;
};
/**
 * 获取指定资源信息
 * @param getSourceInfoDataType 入参
 */
const getSourceInfo = async (data: getSourceInfoDataType) => {
  return await studioAxios.axiosGet(API.getSourceInfo, data);
};

/**
 * 创建资源入参
 * @param cName 资源名称中文
 * @param eName 资源名称英文
 * @param code 资源编码
 * @param parentId 父级资源id，不传则为0，代表根资源
 * @param resourceType 1-菜单  2-按钮  3-接口
 * @param content 路由，接口和菜单为必传，按钮非必传
 * @param action 请求方式（POST\GET\PUT\DELETE等），接口为必传，其他资源非必传
 * @param status 1-可用 2-不可用 //菜单 按钮使用 默认可用
 * @param isAuth 1-鉴权 2-不鉴权 //接口使用 默认不鉴权
 * @param dataPermissions 数据权限，多个用,隔开
 * @param sortOrder 排序序列，默认为0
 * @param icon 常规图标
 * @param selectedIcon 选中图标
 * @param domainType 领域类型，1-系统类 2-业务类   菜单和按钮必传，接口非必传
 */
export type addSourceDataType = {
  cName: string;
  eName: string;
  code: string;
  parentId?: string;
  resourceType: number;
  content?: string;
  action?: string;
  status?: number;
  isAuth?: number;
  dataPermissions?: string;
  sortOrder?: number;
  icon?: string;
  selectedIcon?: string;
  domainType?: number;
};
/**
 * 创建资源
 * @param addSourceDataType 入参
 */
const addSource = async (data: addSourceDataType) => {
  return await studioAxios.axiosPost(API.addSource, data);
};

/**
 * 修改资源入参
 * @param permissionId 资源id
 * @param cName 资源名称中文
 * @param eName 资源名称英文
 * @param parentId 父级资源id，不传则为0，代表根资源
 * @param resourceType 1-菜单  2-按钮  3-接口
 * @param content 路由，接口和菜单为必传，按钮非必传
 * @param action 请求方式（POST\GET\PUT\DELETE等），接口为必传，其他资源非必传
 * @param status 1-可用 2-不可用 //菜单 按钮使用 默认可用
 * @param isAuth 1-鉴权 2-不鉴权 //接口使用 默认不鉴权
 * @param dataPermissions 数据权限，多个用,隔开
 * @param sortOrder 排序序列，默认为0
 * @param icon 常规图标
 * @param selectedIcon 选中图标
 * @param domainType 领域类型，1-系统类 2-业务类   菜单和按钮必传，接口非必传
 */
export type updateSourceDataType = {
  permissionId: string;
  cName: string;
  eName: string;
  parentId?: string;
  resourceType: number;
  content?: string;
  action?: string;
  status?: number;
  isAuth?: number;
  dataPermissions?: string;
  sortOrder?: number;
  icon?: string;
  selectedIcon?: string;
  domainType?: number;
};
/**
 * 修改资源
 * @param updateSourceDataType 入参
 */
const updateSource = async (data: updateSourceDataType) => {
  return await studioAxios.axiosPost(API.updateSource, data);
};

/**
 * 删除资源
 * @param userId 用户id
 * @param permissionId 资源id
 */
export type deleteSourceDataType = {
  permissionId: string;
};
/**
 * 删除指定资源信息
 * @param deleteSourceDataType 入参
 */
const deleteSource = async (data: deleteSourceDataType) => {
  const userInfo = localStore.get('userInfo');
  return await studioAxios.axiosPost(API.deleteSource, { ...data, userId: userInfo?.id });
};

const servicesPermission = {
  rbacAuth,
  dataPermissionGetList,
  dataPermissionAssign,
  dataPermissionAssignBuilder,
  dataUserList,
  rbacUserGetList,
  addSource,
  updateSource,
  deleteSource,
  getSourceInfo
};

export default servicesPermission;
