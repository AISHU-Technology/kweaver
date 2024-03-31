import React from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { InputNumber, Button, Form } from 'antd';
import { ExclamationCircleFilled, LoadingOutlined } from '@ant-design/icons';

const PageRankConfig = (props: any) => {
  const { params, isLoading } = props;
  const { onAnalysis } = props;
  const { epsilon, linkProb } = params;

  const [form] = Form.useForm();

  const onFinish = (values: any) => onAnalysis(values);

  return (
    <div>
      <div className="tip">
        <ExclamationCircleFilled className="tipIcon" />
        <div className="kw-ellipsis">{intl.get('exploreGraph.algorithm.tipPageRank')}</div>
      </div>
      <div className="kw-pt-6">
        <Form
          form={form}
          requiredMark={false}
          layout="vertical"
          initialValues={{ epsilon, linkProb }}
          onFinish={onFinish}
        >
          <Form.Item
            name="epsilon"
            label={intl.get('exploreGraph.algorithm.epsilon')}
            rules={[
              { required: true, message: '' },
              {
                validator: async (rule, value) => {
                  if (String(value).includes('1e') || String(value)?.split('.')?.[1]?.length > 8) {
                    return Promise.reject([intl.get('exploreGraph.algorithm.enterUp8')]);
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <InputNumber
              controls={false}
              onBlur={() => {
                const epsilon = form.getFieldValue('epsilon');
                if (epsilon > 1) form.setFieldsValue({ epsilon: 1 });
                if (epsilon <= 0) form.setFieldsValue({ epsilon: 0.000001 });
              }}
            />
          </Form.Item>
          <Form.Item
            name="linkProb"
            label={intl.get('exploreGraph.algorithm.dumpingFactor')}
            rules={[
              { required: true, message: '' },
              {
                validator: async (rule, value) => {
                  if (String(value)?.split('.')?.[1]?.length > 2) {
                    return Promise.reject([intl.get('exploreGraph.algorithm.enterUp2')]);
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <InputNumber
              controls={false}
              onBlur={() => {
                const linkProb = form.getFieldValue('linkProb');
                if (linkProb > 1) form.setFieldsValue({ linkProb: 1 });
                if (linkProb <= 0) form.setFieldsValue({ linkProb: 0.85 });
              }}
            />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            style={{ width: '100%' }}
            icon={isLoading && <LoadingOutlined />}
            disabled={isLoading}
          >
            {intl.get('exploreGraph.algorithm.analyse')}
          </Button>
        </Form>
      </div>
    </div>
  );
};

export default PageRankConfig;
