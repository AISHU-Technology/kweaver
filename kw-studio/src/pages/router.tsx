import React, { useEffect, lazy, Suspense } from 'react';
import _ from 'lodash';
import { connect } from 'react-redux';
import intl from 'react-intl-universal';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { message, ConfigProvider } from 'antd';

import locales from '@/locales';
import { kwCookie } from '@/utils/handleFunction';
import { changekwLang } from '@/reduxConfig/actions';
import getAntdGlobalConfig from '@/theme/getAntdGlobalConfig';

import UploadDrawer from './Global/UploadDrawer';

import Test from './CognitiveSearchService/KnowledgeCard';

import KwDynamicRouter from '@/components/KwDynamicRouter';

const Home = lazy(() => import('@/pages/Home'));
const Management = lazy(() => import('@/pages/Management'));
const ModelFactory = lazy(() => import('@/pages/ModelFactory'));
const KnowledgeNetwork = lazy(() => import('@/pages/KnowledgeNetwork'));
const CognitiveApplication = lazy(() => import('@/pages/CognitiveApplication'));

const NotFound = lazy(() => import('@/components/NotFound'));
const CognitiveService = lazy(() => import('@/pages/CognitiveService'));
const CognitiveSearchService = lazy(() => import('@/pages/CognitiveSearchService'));
const IntentionCreate = lazy(() => import('@/pages/IntentionDeal'));
const DPApiService = lazy(() => import('@/pages/DPApiService'));
const CustomConfigService = lazy(() => import('@/pages/CustomConfigService'));

const ignoreQueryPermission = ['/login', '/swagger', '/iframe'];

const App = (props: any) => {
  const { kwLang } = props;

  useEffect(() => {
    ConfigProvider.config({ theme: { ...getAntdGlobalConfig() } });
    message.config({ top: 32, maxCount: 1 });

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

  intl.init({
    currentLocale: language,
    locales,
    warningHandler: () => ''
  });

  return (
    <div>
      <Router>
        <Switch>
          <Route path="/" exact render={() => <Home />} />
          <Route path="/home" render={() => <Home />} />
          <KwDynamicRouter menuId="0" extraProps={{ kwLang }} />

          {/* <Route
            path="/management"
            render={() => (
              <Suspense fallback={<div />}>
                <Management kwLang={kwLang} />
              </Suspense>
            )}
          />
          <Route
            path="/model-factory"
            render={() => (
              <Suspense fallback={<div />}>
                <ModelFactory kwLang={kwLang} />
              </Suspense>
            )}
          />
          <Route
            path="/knowledge"
            render={() => (
              <Suspense fallback={<div />}>
                <KnowledgeNetwork kwLang={kwLang} />
              </Suspense>
            )}
          /> */}
          {/* <Route path="/cognitive-application" render={() => <CognitiveApplication kwLang={kwLang} />} />
          <Route path="/cognitive" render={() => <CognitiveService />} />
          <Route path="/search" render={() => <CognitiveSearchService />} />
          <Route path="/intention-create" render={() => <IntentionCreate />} />
          <Route path="/custom" render={() => <CustomConfigService />} />
          <Route path="/test" render={() => <Test type="card" knwId={0} data={[]} />} />
          <Route path="/dpapi" render={() => <DPApiService />} /> */}
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
