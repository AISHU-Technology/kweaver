import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import Cookie from 'js-cookie';
import intl from 'react-intl-universal';
import { useHistory } from 'react-router-dom';
import { Row, message, Modal } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';

import HELPER from '@/utils/helper';
import { PERMISSION_CODES } from '@/enums';
import servicesKnowledgeNetwork from '@/services/knowledgeNetwork';

import Format from '@/components/Format';
import IconFont from '@/components/IconFont';
import KnowledgeModal from '@/components/KnowledgeModal';

import BootstrapCard from './BootstrapCard';
import { kwCookie, sessionStore } from '@/utils/handleFunction';

import serviceLicense, { SERVICE_LICENSE_TYPE } from '@/services/license';

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

const matchKeyToServiceType = (key: string): SERVICE_LICENSE_TYPE => {
  switch (key) {
    case 'knowledgeNetwork':
      return SERVICE_LICENSE_TYPE.KNOWLEDGE_NETWORK_STUDIO;
    case 'cognitiveApplication':
      return SERVICE_LICENSE_TYPE.COGNITIVE_APPLICATION_STUDIO;
    case 'modelFactory':
      return SERVICE_LICENSE_TYPE.MODEL_FACTORY;
    default:
      return SERVICE_LICENSE_TYPE.APP_FACTORY;
  }
};

const validateServiceStatus = async (key: string) => {
  try {
    const res = await serviceLicense.getServiceLicenseStatus(matchKeyToServiceType(key));

    if (res?.res) {
      if (res?.res === '0') {
        message.warning(intl.get('license.licenseInvalidWaring'));
      }
    }
  } catch (error) {
    if (!error.type) return;
    const { Description, description } = error.response || {};
    const curDesc = Description | description;
    curDesc && message.error(curDesc);
  }
};

const Homepage = () => {
  const history = useHistory();
  const [operation, setOperation] = useState<any>({ type: '', visible: false, data: {} });

  const onClick = (key: string, url: string) => async () => {
    // validateServiceStatus(key);
    try {
      if (key === 'modelFactory') {
        // const hasModelFactory = HELPER.getAuthorByUserInfo({
        //   roleType: PERMISSION_CODES.ADF_MODEL_FACTORY
        // });
        // if (hasModelFactory) {
        onToPageModelFactory();
        // } else {
        //   Modal.error({
        //     title: intl.get('homepage.tips'),
        //     icon: <ExclamationCircleFilled />,
        //     content: intl.get('homepage.noPermissionsOfThisModelFactory')
        //   });
        // }
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
              const { id, url } = item;
              return <BootstrapCard key={item.id} {...item} onClick={onClick(id, url)} />;
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
