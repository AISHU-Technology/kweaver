import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import { Route, Switch, useHistory, useLocation } from 'react-router-dom';
import { SettingOutlined } from '@ant-design/icons';

import { getParam } from '@/utils/handleFunction';
import servicesKnowledgeNetwork from '@/services/knowledgeNetwork';

import Layout from '@/Layout';
import IconFont from '@/components/IconFont';
import asyncComponent from '@/components/AsyncComponent';

import headLogo from '@/assets/images/head-Logo.svg';
import cognitiveEngineIcon from '@/assets/images/cognitiveEngine.svg';

const KnowledgeGroup = asyncComponent(() => import('@/pages/KnowledgeNetwork/KnowledgeGroup'));
const CognitiveEngine = asyncComponent(() => import('@/pages/KnowledgeNetwork/CognitiveEngine'));
const DataSource = asyncComponent(() => import('@/components/DataSource'));

const Breadcrumb = (props: any) => {
  const history = useHistory();
  const { kgData } = props;

  return (
    <div className="ad-align-center">
      <div style={{ cursor: 'pointer' }} onClick={() => history.push('/home/graph-list')}>
        工作台
      </div>
      <div className="ad-ml-2 ad-mr-2">/</div>
      <div className="ad-ellipsis" style={{ width: 150 }}>
        {kgData?.knw_name}
      </div>
    </div>
  );
};

const KnowledgeNetwork = () => {
  const history = useHistory();
  const location = useLocation();
  const currentId = parseInt(getParam('id')) || '';

  const [selectedKnowledge, setSelectedKnowledge] = useState<any>({});

  useEffect(() => {
    if (!currentId) return;
    getKnowledge();
  }, []);

  const getKnowledge = async () => {
    const data = { page: 1, size: 10000, order: 'desc', rule: 'update' };
    try {
      const { res = {} } = (await servicesKnowledgeNetwork.knowledgeNetGet(data)) || {};
      setSelectedKnowledge(findSelectedKnowledge(res?.df, currentId));
    } catch (error) {
      // console.log('error', error);
    }
  };

  const findSelectedKnowledge = (knowledgeList = [], findId: string | number) => {
    const knowledge =
      _.filter(knowledgeList, (item: any) => {
        if (item?.id === findId) {
          window.sessionStorage.setItem('selectedKnowledgeId', String(findId));
          return true;
        }
        return false;
      })[0] || {};

    return knowledge;
  };

  const header = {
    logo: headLogo,
    operation: [
      { float: 'left', component: () => <Breadcrumb kgData={selectedKnowledge} /> },
      { icon: <SettingOutlined />, text: 'API文档', onClick: () => history.push('/home/system-config') },
      { icon: <SettingOutlined />, text: '系统配置', onClick: () => history.push('/home/system-config') }
    ]
  };
  const sidebar = {
    value: location.pathname,
    source: [
      {
        label: '知识图谱',
        key: '/knowledge/network',
        icon: <IconFont type="icon-graph" />,
        onClick: () => history.push(`/knowledge/network?id=${currentId}`)
      },
      {
        label: '认知引擎',
        key: '/knowledge/engine',
        icon: <img src={cognitiveEngineIcon} alt="search" />,
        onClick: () => history.push(`/knowledge/engine?id=${currentId}`)
      },
      {
        label: '数据管理',
        key: '/knowledge/source',
        icon: <IconFont type="icon-data" />,
        onClick: () => history.push(`/knowledge/source?id=${currentId}`)
      }
    ]
  };

  return (
    <div className="knowledgeNetwork">
      <Layout header={header} sidebar={sidebar} mainStyle={{ padding: 0, background: '#fff' }}>
        <Switch>
          <Route path="/knowledge/network" render={() => <KnowledgeGroup kgData={selectedKnowledge} />} />
          <Route path="/knowledge/engine" render={() => <CognitiveEngine kgData={selectedKnowledge} />} />
          <Route path="/knowledge/source" render={() => <DataSource selectedKnowledge={selectedKnowledge} />} />
        </Switch>
      </Layout>
    </div>
  );
};

export default KnowledgeNetwork;
