import React, { useEffect, useMemo } from 'react';
import { Form, Input, Select } from 'antd';
import intl from 'react-intl-universal';
import { v4 as generateUuid } from 'uuid';
import _ from 'lodash';
import TemplateModal from '@/components/TemplateModal';
import UniversalModal from '@/components/UniversalModal';
import { defaultNodeDoubleClick } from '../enums';

const { Option } = Select;

const EditConfigModal = (props: any) => {
  const { visible, action, data = {}, totalConfig, onOk, onCancel } = props;
  const [form] = Form.useForm();
  const aliasRule = [
    { required: true, message: intl.get('global.noNull') },
    { pattern: /^[\u4e00-\u9fa5_a-zA-Z0-9]+$/g, message: intl.get('global.onlyNormalName') },
    {
      max: 50,
      message: intl.get('global.lenErr', { len: 50 })
    }
  ];

  // 暂时对 隐藏/取消隐藏 特殊处理
  const isMultipleKey = useMemo(() => _.split(data?.key, '_').pop() === 'hide&show', [data?.key]);

  useEffect(() => {
    form.setFieldsValue({ ...data });
  }, []);

  const optionList: any[] = useMemo(() => {
    if (action !== 'change') return [];
    const totalConfigArr = _.values(totalConfig);
    const customConfigs = _.filter(totalConfigArr, c => c.type === 'custom' && c.pKey === 'nodeRightClick_extensions');
    customConfigs.unshift(defaultNodeDoubleClick);
    return customConfigs;
  }, [action, totalConfig]);

  const handleOk = async () => {
    await form
      .validateFields()
      .then(values => {
        if (action === 'edit') {
          const newData = _.pick(values, 'name', 'alias');
          if (isMultipleKey) {
            newData.alias = `${values.alias1}/${values.alias2}`;
          }
          return onOk({ ...data, ...newData });
        }
        // 切换
        const option = _.find(optionList, o => o.name === values.name);
        onOk({
          ...option,
          type: 'default',
          bind: option.type === 'custom' ? option.key : undefined,
          key: option.type === 'custom' ? generateUuid() : option.key
        });
      })
      .catch(() => {
        //
      });
  };

  return (
    <UniversalModal
      width={480}
      className="add-canvas-config-modal"
      title={action === 'edit' ? intl.get('global.edit') : intl.get('analysisService.changeEvt')}
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      footerData={[
        { label: intl.get('global.cancel'), onHandle: onCancel },
        { label: intl.get('global.ok'), type: 'primary', onHandle: handleOk }
      ]}
    >
      <div className="main-content" style={{ minHeight: action === 'edit' ? 140 : 0 }}>
        <Form form={form} layout="vertical" requiredMark={false}>
          {action === 'edit' ? (
            <>
              <Form.Item label={intl.get('analysisService.funcName')} name="name">
                <Input disabled />
              </Form.Item>
              {isMultipleKey ? (
                <>
                  <Form.Item
                    label={intl.get('analysisService.alias') + 1}
                    name="alias1"
                    validateFirst
                    rules={aliasRule}
                  >
                    <Input placeholder={intl.get('analysisService.pleaseAlias')} autoComplete="off" />
                  </Form.Item>
                  <Form.Item
                    label={intl.get('analysisService.alias') + 2}
                    name="alias2"
                    validateFirst
                    rules={aliasRule}
                  >
                    <Input placeholder={intl.get('analysisService.pleaseAlias')} autoComplete="off" />
                  </Form.Item>
                </>
              ) : (
                <Form.Item label={intl.get('analysisService.alias')} name="alias" validateFirst rules={aliasRule}>
                  <Input placeholder={intl.get('analysisService.pleaseAlias')} autoComplete="off" />
                </Form.Item>
              )}
            </>
          ) : (
            <Form.Item
              label={intl.get('analysisService.funcName')}
              name="name"
              validateFirst
              rules={[{ required: true, message: intl.get('global.noNull') }]}
            >
              <Select placeholder={intl.get('analysisService.pleaseSelectName')}>
                {_.map(optionList, item => (
                  <Option key={item.name} value={item.name}>
                    {item.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}
        </Form>
      </div>
    </UniversalModal>
  );
};

export default (props: any) => (props.visible ? <EditConfigModal {...props} /> : null);
