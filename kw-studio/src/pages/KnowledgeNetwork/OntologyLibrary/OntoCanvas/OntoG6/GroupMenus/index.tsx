import React, { useState } from 'react';
import { message, Tooltip } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import _ from 'lodash';
import classNames from 'classnames';
import servicesSubGraph from '@/services/subGraph';
import IconFont from '@/components/IconFont';
import { tipModalFunc } from '@/components/TipModal';
import ExplainTip from '@/components/ExplainTip';
import GroupList from './GroupList';
import { GraphGroupItem } from '../types/items';
import './style.less';
import { useLocation } from 'react-router-dom';

export interface GroupMenusProps {
  graphId: number;
  groupList: GraphGroupItem[]; // 分组数据
  operateGroup?: GraphGroupItem; // 正在操作的分组
  onSelect: (group: GraphGroupItem) => void; // 选择分组回调
  onEdit?: (group: GraphGroupItem) => void; // 编辑分组
  onDelete?: () => void; // 删除分组回调
  onCreate?: () => void; // 新建分组
  onRename?: (group: GraphGroupItem) => void; // 重命名
  onClear?: () => void; // 触发清除画布
}

const GroupMenus = (props: GroupMenusProps) => {
  const { graphId, groupList, operateGroup, onSelect, onEdit, onDelete, onCreate, onRename, onClear } = props;
  const [isClose, setIsClose] = useState(false); // 是否展开分组菜单
  const location = useLocation<any>();
  const viewMode = location.state?.mode === 'view'; // 是否处于查看模式
  /**
   * 删除分组
   * [BUG 327504]删除全部时清除选中, 以免用户误以为删除的是选中的分组
   */
  const onTriggerDelete = async (group?: GraphGroupItem) => {
    if (groupList.length < 2) return;
    const isAll = !group;
    if (isAll) onClear?.();
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
      // res && message.success(intl.get('createEntity.groupCanceled'));
      // Description && message.error(Description);
      Description &&
        message.error({
          content: Description,
          className: 'custom-class',
          style: {
            marginTop: '6vh'
          }
        });
      onDelete?.();
    } catch {
      // none
    }
  };

  return (
    <div className={classNames('graph-group-menus-root', { 'menus-close': isClose })}>
      <div className="header kw-space-between">
        <div>
          <span className="kw-c-header t-text">{intl.get('createEntity.allGroup')}</span>
          <ExplainTip title={intl.get('createEntity.groupTip')} />
        </div>
        <div>
          {!viewMode && (
            <Tooltip title={intl.get('createEntity.cancelAllGroup')}>
              <span className="delete-icon h-icon-mask kw-ml-2 kw-pointer" onClick={() => onTriggerDelete()}>
                <IconFont type="icon-lajitong" />
              </span>
            </Tooltip>
          )}

          <span className="h-icon-mask kw-ml-1 kw-pointer" onClick={() => setIsClose(pre => !pre)}>
            <DownOutlined rotate={isClose ? 0 : 180} />
          </span>
        </div>
      </div>
      {!viewMode && (
        <div className="create-tool kw-space-between kw-p-4">
          <div className="kw-c-header kw-pointer" onClick={onCreate}>
            <IconFont type="icon-Add" className="kw-mr-2" />
            {intl.get('createEntity.createGroupBtn')}
          </div>
          <div className="kw-c-subtext">shift + N</div>
        </div>
      )}

      <div className="group-tree">
        <GroupList
          groupList={groupList}
          operateGroup={operateGroup}
          onSelect={onSelect}
          onRename={onRename}
          onDelete={onTriggerDelete}
          onEdit={onEdit}
        />
      </div>
    </div>
  );
};

export * from './assistFunction';
export default GroupMenus;
