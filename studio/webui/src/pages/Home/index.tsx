import React from 'react';
import { Route, Switch, useHistory, useLocation } from 'react-router-dom';
import { SettingOutlined, CiOutlined } from '@ant-design/icons';

import Layout from '@/Layout';

import IconFont from '@/components/IconFont';
import asyncComponent from '@/components/AsyncComponent';

import headLogo from '@/assets/images/kw.svg';
import './style.less';

const GraphList = asyncComponent(() => import('./GraphList'));
const ConfigSys = asyncComponent(() => import('./StorageManagement'));

const SOURCE = [
  {
    label: '知识网络',
    key: '/home/graph-list',
    icon: <IconFont type="icon-knowledge" />,
    bindRoute: true
  },
  {
    label: '系统配置',
    key: 'system',
    icon: <IconFont type="icon-setting" />,
    children: [
      {
        label: '存储管理',
        key: '/home/system-config',
        bindRoute: true
      }
    ]
  }
];

const Home = () => {
  const history = useHistory();
  const location = useLocation();

  const header = {
    logo: headLogo,
    operation: [
      {
        icon: <IconFont type="icon-wendang-xianxing" />,
        text: 'API文档',
        onClick: () => history.push('/home/system-config')
      },
      { icon: <SettingOutlined />, text: '系统配置', onClick: () => history.push('/home/system-config') }
    ]
  };
  const sidebar = { source: SOURCE, value: location.pathname };

  return (
    <div className="homeRoot">
      <Layout header={header} sidebar={sidebar}>
        <Switch>
          <Route path="/home/graph-list" render={() => <GraphList />} />
          <Route path="/home/system-config" render={() => <ConfigSys />} />
        </Switch>
      </Layout>
    </div>
  );
};

export default Home;
