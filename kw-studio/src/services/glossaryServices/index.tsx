/**
 * 术语库相关接口
 */
import builderService from '@/utils/axios-http/buildAxios';
import { API } from '@/services/api';

export type GlossaryListParamType = {
  knw_id: number;
  page: number;
  size: number;
  rule: string;
  order: string;
  name?: string;
};

/**
 * 获取术语库列表
 */
export const getGlossaryList = (param: GlossaryListParamType) => builderService.axiosGet(API.glossary, param);

/**
 * 删除术语库
 */
export const deleteGlossary = (param: { taxonomy_ids: number[]; knw_id: number }) =>
  builderService.axiosPost(`${API.glossary}/delete`, param);

export type GlossaryParamType = {
  knw_id?: number;
  name: string;
  default_language: string;
  description?: string;
};
/**
 * 创建术语库
 * @param param
 */
export const createGlossary = (param: GlossaryParamType) => builderService.axiosPost(API.glossary, param, {
  timeout: 60000
});

/**
 * 编辑术语库
 * @param id
 * @param param
 */
export const editGlossary = (id: number, param: GlossaryParamType) =>
  builderService.axiosPost(`${API.glossary}/${id}`, param);

/**
 * 获取术语树的根节点
 */
export const getTermRootNode = (id: number) => builderService.axiosGet(`${API.glossary}/${id}/word`, {});

type TermDataParamType = {
  parent?: string;
  name: string;
  language: string;
};

/**
 * 创建术语
 */
export const createTerm = (id: number, para: TermDataParamType) =>
  builderService.axiosPost(`${API.glossary}/${id}/word`, para);

export type EditTermParamType = {
  action: 'add' | 'update' | 'remove';
  language: string;
  label?: {
    name: string;
    description: string;
    synonym: string[];
  };
};
/**
 * 编辑术语
 */
export const editTerm = (id: number, termIds: string, para: EditTermParamType) =>
  builderService.axiosPost(`${API.glossary}/${id}/word/${termIds}/label`, para);

/**
 * 删除术语
 */
export const deleteTerm = (id: number, para: { word_ids: string[]; delete_option: 'delete_one' | 'delete_sub' }) =>
  builderService.axiosPost(`${API.glossary}/${id}/delete_word`, para);

/**
 * 获取指定id术语的子级
 * @param id
 * @param termIds
 */
export const getTermChildByTermIds = (id: number, termIds: string) =>
  builderService.axiosGet(`${API.glossary}/${id}/word/${termIds}/subclass`, {});

/**
 * 获取指定id术语的信息
 * @param id
 * @param termIds
 */
export const getTermDataByTermIds = (id: number, termIds: string) =>
  builderService.axiosGet(`${API.glossary}/${id}/word/${termIds}`, {});

/**
 * 改变词的层级
 * @param id
 * @param termId
 * @param parentKey
 */
export const changeTermLevel = (id: number, termId: string, parentKey: string) =>
  builderService.axiosPost(`${API.glossary}/${id}/word/${termId}/level`, { parent: parentKey });

type SearchTermType = {
  query: string;
  field: 'name_and_synonym' | 'displayed';
  language?: string;
};

/**
 * 搜索词
 */
export const searchTerm = (id: number, param: SearchTermType) =>
  builderService.axiosGet(`${API.glossary}/${id}/search_word`, param);

/**
 * 获取术语的在树节点上的路径
 * @param id
 * @param termId
 */
export const getTermPath = (id: number, termId: string) =>
  builderService.axiosGet(`${API.glossary}/${id}/locate_word`, {
    word_id: termId
  });

/**
 * 获取术语属性列表
 * @param id
 * @param param
 */
export const getTermAttributeList = (id: number, param: { word_id: string; query?: string; language?: string }) =>
  builderService.axiosGet(`${API.glossary}/${id}/relation/ispartof`, param);

/**
 * 删除术语属性
 * @param id
 * @param param
 */
export const deleteTermAttribute = (id: number, param: { start_word_id: string; end_word_id_list: string[] }) =>
  builderService.axiosPost(`${API.glossary}/${id}/relation/delete_ispartof`, param);

/**
 * 添加术语属性
 * @param id
 * @param param
 */
export const addTermAttribute = (id: number, param: { start_word_id: string; end_word_id_list: string[] }) =>
  builderService.axiosPost(`${API.glossary}/${id}/relation/create_ispartof`, param);

/**
 * 获取自定义关系列表
 * @param id
 */
export const getCustomRelationList = (id: number) =>
  builderService.axiosGet(`${API.glossary}/${id}/custom_relation`, {});

/**
 * 编辑自定义关系
 * @param id
 * @param param
 */
export const editCustomRelation = (
  id: number,
  param: {
    change_list: Array<{ action: 'add' | 'remove'; id?: number; name?: string }>;
  }
) => builderService.axiosPost(`${API.glossary}/${id}/custom_relation`, param, {
  timeout: 60000
});

/**
 * 获取术语的自定义关系列表
 * @param id
 */
export const getCustomRelationListByTerm = (
  id: number,
  param: {
    word_id: string;
    query?: string;
    language?: string;
  }
) => builderService.axiosGet(`${API.glossary}/${id}/relation/custom`, param);

/**
 * 删除术语的自定义关系
 * @param id
 * @param param
 */
export const deleteCustomRelationByTerm = (id: number, param: { relation_ids: number[]; word_id: string }) =>
  builderService.axiosPost(`${API.glossary}/${id}/relation/delete_custom`, param);

/** 编辑词的自定义关系 */
export const editCustomRelationByTerm = (
  id: number,
  param: {
    relation_id: number;
    start_word_id: string;
    add_end_word_id_list: string[];
    remove_end_word_id_list: string[];
  }
) => builderService.axiosPost(`${API.glossary}/${id}/relation/edit_custom`, param);
