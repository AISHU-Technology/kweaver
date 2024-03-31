import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import _ from 'lodash';

import UniversalModal from '@/components/UniversalModal';
import { uniquePromptId } from '@/components/PromptEditor';
import { isDef } from '@/utils/handleFunction';

import VarNumberInput from '../VarNumberInput';
import VarTypeRadio from './VarTypeRadio';
import OptionList, { verifyAllOptions } from './OptionList';
import { TVariables } from '../../types';
import './style.less';
import { ONLY_KEYBOARD } from '@/enums';

export interface VariableModalProps {
  className?: string;
  action?: 'create' | 'editor' | string;
  visible?: boolean;
  variables?: TVariables;
  data?: TVariables[number]; // 编辑的数据
  onOk?: (data: TVariables[number], action: string) => void;
  onCancel?: () => void;
}

/**
 * 创建/编辑变量弹窗
 */
const VariableModal = (props: VariableModalProps) => {
  const { className, visible, action = 'create', variables, data, onOk, onCancel } = props;
  const [form] = Form.useForm();
  const [formCache, setFormCache] = useState({ field_type: 'textarea', value_type: 'i' });
  const [options, setOptions] = useState<Record<string, string>[]>([{ value: '' }]);
  const requiredRules = [{ required: true, message: intl.get('global.noNull') }];

  useEffect(() => {
    if (!data?.var_name) return;
    setFormCache(pre => ({ ...pre, field_type: data.field_type }));
    const initValues: any = _.pick(data, 'var_name', 'field_name', 'field_type');
    if (data.field_type === 'number') {
      initValues.value_type = data.value_type;
      initValues.min = data.range?.[0];
      initValues.max = data.range?.[1];
      setFormCache(pre => ({ ...pre, value_type: data.value_type! }));
    }
    if (data.field_type === 'text') initValues.max_len = data.max_len;
    if (data.field_type === 'selector') setOptions(_.map(data.options, value => ({ value })));
    form.setFieldsValue(initValues);
  }, [data]);

  const onFormChange = (changedValues: any) => {
    if ('field_type' in changedValues || 'value_type' in changedValues) {
      setFormCache(pre => ({ ...pre, ...changedValues }));
    }
    if ('min' in changedValues) {
      form.validateFields(['max']);
    }
    if ('max' in changedValues) {
      form.validateFields(['min']);
    }
  };

  const onAddOptions = () => {
    setOptions(pre => [...pre, { value: '' }]);
  };

  const validateOptions = () => {
    if (formCache.field_type !== 'selector') return true;
    const { data: verifiedData, isErr } = verifyAllOptions(options);
    isErr && setOptions(verifiedData);
    return !isErr;
  };

  const isNameRepeat = (value: string, key: 'var_name' | 'field_name') => {
    if (action === 'edit' && value === data?.[key]) return false;
    const existedNames = _.map(variables, v => v[key]);
    if (!existedNames.length) return false;
    return existedNames.includes(value);
  };

  const handleOk = () => {
    const isOptionsCorrect = validateOptions();
    form
      .validateFields()
      .then(values => {
        if (!isOptionsCorrect) return;
        const body: any = _.pick(values, 'var_name', 'field_name', 'field_type');
        body.id = data?.id || uniquePromptId();
        body.optional = !!data?.optional;
        if (formCache.field_type === 'number') {
          body.value_type = values.value_type;
          body.range = [values.min, values.max];
        }
        if (formCache.field_type === 'text') body.max_len = values.max_len;
        if (formCache.field_type === 'selector') body.options = _.map(options, o => o.value);
        onOk?.(body, action);
      })
      .catch(err => {
        //
      });
  };

  return (
    <UniversalModal
      className={classNames(className, 'mf-prompt-variable-modal')}
      title={intl.get('prompt.varSetting')}
      width={480}
      visible={visible}
      onCancel={onCancel}
      footerData={[
        { label: intl.get('global.cancel'), onHandle: onCancel },
        { label: intl.get('global.ok'), type: 'primary', onHandle: handleOk }
      ]}
    >
      <div style={{ maxHeight: 528, paddingRight: 20, overflow: 'auto' }}>
        <Form
          form={form}
          layout="vertical"
          autoComplete="off"
          initialValues={{ ...formCache, max_len: 48 }}
          onValuesChange={onFormChange}
        >
          <Form.Item
            label={intl.get('prompt.varName')}
            name="var_name"
            rules={[
              ...requiredRules,
              {
                max: 50,
                message: intl.get('global.lenErr', { len: 50 })
              },
              {
                pattern: /^[a-zA-Z0-9!-~]+$/,
                message: intl.get('dpapiService.onlyKeyboard')
              },
              {
                validator(rule, value) {
                  if (isNameRepeat(value, 'var_name')) {
                    return Promise.reject(intl.get('global.repeatName'));
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label={intl.get('prompt.fieldName')}
            name="field_name"
            rules={[
              ...requiredRules,
              {
                max: 50,
                message: intl.get('global.lenErr', { len: 50 })
              },
              {
                pattern: ONLY_KEYBOARD,
                message: intl.get('global.onlyKeyboard')
              },
              {
                validator(rule, value) {
                  if (isNameRepeat(value, 'field_name')) {
                    return Promise.reject(intl.get('global.repeatName'));
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item label={intl.get('prompt.fieldType')} name="field_type" rules={requiredRules}>
            <VarTypeRadio />
          </Form.Item>
          {formCache.field_type === 'text' && (
            <Form.Item label={intl.get('prompt.maxLen')} name="max_len" rules={requiredRules}>
              <VarNumberInput className="kw-w-100" min={1} max={256} precision={0} />
            </Form.Item>
          )}
          {formCache.field_type === 'selector' && (
            <div className="kw-mb-4">
              <div className="kw-mb-2 kw-c-header kw-required">{intl.get('prompt.option')}</div>
              <OptionList values={options} onChange={setOptions} />
              <Button
                className="add-options-btn kw-pl-0"
                type="link"
                style={{ textAlign: 'left' }}
                icon={<PlusOutlined style={{ opacity: 0.8 }} />}
                onClick={onAddOptions}
              >
                {intl.get('ontoLib.canvasOnto.addSynonyms')}
              </Button>
            </div>
          )}
          {formCache.field_type === 'number' && (
            <>
              <Form.Item label={intl.get('prompt.numType')} name="value_type" required>
                <Select>
                  <Select.Option key="int" value="i">
                    {intl.get('prompt.int')}
                  </Select.Option>
                  <Select.Option key="non-int" value="f">
                    {intl.get('prompt.float')}
                  </Select.Option>
                </Select>
              </Form.Item>
              <div className="kw-flex">
                <Form.Item
                  label={intl.get('prompt.min')}
                  name="min"
                  className="kw-w-50 kw-pr-2"
                  rules={[
                    ({ getFieldValue }) => {
                      const max = getFieldValue('max');
                      return {
                        validator(rule, value) {
                          if (!isDef(max)) return Promise.resolve();
                          if (value > max) {
                            return Promise.reject(intl.get('prompt.minTip'));
                          }
                          return Promise.resolve();
                        }
                      };
                    }
                  ]}
                >
                  <VarNumberInput className="kw-w-100" precision={formCache.value_type === 'i' ? 0 : undefined} />
                </Form.Item>
                <Form.Item
                  label={intl.get('prompt.max')}
                  name="max"
                  className="kw-w-50 kw-pl-2"
                  rules={[
                    ({ getFieldValue }) => {
                      const min = getFieldValue('min');
                      return {
                        validator(rule, value) {
                          if (!isDef(min)) return Promise.resolve();
                          if (value < min) {
                            return Promise.reject(intl.get('prompt.maxTip'));
                          }
                          return Promise.resolve();
                        }
                      };
                    }
                  ]}
                >
                  <VarNumberInput className="kw-w-100" precision={formCache.value_type === 'i' ? 0 : undefined} />
                </Form.Item>
              </div>
            </>
          )}
        </Form>
      </div>
    </UniversalModal>
  );
};

export default (props: VariableModalProps) => (props.visible ? <VariableModal {...props} /> : null);
