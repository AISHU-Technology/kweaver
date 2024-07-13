/**
 * 认知服务根路由
 */
import React, { useMemo, useState, lazy } from 'react';
import { Route, Switch, Redirect } from 'react-router-dom';

import KwHeader from '@/components/KwHeader';

import TopHeader from './TopHeader';
import { KnwItem } from './types';

import './style.less';

const SearchConfigStep = lazy(() => import('@/pages/CognitiveSearchService/SearchConfigStep'));
const Publish = lazy(() => import('@/pages/CognitiveSearchService/SearchConfigStep/ThirdPublish'));
const IframeDocument = lazy(() => import('@/pages/CognitiveSearchService/IframeDocument'));
const ConfigTest = lazy(() => import('@/pages/CognitiveSearchService/ConfigTest'));

const CognitiveSearchService = () => {
  const [knwData, setKnwData] = useState<KnwItem>({} as KnwItem);
  const [knwStudio, setKnwStudio] = useState<any>('');
  const [isClassifySetting, setIsClassifySetting] = useState(false); // 资源分类页面
  const pathName = useMemo(() => window.location.pathname, [window.location.pathname]);

  const onKnwChange = (data: KnwItem) => {
    setKnwData({ ...data });
  };

  return (
    <div className="cognitive-search-service-root">
      <TopHeader onChange={onKnwChange} setKnwStudio={setKnwStudio} />
      <div className="l-layout">
        <div className="l-main" style={pathName === '/cognitive/iframe-document' ? { overflowY: 'auto' } : {}}>
          <Switch>
            <Route
              path="/search/resource"
              render={() => (
                <SearchConfigStep
                  knwData={knwData}
                  knwStudio={knwStudio}
                  isClassifySetting={isClassifySetting}
                  setIsClassifySetting={setIsClassifySetting}
                  setKnwStudio={setKnwStudio}
                />
              )}
            />
            <Route
              path="/search/test"
              render={() => <ConfigTest knwStudio={knwStudio} knwData={knwData} setKnwStudio={setKnwStudio} />}
            />
            <Route
              path="/search/iframe-document"
              render={() => <IframeDocument knwStudio={knwStudio} knwData={knwData} setKnwStudio={setKnwStudio} />}
            />
            <Route path="/search/publish" render={() => <Publish knwData={knwData} />} />
            <Redirect to="/home" />
          </Switch>
        </div>
      </div>
    </div>
  );
};

export default CognitiveSearchService;
