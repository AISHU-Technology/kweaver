import React, { useState, useEffect, useMemo, lazy } from 'react';
import _ from 'lodash';
import classnames from 'classnames';
import intl from 'react-intl-universal';
import { Route, Switch, Redirect, useHistory, useLocation } from 'react-router-dom';
import { Spin, Menu, Tooltip, Dropdown, Divider } from 'antd';
import { DownOutlined, LoadingOutlined } from '@ant-design/icons';

import { getParam } from '@/utils/handleFunction';
import servicesPermission from '@/services/rbacPermission';
import servicesKnowledgeNetwork from '@/services/knowledgeNetwork';

import IconFont from '@/components/IconFont';
import KwHeader from '@/components/KwHeader';
import AvatarName from '@/components/Avatar';
import AuthChildRoute from '@/components/AuthChildRoute';
import Sidebar from './Sidebar';
import './style.less';

const ServiceList = lazy(() => import('./AnalysisServiceList'));
const CognitiveIntention = lazy(() => import('./CognitiveIntention'));
const CustomService = lazy(() => import('./CustomService'));
const DBApi = lazy(() => import('./DPApi/index'));
const CognitiveEngine = lazy(() => import('./CognitiveEngine'));
const NotFound = lazy(() => import('@/components/NotFoundChildPage'));

const CognitiveApplication = (props: any) => {
  const history = useHistory();
  const location = useLocation();

  const [knData, setKnData] = useState<any>({});
  const [defaultSelectRoute, setDefaultSelectRoute] = useState('');

  // const { id, opType, kg_name } = useMemo(() => {
  //   const { id, opType, knId, kg_name } = getParam(['id', 'opType', 'knId', 'kg_name']);
  //   return { id: id || knId, opType, kg_name };
  // }, [window?.location?.search]);

  // useEffect(() => {
  //   // 获取列表权限, 判断权限
  //   if (_.isEmpty(knData)) return;
  //   const postData = { dataType: PERMISSION_KEYS.TYPE_KN, dataIds: [String(knData?.id)] };
  //   servicesPermission.dataPermission(postData).then(result => {
  //     const newKgData: any = { ...knData };
  //     newKgData.__codes = result?.res?.[0]?.codes;
  //     newKgData.__isCreator = result?.res?.[0]?.isCreator;
  //     setKnData(newKgData);
  //   });
  // }, [JSON.stringify(knData)]);

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

  const appHasRoute = [
    '/cognitive-application/analysis-auth',
    '/cognitive-application/cognitiveSearch-auth',
    '/cognitive-application/custom-auth',
    '/cognitive-application/domain-analysis',
    '/cognitive-application/domain-intention',
    '/cognitive-application/domain-custom',
    '/cognitive-application/domain-dbapi',
    '/cognitive-application/domain-search',
    '/cognitive-application/subscription'
  ];

  return (
    <div className="cognitiveApplicationRoot">
      <KwHeader breadcrumb={breadcrumb} onClickLogo={() => setTimeout(() => history.push('/home'))} />
      <Switch>
        <div className="l-layout">
          <Sidebar setDefaultSelectRoute={setDefaultSelectRoute} />
          {defaultSelectRoute !== '' && (
            <div className="l-content">
              <div className="l-main">
                {/* <Spin
                wrapperClassName="layoutSpin"
                spinning={isLoading}
                indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
              > */}
                <Switch>
                  <AuthChildRoute
                    path="/cognitive-application/domain-analysis"
                    defaultRoute={defaultSelectRoute}
                    allRoute={appHasRoute}
                    render={() => <ServiceList />}
                  />
                  <AuthChildRoute
                    path="/cognitive-application/domain-intention"
                    defaultRoute={defaultSelectRoute}
                    allRoute={appHasRoute}
                    render={() => <CognitiveIntention />}
                  />
                  <AuthChildRoute
                    path="/cognitive-application/domain-custom"
                    defaultRoute={defaultSelectRoute}
                    allRoute={appHasRoute}
                    render={() => <CustomService />}
                  />
                  <AuthChildRoute
                    path="/cognitive-application/domain-dbapi"
                    defaultRoute={defaultSelectRoute}
                    allRoute={appHasRoute}
                    render={() => <DBApi knData={knData} />}
                  />
                  <AuthChildRoute
                    path="/cognitive-application/domain-search"
                    defaultRoute={defaultSelectRoute}
                    allRoute={appHasRoute}
                    render={() => <CognitiveEngine />}
                  />
                  <Route path={'*'} component={NotFound} />
                </Switch>
                {/* </Spin> */}
              </div>
            </div>
          )}
        </div>
      </Switch>
    </div>
  );
};

export default CognitiveApplication;
