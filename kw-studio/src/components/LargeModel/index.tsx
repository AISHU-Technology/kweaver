import React, { useState, useRef, useEffect } from 'react';

import _ from 'lodash';
import intl from 'react-intl-universal';
import { Form, Input, Button, ConfigProvider, message, Select } from 'antd';

import IconFont from '@/components/IconFont';
import UniversalModal from '@/components/UniversalModal';

import cognitiveSearchService from '@/services/cognitiveSearch';

import OpenAIForm from './OpenAIForm';
import PrivateModelForm from './PrivateModelForm';
import { isCorrectPrompt } from '@/components/PromptConfig';

import './style.less';

export type LargeModelType = {
  visible: boolean;
  data?: any; // 编辑时数据
  onHandleCancel: (data?: any) => void; // 关闭弹窗
  onCreateLargeModel: (data: any) => void; // 新增|编辑保存函数;
  onUpdateTableForLarge?: (data: any) => void;
};

const FORM_ITEM_NAME = ['model', 'api_endpoint', 'api_version', 'api_version', 'api_key', 'api_type'];
const LargeModel = (props: LargeModelType) => {
  const { visible, data, onHandleCancel, onCreateLargeModel, onUpdateTableForLarge } = props;
  const [form] = Form.useForm();
  const [testDisable, setTestDisable] = useState(false); // 测试链接
  const [saveDisable, setSaveDisable] = useState(false); // 保存
  const [formData, setFormData] = useState<any>({}); // 表单信息
  const [loading, setLoading] = useState(false); // 加载loading
  const prevSubTypeRef = useRef<any>();
  const [isVersionEndPoint, setIsVersionEndPoint] = useState(false); // version | endpoint是否必填报错
  const QA_TYPE = useRef([
    { value: 'openai', label: 'OpenAI', sub: intl.get('cognitiveSearch.answersOrganization.feedbackAnswers') },
    {
      value: 'private_llm',
      label: intl.get('cognitiveSearch.privateLLM'),
      sub: intl.get('cognitiveSearch.privateLLMSub')
    }
  ]);

  useEffect(() => {
    form.setFieldsValue({ ...data });
    setFormData({ ...data });
  }, [data]);

  /**
   * 测试连接
   */
  const testAnswerOrganization = async (type: string) => {
    return new Promise((resolve, reject) => {
      form.validateFields().then(async values => {
        const addData: any = onCreateLargeModel(values);
        if (addData?.errorExitName) return;
        try {
          if (type === 'test') {
            setTestDisable(true);
          } else {
            setSaveDisable(true);
          }
          // 请求测试接口
          setLoading(true);
          let data: any = {};
          _.map(_.cloneDeep(values), (item: any, index: any) => {
            if (index !== 'resource_type') {
              data = { ...data, [index === 'sub_type' ? 'type' : index]: item };
            }
          });
          const { res } = await cognitiveSearchService.openAiTest(data);
          if (res) {
            if (type === 'save') {
              setSaveDisable(false);
              onUpdateTableForLarge?.(addData);
            } else {
              setTestDisable(false);
              message.success(intl.get('cognitiveSearch.answersOrganization.testConnected'));
            }
            setLoading(false);
          }
          resolve(values);
        } catch (err) {
          const { ErrorDetails } = err?.response || err?.data || err || {};
          const errorTip =
            typeof ErrorDetails?.[0]?.detail === 'object'
              ? JSON.stringify(ErrorDetails?.[0]?.detail)
              : ErrorDetails?.[0]?.detail;
          setLoading(false);
          setTestDisable(false);
          setSaveDisable(false);
          message.error(errorTip);
          reject(err);
        }
      });
    });
  };

  /**
   * form表单变化
   */
  const onValuesChange = (changedValue: any, allValues: any) => {
    'type' in changedValue && resetFields();
    if (changedValue?.sub_type) {
      form.resetFields(FORM_ITEM_NAME);
      prevSubTypeRef.current = changedValue?.sub_type;
      setFormData(allValues);
      return;
    }
    setFormData(allValues);
  };

  /**
   * 清除编辑器
   */
  const resetFields = () => {
    form.setFieldsValue({
      model: '',
      api_endpoint: '',
      prompt: ''
    });
  };

  /**
   * 测试连接
   */
  const onHandleTest = async () => {
    if (testDisable) return;
    await testAnswerOrganization('test');
  };

  /**
   * 确定
   */
  const onOk = async () => {
    testAnswerOrganization('save');
  };

  const onInputChange = (e: any) => {
    const value = e?.target?.value;
    if (['azure', 'azure_ad'].includes(value.toLowerCase())) {
      setIsVersionEndPoint(true);
    } else {
      setIsVersionEndPoint(false);
      form.resetFields(['api_version', 'api_endpoint']);
    }
  };

  /**
   * 弹窗底部按钮
   */
  const onFooterBtn = () => {
    return (
      <ConfigProvider autoInsertSpaceInButton={false}>
        <Button type="default" onClick={onHandleCancel}>
          {intl.get('global.cancel')}
        </Button>
        {formData?.sub_type ? (
          <Button type="default" onClick={onHandleTest} disabled={testDisable && loading}>
            {testDisable && <IconFont type="icon-tongyishuaxin" spin />}
            {intl.get('cognitiveSearch.resource.testConnect')}
          </Button>
        ) : null}
        <Button type="primary" onClick={onOk} disabled={saveDisable && loading}>
          {saveDisable && <IconFont type="icon-tongyishuaxin" spin />}
          {intl.get('global.ok')}
        </Button>
      </ConfigProvider>
    );
  };

  return (
    <UniversalModal
      className="config-search-first-step-large-model-root"
      title={
        _.isEmpty(data)
          ? intl.get('cognitiveSearch.resource.addResource')
          : intl.get('cognitiveSearch.resource.editResource')
      }
      visible={visible}
      destroyOnClose={true}
      onCancel={onHandleCancel}
      width={640}
      afterClose={() => {
        form.resetFields();
        setFormData({});
      }}
      footerData={onFooterBtn()}
    >
      <Form
        form={form}
        layout={'vertical'}
        initialValues={{ resource_type: intl.get('cognitiveSearch.largeModel') }}
        onValuesChange={onValuesChange}
        autoComplete="off"
      >
        <Form.Item
          name="resource_type"
          label={intl.get('cognitiveSearch.resource.resourceType')}
          rules={[{ required: true }]}
        >
          <Input disabled />
        </Form.Item>
        <Form.Item
          label={intl.get('modelService.mType')}
          name="sub_type"
          style={{ marginBottom: 24 }}
          rules={[{ required: true, message: intl.get('global.noNull') }]}
        >
          <Select
            getPopupContainer={triggerNode => triggerNode?.parentElement || document.body}
            placeholder={intl.get('cognitiveSearch.select')}
          >
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
        {formData?.sub_type === 'openai' && (
          <OpenAIForm isVersionEndPoint={isVersionEndPoint} onInputChange={onInputChange} />
        )}
        {formData?.sub_type === 'private_llm' && <PrivateModelForm />}
      </Form>
    </UniversalModal>
  );
};

export default LargeModel;
