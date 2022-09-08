import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Route, Switch, useHistory, useLocation } from 'react-router-dom';
import { SettingOutlined } from '@ant-design/icons';

import { getParam } from '@/utils/handleFunction';
import servicesKnowledgeNetwork from '@/services/knowledgeNetwork';

import Layout from '@/Layout';
import IconFont from '@/components/IconFont';
import asyncComponent from '@/components/AsyncComponent';

import headLogo from '@/assets/images/kw.svg';

const KnowledgeGroup = asyncComponent(() => import('@/pages/KnowledgeNetwork/KnowledgeGroup'));
const CognitiveEngine = asyncComponent(() => import('@/pages/KnowledgeNetwork/CognitiveEngine'));
const DataSource = asyncComponent(() => import('@/components/DataSource'));

const Breadcrumb = (props: any) => {
  const { kgData } = props;

  return (
    <div className="ad-align-center" style={{ marginTop: 2 }}>
      <div style={{ marginRight: 10 }}>/</div>
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
      { float: 'left', text: '工作台', onClick: () => history.push('/home/graph-list') },
      { float: 'left', component: () => <Breadcrumb kgData={selectedKnowledge} /> },
      {
        icon: <IconFont type="icon-wendang-xianxing" />,
        text: 'API文档',
        onClick: () => window.open('/apidoc')
      },
      { icon: <IconFont type="icon-setting" />, text: '系统配置', onClick: () => history.push('/home/system-config') }
    ]
  };
  const sidebar = {
    value: location.pathname,
    source: [
      {
        label: '知识图谱',
        key: '/knowledge/network',
        icon: <IconFont type="icon-zhishitupu" />,
        onClick: () => history.push(`/knowledge/network?id=${currentId}`)
      },
      {
        label: '认知引擎',
        key: 'knowledgeEngine',
        icon: <IconFont type="icon-renzhiyinqing" />,
        children: [
          {
            label: intl.get('global.knowledgeSearch'),
            key: '/knowledge/engine/search',
            onClick: () => history.push(`/knowledge/engine/search?id=${currentId}`)
          }
        ]
      },
      {
        label: '数据管理',
        key: '/knowledge/source',
        icon: <IconFont type="icon-shujuyuanguanli" />,
        onClick: () => history.push(`/knowledge/source?id=${currentId}`)
      }
    ]
  };

  return (
    <div className="knowledgeNetwork">
      <Layout header={header} sidebar={sidebar} mainStyle={{ padding: 0, background: '#fff' }}>
        <Switch>
          <Route path="/knowledge/network" render={() => <KnowledgeGroup kgData={selectedKnowledge} />} />
          <Route path="/knowledge/engine/search" render={() => <CognitiveEngine kgData={selectedKnowledge} />} />
          <Route path="/knowledge/source" render={() => <DataSource selectedKnowledge={selectedKnowledge} />} />
        </Switch>
      </Layout>
    </div>
  );
};

export default KnowledgeNetwork;
