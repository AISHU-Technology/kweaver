import studioAxios from '@/utils/axios-http/studioAxios';
import { API } from '../api';

/**
 * 获取字典列表入参
 * @param key 模糊查询关键字
 * @param page 查询页数
 * @param size 每页显示数
 */
export type getDictListDataType = {
  key?: string;
  page: number;
  size: number;
};
/**
 * 获取字典列表
 */
const getDictList = async (data: getDictListDataType) => {
  return await studioAxios.axiosGet(API.dictGetList, data);
};

/**
 * 获取字典详情入参
 * @param id 字典id
 */
export type getDictInfoDataType = {
  id: string;
};
/**
 * 获取字典详情
 */
const getDictInfo = async (data: getDictInfoDataType) => {
  return await studioAxios.axiosGet(API.dictGetInfo, data);
};

/**
 * 创建字典入参
 * @param cName 中文名称
 * @param eName 英文名称
 * @param remark 描述
 * @param dictType 字典类型
 */
export type addDictDataType = {
  cName: string;
  eName: string;
  remark?: string;
  dictType: string;
};
/**
 * 创建字典
 * @param addDictDataType 入参
 */
const addDict = async (data: addDictDataType) => {
  return await studioAxios.axiosPost(API.dictAdd, data);
};

/**
 * 修改字典入参
 * @param id 字典id
 * @param cName 中文名称
 * @param eName 英文名称
 * @param remark 描述
 */
export type updateDictDataType = {
  id: string;
  cName: string;
  eName: string;
  remark?: string;
};
/**
 * 修改字典
 * @param updateDictDataType 入参
 */
const updateDict = async (data: updateDictDataType) => {
  return await studioAxios.axiosPost(API.dictUpdate, data);
};

/**
 * 删除字典入参
 * @param ids 字典id数组
 */
export type deleteDictDataType = {
  ids: string[];
};
/**
 * 删除字典
 * @param deleteDictDataType 入参
 */
const deleteDict = async (data: deleteDictDataType) => {
  return await studioAxios.axiosPost(API.dictDelete, data);
};

/**
 * 获取指定字典下的字典值列表入参
 * @param fieldType 字段类型
 * @param fieldValue 字段值
 * @param key 模糊查询关键字
 * @param page 查询页数
 * @param size 每页显示数
 */
export type getDictListItemDataType = {
  fieldType: number;
  fieldValue: string;
  key?: string;
  page: number;
  size: number;
};
/**
 * 获取指定字典下的字典值列表
 */
const getDictListItem = async (data: getDictListItemDataType) => {
  return await studioAxios.axiosGet(API.dictGetItemList, data);
};

/**
 * 获取字典值详情入参
 * @param id 字典值id
 */
export type getDictItemInfoDataType = {
  id: string;
};
/**
 * 获取字典值详情
 */
const getDictItemInfo = async (data: getDictItemInfoDataType) => {
  return await studioAxios.axiosGet(API.dictGetItemInfo, data);
};

/**
 * 创建字典值入参
 * @param cName 中文名称
 * @param eName 英文名称
 * @param remark 描述
 * @param dictId 字典id
 * @param itemValue 数据值
 */
export type addDictItemDataType = {
  cName: string;
  eName: string;
  remark?: string;
  dictId: string;
  itemValue?: string;
};
/**
 * 创建字典值
 * @param addDictItemDataType 入参
 */
const addDictItem = async (data: addDictItemDataType) => {
  return await studioAxios.axiosPost(API.dictAddItem, data);
};

/**
 * 修改字典值入参
 * @param id 字典值id
 * @param cName 中文名称
 * @param eName 英文名称
 * @param remark 描述
 * @param itemValue 数据值
 */
export type updateDictItemDataType = {
  id: string;
  cName: string;
  eName: string;
  remark?: string;
  itemValue?: string;
};
/**
 * 修改字典值
 * @param updateDictItemDataType 入参
 */
