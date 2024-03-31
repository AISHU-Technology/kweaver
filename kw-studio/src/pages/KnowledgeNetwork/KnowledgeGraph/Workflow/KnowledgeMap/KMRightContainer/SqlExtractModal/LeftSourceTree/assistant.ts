import _ from 'lodash';
import { DATA_SOURCES } from './enums';

/** 创建根节点 */
export const createRootNode = (node: any) => {
  const { dsname, ds_path, id } = node;

  const children = [
    { title: ds_path, type: 'base', key: _.uniqueId(), isLeaf: false, origin: node },
    { title: '', key: _.uniqueId() }
  ];
  return {
    id,
    title: ds_path,
    type: 'base',
    key: _.uniqueId(),
    isLeaf: false,
    origin: node
  };
  // return {
  //   id,
  //   title: dsname,
  //   type: 'root',
  //   key: _.uniqueId(),
  //   children,
  //   origin: node
  // };
};

/**
 * @param tree 原始树数据
 * @param target 展开的节点
 * @param children 展开节点的子节点
 * @returns
 */
export const updateTreeData = (tree: any, target: any, children: any) => {
  return tree.map((node: any) => {
    if (node.key === target.key) {
      return { ...node, children };
    } else if (node?.children) {
      return { ...node, children: updateTreeData(node?.children, target, children) };
    }
    return node;
  });
};

/**
 *
 * @param str 需要转换的字符串
 * @returns 字段长度用括号括起来
 */
export const addParentheses = (str: string) => {
  if (!str) return '';
  if (/[()]/.test(str)) return str;

  // 匹配字符串中的数字部分
  const numPattern = /(\d+)/g;

  // 使用 replace 方法替换数字部分为带括号的形式
  const convertedString = str.replace(numPattern, '($1)');
  return convertedString;
};

/**
 * 匹配数据源图标
 */
export const getImage = (data: any) => {
  const { data_source, connect_type, dataType } = data;

  if (connect_type === 'odbc') return DATA_SOURCES[`${data_source}-${connect_type}`];

  return DATA_SOURCES[data_source] || DATA_SOURCES[`${data_source}-${dataType}`];
};
