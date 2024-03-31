/**
 * iframe页面一级路由
 */

import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import Graph from './Graph';
import ConfigSearchIframe from './ConfigSearchIframe';
import KnwCardIframe from './KnwCardIframe';
import KnwRecommendIframe from './KnwRecommendIframe';
import SubgraphIframe from './SubgraphIframe';

const IframeBase = () => {
  return (
    <Switch>
      <Route path="/iframe/graph" component={Graph} />
      <Route path="/iframe/search" component={ConfigSearchIframe} />
      <Route path="/iframe/knowledge-card" component={KnwCardIframe} />
      <Route path="/iframe/knowledge-recommend" component={KnwRecommendIframe} />
      <Route path="/iframe/subgraph" component={SubgraphIframe} />
      <Redirect exact from="/iframe" to="/" />
    </Switch>
  );
};

export default IframeBase;
