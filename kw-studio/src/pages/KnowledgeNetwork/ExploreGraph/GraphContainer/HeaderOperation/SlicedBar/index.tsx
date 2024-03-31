/**
 * 图切片操作按钮
 */

import React, { useState } from 'react';
import { Menu, Button, Tooltip, Dropdown } from 'antd';
import _ from 'lodash';
import classnames from 'classnames';
import intl from 'react-intl-universal';
import IconFont from '@/components/IconFont';
import OperateModal from '@/pages/KnowledgeNetwork/ExploreGraph/LeftSpace/Sliced/OperateModal';
import { getSavedSlicedData } from '@/pages/KnowledgeNetwork/ExploreGraph/LeftSpace/Sliced/assistant';

const SlicedBar = (props: any) => {
  const { title, selectedItem, disabled, onOpenLeftDrawer, onChangeData } = props;
  const hasSelected = selectedItem?.selected?.length;
  const [operateInfo, setOperateInfo] = useState({ visible: false, data: {} }); // 保存弹窗

  const onMenuClick = (data: any) => {
    data.key === 'list' && onOpenLeftDrawer?.('sliced');
    if (data.key === 'save') {
      const data = getSavedSlicedData(selectedItem.selected, selectedItem.graph.current.__getSubGroups());
      setOperateInfo({ visible: true, data });
    }
  };

  const menu = (
    <Menu onClick={onMenuClick} style={{ width: 150 }}>
      <Menu.Item key="save" className="menuItem" disabled={!hasSelected}>
        {intl.get('exploreGraph.sliceSave')}
      </Menu.Item>
      <Menu.Item key="list" className="menuItem">
        {intl.get('exploreGraph.sliceList')}
      </Menu.Item>
    </Menu>
  );

  return (
    <div className="leftSpaceSimpleRoot">
      <Dropdown overlay={menu} trigger={['click']} disabled={disabled}>
        <Tooltip title={title || intl.get('exploreGraph.sliceTitle')} placement="top">
          <Button
            type="link"
            className={classnames('dropdownButton', { disabled })}
            disabled={disabled}
            style={{
              padding: 0,
              paddingTop: 1,
              minWidth: 0,
              ...(disabled ? { color: 'rgba(0, 0, 0, 0.25)' } : { color: '#000' })
            }}
          >
            <IconFont type="icon-tuqiepian" className="kw-pointer" style={{ fontSize: 20, margin: '0px 6px 3px' }} />
          </Button>
        </Tooltip>
      </Dropdown>

      <OperateModal
        {...operateInfo}
        selectedItem={selectedItem}
        onCancel={() => setOperateInfo({ visible: false, data: {} })}
        onChangeData={onChangeData}
      />
    </div>
  );
};

export default SlicedBar;
