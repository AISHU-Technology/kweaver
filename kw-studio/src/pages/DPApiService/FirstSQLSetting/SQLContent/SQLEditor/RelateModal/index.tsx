/**
 * 关联参数弹窗
 */

import React from 'react';
import { Form, Select, Empty } from 'antd';
import intl from 'react-intl-universal';
import _ from 'lodash';
import TemplateModal from '@/components/TemplateModal';
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
    <TemplateModal
      className="function-relate-modal"
      title={intl.get('exploreAnalysis.select')}
      visible={visible}
      width={640}
      zIndex={1052}
      onOk={handleOk}
      onCancel={onCancel}
    >
      <div style={{ padding: '24px 0 0 0' }} id="relateBox">
        <Form form={form} requiredMark={false} colon={false}>
          <Form.Item
            label={intl.get('function.paramName')}
            name="name"
            rules={[{ required: true, message: intl.get('global.noNull') }]}
          >
            <Select
              placeholder={intl.get('function.pleaseSelect')}
              notFoundContent={<Empty image={kongImg} description={intl.get('global.noData')} />}
              getPopupContainer={() => document.getElementById('relateBox') as HTMLDivElement}
            >
              {_.map(data, item => (
                <Option key={item.name} value={item.name}>
                  {item.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </div>
    </TemplateModal>
  );
};

export default (props: any) => (props.visible ? <RelateModal {...props} /> : null);
