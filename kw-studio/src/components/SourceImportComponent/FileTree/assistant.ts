import _ from 'lodash';
import { DS_TYPE } from '@/enums';
import { DsSourceItem } from '../types';

/**
 * 后端数据转化树节点
 * @param file 文件数据
 */
export const createTreeNode = (
  file: Record<string, any>,
  source: DsSourceItem,
  parent?: Record<string, any>,
  disabledNodeKeys: string[] = []
) => {
  const { name, type, docid } = file;
  const { dataType } = source;
  const checkable = (type === 'file' && dataType === DS_TYPE.STRUCTURED) || dataType === DS_TYPE.UNSTRUCTURED;
  const path = parent ? `${parent.path}/${name}` : name;
  const key = JSON.stringify({ docid, name, path, type });

  return {
    id: docid,
    title: name,
    name,
    type,
    path,
    checkable,
    key,
    value: key,
    isLeaf: type === 'file',
    pid: parent?.id,
    disabled: disabledNodeKeys.includes(docid)
  };
};

/**
 * 数据为 kingbasees | sqlserver | postgresql 时转化树节点
 */
export const onCreateTreeNode = (fileKey: any, fileValue: any, index: any) => {
  const handleValue = fileValue.reduce((pre: any, cur: any) => {
    return [
      ...pre,
      {
        id: `${fileKey}/${cur}`,
        key: `${fileKey}/${cur}`,
        value: cur,
        name: cur,
        title: cur,
        checkable: true,
        type: 'file'
      }
    ];
  }, []);
  return {
    id: fileKey,
    title: fileKey,
    name: fileKey,
    type: 'dir',
    checkable: false,
    key: `${fileKey}/${index}`,
    children: handleValue,
    value: fileKey,
    isLeaf: false
  };
};

/**
 * 异步加载时更新树
 * @param origin 原树
 * @param id 更新的节点id
 * @param children 新增的子节点
 */
export const updateTreeData = (origin: any[], id: string, children: any[]): any[] => {
  return _.map(origin, node => {
    if (node.id === id) {
      return { ...node, children };
    }

    if (node.children && node.children.length > 0) {
      return { ...node, children: updateTreeData(node.children, id, children) };
    }

    return node;
  });
};

/**
 * 更新树节点缓存
 */
export const updateTreeCache = (origin: any[], id: string, children: any[]) => {
  _.forEach(origin, node => {
    if (node.id === id) {
      node.children = children;
      return;
    }

    if (node.children) {
      return updateTreeCache(node.children, id, children);
    }
  });
};

/**
 * 获取所有子节点key
 * @param node 树节点
 */
export const getAllChildrenKeys = (node: any) => {
  const keys: any[] = [];
  const loop = (children: any[]) => {
    if (!children) return;
    _.forEach(children, item => {
      item.checkable && keys.push(item.key);
      loop(item.children);
    });
  };
  loop(node.children);
  return keys;
};

/**
 * 获取节点
 * @param id
 * @param treeData
 * @param field 判断的字段
 */
export const getNode = (id: string | string[], treeData: any[], field = 'id') => {
  const nodes: any[] = [];
  const loop = (data: any[]) => {
    _.forEach(data, (item, i) => {
      const isMatch = _.isArray(id) ? _.includes(id, item[field]) : id === item[field];
      if (isMatch) {
        nodes.push(item);
        return;
      }

      if (item.children?.length) {
        loop(item.children);
      }
    });
  };
  loop(treeData);
  return _.isArray(id) ? nodes : nodes[0];
};
