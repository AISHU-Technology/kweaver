import React from 'react';
import { Route, Switch, useHistory } from 'react-router-dom';
import { SettingOutlined } from '@ant-design/icons';

import Header from '@/components/Header';
import IconFont from '@/components/IconFont';
import asyncComponent from '@/components/AsyncComponent';

import headLogo from '@/assets/images/kw.svg';
import './style.less';

const GraphList = asyncComponent(() => import('./GraphList'));
const ConfigSys = asyncComponent(() => import('./StorageManagement'));

const Home = () => {
  const history = useHistory();

  return (
    <div className="homeRoot">
      <Header
        logo={headLogo}
        operation={[
          { float: 'left', text: '工作台', onClick: () => history.push('/home/graph-list') },
          {
            icon: <IconFont type="icon-wendang-xianxing" />,
            text: 'API文档',
            onClick: () => history.push('/home/system-config')
          },
          {
            icon: <IconFont type="icon-setting" />,
            text: '系统配置',
            onClick: () => history.push('/home/system-config')
          }
        ]}
      />
      <Switch>
        <Route path="/home/graph-list" render={() => <GraphList />} />
        <Route path="/home/system-config" render={() => <ConfigSys />} />
      </Switch>
    </div>
  );
};

export default Home;
