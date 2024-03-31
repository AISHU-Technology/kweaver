/**
 * 关联参数弹窗
 */

import React from 'react';
import { Form, Select, Empty } from 'antd';
import intl from 'react-intl-universal';
import _ from 'lodash';
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
      title={intl.get('dpapiService.select')}
      visible={visible}
      width={640}
      zIndex={1049}
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
            label={intl.get('dpapiService.paramName')}
            name="name"
            rules={[{ required: true, message: intl.get('subscription.cannotNull') }]}
          >
            <Select
              placeholder={intl.get('dpapiService.pleaseSelect')}
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
