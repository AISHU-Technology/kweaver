import React, { useEffect, useState } from 'react';

import _ from 'lodash';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import { Button, Radio, Form, message } from 'antd';

import DragLine from '@/components/DragLine';
import PromptConfig, { isCorrectPrompt } from '@/components/PromptConfig';

import { MODEL_TYPE_TRANSLATE } from '../../enum';
import { containsTemplateTags } from '../IntentionalConfig/LModel/assistant';

import './style.less';

export default function AnswerOrganization(props: any) {
  const { testData, isSaved, configData, onPrev, onSaveConfig, updateConfig } = props;
  const [form] = Form.useForm();
  const [defaultPrompt, setDefaultPrompt] = useState('');
  const [alreadyExitLargeData, setAlreadyExitLargeData] = useState<any>([]); // 流程一添加的大模型资源
  const [value, setValue] = useState(''); // 单选框值
  const [modelErr, setModelErr] = useState<boolean>(false);

  useEffect(() => {
    onHandleLargeData();
  }, [testData?.props?.data_all_source, configData?.ans_config]);

  /**
   * 流程一添加的大模型数据提取
   */
  const onHandleLargeData = () => {
    const allSource = _.cloneDeep(testData?.props?.data_all_source);
    const filterLargeConfig = _.filter(_.cloneDeep(allSource), (item: any) =>
      ['openai', 'private_llm'].includes(item?.sub_type)
    );
    const largeModelKV = _.keyBy(filterLargeConfig, 'sub_type');
    if (largeModelKV?.[configData?.ans_config?.type]) {
      setValue(configData?.ans_config?.type);
    } else if (configData?.ans_config?.type) {
      setModelErr(true);
    }

    setDefaultPrompt(configData?.ans_config?.prompt);
    setAlreadyExitLargeData(filterLargeConfig);
  };

  /**
   * 上一步
   */
  const onClickPrev = () => {
    onPrev();
  };

  /**
   * 保存
   */
  const onClickSave = () => {
    if (!value) return setModelErr(true);
    form.validateFields().then(values => {
      if (verifyPrompt(values?.prompt)) {
        const checkParam = _.every(['subgraph', 'query'], item => containsTemplateTags(values?.prompt, [item]));
        if (!checkParam) return message.error(intl.get('cognitiveSearch.qaAdvConfig.anspromptError'));
        updateConfig({ ans_config: { type: value, prompt: values?.prompt } }); // 保存数据
        onSaveConfig({ type: value, prompt: values?.prompt });
        message.success(intl.get('global.saveSuccess'));
      }
    });
  };

  /**
   * 校验prompt
   * @param value
   */
  const verifyPrompt = (value?: string) => {
    const isCorrect = isCorrectPrompt(value);
    !isCorrect && message.error(intl.get('cognitiveSearch.promptErr'));
    return isCorrect;
  };

  /**
   * 单选框变化
   */
  const onChange = (value: string) => {
    setModelErr(false);
    setValue(value);
  };

  /**
   * 模型提示
   */
  const onModelTip = (type: string) => {
    return (
      <div className="openAiTips">
        {type === 'openai' ? (
          <>
            <p>
              {intl.get('cognitiveSearch.answersOrganization.1DataWillBeSharedOpenlyWhenUsingOpenAI').split('|')[0]}
              <span className="text-color">
                {intl.get('cognitiveSearch.answersOrganization.1DataWillBeSharedOpenlyWhenUsingOpenAI').split('|')[1]}
              </span>
            </p>
            <p>{intl.get('cognitiveSearch.answersOrganization.2IfTheOpenAIConnectionErrorOccurs')}</p>
            <p>{intl.get('cognitiveSearch.answersOrganization.3YouWillBeChargedByOpenAI')}</p>
          </>
        ) : (
          <p>{intl.get('cognitiveSearch.privateLLMTip')}</p>
        )}
      </div>
    );
  };

  return (
    <div className="qa-adv-config-answer-organization-root kw-h-100 kw-flex">
      <div className="config-content kw-flex-column">
        <div className="kw-mb-2 text-title">
          {intl.get('cognitiveSearch.answersOrganization.answersOrganizationModel')}
        </div>
        <div className="kw-w-100 card-wrap kw-pb-2">
          {_.map(alreadyExitLargeData, (item: any, index: any) => {
            const isLast = index + 1 === alreadyExitLargeData?.length;
            return (
              <div
                key={index}
                onClick={() => onChange(item?.sub_type)}
                className={classNames(
                  'organization-card-box kw-pointer',
                  {
                    'organization-selected-box': value === item?.sub_type
                  },
                  { errorBorder: modelErr },
                  { 'kw-mb-4': !modelErr || !isLast }
                )}
              >
                <div className="title-box kw-space-between">
                  <div className="title-left kw-c-text">{MODEL_TYPE_TRANSLATE[item?.sub_type]}</div>
                  <Radio.Group value={value}>
                    <Radio value={item?.sub_type} />
                  </Radio.Group>
                </div>
                {onModelTip(item?.sub_type)}
              </div>
            );
          })}
          {modelErr && <div className="errorText kw-c-error">{intl.get('global.noNull')}</div>}
        </div>
        <Form form={form} layout="vertical">
          <Form.Item
            name="prompt"
            rules={[
              { required: true, message: intl.get('global.noNull') },
              { max: 1000, message: intl.get('global.lenErr', { len: 1000 }) }
            ]}
          >
            <PromptConfig defaultPrompt={defaultPrompt} type="adv" alreadyExitLargeData={alreadyExitLargeData} />
          </Form.Item>
        </Form>
      </div>
      <div className="config-footer kw-center">
        <div>
          <Button onClick={onClickPrev}>{intl.get('global.previous')}</Button>
          <Button className="kw-ml-2" type="primary" disabled={isSaved} onClick={onClickSave}>
            {intl.get('cognitiveSearch.save')}
          </Button>
        </div>
      </div>
    </div>
  );
}
