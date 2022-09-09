import React, { useState } from 'react';
import intl from 'react-intl-universal';
import { useLocation } from 'react-router-dom';
import { Tabs } from 'antd';

import Layout from '@/Layout';
import Format from '@/components/Format';
import IconFont from '@/components/IconFont';

import GraphDatabase from './GraphDatabase';
import IndexConfig from './IndexConfig';

const SOURCE = [
  {
    label: '系统配置',
    key: 'system',
    icon: <IconFont type="icon-xitongpeizhi" />,
    children: [
      {
        label: '存储管理',
        key: '/home/system-config',
        bindRoute: true
      }
    ]
  }
];

const StorageManagement = () => {
  const location = useLocation();
  const [tabsKey, setTabsKey] = useState('index');

  const callback = (key: string) => setTabsKey(key);

  const sidebar = { source: SOURCE, value: location.pathname };

  return (
    <div className="storageManagementRoot">
      <Layout sidebar={sidebar} isHeaderHide={true} mainStyle={{ padding: 0 }}>
        <div className="ad-p-5 ad-bg-white" style={{ height: '100%' }}>
          <Format.Title className="ad-mb-2">存储管理</Format.Title>
          <Tabs defaultActiveKey="index" activeKey={tabsKey} onChange={callback}>
            <Tabs.TabPane key="index" tab={intl.get('configSys.indexConfig')}>
              <IndexConfig tabsKey={tabsKey} />
            </Tabs.TabPane>
            <Tabs.TabPane key="graph" tab={intl.get('configSys.graphDatabase')}>
              <GraphDatabase tabsKey={tabsKey} />
            </Tabs.TabPane>
          </Tabs>
        </div>
      </Layout>
    </div>
  );
};

export default StorageManagement;
