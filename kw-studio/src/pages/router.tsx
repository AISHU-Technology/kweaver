import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import { connect } from 'react-redux';
import intl from 'react-intl-universal';
import { BrowserRouter as Router, Route, Switch, useHistory } from 'react-router-dom';
import { message, ConfigProvider } from 'antd';

import { PERMISSION_CODES } from '@/enums';
import servicesPermission from '@/services/rbacPermission';
import locales from '@/locales';
import { kwCookie, localStore } from '@/utils/handleFunction';
import { changekwLang } from '@/reduxConfig/actions';
import getAntdGlobalConfig from '@/theme/getAntdGlobalConfig';

import asyncComponent from '@/components/AsyncComponent';
import AuthRouter from '@/components/AuthRouter';
import UploadDrawer from './Global/UploadDrawer';

import Test from './CognitiveSearchService/KnowledgeCard';

const Home = asyncComponent(() => import('@/pages/Home'));
const ModelFactory = asyncComponent(() => import('@/pages/ModelFactory'));
const KnowledgeNetwork = asyncComponent(() => import('@/pages/KnowledgeNetwork'));
const CognitiveApplication = asyncComponent(() => import('@/pages/CognitiveApplication'));

const Admin = asyncComponent(() => import('@/pages/Admin'));
const NotFound = asyncComponent(() => import('@/components/NotFound'));
const IframeBase = asyncComponent(() => import('@/pages/IframeBase'));
const CognitiveService = asyncComponent(() => import('@/pages/CognitiveService'));
const CognitiveSearchService = asyncComponent(() => import('@/pages/CognitiveSearchService'));
const IntentionCreate = asyncComponent(() => import('@/pages/IntentionDeal'));
const DPApiService = asyncComponent(() => import('@/pages/DPApiService'));
const CustomConfigService = asyncComponent(() => import('@/pages/CustomConfigService'));

// 不查询权限
const ignoreQueryPermission = ['/login', '/swagger', '/iframe'];

const Empty = (props: any) => {
  const history = useHistory();

  useEffect(() => {
    // servicesPermission
    //   .permissionGetMenus()
    //   .then((result: any) => {
    //     const hasAdminMenu = _.includes(result?.res || [], PERMISSION_CODES.ADF_MANAGEMENT);
    //     if (hasAdminMenu) {
    //       history.replace('/admin');
    //     } else {
    //       history.replace('/home');
    //     }
    //   })
    //   .catch(error => {
    //     history.replace('/login');
    //   });
  }, []);

  return null;
};
const App = (props: any) => {
  const { kwLang } = props;
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    ConfigProvider.config({ theme: { ...getAntdGlobalConfig() } });
    message.config({ top: 32, maxCount: 1 }); // 实际 = top 32 + padding-top 8 = 40

    let isSkip = false;
    _.forEach(ignoreQueryPermission, key => {
      if (_.includes(window.location.pathname, key)) isSkip = true;
    });
    if (!isSkip) getPermission();
  }, []);

  /**
   * 查询和更新用户权限
   */
  const getPermission = () => {};

  const language = kwCookie.get('kwLang') || 'zh-CN';
  kwCookie.set('kwLang', language, { expires: 365 });
  props.updatekwLang(language);

  // 初始化语言
  intl.init({
    currentLocale: language,
    locales,
    // fallbackLocale: 'zh-CN',
    warningHandler: (message: any, error: any) => ''
  });

  return (
    <div>
      <Router>
        <Switch>
          <Route path="/" exact render={() => <Home />} />
          <AuthRouter path="/home" isRender={!isAdmin} render={() => <Home />} />
          <AuthRouter path="/model-factory" isRender={!isAdmin} render={() => <ModelFactory kwLang={kwLang} />} />
          <Route path="/knowledge" render={() => <KnowledgeNetwork kwLang={kwLang} />} />
          <AuthRouter
            path="/cognitive-application"
            isRender={!isAdmin}
            render={() => <CognitiveApplication kwLang={kwLang} />}
          />
          <Route path="/cognitive" render={() => <CognitiveService />} />
          <Route path="/search" render={() => <CognitiveSearchService />} />
          <Route path="/intention-create" render={() => <IntentionCreate />} />
          <Route path="/custom" render={() => <CustomConfigService />} />
          <Route path="/test" render={() => <Test type="card" knwId={0} data={[]} />} />
          <Route path="/dpapi" render={() => <DPApiService />} />
          <Route path="/iframe" render={() => <IframeBase />} />
          <Route render={() => <NotFound />} />
        </Switch>
      </Router>
      <UploadDrawer />
    </div>
  );
};

const mapStateToProps = (state: any) => ({
  kwLang: state.getIn(['changekwLang', 'kwLang'])
});
const mapDispatchToProps = (dispatch: any) => ({
  updatekwLang: (kwLang: any) => dispatch(changekwLang(kwLang))
});

export default connect(mapStateToProps, mapDispatchToProps)(App);
