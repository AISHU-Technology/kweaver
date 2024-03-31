import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Form, Input, Select, Radio, message } from 'antd';
import intl from 'react-intl-universal';
import _ from 'lodash';
import { ONLY_KEYBOARD } from '@/enums';
import TemplateModal from '@/components/TemplateModal';
import './style.less';

// const DESC_REG = /^[!-~a-zA-Z0-9_\u4e00-\u9fa5 ！￥……（）——“”：；，。？、‘’《》｛｝【】·\s]+$/;
const { Option } = Select;
const TYPE_ENUM = [
  { key: 'int', _intl: 'dpapiService.int' },
  { key: 'string', _intl: 'dpapiService.string' },
  { key: 'double', _intl: 'dpapiService.double' },
  { key: 'boolean', _intl: 'dpapiService.boolean' },
  { key: 'array', _intl: 'dpapiService.array' }
];

const AddParamsModal = (props: any) => {
  const { entities = [], visible, parameters, selectValue, editParam, isService, onHandleOk, onCancel } = props;
  const [form] = Form.useForm();
  const containerRef = useRef<HTMLDivElement>(null);
  const [paramType, setParamType] = useState('');
  const paramNameObj = useMemo(() => {
    const keyMap = _.keyBy(parameters, 'name');
    if (editParam.name) Reflect.deleteProperty(keyMap, editParam.name);
    return keyMap;
  }, [parameters, editParam]);

  useEffect(() => {
    if (visible) {
      if (!editParam?.name) {
        form.setFieldsValue({ name: '', alias: '', example: selectValue, description: '' });
      } else {
        const { name, example, description, alias, param_type = 'string', options } = editParam;
        form.setFieldsValue({ name, example, alias, description, param_type, options });
        setParamType(param_type);
      }
    }
  }, [visible]);

  /**
   * 点击确定
   */
  const onOk = () => {
    form.validateFields().then(values => {
      onHandleOk(values);
    });
  };

  /**
   * 表单变化回调
   */
  const onValuesChange = (change: any, values: any) => {
    if (_.has(change, 'param_type')) {
      setParamType(change.param_type);
    }
  };

  return (
    <TemplateModal
      className="func-add-param-modal-root"
      title={intl.get('function.parameter')}
      width={800}
      visible={visible}
      zIndex={1052}
      onOk={onOk}
      onCancel={onCancel}
    >
      <div style={{ paddingBottom: 0 }} className="" ref={containerRef}>
        <Form form={form} layout="vertical" onValuesChange={onValuesChange}>
          <div className="kw-space-between half-row">
            <Form.Item
              label={intl.get('function.paramName')}
              name="name"
              validateFirst
              rules={[
                { required: true, message: intl.get('global.noNull') },
                { pattern: /^[\u4e00-\u9fa5_a-zA-Z0-9]+$/g, message: intl.get('global.onlyNormalName') },
                { max: 50, message: intl.get('global.lenErr', { len: 50 }) },
                {
                  validator: async (rule, value) => {
                    if (value && paramNameObj[value]) {
                      throw new Error(intl.get('global.repeatName'));
                    }
                  }
                }
              ]}
            >
              <Input placeholder={intl.get('function.variableName')} autoComplete="off" />
            </Form.Item>
            <Form.Item
              label={intl.get('function.showName')}
              name="alias"
              validateFirst
              rules={[
                { required: true, message: intl.get('global.noNull') },
                { pattern: /^[\u4e00-\u9fa5_a-zA-Z0-9]+$/g, message: intl.get('global.onlyNormalName') },
                { max: 50, message: intl.get('global.lenErr', { len: 50 }) }
              ]}
            >
              <Input placeholder={intl.get('function.enterAlias')} autoComplete="off" />
            </Form.Item>
          </div>
          <Form.Item
            name="param_type"
            label={<>{intl.get('function.paramType')}</>}
            rules={[{ required: true, message: intl.get('global.noNull') }]}
          >
            <Select
              placeholder={intl.get('global.pleaseSelect')}
              getPopupContainer={() => containerRef.current || document.body}
            >
              {_.map(TYPE_ENUM, item => (
                <Option key={item.key} value={item.key}>
                  {intl.get(item._intl)}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="example" label={intl.get('function.example')}>
            <Input disabled />
          </Form.Item>

          <Form.Item
            name="description"
            label={intl.get('global.desc')}
            rules={[
              { max: 150, message: intl.get('global.lenErr', { len: 150 }) },
              { pattern: ONLY_KEYBOARD, message: intl.get('global.onlyKeyboard') }
            ]}
          >
            <Input.TextArea placeholder={intl.get('function.enterVarDes')} autoComplete="off" />
          </Form.Item>
        </Form>
      </div>
    </TemplateModal>
  );
};

export default (props: any) => (props.visible ? <AddParamsModal {...props} /> : null);
