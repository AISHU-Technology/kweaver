import _ from 'lodash';
import intl from 'react-intl-universal';
import { GraphGroupItem } from '../../types/items';

export enum TREE_TYPE {
  entity_class,
  edge_class,
  group = 'group',
  entity = 'entity',
  edge = 'edge'
}

/**
 * 转换树结构
 * @param data 分组数据
 */
export const parseToTree = (data: GraphGroupItem[]) => {
  return _.map(data, item => {
    const { id, name, isUngrouped, entity = [], edge = [] } = item;
    const _root = { ...item };
    return {
      id,
      key: id,
      type: TREE_TYPE.group,
      isLeaf: false, // 强制指定为父节点
      name,
      isUngrouped,
      _data: _root,
      _root,
      children: [
        entity.length && {
          id: `entity-class-${id}`,
          key: `entity-class-${id}`,
          type: TREE_TYPE.entity_class,
          name: intl.get('createEntity.ec'),
          _group: id,
          _data: {
            id: `entity-class-${id}`,
            key: `entity-class-${id}`,
            type: TREE_TYPE.entity_class
          },
          _root,
          children: entity.map((node: any) => {
            return {
              id: node.uid,
              key: `entity-${id}-${node.uid}`,
              type: TREE_TYPE.entity,
              _group: id,
              _data: { ...node, key: `entity-${id}-${node.uid}` },
              _root
            };
          })
        },
        edge.length && {
          id: `edge-class-${id}`,
          key: `edge-class-${id}`,
          type: TREE_TYPE.edge_class,
          name: intl.get('createEntity.rc'),
          _group: id,
          _data: {
            id: `edge-class-${id}`,
            key: `edge-class-${id}`,
            type: TREE_TYPE.edge_class
          },
          _root,
          children: edge.map((e: any) => {
            return {
              id: e.uid,
              key: `edge-${id}-${e.uid}`,
              type: TREE_TYPE.edge,
              _group: id,
              _data: { ...e, key: `edge-${id}-${e.uid}` },
              _root
            };
          })
        }
      ].filter(Boolean)
    };
  });
};
