import React, { useState } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { useHistory } from 'react-router-dom';
import { Row, message } from 'antd';

import servicesKnowledgeNetwork from '@/services/knowledgeNetwork';

import Format from '@/components/Format';
import IconFont from '@/components/IconFont';
import KnowledgeModal from '@/components/KnowledgeModal';

import BootstrapCard from './BootstrapCard';
import { kwCookie, sessionStore } from '@/utils/handleFunction';

const DATA: any = [
  {
    id: 'modelFactory',
    url: '/model-factory',
    dec: intl.get('homepage.modelFactoryDec'),
    icon: 'icon-color-moxinggongchang',
    title: intl.get('homepage.modelFactory'),
    backImage: 'modelFactory'
  },
  {
    id: 'knowledgeNetwork',
    url: '/knowledge',
    dec: intl.get('homepage.knowledgeNetworkDec'),
    icon: 'icon-color-zhishiwangluo',
    title: intl.get('homepage.knowledgeNetwork'),
    backImage: 'knowledgeNetwork'
  }
  // {
  //   id: 'cognitiveApplication',
  //   url: '/cognitive-application',
  //   dec: intl.get('homepage.cognitiveApplicationDec'),
  //   icon: 'icon-color-renzhiyingyong',
  //   title: intl.get('homepage.cognitiveApplication'),
  //   backImage: 'cognitiveApplication'
  // }
];

const Homepage = () => {
  const history = useHistory();
  const [operation, setOperation] = useState<any>({ type: '', visible: false, data: {} });

  const onClick = (key: string) => async () => {
    try {
      if (key === 'modelFactory') {
        onToPageModelFactory();
        return;
      }
      const postData = { size: 1000, page: 1, rule: 'update', order: 'desc' };
      const result = (await servicesKnowledgeNetwork.knowledgeNetGet(postData)) || {};
      const items = result?.res?.df;
      const id = items?.[0]?.id;
      if (key === 'knowledgeNetwork') {
        if (id) {
          onToPageKnowledgeNetwork(sessionStore.get('selectedKnowledgeId') ?? id);
        } else {
          onCreateNetwork();
        }
      } else if (key === 'cognitiveApplication') {
        if (_.isEmpty(items)) {
          message.warning(intl.get('homepage.pleaseContactAdministrator'));
        } else {
          if (id) onToPageCognitiveApplication(id);
        }
      }
    } catch (error) {
      //
    }
  };

  /** 创建知识网络弹窗相关 */
  const onCreateNetwork = () => setOperation({ type: 'add', data: {}, visible: true });
  const onCloseCreateModel = () => setOperation({});

  // 点击进入模型工厂
  const onToPageModelFactory = () => {
    history.push('/model-factory/prompt-home');
    // history.push('/model-factory/prompt-manage');
  };

  // 点击进入知识网络
  const onToPageKnowledgeNetwork = (id: string | number | undefined) => {
    if (!id) return;
    history.push(`/knowledge/studio-network?id=${id}`);
  };

  // 点击进入认知应用
  const onToPageCognitiveApplication = (id: string | number | undefined) => {
    if (!id) return;
    // history.push(`/cognitive-application/domain-analysis?id=${id}`);
    history.push('/cognitive-application/domain-analysis');
  };

  const language = kwCookie.get('kwLang') || 'zh-CN';
  const titleWidth = language === 'zh-CN' ? 58 : 74;

  return (
    <div>
      <div style={{ padding: '0px 24px', maxWidth: 1232 }}>
        <div className="kw-mt-9 kw-center">
          <Format.HeaderTitle level={20}>{intl.get('homepage.welcomeToKWeaver')}</Format.HeaderTitle>
        </div>
        <div className="kw-mt-5">
          <div className="kw-align-center">
            <IconFont className="kw-mr-2" type="icon-color-kaishishiyong" />
            <Format.HeaderTitle className="kw-mr-3" level={14} style={{ width: titleWidth, minWidth: titleWidth }}>
              {intl.get('homepage.getStarted')}
            </Format.HeaderTitle>
            <div style={{ width: '100%', height: 1, background: 'rgba(0,0,0,.1)' }} />
          </div>
          <Row gutter={[16, 16]} justify="space-between" wrap className="kw-mt-3">
            {_.map(DATA, item => {
              const { id } = item;
              return <BootstrapCard key={item.id} {...item} onClick={onClick(id)} />;
            })}
          </Row>
        </div>
      </div>
      <KnowledgeModal
        visible={operation.visible && ['add', 'edit'].includes(operation.type)}
        source={operation}
        onSuccess={() => {}}
        onToPageNetwork={onToPageKnowledgeNetwork}
        onCancel={onCloseCreateModel}
      />
    </div>
  );
};

export default Homepage;
