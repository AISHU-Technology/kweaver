/**
 * 认知服务根路由
 */
import React, { useMemo, useState, lazy } from 'react';
import { Route, Switch, Redirect, useHistory } from 'react-router-dom';
import { Divider } from 'antd';
import intl from 'react-intl-universal';

import KwHeader from '@/components/KwHeader';
import IconFont from '@/components/IconFont';
import { KnwItem } from './types';
import './style.less';

const AnalysisServiceConfig = lazy(() => import('@/pages/CognitiveService/AnalysisServiceConfig'));
const AnalysisServiceTest = lazy(() => import('@/pages/CognitiveService/AnalysisServiceTest'));
const IframeDocument = lazy(() => import('@/pages/CognitiveService/IframeDocument'));

const CognitiveService = (props: any) => {
  const history = useHistory();
  const [knwData, setKnwData] = useState<KnwItem>({} as KnwItem);
  const pathName = useMemo(() => window.location.pathname, [window.location.pathname]);

  // 面包屑
  const breadcrumb = {
    key: 'breadcrumb',
    label: (
      <div className="kw-align-center">
        <Divider type="vertical" style={{ margin: '0px 16px' }} />
        <div className="componentIcon">
          <IconFont type="icon-color-renzhiyingyong" />
        </div>
        <div className="kw-ml-2">{intl.get('homepage.cognitiveApplication')}</div>
      </div>
    )
  };

  return (
    <div className="cognitive-service-root">
      <KwHeader breadcrumb={breadcrumb} onClickLogo={() => history.push('/home')} />
      <div className="l-layout">
        <div className="l-main" style={{}}>
          <Switch>
            <Route path="/cognitive/config" render={() => <AnalysisServiceConfig knwData={knwData} />} />
            <Route path="/cognitive/test" render={() => <AnalysisServiceTest />} />
            <Route path="/cognitive/iframe-document" render={() => <IframeDocument />} />
            <Redirect to="/home" />
          </Switch>
        </div>
      </div>
    </div>
  );
};

export default CognitiveService;
