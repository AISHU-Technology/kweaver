/**
 * 认知服务根路由
 */
import React, { useMemo, useState } from 'react';
import { Route, Switch, Redirect } from 'react-router-dom';

import asyncComponent from '@/components/AsyncComponent';
import TopHeader from './TopHeader';
import { KnwItem } from './types';

import './style.less';

const CustomCreateStep = asyncComponent(() => import('@/pages/CustomConfigService/CustomCreateStep'));
const Publish = asyncComponent(() => import('@/pages/CustomConfigService/CustomCreateStep/Publish'));
const CustomTest = asyncComponent(() => import('@/pages/CustomConfigService/CustomTest'));

const CustomConfigService = () => {
  const [knwStudio, setKnwStudio] = useState<any>('');
  const pathName = useMemo(() => window.location.pathname, [window.location.pathname]);

  return (
    <div className="custom-config-test-service-page-wrap-root">
      <TopHeader setKnwStudio={setKnwStudio} />

      <div className="l-layout">
        <div className="l-main">
          <Switch>
            <Route
              path="/custom/service"
              render={() => <CustomCreateStep knwStudio={knwStudio} setKnwStudio={setKnwStudio} />}
            />
            <Route
              path="/custom/test"
              render={() => <CustomTest knwStudio={knwStudio} setKnwStudio={setKnwStudio} />}
            />
            <Route path="/custom/publish" render={() => <Publish />} />
            <Redirect to="/home" />
          </Switch>
        </div>
      </div>
    </div>
  );
};

export default CustomConfigService;
