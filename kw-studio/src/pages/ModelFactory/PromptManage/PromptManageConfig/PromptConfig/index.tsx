import React, { useEffect, useMemo, useState, forwardRef, useImperativeHandle } from 'react';

import _ from 'lodash';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import { useHistory } from 'react-router-dom';
import { ConfigProvider, message, Form, Input, Select, Button, Tooltip } from 'antd';

import HOOKS from '@/hooks';
import { ONLY_KEYBOARD } from '@/enums';
import IconFont from '@/components/IconFont';
import { uniquePromptId } from '@/components/PromptEditor';
import { getParam, copyToBoard } from '@/utils/handleFunction';

import * as promptServices from '@/services/prompt';

import Configs from './Configs';
import { TModelParams } from '../types';
import { PROMPT_TYPES } from '../enums';
import PromptIcon from './components/PromptIcon';
import { getRememberParams } from '../../PromptHome/utils';
import CategorySelector from './components/CategorySelector';
import { getCorrectModelOptions, getDefaultModelOptions } from './utils';
import { PromptContextProvider, StoreProps, initState } from './useConfigStore';

import './style.less';

export interface PromptConfigProps {
  className?: string;
}

const getAction = () => {
  const action = getParam('action');
  return action;
};

const PromptConfig = (props: any, ref: any) => {
  const { onExit, className, projectList, setIsChange } = props;
  const [form] = Form.useForm();
  const history = useHistory();
  const [configStore, setConfigStore, getLatestStore] = HOOKS.useImmerState<StoreProps>(() => ({
    ...initState,
    action: getAction()
  }));
  const contextValue = useMemo(() => ({ configStore, setConfigStore, getLatestStore }), [configStore]);
  const [formData, setFormData] = useState<any>({ prompt_type: 'completion', icon: '5' });
  const [modelData, setModelData] = useState({ chat: [], completion: [] } as Record<string, any[]>);
  const [id, setID] = useState<any>('');
  const [isError, setIsError] = useState(false);

  useImperativeHandle(ref, () => ({ onBack, handleSave }));

  useEffect(() => {
    const { action, _category, _project } = getParam(['action', '_category', '_project']);
    if (!_.isEmpty(projectList) && action === 'create') {
      setFormData({ ...formData, prompt_item_id: _project });
      form.setFieldsValue({ prompt_item_type_id: _category });
      const info = { ...configStore?.promptInfo, prompt_type: 'completion' };
      setConfigStore(pre => ({ ...pre, promptInfo: info }));
    }
  }, [projectList]);

  useEffect(() => {
    const { action, prompt_id } = getParam(['action', 'prompt_id']);
    if (action !== 'create') {
      init();
      setID(prompt_id);
    }
  }, []);

  /**
   * 返回
   */
  const onBack = () => {
    const search = getRememberParams(configStore?.promptInfo as any);
    history.push(`/model-factory/prompt-manage${search}`);
  };

  /**
   * 编辑或查看进入
   */
  const init = async () => {
    setConfigStore((pre: any) => {
      pre.publicState = { ...pre.publicState, isEditing: getAction() !== 'check' };
    });
    const prompt_id = getParam('prompt_id');
    if (!prompt_id) return;
    try {
      const { res } = await promptServices.promptDetail({ prompt_id });
      if (!res) return;
      const { messages, model_id, model_para, opening_remarks } = res;
      const variables = _.map(res.variables, v => ({ ...v, id: uniquePromptId() }));
      setConfigStore((pre: any) => {
        pre.originInfo = _.cloneDeep(res);
        pre.promptInfo = _.cloneDeep(res);
        pre.modelOptions = model_para;
        pre.variables = variables;
        pre.enhanceConfig = { prologue: opening_remarks };
      });
      form.setFieldsValue({ ...res });
      setFormData({ ...res });
      const { editorRef } = getLatestStore();
      editorRef?.current?.init?.(messages, { variables });
      getModelList(model_id, model_para);
    } catch (err) {
      const { description } = err?.response || err?.data || err || {};
      description && message.error(description);
    }
  };

  /**
   * 获取模型
   * @param model_id 初始化的模型id
   * @param isCreate 是否是新建进入
   */
  const getModelList = async (model_id: string, oldData?: TModelParams) => {
    const { res } = (await promptServices.promptLLMList()) || {};
    if (!res?.data) return;
    const modelList = res.data;
    const modelData = _.find(modelList, d => d.model_id === model_id) || {};
    setConfigStore((pre: any) => {
      pre.modelList = modelList;
      if (!modelData) return;
      pre.modelData = modelData;
      if (oldData) {
        pre.modelOptions = getCorrectModelOptions(oldData, modelData.model_para);
      } else {
        pre.modelOptions = getDefaultModelOptions(modelData.model_para);
      }
    });
  };

  /**
   * Form表单变化
   */
  const onFormChange = (changedValues: any) => {
    if ('prompt_type' in changedValues) {
      const { prompt_type } = changedValues;
      setFormData((pre: any) => ({ ...pre, prompt_type }));
      setConfigStore(pre => ({ ...pre, promptInfo: changedValues }));
      const model_id = form.getFieldValue('model_id');
      if (model_id && !_.find(modelData[prompt_type], item => item.model_id === model_id)) {
        form.setFieldsValue({ model_id: undefined });
      }
    }
    setIsChange(true);
    setFormData({ ...formData, ...changedValues });
  };

  /**
   * 选择颜色变化
   */
  const onChange = (e: any) => {
    setIsChange(true);
    setFormData((pre: any) => ({ ...pre, icon: e }));
  };

  /**
   * 表单提交校验
   */
  const submit = () => {
    form
      .validateFields()
      .then(values => {
        const valueTrim = values?.prompt_name?.trim?.();
        if (!valueTrim) {
          form.setFields([{ name: 'prompt_name', errors: [intl.get('global.noNull')] }]);
          return;
        }

        form.setFieldsValue({ prompt_name: valueTrim });
        handleSave({ ...values, prompt_name: valueTrim });
      })
      .catch(err => {
        //
      });
  };

  /**
   * 保存
   */
  const handleSave = async (values?: any) => {
    const { promptInfo, enhanceConfig, variables } = configStore;
    if (!promptInfo?.messages) {
      setIsError(true);
      return;
    }
    const info = values || _.pick(formData, ['prompt_name', 'icon', 'prompt_desc']);
    let data: any = {};
    data = {
      ...info,
      icon: formData?.icon,
      prompt_item_id: formData?.prompt_item_id,
      messages: promptInfo?.messages,
      variables
    };
    if (promptInfo?.prompt_type === 'chat') {
      data.opening_remarks = enhanceConfig?.prologue;
    }

    const { action, prompt_id, _project, _category } = getParam(['action', 'prompt_id', '_category', '_project']);
    if (action === 'edit') {
      data.prompt_id = prompt_id;
      data = _.omit(data, ['prompt_type']);
    }

    const servicesFunc = action === 'create' ? promptServices.promptAdd : promptServices.managePromptEdit;

    try {
      const { res } = (await servicesFunc(data)) || {};
      if (res) {
        message.success(intl.get('global.saveSuccess'));
        setIsChange(false);
        const info = {
          ...configStore?.promptInfo,
          prompt_id: res?.prompt_id,
          prompt_item_id: formData?.prompt_item_id,
          prompt_item_type_id: values?.prompt_item_type_id
        };
        setConfigStore(pre => ({ ...pre, promptInfo: info }));
        if (action === 'create') {
          history.push(
            `${window.location.pathname}?_project=${_project}&_category=${_category}&action=edit&prompt_id=${res?.prompt_id}&name=${values?.prompt_name}`
          );
        }
      }
    } catch (err) {
      const { description, code } = err?.response || err?.data || err || {};
      if (
        code === 'ModelFactory.PromptController.PromptNameEdit.NameError' ||
        code === 'ModelFactory.PromptController.PromptAdd.NameError'
      ) {
        form.setFields([
          {
            name: 'prompt_name',
            errors: [intl.get('global.repeatName')]
          }
        ]);
        return;
      }
      description && message.error(description);
    }
  };

  /**
   * 复制ID
   */
  const onCopy = () => {
    copyToBoard(id);
    message.success(intl.get('global.copySuccess'));
  };

  return (
    <div className={classNames(className, 'kw-w-100 kw-flex manage-mf-prompt-config-root kw-h-100')}>
      <ConfigProvider autoInsertSpaceInButton={false}>
        <PromptContextProvider value={contextValue}>
          <div className="prompt-config-main kw-flex kw-mb-6 kw-pl-6 kw-pr-6 kw-pt-8">
            <div className="main-content">
              <Form
                form={form}
                layout="vertical"
                autoComplete="off"
                initialValues={{ ...formData, prompt_desc: '' }}
                onValuesChange={onFormChange}
                className="prompt-form"
              >
                {configStore?.action === 'edit' ? (
                  <Form.Item
                    label={intl.get('prompt.id')}
                    name="prompt_id"
                    hidden={configStore?.action !== 'edit'}
                    rules={[
                      { required: true, message: intl.get('global.pleaseSelect') },
                      { max: 20, message: intl.get('global.lenErr', { len: 20 }) },
                      { pattern: /\w/, message: intl.get('global.onlyMetacharacters') }
                    ]}
                  >
                    <Input
                      disabled={true}
                      suffix={
                        <Tooltip title={intl.get('global.copy') + ' ID'}>
                          <div
                            className="kw-pointer"
                            style={{ width: 24, height: 24, textAlign: 'center' }}
                            onClick={onCopy}
                          >
                            <IconFont type="icon-copy" style={{ color: 'var(--kw-text-color)' }} />
                          </div>
                        </Tooltip>
                      }
                    />
                  </Form.Item>
                ) : null}

                <Form.Item
                  label={intl.get('prompt.promptName')}
                  name="prompt_name"
                  validateFirst
                  rules={[
                    { required: true, message: intl.get('global.noNull') },
                    { max: 50, message: intl.get('global.lenErr', { len: 50 }) },
                    { pattern: ONLY_KEYBOARD, message: intl.get('global.onlyKeyboard') }
                  ]}
                >
                  <Input placeholder={intl.get('global.pleaseEnter')} />
                </Form.Item>
                <Form.Item
                  label={intl.get('prompt.promptType')}
                  name="prompt_type"
                  rules={[{ required: true, message: intl.get('global.pleaseSelect') }]}
                >
                  <Select disabled={configStore?.action === 'edit'}>
                    {PROMPT_TYPES.map(item => {
                      return (
                        <Select.Option key={item?.key}>
                          <div>
                            <div className="kw-align-center kw-mb-2">
                              <IconFont type={item.icon} className="kw-mr-2" style={{ fontSize: 16 }} />
                              <div>{item.label}</div>
                            </div>
                            <div className="kw-c-subtext kw-ellipsis-2" style={{ lineHeight: '18px', fontSize: 12 }}>
                              {item.desc}
                            </div>
                          </div>
                        </Select.Option>
                      );
                    })}
                  </Select>
                </Form.Item>
                <Form.Item
                  label={intl.get('prompt.selectGroup')}
                  name="prompt_item_type_id"
                  rules={[{ required: true, message: intl.get('global.pleaseSelect') }]}
                >
                  <CategorySelector
                    projectList={projectList}
                    onProjectChange={prompt_item_id => {
                      setIsChange(true);
                      form.setFieldsValue({ prompt_item_id });
                      setFormData({ ...formData, prompt_item_id });
                    }}
                  />
                </Form.Item>
                <Form.Item
                  label={
                    <div>
                      {intl.get('prompt.prompt')}{' '}
                      <Tooltip title={intl.get('prompt.varWarning4')}>
                        <IconFont type="icon-wenhao" className="kw-c-subtext kw-ml-1" />
                      </Tooltip>
                    </div>
                  }
                  required
                  name="variables"
                >
                  <Configs isError={isError} setIsError={setIsError} setIsChange={setIsChange} formData={formData} />
                </Form.Item>
                <Form.Item
                  label={intl.get('global.desc')}
                  name="prompt_desc"
                  validateFirst
                  rules={[
                    { max: 255, message: intl.get('global.lenErr', { len: 255 }) },
                    { pattern: ONLY_KEYBOARD, message: intl.get('global.onlyKeyboard') }
                  ]}
                >
                  <Input.TextArea placeholder={intl.get('global.pleaseEnter')} rows={4} />
                </Form.Item>
                <Form.Item label={intl.get('prompt.colorTwo')} name="icon" required>
                  <div className="kw-align-center">
                    {Array.from({ length: 10 }, (v, i) => i).map(i => (
                      <PromptIcon
                        key={i}
                        className={classNames('icon-radio-item kw-mr-5 kw-pointer', {
                          'kw-ml-2': !i,
                          checked: String(formData?.icon) === String(i)
                        })}
                        type={formData?.prompt_type}
                        icon={i}
                        onClick={() => onChange(String(i))}
                      />
                    ))}
                  </div>
                </Form.Item>
              </Form>
            </div>
          </div>
        </PromptContextProvider>
      </ConfigProvider>
      <div className="footer-box kw-pt-3 kw-pb-3 kw-center kw-w-100">
        <Button className="kw-mr-3" onClick={onExit}>
          {intl.get('global.cancel')}
        </Button>
        <Button type="primary" onClick={() => submit()}>
          {intl.get('global.save')}
        </Button>
      </div>
    </div>
  );
};

export default forwardRef(PromptConfig);
