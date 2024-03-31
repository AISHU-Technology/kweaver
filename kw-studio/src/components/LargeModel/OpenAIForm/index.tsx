import React from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Form, Input, Divider, Tooltip } from 'antd';

import IconFont from '@/components/IconFont';
import { ONLY_KEYBOARD } from '@/enums';

import './style.less';

export interface OpenAIFormProps {
  isVersionEndPoint?: boolean;
  defaultPrompt?: string;
  onInputChange?: (e: any) => void;
}

const OpenAIForm = (props: OpenAIFormProps) => {
  const { isVersionEndPoint, defaultPrompt, onInputChange } = props;
  return (
    <div className="first-step-openai-model-root">
      <div className="kw-flex">
        <div className="kw-w-50 kw-pr-3">
          <Form.Item
            label={
              <div className="kw-flex model-label">
                Model
                <Tooltip className="kw-ml-2" title={intl.get('cognitiveSearch.answersOrganization.supportVersion')}>
                  <IconFont type="icon-wenhao" className="kw-c-subtext" />
                </Tooltip>
              </div>
            }
            name="model"
            rules={[
              { required: true, message: intl.get('global.noNull') },
              { pattern: ONLY_KEYBOARD, message: intl.get('cognitiveSearch.answersOrganization.onlyKeyBoard') }
            ]}
          >
            <Input placeholder={`${intl.get('cognitiveSearch.answersOrganization.sample')}：gpt-35-turbo-16k`} />
          </Form.Item>
        </div>
        <div className="kw-w-50 kw-pl-3">
          <Form.Item
            label={
              <div className="kw-flex model-label">
                API Type
                <Tooltip className="kw-ml-2" title={intl.get('cognitiveSearch.answersOrganization.selectOpenAI')}>
                  <IconFont type="icon-wenhao" className="kw-c-subtext" />
                </Tooltip>
              </div>
            }
            name="api_type"
            rules={[
              { required: true, message: intl.get('global.noNull') },
              { pattern: ONLY_KEYBOARD, message: intl.get('cognitiveSearch.answersOrganization.onlyKeyBoard') }
            ]}
          >
            <Input
              placeholder={`${intl.get('cognitiveSearch.answersOrganization.sample')}：azure`}
              onChange={onInputChange}
            />
          </Form.Item>
        </div>
      </div>
      <Form.Item
        label="API Key"
        name="api_key"
        rules={[
          { required: true, message: intl.get('global.noNull') },
          { pattern: ONLY_KEYBOARD, message: intl.get('cognitiveSearch.answersOrganization.onlyKeyBoard') }
        ]}
      >
        <Input
          placeholder={`${intl.get('cognitiveSearch.answersOrganization.sample')}：5fc6b8ade9847dd86d5b8d7e61av9f2`}
        />
      </Form.Item>

      {isVersionEndPoint ? (
        <>
          <Form.Item
            label="API Version"
            name="api_version"
            rules={[
              { required: isVersionEndPoint, message: isVersionEndPoint ? intl.get('global.noNull') : '' },
              {
                pattern: ONLY_KEYBOARD,
                message: intl.get('cognitiveSearch.answersOrganization.onlyKeyBoard')
              }
            ]}
          >
            <Input placeholder={`${intl.get('cognitiveSearch.answersOrganization.sample')}：2023-03-15-preview`} />
          </Form.Item>
          <Form.Item
            label="API Endpoint"
            name="api_endpoint"
            rules={[
              { required: isVersionEndPoint, message: isVersionEndPoint ? intl.get('global.noNull') : '' },
              {
                pattern: ONLY_KEYBOARD,
                message: intl.get('cognitiveSearch.answersOrganization.onlyKeyBoard')
              }
            ]}
          >
            <Input
              placeholder={`${intl.get(
                'cognitiveSearch.answersOrganization.sample'
              )}：https://demo-chatgpt.openai.azure.com/`}
            />
          </Form.Item>
        </>
      ) : (
        <>
          <Form.Item
            label="API Version"
            name="api_version"
            rules={[
              {
                pattern: ONLY_KEYBOARD,
                message: intl.get('cognitiveSearch.answersOrganization.onlyKeyBoard')
              }
            ]}
          >
            <Input placeholder={`${intl.get('cognitiveSearch.answersOrganization.sample')}：2023-03-15-preview`} />
          </Form.Item>
          <Form.Item
            label="API Endpoint"
            name="api_endpoint"
            rules={[
              {
                pattern: ONLY_KEYBOARD,
                message: intl.get('cognitiveSearch.answersOrganization.onlyKeyBoard')
              }
            ]}
          >
            <Input
              placeholder={`${intl.get(
                'cognitiveSearch.answersOrganization.sample'
              )}：https://demo-chatgpt.openai.azure.com/`}
            />
          </Form.Item>
        </>
      )}
    </div>
  );
};

export default OpenAIForm;
