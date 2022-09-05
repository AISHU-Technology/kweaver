import React, { useState } from 'react';
import intl from 'react-intl-universal';
import { Tabs } from 'antd';

import Format from '@/components/Format';
import GraphDatabase from './GraphDatabase';
import IndexConfig from './IndexConfig';

import './index.less';

const StorageManagement = () => {
  const [tabsKey, setTabsKey] = useState('index');

  const callback = (key: string) => setTabsKey(key);

  return (
    <div className="storageManagementRoot">
      <Format.Title className="ad-mb-5" level={5}>
        存储管理
      </Format.Title>
      <div className="content">
        <Tabs defaultActiveKey="index" activeKey={tabsKey} onChange={callback}>
          <Tabs.TabPane key="index" tab={intl.get('configSys.indexConfig')}>
            <IndexConfig tabsKey={tabsKey} />
          </Tabs.TabPane>
          <Tabs.TabPane key="graph" tab={intl.get('configSys.graphDatabase')}>
            <GraphDatabase tabsKey={tabsKey} />
          </Tabs.TabPane>
        </Tabs>
      </div>
    </div>
  );
};

export default StorageManagement;
