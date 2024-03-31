import React from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Form, Select } from 'antd';

import UniversalModal from '@/components/UniversalModal';

import './style.less';

const KnowledgeNetworkSelect = (props: any) => {
  const [form] = Form.useForm();

  const { items = [], visible } = props;
  const { onCancel, onToPageCognitiveApplication } = props;

  const onOk = () => {
    form.validateFields().then(values => {
      onToPageCognitiveApplication(values?.kn);
      onCancel();
    });
  };
  const layout = { labelCol: { span: 5 }, wrapperCol: { span: 19 } };

  return (
    <UniversalModal
      visible={visible}
      title={intl.get('homepage.selectKnowledgeNetwork')}
      className="knowledgeNetworkSelectRoot"
      destroyOnClose
      width={500}
      onCancel={onCancel}
      footerData={[
        { label: intl.get('global.cancel'), onHandle: onCancel },
        { label: intl.get('global.ok'), type: 'primary', onHandle: onOk }
      ]}
    >
      <Form form={form} {...layout} className="selectKNForm">
        <Form.Item
          name="kn"
          label={intl.get('homepage.knowledgeNetwork2')}
          rules={[{ required: true, message: intl.get('global.noNull') }]}
        >
          <Select
            style={{ width: '100%' }}
            placeholder={intl.get('homepage.pleaseSelect')}
            options={_.map(items, (item: any) => {
              return { label: item?.knw_name, value: item?.id };
            })}
          />
        </Form.Item>
      </Form>
    </UniversalModal>
  );
};

export default KnowledgeNetworkSelect;
