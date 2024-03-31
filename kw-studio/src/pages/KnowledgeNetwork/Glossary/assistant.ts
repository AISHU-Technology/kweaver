import _ from 'lodash';
import { TermTreeNodeType, TermType } from '@/pages/KnowledgeNetwork/Glossary/types';
import type { DataNode } from 'antd/es/tree';
import React from 'react';
import IconFont from '@/components/IconFont';

type AddTreeNodeType = {
  treeDataSource: TermTreeNodeType[];
  treeNode: TermTreeNodeType[];
  parentKey?: string;
  method?: 'unshift' | 'replace'; // treeNode添加到parentKey的方式， replace意思是将treeNode完全替换parentKey的children
};
export const addTreeNode = ({ treeDataSource, treeNode, parentKey, method = 'unshift' }: AddTreeNodeType) => {
  let newTreeDataSource = _.cloneDeep(treeDataSource);
  if (parentKey) {
    const loop = (data: TermTreeNodeType[]) => {
      data.forEach(node => {
        if (node.key === parentKey) {
          node.isLeaf = false;
          if (method === 'unshift') {
            node.children = [...treeNode, ...node.children];
          }
          if (method === 'replace') {
            node.children = [...treeNode];
          }
          if (node.children.length === 0) {
            node.isLeaf = true;
          }
        } else {
          if (node.children && node.children.length > 0) {
            loop(node.children);
          }
        }
      });
    };
    loop(newTreeDataSource);
  } else {
    newTreeDataSource = [...treeNode, ...newTreeDataSource];
  }
  return newTreeDataSource;
};

type DeleteTreeNodeType = {
  treeDataSource: TermTreeNodeType[];
  deleteNodeKey: string;
  delete_option: string; // delete_one  delete_sub
};
export const deleteTreeNode = ({ treeDataSource, deleteNodeKey, delete_option }: DeleteTreeNodeType) => {
  let newTreeDataSource = treeDataSource;
  let deleteExpandedKey;
  let deleteLoadedKey;
  let deleteNodeParentKey;
  const loop = (data: TermTreeNodeType[], parentNode?: TermTreeNodeType) => {
    data.forEach((node, index) => {
      if (deleteNodeKey === node.key) {
        deleteNodeParentKey = node.parentKey;
        if (delete_option === 'delete_sub') {
          data.splice(index, 1);
          if (data.length === 0 && parentNode) {
            // 父级节点的children被删空之后，那么父节点变成叶子节点
            deleteExpandedKey = parentNode.key;
            deleteLoadedKey = parentNode.key;
            parentNode.isLeaf = true;
          }
        }
        if (delete_option === 'delete_one') {
          // 将子节点提至最顶层作为根节点
          const childData = _.cloneDeep(node.children);
          data.splice(index, 1);
          if (childData.length > 0) {
            childData.forEach(item => (item.parentKey = undefined));
            newTreeDataSource = [...newTreeDataSource, ...childData];
          }
          // const childData = _.cloneDeep(node.children);
          // data.splice(index, 1, ...childData);
        }
      } else {
        if (node.children && node.children.length > 0) {
          loop(node.children, node);
        }
      }
    });
  };
  loop(newTreeDataSource);
  return {
    newTreeDataSource,
    deleteExpandedKey,
    deleteLoadedKey,
    deleteNodeParentKey
  };
};

type UpdateTreeDataType = {
  treeDataSource: TermTreeNodeType[];
  treeNode: TermTreeNodeType;
  replaceKey: string;
};
/**
 * 更新树数据源
 */
export const updateTreeData = ({ treeDataSource, treeNode, replaceKey }: UpdateTreeDataType) => {
  const loop = (data: TermTreeNodeType[]) => {
    data.forEach((node, index) => {
      if (node.key === replaceKey) {
        // 替换指定节点的时候，保证被替换的节点，其子节点不会丢失
        const nodeChildren = node.children;
        const targetTreeNode: TermTreeNodeType = { ...treeNode, children: nodeChildren };
        data.splice(index, 1, targetTreeNode);
      } else {
        if (node.children && node.children.length > 0) {
          loop(node.children);
        }
      }
    });
  };
  loop(treeDataSource);
  return treeDataSource;
};

