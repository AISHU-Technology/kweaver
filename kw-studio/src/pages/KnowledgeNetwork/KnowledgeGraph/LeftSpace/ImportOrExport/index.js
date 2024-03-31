import React, { useState } from 'react';
import { Button, Dropdown, Menu } from 'antd';
import { CaretDownOutlined } from '@ant-design/icons';

import intl from 'react-intl-universal';

import IconFont from '@/components/IconFont';

const ImportOrExport = props => {
  const selectMenu = e => {
    const key = e.key;
  };

  return (
    <React.Fragment>
      <Dropdown
        placement="bottomRight"
        getPopupContainer={triggerNode => triggerNode.parentElement}
        overlay={
          <Menu className="menu-select" onClick={selectMenu}>
            <Menu.Item key="import">
              <IconFont type="icon-xinjian" origin="new" style={{ marginRight: 8 }} />
              {intl.get('knowledge.import')}
            </Menu.Item>
            <Menu.Item key="export">
              <IconFont type="icon-xinjian" origin="new" style={{ marginRight: 8 }} />
              {intl.get('knowledge.export')}
            </Menu.Item>
          </Menu>
        }
      >
        <Button className="operate-btn">
          <IconFont type="icon-xinjian" origin="new" />
          {intl.get('knowledge.import')}/{intl.get('knowledge.export')}
          <CaretDownOutlined style={{ marginLeft: 4, fontSize: 12 }} />
        </Button>
      </Dropdown>
    </React.Fragment>
  );
};

export default ImportOrExport;
