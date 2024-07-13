import React, { useState, useEffect } from 'react';
import { Form, Input, message, Radio, Select, Empty } from 'antd';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { v4 as generateUuid } from 'uuid';
import { ONLY_KEYBOARD } from '@/enums';
import TemplateModal from '@/components/TemplateModal';
import UniversalModal from '@/components/UniversalModal';
import kongImg from '@/assets/images/kong.svg';
import './style.less';

const DES_REG = /^[\s\n\u4e00-\u9fa5a-zA-Z0-9!-~？！，、；：“”‘'（）《》【】～￥—]+$/;

export interface OperateModalProps {
  type?: 'save' | 'edit';
  visible: boolean;
  data: Record<string, any>;
  selectedItem?: any;
  onCancel?: () => void;
  onChangeData?: (data: any) => void;
}

const OperateModal = (props: OperateModalProps) => {
  const { type = 'save', visible, data, selectedItem, onCancel, onChangeData } = props;
  const [form] = Form.useForm();
  const [saveType, setSaveType] = useState('create'); // create 新建; cover覆盖
  const slicedList = selectedItem?.sliced || [];

  useEffect(() => {
    data.id && form.setFieldsValue({ ..._.pick(data, 'name', 'description') });
  }, [data]);

  const onFormChange = (changedValues: any) => {
    if (changedValues.saveType) {
      setSaveType(changedValues.saveType);
      form.setFieldsValue({ name: undefined, description: '' });
    }
  };

  /**
   * 保存
   * @param formValues 表单数据
   */
  const handleSave = (formValues: Record<string, any>) => {
    if (data.nodes?.length > 1000) {
      return message.error(intl.get('exploreGraph.sliceLimitTip'));
    }
    if (formValues.saveType === 'create' && slicedList.length > 100) {
      return message.error(intl.get('exploreGraph.sliceMaxTip'));
    }
    const newSlicedList = [...slicedList];
    const info = {
      name: formValues.name,
      description: formValues.description
    };
    if (formValues.saveType === 'cover') {
      const index = _.findIndex(slicedList, (d: any) => d.name === formValues.name);
      newSlicedList[index] = { ...data, ...info, id: slicedList[index].id };
    } else {
      newSlicedList.unshift({ ...data, ...info, id: generateUuid() });
    }
    onChangeData?.({ type: 'sliced', data: newSlicedList });
    onCancel?.();
    message.success(intl.get('global.saveSuccess'));
    // TODO 是否需要更新画布？
  };

  /**
   * 编辑
   * @param formValues 表单数据
   */
  const handleEdit = (formValues: Record<string, any>) => {
    const newSlicedList = [...slicedList];
    const index = _.findIndex(slicedList, (d: any) => d.name === data.name);
    newSlicedList[index] = { ...data, ..._.pick(formValues, 'name', 'description') };
    onChangeData?.({ type: 'sliced', data: newSlicedList });
    onCancel?.();

    // 若修改的切片存在画布中, 则更新名称
    const groupInstance = selectedItem.graph.current.__getSubGroupById(data.id);
    if (!groupInstance) return;
    groupInstance.updateCfg({ name: formValues.name });
  };

  /**
   * 点击确定
   */
  const handleOk = () => {
    form.validateFields().then(values => {
      type === 'save' ? handleSave(values) : handleEdit(values);
    });
  };

  return (
    <UniversalModal
      className="sliced-op-modal"
      title={type === 'save' ? intl.get('exploreGraph.sliceSave') : intl.get('exploreGraph.sliceEdit')}
      zIndex={2000}
      open={visible}
      onCancel={onCancel}
      onOk={handleOk}
      footerData={[
        { label: intl.get('global.cancel'), onHandle: onCancel },
        { label: intl.get('global.ok'), type: 'primary', onHandle: handleOk }
      ]}
    >
      <div className="main-content">
        <Form form={form} layout="vertical" initialValues={{ saveType: 'create' }} onValuesChange={onFormChange}>
          {type === 'save' && (
            <Form.Item className="type-row kw-mb-3" label={intl.get('exploreGraph.saveType')} name="saveType">
              <Radio.Group>
                <Radio className="kw-mr-8" value="create">
                  {intl.get('exploreGraph.newSave')}
                </Radio>
                <Radio value="cover" disabled={!slicedList.length}>
                  {intl.get('exploreGraph.coverSave')}
                </Radio>
              </Radio.Group>
            </Form.Item>
          )}
          <Form.Item
            label={intl.get('exploreGraph.sliceName')}
            name="name"
            validateFirst
            rules={[
              { required: true, message: intl.get('global.noNull') },
              { pattern: /^[\u4e00-\u9fa5_a-zA-Z0-9]+$/g, message: intl.get('global.onlyNormalName') },
              { max: 50, message: intl.get('global.lenErr', { len: 50 }) },
              {
                validator: async (rule, value) => {
                  let isExist = false;
                  if (type === 'edit') {
                    isExist = _.some(slicedList, d => d.name === value && d.id !== data.id);
                  }
                  if (type === 'save' && saveType === 'create') {
                    isExist = _.some(slicedList, d => value === d.name);
                  }
                  return isExist && Promise.reject(intl.get('global.repeatName'));
                }
              }
            ]}
          >
            {saveType === 'create' ? (
              <Input placeholder={intl.get('exploreGraph.sliceNamePlace')} autoComplete="off" />
            ) : (
              <Select
                showSearch
                placeholder={intl.get('exploreGraph.sliceSelect')}
                getPopupContainer={triggerNode => triggerNode.parentElement!}
                notFoundContent={<Empty image={kongImg} description={intl.get('global.noData')} />}
                onChange={(v, options: any) => form.setFieldsValue({ description: options.data?.description })}
              >
                {_.map(slicedList, item => (
                  <Select.Option key={item.name} data={item}>
                    {item.name}
                  </Select.Option>
                ))}
              </Select>
            )}
          </Form.Item>
          <Form.Item
            name="description"
            label={intl.get('global.desc')}
            rules={[
              { max: 255, message: intl.get('global.lenErr', { len: 255 }) },
              { pattern: ONLY_KEYBOARD, message: intl.get('global.onlyKeyboard') }
            ]}
          >
            <Input.TextArea
              placeholder={intl.get('exploreGraph.sliceDescPlace')}
              rows={4}
              autoComplete="off"
            ></Input.TextArea>
          </Form.Item>
        </Form>
      </div>
    </UniversalModal>
  );
};

export default (props: OperateModalProps) => (props.visible ? <OperateModal {...props} /> : null);