/**
 * 通过后端存储的术语数据格式和选中的语言生成树节点数据
 */
export const generateTreeNodeDataByTerm = (
  termData: TermType[],
  language: string,
  parentKey?: string
): TermTreeNodeType[] => {
  return termData.map((item: TermType) => {
    const title = getTermNameByLanguage(item, language);
    return {
      key: item.id,
      title,
      isInput: false,
      children: [],
      sourceData: {
        ...item
      },
      isLeaf: item.level.child_count === 0,
      parentKey
    };
  });
};

/**
 * 改变树节点的层级
 * @param treeDataSource
 * @param info
 */
export const changeTreeNodeLevel = (treeDataSource: TermTreeNodeType[], info: any) => {
  const data = treeDataSource;
  const dropKey = info.node.key;
  const dragKey = info.dragNode.key;
  const dropPos = info.node.pos.split('-');
  const dropPosition = info.dropPosition - Number(dropPos[dropPos.length - 1]);

  const loop = (data: DataNode[], key: React.Key, callback: (node: DataNode, i: number, data: any) => void) => {
    for (let i = 0; i < data.length; i++) {
      if (data[i].key === key) {
        return callback(data[i], i, data);
      }
      if (data[i].children) {
        loop(data[i].children!, key, callback);
      }
    }
  };

  // Find dragObject
  let dragObj: any;
  loop(data, dragKey, (item, index, arr) => {
    arr.splice(index, 1);
    dragObj = item;
  });

  if (!info.dropToGap) {
    // Drop on the content
    loop(data, dropKey, item => {
      item.children = item.children || [];
      // where to insert 示例添加到头部，可以是随意位置
      item.children.unshift(dragObj);
    });
  } else if (
    ((info.node as any).props.children || []).length > 0 && // Has children
    (info.node as any).props.expanded && // Is expanded
    dropPosition === 1 // On the bottom gap
  ) {
    loop(data, dropKey, item => {
      item.children = item.children || [];
      // where to insert 示例添加到头部，可以是随意位置
      item.children.unshift(dragObj);
    });
  } else {
    let ar: any[] = [];
    let i: number;
    loop(data, dropKey, (_item, index, arr) => {
      ar = arr;
      i = index;
    });
    if (dropPosition === -1) {
      ar.splice(i!, 0, dragObj!);
    } else {
      ar.splice(i! + 1, 0, dragObj!);
    }
  }
  return data;
};

/**
 * 扁平术语树数据源
 * @param treeData
 */
export const flatTermTree = (treeData: TermTreeNodeType[]) => {
  const res: TermTreeNodeType[] = [];
  const loop = (data: TermTreeNodeType[]) => {
    data.forEach(item => {
      res.push({ ...item });
      if (item.children && item.children.length > 0) {
        loop(item.children);
      }
    });
  };
  loop(treeData);

  return res;
};

/**
 * 获取指定语言下的name，如果没有则默认返回第一个翻译
 * @param termData
 * @param language
 */
export const getTermNameByLanguage = (termData: TermType, language: string) => {
  if (termData) {
    const target = termData?.label.find(i => i.language === language);
    if (target) {
      return target.name;
    }
    return termData?.label[0].name;
  }
  return '';
};

/**
 * 获取指定术语的父节点key
 * @param treeData
 * @param termId
 */
export const getTermParentByTermId = (treeData: TermTreeNodeType[], termId: string) => {
  const flatData = flatTermTree(treeData);
  const termData = flatData.find(item => item.key === termId);
  if (termData) {
    return termData.parentKey;
  }
};

/**
 * 获取指定术语key  对应的术语树节点数据
 * @param treeData
 * @param termId
 */
export const getTermTreeNodeByTermId = (treeData: TermTreeNodeType[], termId: string) => {
  const flatData = flatTermTree(treeData);
  const termData = flatData.find(item => item.key === termId);
  if (termData) {
    return termData;
  }
};
