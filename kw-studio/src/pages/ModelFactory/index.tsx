import React, { useState, lazy } from 'react';
import { Divider } from 'antd';
import { Route, Switch, Redirect, useHistory, useLocation } from 'react-router-dom';
import _ from 'lodash';
import intl from 'react-intl-universal';

// import { getParam } from '@/utils/handleFunction';
// import servicesKnowledgeNetwork from '@/services/knowledgeNetwork';

import IconFont from '@/components/IconFont';
import KwHeader from '@/components/KwHeader';
// import AvatarName from '@/components/Avatar';
import AuthChildRoute from '@/components/AuthChildRoute';

import Sidebar from './Sidebar';

import './style.less';

// const ModelLibrary = lazy(() => import('./ModelLibrary'));
const IntentionPool = lazy(() => import('./IntentionPool'));
const LLMModel = lazy(() => import('./LLMModel'));
const ModelService = lazy(() => import('./ModelService'));
const PromptHome = lazy(() => import('./Prompt/PromptHome'));
const PromptConfig = lazy(() => import('./Prompt/PromptConfig'));
const PromptManage = lazy(() => import('./PromptManage/PromptHome'));
const PromptManageConfig = lazy(() => import('./PromptManage/PromptManageConfig'));
const NotFound = lazy(() => import('@/components/NotFoundChildPage'));

const HIED_SIDE_URLS = [
  '/model-factory/prompt-config',
  '/model-factory/prompt-manage-create',
  '/model-factory/prompt-test',
  '/model-factory/doc/prompt',
  '/model-factory/doc/model'
];

const REST_FULL_API_URLS = ['/model-factory/doc/prompt', '/model-factory/doc/model'];

const ModelFactory = (props: any) => {
  const history = useHistory();
  const location = useLocation();
  const [defaultSelectRoute, setDefaultSelectRoute] = useState('');

  const breadcrumb = {
    key: 'breadcrumb',
    label: (
      <div className="kw-align-center">
        <Divider type="vertical" style={{ margin: '0px 16px' }} />
        <div className="componentIcon">
          <IconFont type="icon-color-moxinggongchang" />
        </div>
        <div className="kw-ml-2">{intl.get('homepage.modelFactory')}</div>
      </div>
    )
  };

  const appHasRoute = [
    '/model-factory/studio-intentionPool',
    '/model-factory/studio-modelService',
    '/model-factory/llm-model',
    '/model-factory/prompt-home',
    '/model-factory/prompt-config',
    '/model-factory/doc',
    '/model-factory/prompt-manage',
    '/model-factory/prompt-manage-create'
  ];

  return (
    <div className="modelShopRoot">
      <KwHeader breadcrumb={breadcrumb} onClickLogo={() => setTimeout(() => history.push('/home'))} />
      <div className="l-layout">
        {!HIED_SIDE_URLS.includes(location.pathname) && <Sidebar setDefaultSelectRoute={setDefaultSelectRoute} />}
        {/* 暂时注释(编辑进入刷新页面空白) */}
        {/* {(defaultSelectRoute !== '' || REST_FULL_API_URLS.includes(location.pathname)) && ( */}
        <div className="l-content">
          <div className="l-main">
            <Switch>
              {/* <Route path="/model-factory/studio-model" render={() => <ModelLibrary />} /> */}
              <AuthChildRoute
                path="/model-factory/studio-intentionPool"
                defaultRoute={defaultSelectRoute}
                allRoute={appHasRoute}
                render={() => <IntentionPool />}
              />
              <AuthChildRoute
                path="/model-factory/studio-modelService"
                defaultRoute={defaultSelectRoute}
                allRoute={appHasRoute}
                render={() => <ModelService />}
              />
              <AuthChildRoute
                path="/model-factory/llm-model"
                defaultRoute={defaultSelectRoute}
                allRoute={appHasRoute}
                render={() => <LLMModel />}
              />
              <AuthChildRoute
                path="/model-factory/prompt-manage"
                defaultRoute={defaultSelectRoute}
                allRoute={appHasRoute}
                render={() => <PromptManage />}
              />
              <AuthChildRoute
                path="/model-factory/prompt-manage-create"
                defaultRoute={defaultSelectRoute}
                allRoute={appHasRoute}
                render={() => <PromptManageConfig />}
              />
              <AuthChildRoute
                path="/model-factory/prompt-home"
                defaultRoute={defaultSelectRoute}
                allRoute={appHasRoute}
                render={() => <PromptHome />}
              />
              <AuthChildRoute
                path="/model-factory/prompt-config"
                defaultRoute={defaultSelectRoute}
                allRoute={appHasRoute}
                render={() => <PromptConfig />}
              />
              <Route path={'*'} component={NotFound} />
            </Switch>
          </div>
        </div>
        {/* )} */}
      </div>
    </div>
  );
};

export default ModelFactory;
