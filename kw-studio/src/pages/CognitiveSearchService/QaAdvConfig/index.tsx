import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { tipModalFunc } from '@/components/TipModal';
import useDeepCompareEffect from '@/hooks/useDeepCompareEffect';
import TopSteps from './topSteps';
import IntentionConfig from './IntentionalConfig';
import GraphAnaConfig from './GraphAnaConfig';
import AnswerOrganization from './AnswerOrganization';
import { INIT_CONFIG } from './enums';

import './style.less';

const QaAdvanceConfig = (props: any) => {
  const {
    adv_config = INIT_CONFIG,
    testData,
    graphSources,
    onExit,
    onSave,
    setTestData,
    onUpdateTableData,
    onUpdateTableForLarge
  } = props;
  const [step, setStep] = useState<number>(0);
  const [configData, setConfigData] = useState<any>({}); // 保存流程的配置
  const [isSaved, setIsSaved] = useState<boolean>(false); // 是否保存

  useDeepCompareEffect(() => {
    setIsSaved(false);
  }, [configData]);

  useEffect(() => {
    setConfigData(adv_config);
  }, []);

  /** 退出 */
  const goBack = async () => {
    const isOk = isSaved
      ? true
      : await tipModalFunc({
          title: intl.get('intention.quit'),
          content: intl.get('intention.caution'),
          closable: false
        });
    if (!isOk) return;
    onExit();
  };

  // 下一步
  const onNext = () => {
    setStep(pre => pre + 1);
  };

  // 上一步
  const onPrev = () => {
    if (step === 0) return goBack();
    setStep(pre => pre - 1);
  };

  /** 步骤三保存，更新外部数据 */
  const onSaveConfig = (ans_config: any) => {
    if (configData?.intent_config?.model_type === 'default') {
      // 去掉参数不需要的“list”
      const intConfig = _.omit(configData?.intent_config, 'intent_list');
      onSave({ ...configData, intent_config: intConfig, ans_config });
    } else {
      onSave({ ...configData, ans_config });
    }

    setIsSaved(true);
  };

  // 更新配置数据
  const updateConfig = (data: any) => {
    setConfigData((pre: any) => ({ ...pre, ...data }));
  };

  return (
    <div className="qaAdvanceConfigRoot">
      <TopSteps step={step} onExit={goBack} />

      <div className="configRoot-container">
        <div className={classNames('view-wrapper', step === 0 ? 'show' : 'hide')}>
          <IntentionConfig
            onNext={onNext}
            onPrev={onPrev}
            configData={configData}
            updateConfig={updateConfig}
            testData={testData}
            setTestData={setTestData}
            onUpdateTableData={onUpdateTableData}
            onUpdateTableForLarge={onUpdateTableForLarge}
          />
        </div>
        <div className={classNames('view-wrapper', step === 1 ? 'show' : 'hide')}>
          <GraphAnaConfig
            graphSources={graphSources}
            configData={configData}
            updateConfig={updateConfig}
            onNext={onNext}
            onPrev={onPrev}
          />
        </div>
        <div className={classNames('view-wrapper', step === 2 ? 'show' : 'hide')}>
          <AnswerOrganization
            configData={configData}
            isSaved={isSaved}
            onSaveConfig={onSaveConfig}
            onPrev={onPrev}
            updateConfig={updateConfig}
            testData={testData}
          />
        </div>
      </div>
    </div>
  );
};
export default (props: any) => (props?.visible ? <QaAdvanceConfig {...props} /> : null);
