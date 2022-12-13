import React, { useState } from 'react';
import { message } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import _ from 'lodash';
import classNames from 'classnames';
import servicesSubGraph from '@/services/subGraph';
import IconFont from '@/components/IconFont';
import { tipModalFunc } from '@/components/TipModal';
import GroupTree from './GroupTree';
import { GraphGroupItem } from '../types/items';
import './style.less';

export interface GroupMenusProps {
  graphId: number;
  groupList: GraphGroupItem[]; // 分组数据
  selectedData: { group?: GraphGroupItem; data: Record<string, any> }; // 选择的数据
  operateGroup?: GraphGroupItem; // 正在操作的分组
  onSelect: (type: 'group' | 'node' | 'edge', group: GraphGroupItem, data: Record<string, any>) => void; // 选择分组回调
  onAdd?: (group: GraphGroupItem) => void; // 添加数据回调
  onDelete?: () => void; // 删除分组回调
  onCreate?: () => void; // 新建分组
  onEdit?: (group: GraphGroupItem) => void; // 编辑分组
}

const GroupMenus = (props: GroupMenusProps) => {
  const { graphId, groupList, selectedData, operateGroup, onSelect, onAdd, onDelete, onCreate, onEdit } = props;
  const [isClose, setIsClose] = useState(false); // 是否展开分组菜单

  /**
   * 删除分组
   */
  const onTriggerDelete = async (group?: GraphGroupItem) => {
    if (groupList.length < 2) return;
    const isAll = !group;
    const isOk = await tipModalFunc({
      title: isAll ? intl.get('createEntity.cancelAllGroupTip') : intl.get('createEntity.cancelGroupTip'),
      content: intl.get('createEntity.cancelGroupContent')
    });
    if (!isOk) return;
    const ids = isAll
      ? groupList.reduce((arr, g) => (g.isUngrouped ? arr : [...arr, g.id]), [] as number[])
      : [group.id];
    try {
      const { res, Description } =
        (await servicesSubGraph.subgraphDelete({ graph_id: graphId, subgraph_ids: ids })) || {};
      res && message.success(intl.get('createEntity.groupCanceled'));
      Description && message.error(Description);
      onDelete?.();
    } catch {
      // none
    }
  };

  return (
    <div className={classNames('graph-group-menus-root', { 'menus-close': isClose })}>
      <div className="header ad-space-between">
        <span className="ad-c-header">{intl.get('createEntity.group')}</span>
        <div>
          <span className="delete-icon h-icon-mask ad-ml-2 ad-pointer" onClick={() => onTriggerDelete()}>
            <IconFont type="icon-lajitong" />
          </span>
          <span className="h-icon-mask ad-ml-1 ad-pointer" onClick={() => setIsClose(pre => !pre)}>
            <DownOutlined rotate={isClose ? 0 : 180} />
          </span>
        </div>
      </div>
      <div className="create-tool ad-space-between ad-p-4">
        <div className="ad-c-header ad-pointer" onClick={onCreate}>
          <IconFont type="icon-Add" className="ad-mr-2" />
          {intl.get('createEntity.createGroupBtn')}
        </div>

        <div className="ad-c-subtext">shift + N</div>
      </div>
      <div className="group-tree">
        <GroupTree
          groupList={groupList}
          selectedData={selectedData}
          operateGroup={operateGroup}
          onSelect={onSelect}
          onEdit={onEdit}
          onDelete={onTriggerDelete}
          onAdd={onAdd}
        />
      </div>
    </div>
  );
};

export * from './assistFunction';
export default GroupMenus;
