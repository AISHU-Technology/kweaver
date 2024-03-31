import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import _ from 'lodash';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import { Form, Select, message } from 'antd';

import cognitiveSearchService from '@/services/cognitiveSearch';

import './style.less';
import PromptConfig, { isCorrectPrompt } from '@/components/PromptConfig';

const QA_TYPE_ALL = [
  {
    value: 'default',
    label: intl.get('cognitiveSearch.answersOrganization.genericMode'),
    sub: intl.get('cognitiveSearch.answersOrganization.fasterFeedback')
  },
  { value: 'openai', label: 'OpenAI', sub: intl.get('cognitiveSearch.answersOrganization.feedbackAnswers') },
  {
    value: 'private_llm',
    label: intl.get('cognitiveSearch.privateLLM'),
    sub: intl.get('cognitiveSearch.privateLLMSub')
  }
];

const AnswerOrganizationConfig = (props: any, ref: any) => {
  const {
    visible,
    kgqaConfig,
    onSaveDefault,
    testData,
    setKgqaConfig,
    setKgqaData,
    kgqaData,
    setQaError,
    formData,
    setFormData
  } = props;
  const { onHandleSave, onHandleCancel } = props;
  const [form] = Form.useForm<any>();
  // const [formData, setFormData] = useState<any>({});
  const [defaultPrompt, setDefaultPrompt] = useState('');
  const QA_TYPE = useRef<any>(QA_TYPE_ALL);
  const selectPreRef = useRef<any>();

  useImperativeHandle(ref, () => ({
    onOk
  }));

  useEffect(() => {
    if (kgqaConfig?.ans_organize?.type === 'default' && _.isEmpty(kgqaConfig?.ans_organize)) return;
    if (kgqaConfig?.ans_organize?.type === 'default') {
      setFormData({ type: 'default' });
      form.setFieldsValue({ type: 'default' });
      return;
    }
    form.setFieldsValue(kgqaConfig?.ans_organize);
    if (!kgqaConfig?.ans_organize?.type) {
      form.validateFields();
    }
    setFormData(kgqaConfig?.ans_organize);
    setDefaultPrompt(kgqaConfig?.ans_organize?.prompt);
  }, []);

  useEffect(() => {
    const firstStepData = _.cloneDeep(testData?.props?.data_all_source);
    const alreadyExit: any = ['default'];
    _.map(_.cloneDeep(firstStepData), (item: any) => {
      if (['private_llm', 'openai'].includes(item?.sub_type)) {
        alreadyExit.push(item?.sub_type);
      }
    });
    const filterQAType = _.filter(_.cloneDeep(QA_TYPE_ALL), (item: any) => alreadyExit.includes(item?.value));
    QA_TYPE.current = filterQAType;
  }, [testData]);

  /**
   * 表单值改变
   */
  const onValuesChange = (changedValue: any, allValues: any) => {
    'type' in changedValue && resetFields();
    setFormData(allValues);
  };

  /**
   * 清除编辑器
   */
  const resetFields = () => {
    setDefaultPrompt('');
    form.setFieldsValue({
      model: '',
      api_endpoint: '',
      prompt: ''
    });
  };

  /**
   * 保存
   */
  const onOk = async () => {
    if (formData?.type === 'default') {
      onSave({}, formData?.type);
      return;
    }
    form.validateFields().then(async values => {
      if (['openai', 'private_llm'].includes(values?.type) && verifyPrompt(values?.prompt)) {
        onPromptTest(values);
      }
    });
  };

  /**
   * prompt测试连接
   */
  const onPromptTest = async (values: any) => {
    const filterData = _.filter(
      _.cloneDeep(testData?.props?.data_all_source),
      (item: any) => item?.sub_type === values?.type
    );

    const data = {
      ...filterData?.[0]?.model_conf,
      prompt: values?.prompt,
      type: filterData?.[0]?.sub_type
    };
    try {
      const { res } = await cognitiveSearchService.openAiTest(data);
      if (res) {
        onSave(values, formData?.type);
        form.scrollToField('prompt');
      }
    } catch (err) {
      const { ErrorDetails } = err?.response || err || err?.data || {};
      ErrorDetails && message.error(ErrorDetails);
    }
  };

  /**
   * Open AI 保存
   */
  const onSave = (values: any, type: string) => {
    const allSource = _.cloneDeep(testData?.props?.data_all_source);
    let largeConfig: any = {};
    _.map(_.cloneDeep(allSource), (item: any) => {
      if (item?.sub_type === type) {
        largeConfig = item?.model_conf;
      }
    });
    if (type === 'default') {
      setKgqaConfig({ ...kgqaConfig, ans_organize: { type: 'default' } });
      setKgqaData({ ...kgqaData, props: { ...kgqaData.props, ans_organize: { type: 'default' } } });
    } else {
      setKgqaConfig({ ...kgqaConfig, ans_organize: { ...largeConfig, type, prompt: values?.prompt || '' } });
      setKgqaData({
        ...kgqaData,
        props: { ...kgqaData.props, ans_organize: { ...largeConfig, type, prompt: values?.prompt || '' } }
      });
    }
    onHandleSave();
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
   * 选择框切换
   */
  const onChange = (value: any) => {
    if (selectPreRef?.current !== value) {
      form.resetFields(['prompt']);
    }
  };

  return (
    <>
      <div className="answer-organization-config-root" style={{ display: visible ? 'block' : 'none' }}>
        <Form
          form={form}
          className="contentFrom"
          name="answerOrganizationConfigFrom"
          layout="vertical"
          initialValues={{ type: kgqaConfig?.ans_organize?.type || formData?.type || 'default' }}
          onValuesChange={onValuesChange}
          autoComplete="off"
          scrollToFirstError
        >
          <Form.Item
            label={intl.get('cognitiveSearch.answersOrganization.answersOrganizationModel')}
            name="type"
            style={{ marginBottom: 8 }}
            rules={[{ required: true, message: intl.get('global.noNull') }]}
          >
            <Select getPopupContainer={triggerNode => triggerNode?.parentElement || document.body} onChange={onChange}>
              {_.map(QA_TYPE.current, item => {
                const { value, label, sub } = item;
                return (
                  <Select.Option key={value} value={value} label={label}>
                    <div>{label}</div>
                    <div className="kw-c-subtext">{sub}</div>
                  </Select.Option>
                );
              })}
            </Select>
          </Form.Item>

          {['openai', 'private_llm'].includes(formData?.type) ? (
            <>
              <div className={classNames('kw-mb-4', { 'tip-text-box': formData?.type === 'openai' })}>
                {formData?.type === 'openai' ? (
                  <div className="openAiTips">
                    <p>
                      {
                        intl
                          .get('cognitiveSearch.answersOrganization.1DataWillBeSharedOpenlyWhenUsingOpenAI')
                          .split('|')[0]
                      }
                      <span className="text-color">
                        {
                          intl
                            .get('cognitiveSearch.answersOrganization.1DataWillBeSharedOpenlyWhenUsingOpenAI')
                            .split('|')[1]
                        }
                      </span>
                    </p>
                    <p>{intl.get('cognitiveSearch.answersOrganization.2IfTheOpenAIConnectionErrorOccurs')}</p>
                    <p>{intl.get('cognitiveSearch.answersOrganization.3YouWillBeChargedByOpenAI')}</p>
                  </div>
                ) : (
                  <div className="kw-mt-4 kw-mb-3 kw-c-text">{intl.get('cognitiveSearch.privateLLMTip')}</div>
                )}
              </div>
              <Form.Item
                name="prompt"
                rules={[
                  { required: true, message: intl.get('global.noNull') },
                  { max: 1000, message: intl.get('global.lenErr', { len: 1000 }) }
                ]}
              >
                <PromptConfig defaultPrompt={defaultPrompt} type={formData?.type} />
              </Form.Item>
            </>
          ) : null}
        </Form>
      </div>
    </>
  );
};

export default forwardRef(AnswerOrganizationConfig);
