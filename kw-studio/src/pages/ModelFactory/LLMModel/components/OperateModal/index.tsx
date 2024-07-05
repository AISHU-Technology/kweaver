import React, { useState, useEffect } from 'react';

import _ from 'lodash';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import { Form, Select, Input, message, ConfigProvider, Button, Tooltip } from 'antd';

import { ONLY_KEYBOARD } from '@/enums';
import IconFont from '@/components/IconFont';
import * as servicesLLMModel from '@/services/llmModel';
import UniversalModal from '@/components/UniversalModal';
import { flatObject, parseObjectPath, copyToBoard } from '@/utils/handleFunction';

import ModelIcon from '../ModelIcon';
import { OPENAI_CONFIG } from '../../enums';

import './style.less';

export interface OperateModalProps {
  className?: string;
  modelConfig?: any;
  visible?: boolean;
  action?: 'create' | 'edit' | 'check' | string;
  data?: any;
  onOk?: (action: string) => void;
  onCancel?: () => void;
}

const REG_PATTERN = /[a-zA-Z0-9!-~]+$/;
const OperateModal = (props: OperateModalProps) => {
  const { className, modelConfig, visible, action = 'create', data, onOk, onCancel } = props;
  const [form] = Form.useForm();
  const [modelOptions, setModelOptions] = useState<any[]>(_.values(modelConfig)); // 下拉模型选项
  const [formConfigs, setFormConfigs] = useState<any[]>([]); // 表单渲染数据
  const [loading, setLoading] = useState({ test: false, save: false });
  const [detail, setDetail] = useState<any>({});
  const [error, setError] = useState(false);

  useEffect(() => {
    const model_series = data?.model_series || _.keys(modelConfig)[0];
    const model_name = data?.model_name;
    onFormChange({ model_series });
    form.setFieldsValue({ model_series, 'model_config.model_name': model_name });
    !modelOptions.length && setModelOptions(_.values(modelConfig));
    if (action !== 'create' && !_.isEmpty(data)) {
      getModelDetail(data.model_id);
    }
  }, [action, data, modelConfig]);

  /**
   * 获取模型详细配置
   * @param model_id 模型id
   */
  const getModelDetail = async (model_id: string) => {
    try {
      const { res } = (await servicesLLMModel.llmModelGet({ model_id })) || {};
      if (!res) return;
      setDetail(res);
      const initValues = flatObject(_.omit(res, 'model_id'));
      // 显示时分割前缀, 编辑保存只传前缀
      const index = initValues.model_name.lastIndexOf(data.model);
      initValues.model_name = initValues.model_name.slice(0, Math.max(index, 0));
      if (initValues.model_url) initValues.model_url = window.location.origin + initValues.model_url;
      form.setFieldsValue(initValues);
      if (!modelConfig.openai) {
        setModelOptions(pre => [...pre, ..._.values(OPENAI_CONFIG)]);
      }
    } catch (err) {
      //
    }
  };

  /**
   * 表单填入值变化
   */
  const onFormChange = (changedValues: any) => {
    if ('model_series' in changedValues) {
      const { model_series } = changedValues;
      const model = modelConfig[model_series] || OPENAI_CONFIG[model_series];
      model && setFormConfigs(model.formData);
      onReset();
    }
  };

  /**
   * 切换供应商后表单重置
   */
  const onReset = () => {
    const allFormItemLabel: any = [];
    _.map(_.cloneDeep(Object.values(modelConfig)), (item: any) =>
      _.map(item?.formData, (i: any) => {
        allFormItemLabel.push(i?.field);
      })
    );
    const duplicateRemoval = [...new Set(_.concat(allFormItemLabel, []))];
    form.resetFields(duplicateRemoval);
    setError(false);
  };

  /**
   * 测试的参数
   * @param body
   */
  const getTestBody = (body: any) => {
    const model_config = { ...(detail?.model_config || {}), ...body.model_config };
    if (['aishu-Qwen', 'aishu-baichuan'].includes(body.model_series)) {
      model_config.api_type = 'openai';
    }
    return { model_config, model_series: body.model_series === 'OpenAI' ? 'openai' : body.model_series };
  };

  // 点击测试或保存
  const submit = (type: 'test' | 'save') => {
    if (loading.test || loading.save) return;
    form
      .validateFields()
      .then(async values => {
        handleSaveOrTest(values, type);
      })
      .catch(err => {
        //
      });
  };

  /**
   * 保存或测试
   */
  const handleSaveOrTest = async (values: any, type: 'test' | 'save') => {
    const fields: any = parseObjectPath(values);

    const filterModelName: any = _.omit(_.cloneDeep(fields?.model_config), ['model_name']);
    const testBody = getTestBody(fields);
    try {
      setLoading(pre => ({ ...pre, [type]: true }));
      const { res: testRes } = (await servicesLLMModel.llmModelTest(testBody)) || {};
      if (type === 'test') {
        setLoading(pre => ({ ...pre, [type]: false }));
        testRes?.status
          ? message.success(intl.get('global.testSuccessful'))
          : message.error(intl.get('llmModel.testFailed'));
        return;
      }
      if (!testRes) return;
      try {
        const body = {
          ...fields,
          model_series: fields.model_series === 'OpenAI' ? 'openai' : fields.model_series,
          model_config: { ...(detail?.model_config || {}), ...filterModelName },
          model_name: values['model_config.model_name']
        };
        if (['aishu-Qwen', 'aishu-baichuan'].includes(fields.model_series)) {
          body.model_config.api_type = 'openai';
        }
        const serviceFunc = action === 'create' ? servicesLLMModel.llmModelAdd : servicesLLMModel.llmModelEdit;
        if (action === 'create') body.model_type = testRes.model_type;
        if (action === 'edit') body.model_id = data.model_id;
        const { res: savedRes } = (await serviceFunc(body)) || {};
        setLoading(pre => ({ ...pre, [type]: false }));
        // TODO 名称重复报错
        if (savedRes) {
          message.success(intl.get('global.saveSuccess'));
          onOk?.(action);
        }
      } catch (savedErr) {
        setLoading(pre => ({ ...pre, [type]: false }));
        const { description, code } = savedErr?.response || savedErr?.data || savedErr || {};
        if (
          [
            'ModelFactory.ConnectController.LLMEdit.ParameterError',
            'ModelFactory.ConnectController.LLMAdd.ParameterError'
          ].includes(code)
        ) {
          return form.setFields([
            {
              name: action === 'create' ? 'model_config.model_name' : 'model_name',
              errors: [intl.get('global.repeatName')]
            }
          ]);
        }
        description && message.error(description);
      }
    } catch (testErr) {
      setLoading(pre => ({ ...pre, [type]: false }));
      message.error(intl.get('llmModel.testFailed'));
    }
  };

  const onCopy = async () => {
    const url = form.getFieldValue('model_url');
    const isSuccess = await copyToBoard(url);
    isSuccess && message.success(intl.get('exploreAnalysis.copySuccess'));
  };

  const renderTitle = () => {
    return {
      create: intl.get('llmModel.titleCreate'),
      edit: intl.get('llmModel.titleEdit'),
      check: intl.get('llmModel.titleCheck')
    }[action];
  };

  /**
   * API Model 填入校验
   */
  const onInputChange = (value: any) => {
    if (!value || value?.length > 50 || !REG_PATTERN.test(value)) {
      setError(true);
      return;
    }
    setError(false);
  };

  const formModelName = (item: any, component: any) => {
    const { field, label, placeholder, rules } = item;
    const disabled = action !== 'create';
    const place = disabled ? undefined : placeholder;
    return (
      <Form.Item
        key={field}
        label={label}
        name={field}
        rules={rules}
        validateFirst
        extra={
          label === 'API Model' && action === 'create' ? (
            <div className={error ? 'kw-c-error kw-mb-4' : 'kw-mt-1'}>{intl.get('prompt.inputTip')}</div>
          ) : null
        }
      >
        {
          (
            {
              input: <Input placeholder={place} disabled={disabled} onChange={e => onInputChange(e?.target?.value)} />,
              textarea: <Input.TextArea placeholder={place} rows={4} disabled={disabled} />,
              password: <Input.Password disabled={disabled} visibilityToggle={false} />
            } as any
          )[component]
        }
      </Form.Item>
    );
  };

  return (
    <ConfigProvider autoInsertSpaceInButton={false}>
      <UniversalModal
        className={classNames(className, 'llm-operate-modal-root')}
        title={renderTitle()}
        open={visible}
        onCancel={onCancel}
        footerData={
          action === 'check' ? null : (
            <>
              <Button type="default" onClick={onCancel}>
                {intl.get('global.cancel')}
              </Button>
              {action === 'create' && (
                <Button className="kw-ml-2" type="default" onClick={() => submit('test')}>
                  {loading.test && <IconFont type="icon-tongyishuaxin" spin />}
                  {intl.get('global.linkTest')}
                </Button>
              )}
              <Button className="kw-ml-2" type="primary" onClick={() => submit('save')}>
                {loading.save && <IconFont type="icon-tongyishuaxin" spin />}
                {intl.get('global.save')}
              </Button>
            </>
          )
        }
      >
        <div className="llm-operate-modal-content kw-h-100">
          <Form form={form} layout="vertical" autoComplete="off" onValuesChange={onFormChange}>
            <Form.Item
              label={intl.get('modelLibrary.modelName')}
              name="model_config.model_name"
              validateFirst
              rules={[
                { required: true, message: intl.get('global.noNull') },
                {
                  max: 50,
                  message: intl.get('global.lenErr', { len: 50 })
                },
                { pattern: ONLY_KEYBOARD, message: intl.get('global.onlyKeyboard') }
              ]}
            >
              <Input placeholder={intl.get('global.pleaseEnter')} disabled={action === 'check'} />
            </Form.Item>
            <Form.Item className="kw-mb-6" label={intl.get('llmModel.colSupplier')} name="model_series">
              <Select
                className="model-selector"
                placeholder={intl.get('global.pleaseSelect')}
                disabled={action !== 'create'}
                getPopupContainer={triggerNode => triggerNode?.parentElement || document.body}
              >
                {modelOptions.map((item: any) => {
                  const { _model, title, icon } = item;
                  return (
                    <Select.Option key={_model} value={_model}>
                      <div className="model-option kw-align-center">
                        <ModelIcon size={32} type={_model} icon={icon} />
                        <div className="kw-flex-item-full-width kw-pl-3">{title}</div>
                      </div>
                    </Select.Option>
                  );
                })}
              </Select>
            </Form.Item>

            {_.map(formConfigs, item => {
              const { field } = item;
              const disabled = action !== 'create';
              let component = item.component;
              if (disabled && _.endsWith(field, 'api_key')) {
                component = 'password';
              }
              if (!['model_config.model_name', 'model_config.api_type'].includes(field)) {
                return formModelName(item, component);
              }
            })}

            {action === 'check' && (
              <div className="url-form-item kw-flex">
                <Form.Item label="URL" name="model_url" className="kw-flex-item-full-width">
                  <Input
                    disabled
                    suffix={
                      <Tooltip title={intl.get('global.copy') + ' URL'}>
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
              </div>
            )}
          </Form>
        </div>
      </UniversalModal>
    </ConfigProvider>
  );
};

export default (props: OperateModalProps) => (props.visible ? <OperateModal {...props} /> : null);
