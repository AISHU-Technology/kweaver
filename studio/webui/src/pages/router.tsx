import React, { useEffect } from 'react';
import Cookie from 'js-cookie';
import { connect } from 'react-redux';
import intl from 'react-intl-universal';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import { message, ConfigProvider } from 'antd';

import locales from '@/locales';
import { changeAnyDataLang } from '@/reduxConfig/actions';
import getAntdGlobalConfig from '@/theme/getAntdGlobalConfig';

import asyncComponent from '@/components/AsyncComponent';

const Home = asyncComponent(() => import('@/pages/Home'));
const Workflow = asyncComponent(() => import('@/pages/Home/Workflow'));
const KnowledgeNetwork = asyncComponent(() => import('@/pages/KnowledgeNetwork'));
const NotFound = asyncComponent(() => import('@/components/NotFound'));
const AuthSuccess = asyncComponent(() => import('@/pages/AuthAS7'));
const SwaggerUI = asyncComponent(() => import('@/pages/SwaggerUI'));

const App = (props: any) => {
  useEffect(() => {
    const antdGlobalConfig = getAntdGlobalConfig();
    ConfigProvider.config({ theme: { ...antdGlobalConfig } });
    message.config({ top: 32, maxCount: 1 }); // 实际 = top 32 + padding-top 8 = 40
  }, []);

  const language = Cookie.get('anyDataLang') || 'zh-CN';
  Cookie.set('anyDataLang', language, { expires: 365 });
  props.updateAnyDataLang(language);

  // 初始化语言
  intl.init({ currentLocale: language, locales });

  return (
    <div>
      <Router>
        <Switch>
          <Redirect exact from="/" to="/home/graph-list" />
          <Route path="/home/workflow/create" render={() => <Workflow />} />
          <Route path="/home/workflow/edit" render={() => <Workflow />} />
          <Route path="/home" render={() => <Home />} />
          <Route path="/knowledge" render={(arg: any) => <KnowledgeNetwork {...arg} />} />
          <Route path="/auth-success" render={() => <AuthSuccess />} />
          <Route path="/apidoc" render={() => <SwaggerUI />} />
          <Route render={() => <NotFound />} />
        </Switch>
      </Router>
    </div>
  );
};

const mapStateToProps = (state: any) => ({
  anyDataLang: state.getIn(['changeAnyDataLang', 'anyDataLang'])
});
const mapDispatchToProps = (dispatch: any) => ({
  updateAnyDataLang: (anyDataLang: any) => dispatch(changeAnyDataLang(anyDataLang))
});

export default connect(mapStateToProps, mapDispatchToProps)(App);
