import React, { useEffect } from 'react';
import { Input, Form } from 'antd';
import intl from 'react-intl-universal';
import TemplateModal from '@/components/TemplateModal';
import UniversalModal from '@/components/UniversalModal';
import './style.less';

type SetErrFunc = (err: { name: string; errors: any[] }) => void;
type OnOkFunc = (type: GroupOpModalProps['type'], group: Record<string, any>, setErr?: SetErrFunc) => void;

export interface GroupOpModalProps {
  visible: boolean;
  type: 'create' | 'edit' | string;
  group?: Record<string, any>;
  onOk: OnOkFunc;
  onCancel: () => void;
}

const GroupOpModal = (props: GroupOpModalProps) => {
  const { visible, type, group = {}, onOk, onCancel } = props;
  const [form] = Form.useForm();

  useEffect(() => {
    type === 'edit' && form.setFieldsValue(group);
  }, [type, group]);

  const handleOk = () => {
    form
      .validateFields()
      .then(async values => {
        const setErr: SetErrFunc = err => form.setFields([{ ...err }]);
        onOk(type, { ...group, ...values }, setErr);
      })
      .catch(err => {
        // none
      });
  };

  return (
    <UniversalModal
      className="graph-group-op-modal"
      open={visible}
      title={intl.get(`createEntity.${type === 'edit' ? 'updateGroupBtn' : 'createGroupBtn'}`)}
      onOk={handleOk}
      onCancel={onCancel}
      footerData={[
        { label: intl.get('global.cancel'), onHandle: onCancel },
        { label: intl.get('global.ok'), type: 'primary', onHandle: handleOk }
      ]}
    >
      <div className="form-wrap">
        <Form form={form} autoComplete="off" colon={false} requiredMark={false}>
          <Form.Item
            label={intl.get('createEntity.groupName')}
            name="name"
            validateFirst
            rules={[
              { required: true, message: intl.get('createEntity.groupNamePlace') },
              { pattern: /^[\u4e00-\u9fa5_a-zA-Z0-9]+$/g, message: intl.get('global.onlyNormalName') },
              {
                max: 50,
                message: intl.get('global.lenErr', { len: 50 })
              },
              {
                validator: async (_, value) => {
                  if (['未分组', 'ungrouped'].includes(value)) {
                    throw new Error(intl.get('createEntity.groupBlackList'));
                  }
                }
              }
            ]}
          >
            <Input />
          </Form.Item>
        </Form>
      </div>
    </UniversalModal>
  );
};

export default (props: GroupOpModalProps) => (props.visible ? <GroupOpModal {...props} /> : null);