const updateDictItem = async (data: updateDictItemDataType) => {
  return await studioAxios.axiosPost(API.dictUpdateItem, data);
};

/**
 * 删除字典值入参
 * @param ids 字典值id数组
 */
export type deleteDictItemDataType = {
  ids: string[];
};
/**
 * 删除字典值
 * @param deleteDictItemDataType 入参
 */
const deleteDictItem = async (data: deleteDictItemDataType) => {
  return await studioAxios.axiosPost(API.dictDeleteItem, data);
};

/**
 * List菜单入参
 * @param isTree 是否树型数据（1：树形结构、2：平铺）
 * @param menuType 菜单类型（1:菜单、2：按钮、3：全部）
 * @param key 关键字
 * @param page 页数
 * @param size 每页显示数
 * @param pid （1：知识网络，293：模型工厂）
 */
export type listMenuDataType = {
  isTree: number;
  menuType: number;
  key?: string;
  page: number;
  size: number;
  pid?: string;
};
/**
 * List菜单
 * @param listMenuDataType 入参
 */
const newMenuList = async (data: listMenuDataType) => {
  return await studioAxios.axiosGet(API.newMenuList, data);
};

/**
 * 获取菜单详情入参
 * @param id 菜单id
 */
export type listMenuInfoDataType = {
  id: string;
};
/**
 * 获取菜单详情
 * @param listMenuInfoDataType 入参
 */
const newMenuInfo = async (data: listMenuInfoDataType) => {
  return await studioAxios.axiosGet(API.newMenuInfo, data);
};

/**
 * 添加菜单入参
 * @param cName 中文名
 * @param eName 英文名
 * @param code 编码
 * @param icon 图标
 * @param selectedIcon 选中图标
 * @param path 路径
 * @param component 组件
 * @param menuType 菜单类型
 * @param pid
 * @param sortOrder
 * @param visible
 */
export type addMenuDataType = {
  cName: string;
  eName: string;
  code: string;
  icon?: string;
  selectedIcon?: string;
  path?: string;
  component?: string;
  menuType: number;
  pid?: string;
  sortOrder?: number;
  visible?: number;
};
/**
 * 添加菜单入参
 * @param addMenuDataType 入参
 */
const newMenuAdd = async (data: addMenuDataType) => {
  return await studioAxios.axiosPost(API.newMenuAdd, data);
};

/**
 * 更新菜单入参
 * @param id
 * @param cName 中文名
 * @param eName 英文名
 * @param icon 图标
 * @param selectedIcon 选中图标
 * @param path 路径
 * @param component 组件
 * @param menuType 菜单类型
 * @param pid
 * @param sortOrder
 * @param visible
 */
export type updateMenuDataType = {
  id: string;
  cName: string;
  eName: string;
  icon?: string;
  selectedIcon?: string;
  path?: string;
  component?: string;
  menuType: number;
  pid?: string;
  sortOrder?: number;
  visible?: number;
};
/**
 * 更新菜单入参
 * @param updateMenuDataType 入参
 */
const newMenuUpdate = async (data: updateMenuDataType) => {
  return await studioAxios.axiosPost(API.newMenuUpdate, data);
};

/**
 * 删除菜单详情入参
 * @param ids 菜单ids
 */
export type delMenuDataType = {
  ids: string[];
};
/**
 * 删除菜单
 * @param delMenuDataType 入参
 */
const newMenuDelete = async (data: delMenuDataType) => {
  return await studioAxios.axiosPost(API.newMenuDel, data);
};

const servicesEventStats = {
  getDictList,
  getDictInfo,
  addDict,
  updateDict,
  deleteDict,
  getDictListItem,
  getDictItemInfo,
  addDictItem,
  updateDictItem,
  deleteDictItem,
  newMenuList,
  newMenuInfo,
  newMenuAdd,
  newMenuUpdate,
  newMenuDelete
};

export default servicesEventStats;
