import React, { useState, useEffect, useContext } from 'react';
import { Divider } from 'antd';
import { Prompt, useHistory } from 'react-router-dom';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import IconFont from '@/components/IconFont';
import { tipModalFunc } from '@/components/TipModal';
import KwHeader from '@/components/KwHeader';
import { getParam } from '@/utils/handleFunction';
import TopSteps from './TopSteps';
import FirstSQLSetting from './FirstSQLSetting';
import SecondPublishAPI from './SecondPublishAPI';
import {
  CHANGE_KN_USER_LIST_VALUE,
  CHANGE_SELECTED_KN_USER_ID_VALUE,
  DataWrapper,
  DpapiDataContext
} from './dpapiData';

import './style.less';
import servicesKnowledgeNetwork from '@/services/knowledgeNetwork';

// 判断进入的界面
// 点击【编辑】进入服务，跳转「配置策略与测试」页面
// 点击【发布】进入服务，跳转「发布服务」页面
const getFirstParam = () => {
  let action = getParam('action') as any;
  if (!['create', 'edit', 'publish'].includes(action)) {
    action = 'create';
  }
  let step = 0;
  if (action === 'publish') {
    step = 1;
  } else if (action === 'create' || action === 'edit') {
    step = 0;
  }
  return { step, action };
};

const DPApiService = (props: any) => {
  const history = useHistory();
  const [step, setStep] = useState(() => getFirstParam().step);
  // const [step, setStep] = useState(0);
  const [action] = useState<any>(() => getFirstParam().action); // 进入页面的动作行为
  const [isPrevent, setIsPrevent] = useState(true); // 是否阻止路由跳转
  const [id, setId] = useState(getParam('id'));
  const [kwId, setKwId] = useState(getParam('kwId')); // 初始化为url带过来的kwId- 仅编辑状态有

  /**
   * 退出
   */
  const onExit = async (url?: string) => {
    const isOk = await tipModalFunc({
      title: intl.get('cognitiveSearch.quit'),
      content: intl.get('cognitiveSearch.notRetrieved')
    });
    if (!isOk) {
      setIsPrevent(true);
      return;
    }
    setIsPrevent(false);

    if (typeof url === 'string') {
      Promise.resolve().then(() => {
        history.push(url);
      });
    } else {
      Promise.resolve().then(() => {
        history.push(`/cognitive-application/domain-dbapi?id=${kwId}`);
      });
    }
  };

  /**
   * 下一步
   */
  const onNext = () => {
    setStep(step + 1);
  };

  /**
   * 上一步
   */
  const onPrev = () => {
    setStep(step - 1);
  };

  useEffect(() => {
    if (!kwId) return;
  }, [kwId]);

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
    <div className="dpapi-wrapper">
      <KwHeader onClickLogo={() => onExit('/home')} breadcrumb={breadcrumb} />
      <DataWrapper>
        <div className="dpapi-top-step-container">
          <TopSteps step={step} onExit={onExit} isHideStep={action === 1} pageAction={action} />
        </div>
        <div className={classNames('dpapi-search-content', { 'full-container': step === 1 })}>
          <div className={classNames('view-wrapper', step === 0 ? 'view-show' : 'view-hide')}>
            <FirstSQLSetting
              onNext={onNext}
              onExit={onExit}
              pageAction={action}
              setStep={setStep}
              setIsPrevent={setIsPrevent}
              id={id}
              kwId={kwId}
              onKnIdChange={setKwId}
            />
          </div>
          <div className={classNames('view-wrapper', step === 1 ? 'view-show' : 'view-hide')}>
            <SecondPublishAPI onPrev={onPrev} step={step} pageAction={action} setIsPrevent={setIsPrevent} id={id} />
          </div>
        </div>
      </DataWrapper>

      <Prompt
        when={isPrevent}
        message={() => {
          return false;
        }}
      />
    </div>
  );
};
export default DPApiService;
