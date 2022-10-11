import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import Cookie from 'js-cookie';
import intl from 'react-intl-universal';
import { Route, Switch, useHistory, useLocation } from 'react-router-dom';
import { GlobalOutlined } from '@ant-design/icons';

import { getParam } from '@/utils/handleFunction';
import servicesKnowledgeNetwork from '@/services/knowledgeNetwork';

import Layout from '@/Layout';
import IconFont from '@/components/IconFont';
import asyncComponent from '@/components/AsyncComponent';

import headLogo from '@/assets/images/kw.svg';

const DomainIQ = asyncComponent(() => import('@/pages/KnowledgeNetwork/DomainIQ'));
const KnowledgeGroup = asyncComponent(() => import('@/pages/KnowledgeNetwork/KnowledgeGroup'));
const CognitiveEngine = asyncComponent(() => import('@/pages/KnowledgeNetwork/CognitiveEngine'));
const DataSource = asyncComponent(() => import('@/components/DataSource'));
const Thesaurus = asyncComponent(() => import('@/pages/KnowledgeNetwork/ThesaurusManagement'));

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
      { float: 'left', text: intl.get('global.studio'), onClick: () => history.push('/home/graph-list') },
      { float: 'left', component: () => <Breadcrumb kgData={selectedKnowledge} /> },
      {
        icon: <IconFont type="icon-wendang-xianxing" />,
        text: intl.get('global.document'),
        onClick: () => window.open('/apidoc')
      },
      {
        icon: <IconFont type="icon-setting" />,
        text: intl.get('global.systemConfig'),
        onClick: () => history.push('/home/system-config')
      },
      {
        icon: <GlobalOutlined />,
        text: intl.get('global.language'),
        onClick: () => {
          const language = Cookie.get('anyDataLang') || 'zh-CN';
          Cookie.set('anyDataLang', language === 'zh-CN' ? 'en-US' : 'zh-CN', { expires: 365 });
          window.location.reload();
        }
      }
    ]
  };
  const sidebar = {
    value: location.pathname,
    source: [
      {
        label: intl.get('global.domainIQ'),
        key: '/knowledge/iq',
        icon: <IconFont type="icon-lingyuzhishang" />,
        onClick: () => history.push(`/knowledge/iq?id=${currentId}`)
      },
      {
        label: intl.get('global.domainGraph'),
        key: '/knowledge/network',
        icon: <IconFont type="icon-zhishitupu" />,
        onClick: () => history.push(`/knowledge/network?id=${currentId}`)
      },
      {
        label: intl.get('global.thesaurusManagement'),
        key: '/knowledge/thesaurus',
        icon: <IconFont type="icon-ciku" />,
        onClick: () => history.push(`/knowledge/thesaurus?id=${currentId}`)
      },
      {
        label: intl.get('global.cognitiveEngine'),
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
        label: intl.get('global.dataManage'),
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
          <Route path="/knowledge/iq" render={() => <DomainIQ kgData={selectedKnowledge} />} />
          <Route path="/knowledge/network" render={() => <KnowledgeGroup kgData={selectedKnowledge} />} />
          <Route path="/knowledge/engine/search" render={() => <CognitiveEngine kgData={selectedKnowledge} />} />
          <Route path="/knowledge/source" render={() => <DataSource selectedKnowledge={selectedKnowledge} />} />
          <Route path="/knowledge/thesaurus" render={() => <Thesaurus kgData={selectedKnowledge} />} />
        </Switch>
      </Layout>
    </div>
  );
};

export default KnowledgeNetwork;
