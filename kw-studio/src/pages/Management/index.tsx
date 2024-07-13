import React, { useState, lazy } from 'react';
import { connect } from 'react-redux';
import { Route, Switch, Redirect, useHistory } from 'react-router-dom';

import KwHeader from '@/components/KwHeader';
import AuthChildRoute from '@/components/AuthChildRoute';

import SideBar from './SideBar';

import './style.less';

const MenuManagement = lazy(() => import('./MenuManagement'));
const DictManagement = lazy(() => import('./DictManagement'));
const NotFound = lazy(() => import('@/components/NotFoundChildPage'));

const Management = (props: any) => {
  const { kwLang } = props;
  const history = useHistory();
  const [defaultSelectRoute, setDefaultSelectRoute] = useState('');

  const appHasRoute = ['/management/management-menu', '/management/management-dict'];

  return (
    <div className="homeRoot">
      <KwHeader onClickLogo={() => setTimeout(() => history.push('/home'))} />
      <div className="l-layout">
        <SideBar locale={(kwLang || 'zh-CN').toLowerCase()} setDefaultSelectRoute={setDefaultSelectRoute} />
        {defaultSelectRoute !== '' && (
          <div className="l-content">
            <div className="l-main">
              <Switch>
                <AuthChildRoute
                  path="/management/management-menu"
                  defaultRoute={defaultSelectRoute}
                  allRoute={appHasRoute}
                  render={() => <MenuManagement />}
                />
                <AuthChildRoute
                  path="/management/management-dict"
                  defaultRoute={defaultSelectRoute}
                  allRoute={appHasRoute}
                  render={() => <DictManagement />}
                />
                {appHasRoute.includes(defaultSelectRoute) || window.location.pathname === '/management' ? (
                  <Redirect to={defaultSelectRoute} />
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

const mapStateToProps = (state: any) => ({
  kwLang: state.getIn(['changekwLang', 'kwLang'])
});

export default connect(mapStateToProps)(Management);
