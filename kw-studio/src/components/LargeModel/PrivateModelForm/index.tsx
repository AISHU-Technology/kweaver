import React from 'react';
import intl from 'react-intl-universal';
import { Form, Input } from 'antd';
import { ONLY_KEYBOARD } from '@/enums';

export interface PrivateModelFormProps {
  defaultPrompt?: string;
}

const PrivateModelForm = () => {
  return (
    <>
      <Form.Item
        label={'Model'}
        name="model"
        rules={[
          { required: true, message: intl.get('global.noNull') },
          { pattern: ONLY_KEYBOARD, message: intl.get('cognitiveSearch.answersOrganization.onlyKeyBoard') }
        ]}
      >
        <Input placeholder={`${intl.get('cognitiveSearch.answersOrganization.sample')}：baichuan2、vicuna-vllm`} />
      </Form.Item>
      <Form.Item
        label="API Endpoint"
        name="api_endpoint"
        rules={[
          { required: true, message: intl.get('global.noNull') },
          {
            pattern: ONLY_KEYBOARD,
            message: intl.get('cognitiveSearch.answersOrganization.onlyKeyBoard')
          }
        ]}
      >
        <Input placeholder={`${intl.get('cognitiveSearch.answersOrganization.sample')}：http://xxx.xx.xx.xx:xxxx`} />
      </Form.Item>
    </>
  );
};

export default PrivateModelForm;
