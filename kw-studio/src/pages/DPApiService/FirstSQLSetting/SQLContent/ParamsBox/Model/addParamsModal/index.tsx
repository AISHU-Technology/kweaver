import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Form, Input, Select, Radio, message } from 'antd';
import intl from 'react-intl-universal';
import _ from 'lodash';
import TemplateModal from '@/components/TemplateModal';
import UniversalModal from '@/components/UniversalModal';
import ExplainTip from '@/components/ExplainTip';
import './style.less';
import SelectConfigTags from '@/pages/CognitiveService/AnalysisServiceConfig/ConfigAndTest/ConfigPanel/SelectConfigTags';

const DESC_REG = /^[!-~a-zA-Z0-9_\u4e00-\u9fa5 ！￥……（）——“”：；，。？、‘’《》｛｝【】·\s]+$/;
const { Option } = Select;

const TYPE_ENUM = [
  { key: 'int', _intl: 'dpapiService.int' },
  { key: 'string', _intl: 'dpapiService.string' },
  { key: 'double', _intl: 'dpapiService.double' },
  { key: 'boolean', _intl: 'dpapiService.boolean' },
  { key: 'array', _intl: 'dpapiService.array' }
];

const CustomRadio = (props: any) => (
  <>
    <span className="custom-label required kw-mr-5">{intl.get('function.options')}</span>
    <Radio.Group {...props}>
      <Radio className="kw-mr-9" value={'single'}>
        {intl.get('function.single')}
      </Radio>
      <Radio value={'multiple'}>{intl.get('function.multiple')}</Radio>
    </Radio.Group>
  </>
);

const AddParamsModal = (props: any) => {
  const { entities = [], visible, parameters, selectValue, editParam, isService, onHandleOk, onCancel } = props;
  const [form] = Form.useForm();
  const containerRef = useRef<HTMLDivElement>(null);
  const [paramType, setParamType] = useState('');
  const [entityClasses, setEntityClasses] = useState<any[]>([]); // 实体类绑定的tags
  const paramNameObj = useMemo(() => {
    const keyMap = _.keyBy(parameters, 'name');
    if (editParam.name) Reflect.deleteProperty(keyMap, editParam.name);
    return keyMap;
  }, [parameters, editParam]);

  useEffect(() => {
    if (visible) {
      if (!editParam?.name) {
        const tag = _.map(entities, e => e?.name);
        const selectTags = paramType === 'entity' && isService ? tag : undefined;
        setEntityClasses(tag);
        form.setFieldsValue({ name: '', alias: '', example: selectValue, description: '', entity_classes: selectTags });
      } else {
        const { name, example, description, alias, param_type = 'string', options, entity_classes } = editParam;
        // 从函数管理引用的函数没有entity_classes这个字段
        const selectTags =
          param_type === 'entity' && isService ? entity_classes || _.map(entities, e => e?.name) : entityClasses;
        setEntityClasses(selectTags);
        form.setFieldsValue({ name, example, alias, description, param_type, options, entity_classes: selectTags });
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
      if (change.param_type === 'entity') {
        form.setFieldsValue({ options: 'single' });
        form.setFieldsValue({ entity_classes: entityClasses });
      }
    }
  };

  return (
    <UniversalModal
      className="func-add-param-modal-root"
      title={intl.get('dpapiService.parameter')}
      width={800}
      open={visible}
      zIndex={1052}
      onOk={onOk}
      onCancel={onCancel}
      footerData={[
        { label: intl.get('global.cancel'), onHandle: onCancel },
        { label: intl.get('global.ok'), type: 'primary', onHandle: onOk }
      ]}
    >
      <div ref={containerRef}>
        <Form form={form} layout="vertical" onValuesChange={onValuesChange}>
          <div className="kw-space-between half-row">
            <Form.Item
              label={intl.get('dpapiService.paramName')}
              name="name"
              validateFirst
              rules={[
                { required: true, message: intl.get('subscription.cannotNull') },
                { pattern: /^[\u4e00-\u9fa5_a-zA-Z0-9]+$/g, message: intl.get('global.onlyNormalName') },
                { max: 50, message: intl.get('global.lenErr', { len: 50 }) },
                {
                  validator: async (rule, value) => {
                    if (value && paramNameObj[value]) {
                      throw new Error(intl.get('dpapiService.existName'));
                    }
                  }
                }
              ]}
            >
              <Input placeholder={intl.get('dpapiService.variableName')} autoComplete="off" />
            </Form.Item>
            <Form.Item
              label={intl.get('dpapiService.showName')}
              name="alias"
              validateFirst
              rules={[
                { required: true, message: intl.get('subscription.cannotNull') },
                { pattern: /^[\u4e00-\u9fa5_a-zA-Z0-9]+$/g, message: intl.get('global.onlyNormalName') },
                { max: 50, message: intl.get('global.lenErr', { len: 50 }) }
              ]}
            >
              <Input placeholder={intl.get('dpapiService.enterAlias')} autoComplete="off" />
            </Form.Item>
          </div>
          <Form.Item
            name="param_type"
            label={intl.get('dpapiService.paramType')}
            rules={[{ required: true, message: intl.get('subscription.cannotNull') }]}
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
          {isService && paramType === 'entity' && (
            <Form.Item
              name="entity_classes"
              label={
                <>
                  {intl.get('function.entityRange')}
                  <ExplainTip title={intl.get('function.entityRangeTip')} />
                </>
              }
              rules={[{ required: true, message: intl.get('cognitiveService.neighbors.notNull') }]}
              validateFirst={true}
            >
              <SelectConfigTags classList={entities} value={[]} onChange={() => {}} />
            </Form.Item>
          )}
          {paramType === 'entity' && (
            <Form.Item
              className="method-row"
              name="options"
              rules={[{ required: true, message: intl.get('global.pleaseSelect') }]}
            >
              <CustomRadio />
            </Form.Item>
          )}

          <Form.Item name="example" label={intl.get('dpapiService.example')}>
            <Input disabled />
          </Form.Item>

          <Form.Item
            name="description"
            label={intl.get('global.desc')}
            rules={[
              { max: 150, message: intl.get('global.lenErr', { len: 150 }) },
              { pattern: DESC_REG, message: intl.get('global.onlyKeyboard') }
            ]}
          >
            <Input.TextArea placeholder={intl.get('dpapiService.enterVarDes')} autoComplete="off" />
          </Form.Item>
        </Form>
      </div>
    </UniversalModal>
  );
};

export default (props: any) => (props.visible ? <AddParamsModal {...props} /> : null);
