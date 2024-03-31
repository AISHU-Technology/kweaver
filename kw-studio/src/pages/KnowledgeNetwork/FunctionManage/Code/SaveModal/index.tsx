import React from 'react';
import { Form, Select, Input } from 'antd';
import intl from 'react-intl-universal';
import _ from 'lodash';
import { ONLY_KEYBOARD } from '@/enums';
import TemplateModal from '@/components/TemplateModal';
import UniversalModal from '@/components/UniversalModal';
import ExplainTip from '@/components/ExplainTip';
import Format from '@/components/Format';
import './style.less';

const DESC_REG = /^[!-~a-zA-Z0-9_\u4e00-\u9fa5 ！￥……（）——“”：；，。？、‘’《》｛｝【】·\s]+$/;
const { Option } = Select;
const { TextArea } = Input;

const SaveModal = (props: any) => {
  const { visible, onOk, onCancel } = props;
  const [form] = Form.useForm();

  const handleOk = () => {
    form.validateFields().then(values => {
      onOk(values, form.setFields);
    });
  };

  return (
    <UniversalModal
      title={
        <div>
          <div className={'kw-format-text kw-format-text-no-height-3 kw-format-strong-6 kw-c-header'}>
            {intl.get('global.save')}
          </div>
          <ExplainTip autoMaxWidth title={intl.get('function.saveTip')} />
        </div>
      }
      visible={visible}
      className="saveModal"
      zIndex={1052}
      onOk={handleOk}
      onCancel={onCancel}
      footerData={[
        { label: intl.get('global.cancel'), onHandle: onCancel },
        { label: intl.get('global.ok'), type: 'primary', onHandle: handleOk }
      ]}
    >
      <div>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            name: '',
            description: '',
            language: 'nGQL'
          }}
        >
          <Form.Item
            label={intl.get('function.functionName')}
            name="name"
            rules={[
              { required: true, message: intl.get('global.noNull') },
              { max: 50, message: intl.get('global.lenErr', { len: 50 }) },
              { pattern: ONLY_KEYBOARD, message: intl.get('global.onlyKeyboard') }
            ]}
          >
            <Input placeholder={intl.get('function.enterFunName')} autoComplete="off" />
          </Form.Item>

          <Form.Item
            label={intl.get('function.language')}
            name="language"
            rules={[{ required: true, message: intl.get('global.noNull') }]}
          >
            <Select>
              <Option key={'nGQL'} value="nGQL">
                nGQL
              </Option>
            </Select>
          </Form.Item>

          <Form.Item
            label={intl.get('global.desc')}
            name="description"
            validateFirst={true}
            rules={[
              { max: 150, message: intl.get('global.lenErr', { len: 150 }) },
              {
                pattern: ONLY_KEYBOARD,
                message: intl.get('global.onlyKeyboard')
              }
            ]}
          >
            <TextArea placeholder={intl.get('function.enterDes')} autoComplete="off" style={{ height: 64 }} />
          </Form.Item>
        </Form>
      </div>
    </UniversalModal>
  );
};

export default (props: any) => (props.visible ? <SaveModal {...props} /> : null);
