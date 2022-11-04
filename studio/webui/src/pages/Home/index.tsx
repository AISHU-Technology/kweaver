import React from 'react';
import Cookie from 'js-cookie';
import intl from 'react-intl-universal';
import { Route, Switch, useHistory } from 'react-router-dom';
import { GlobalOutlined } from '@ant-design/icons';

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
          { float: 'left', text: intl.get('global.studio'), onClick: () => history.push('/home/graph-list') },
          {
            icon: <IconFont type="icon-wendang-xianxing" />,
            text: intl.get('global.document'),
            onClick: () => window.open('/apidoc')
          },
          {
            icon: <IconFont type="icon-setting" />,
            text: intl.get('global.systemConfig'),
            onClick: () => history.push('/home/system-config')
          },
          {
            icon: <GlobalOutlined />,
            text: intl.get('global.language'),
            onClick: () => {
              const language = Cookie.get('anyDataLang') || 'zh-CN';
              Cookie.set('anyDataLang', language === 'zh-CN' ? 'en-US' : 'zh-CN', { expires: 365 });
              window.location.reload();
            }
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
