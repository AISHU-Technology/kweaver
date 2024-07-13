import React, { useState } from 'react';
import { Dropdown, Menu } from 'antd';
import { EllipsisOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import _ from 'lodash';
import classNames from 'classnames';
import IconFont from '@/components/IconFont';
import { numToThousand } from '@/utils/handleFunction';
import { GraphGroupItem } from '../../types/items';
import './style.less';

export interface GroupListProps {
  groupList: GraphGroupItem[];
  operateGroup?: GraphGroupItem; // 正在操作的分组
  onSelect: (group: GraphGroupItem) => void; // 选择分组回调
  onEdit?: (group: any) => void;
  onRename?: (group: any) => void;
  onDelete?: (group: any) => void;
}

const GroupList = (props: GroupListProps) => {
  const { groupList, operateGroup, onSelect, onEdit, onRename, onDelete } = props;
  const [hoverGroup, setHoverGroup] = useState(0); // 悬停操作的分组id

  return (
    <div className="flow-3-group-menu-list">
      {_.map(groupList, item => {
        const { name, id, entity_num, edge_num, isUngrouped } = item;
        const count = entity_num + edge_num || 0;
        const isHover = hoverGroup === id;

        return (
          <div
            key={id}
            className={classNames('group-items kw-space-between kw-w-100 kw-pointer', {
              checked: operateGroup?.id === id,
              'hover-bg': isHover
            })}
            onClick={() => onSelect(item)}
          >
            <div className="group-info" title={name}>
              <IconFont type="icon-putongwenjianjia" className="kw-mr-2" />
              <span className="group-name kw-ellipsis">{name}</span>
            </div>
            {!!id && (
              <div className="tool-box">
                <span className="kw-c-subtext kw-mr-2">{numToThousand(count)}</span>

                {!isUngrouped && (
                  <>
                    <Dropdown
                      destroyPopupOnHide
                      open={isHover}
                      onOpenChange={visible => setHoverGroup(visible ? id : 0)}
                      overlay={
                        <Menu
                          // style={{ display: isHover ? undefined : 'none' }} // 强制隐藏
                          onClick={({ key, domEvent }) => {
                            domEvent.stopPropagation();
                            key === 'edit' && onRename?.(item);
                            key === 'delete' && onDelete?.(item);
                          }}
                        >
                          <Menu.Item key={'edit'}>{intl.get('createEntity.updateGroupBtn')}</Menu.Item>
                          <Menu.Item key={'delete'}>{intl.get('createEntity.cancelGroupBtn')}</Menu.Item>
                        </Menu>
                      }
                    >
                      <span className="click-mask kw-mr-2" onClick={e => e.stopPropagation()}>
                        <EllipsisOutlined style={{ transform: 'scale(1.2)' }} />
                      </span>
                    </Dropdown>

                    <span
                      className="click-mask kw-mr-1"
                      title={intl.get('global.edit')}
                      onClick={e => {
                        e.stopPropagation();
                        onEdit?.(item);
                      }}
                    >
                      <IconFont type="icon-edit" />
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default GroupList;
