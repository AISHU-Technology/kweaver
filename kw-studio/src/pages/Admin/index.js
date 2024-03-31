import React, { useState } from 'react';
import _ from 'lodash';
import { connect } from 'react-redux';
import { Route, Switch, Redirect } from 'react-router-dom';

import CHeader from '@/components/Header';
import asyncComponent from '@/components/AsyncComponent';
import AuthChildRoute from '@/components/AuthChildRoute';

import SideBar from './SideBar';

import './style.less';

const MenuManagement = asyncComponent(() => import('./MenuManagement'));
const DictManagement = asyncComponent(() => import('./DictManagement'));
const NotFound = asyncComponent(() => import('@/components/NotFoundChildPage'));

const Home = props => {
  const { kwLang } = props;
  const [defaultSelectRoute, setDefaultSelectRoute] = useState('');

  const appHasRoute = ['/admin/management-menu', '/admin/management-dict'];

  return (
    <div className="homeRoot">
      <CHeader hideApiDocument={true} />
      <div className="l-layout">
        <SideBar locale={(kwLang || 'zh-CN').toLowerCase()} setDefaultSelectRoute={setDefaultSelectRoute} />
        {defaultSelectRoute !== '' && (
          <div className="l-content">
            <div className="l-main">
              <Switch>
                <AuthChildRoute
                  path="/admin/management-menu"
                  defaultRoute={defaultSelectRoute}
                  allRoute={appHasRoute}
                  component={MenuManagement}
                />
                <AuthChildRoute
                  path="/admin/management-dict"
                  defaultRoute={defaultSelectRoute}
                  allRoute={appHasRoute}
                  component={DictManagement}
                />
                {appHasRoute.includes(defaultSelectRoute) ? (
                  <Redirect to={defaultSelectRoute} />
                ) : window.location.pathname === '/admin' ? (
                  window.location.replace(defaultSelectRoute)
                ) : (
                  <Route path={'*'} component={NotFound} />
                )}
              </Switch>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const mapStateToProps = state => ({
  kwLang: state.getIn(['changekwLang', 'kwLang'])
});

export default connect(mapStateToProps)(Home);
