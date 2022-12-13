import React, { useState, useEffect } from 'react';
import { Dropdown, Tree, Menu } from 'antd';
import { DownOutlined, EllipsisOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import _ from 'lodash';
import classNames from 'classnames';
import IconFont from '@/components/IconFont';
import { numToThousand } from '@/utils/handleFunction';
import GraphNode from './GraphNode';
import { TREE_TYPE, parseToTree } from './assistFunction';
import { GraphGroupItem } from '../../types/items';
import './style.less';

export interface GroupTreeProps {
  groupList: GraphGroupItem[];
  selectedData: { group?: GraphGroupItem; data: Record<string, any> }; // 选择的数据
  operateGroup?: GraphGroupItem; // 正在操作的分组
  onSelect: (type: 'group' | 'node' | 'edge', group: GraphGroupItem, data: Record<string, any>) => void; // 选择分组回调
  onAdd?: (group: any) => void;
  onEdit?: (group: any) => void;
  onDelete?: (group: any) => void;
}

const GroupTree = (props: GroupTreeProps) => {
  const { groupList, selectedData, operateGroup, onSelect, onAdd, onEdit, onDelete } = props;
  const [treeData, setTreeData] = useState<any[]>([]); // 树数据
  const [selectedKeys, setSelectKeys] = useState<string[]>([]); // 选择的key
  const [hoverGroup, setHoverGroup] = useState(0); // 悬停操作的分组id

  useEffect(() => {
    const tree = parseToTree(groupList);
    setTreeData(tree);
  }, [groupList]);

  useEffect(() => {
    const { group, data } = selectedData;
    const keys: any[] = operateGroup?.id ? [operateGroup.id] : [];
    if (!data?.uid) return setSelectKeys(keys);

    const type = data.relations ? 'edge' : 'entity';

    if (group?.id) {
      setSelectKeys([...keys, `${type}-${group.id}-${data.uid}`]);
      return;
    }
    const gKeys = groupList.map(g => `${type}-${g.id}-${data.uid}`);
    setSelectKeys([...keys, ...gKeys]);
  }, [selectedData, operateGroup]);

  /**
   * 渲染父节点标题, 为了方便绑定事件, 不单独封装
   * @param data 数据
   */
  const renderNodeTitle = (data: any) => {
    const { name, id, entity_num, edge_num, isUngrouped } = data;
    const count = entity_num + edge_num || 0;
    const isHover = hoverGroup === id;
    return (
      <div className={classNames('group-node-title ad-space-between ad-w-100', { 'hover-node': isHover })} title="">
        <div className="group-info" title={name}>
          <IconFont type="icon-putongwenjianjia" className="ad-mr-1" />
          <span className="group-name ad-ellipsis">{name}</span>
        </div>
        {!!id && (
          <div className="tool-box">
            <span className="ad-c-subtext ad-mr-1">{numToThousand(count)}</span>

            {!isUngrouped && (
              <>
                <Dropdown
                  getPopupContainer={() => document.querySelector('.graph-group-tree')!}
                  destroyPopupOnHide
                  visible={isHover}
                  onVisibleChange={visible => setHoverGroup(visible ? id : 0)}
                  overlay={
                    <Menu
                      style={{ display: isHover ? undefined : 'none' }} // 强制隐藏
                      onClick={({ key, domEvent }) => {
                        domEvent.stopPropagation();
                        key === 'edit' && onEdit?.(data);
                        key === 'delete' && onDelete?.(data);
                      }}
                    >
                      <Menu.Item key={'edit'}>{intl.get('createEntity.updateGroupBtn')}</Menu.Item>
                      <Menu.Item key={'delete'}>{intl.get('createEntity.cancelGroupBtn')}</Menu.Item>
                    </Menu>
                  }
                >
                  <span className="click-mask ad-mr-1">
                    <EllipsisOutlined style={{ transform: 'scale(1.2)' }} />
                  </span>
                </Dropdown>

                <span
                  className="click-mask ad-mr-1"
                  title={intl.get('global.add')}
                  onClick={e => {
                    e.stopPropagation();
                    onAdd?.(data);
                  }}
                >
                  <IconFont type="icon-Add" />
                </span>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  /**
   * 处理选中逻辑
   * @param keys 选中的key
   * @param e { selected: bool, selectedNodes, node, event }
   */
  const handleSelect = (keys: any[], e: any) => {
    const { node } = e;
    if ([TREE_TYPE.entity_class, TREE_TYPE.edge_class].includes(node.type)) return;
    const group = node._root;
    const data = [TREE_TYPE.entity, TREE_TYPE.edge].includes(node.type) ? node._data : group;
    onSelect(node.type, group, data);
  };

  return (
    <Tree
      className="graph-group-tree ad-w-100"
      switcherIcon={<DownOutlined />}
      multiple
      blockNode
      treeData={treeData}
      selectedKeys={selectedKeys}
      onSelect={handleSelect}
      titleRender={item => {
        const { name, type, _data } = item;
        if (type === TREE_TYPE.entity || type === TREE_TYPE.edge) {
          return <GraphNode data={_data} type={type} />;
        }
        return renderNodeTitle(type === TREE_TYPE.group ? _data : { name });
      }}
    />
  );
};

export default GroupTree;
