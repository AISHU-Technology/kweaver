/**
 * 关联参数弹窗
 */

import React from 'react';
import { Form, Select, Empty } from 'antd';
import intl from 'react-intl-universal';
import _ from 'lodash';
import TemplateModal from '@/components/TemplateModal';
import UniversalModal from '@/components/UniversalModal';
import kongImg from '@/assets/images/kong.svg';
import './style.less';

const { Option } = Select;

const RelateModal = (props: any) => {
  const { visible, data, onOk, onCancel } = props;
  const [form] = Form.useForm();

  const handleOk = () => {
    form.validateFields().then(values => {
      const param = _.find(data, d => d.name === values.name);
      onOk(param);
    });
  };

  return (
    <UniversalModal
      className="function-relate-modal"
      title={intl.get('exploreAnalysis.select')}
      open={visible}
      width={480}
      zIndex={1052}
      onOk={handleOk}
      onCancel={onCancel}
      footerData={[
        { label: intl.get('global.cancel'), onHandle: onCancel },
        { label: intl.get('global.ok'), type: 'primary', onHandle: handleOk }
      ]}
    >
      <div style={{ padding: '24px 0px 0px' }}>
        <Form form={form} requiredMark={false} colon={false}>
          <Form.Item
            label={intl.get('function.paramName')}
            name="name"
            rules={[{ required: true, message: intl.get('global.noNull') }]}
          >
            <Select
              getPopupContainer={e => e.parentElement!}
              listHeight={32 * 8}
              placeholder={intl.get('function.pleaseSelect')}
              notFoundContent={<Empty image={kongImg} description={intl.get('global.noData')} />}
            >
              {_.map(data, item => (
                <Option key={item.name} value={item.name}>
                  {item.alias}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </div>
    </UniversalModal>
  );
};

export default (props: any) => (props.visible ? <RelateModal {...props} /> : null);
