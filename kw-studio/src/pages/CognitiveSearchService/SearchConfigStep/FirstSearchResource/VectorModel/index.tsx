import React, { useEffect, useState } from 'react';
import { Button, Form, Input, Select, message } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import _ from 'lodash';
import serviceCognitiveSearch from '@/services/cognitiveSearch';
import UniversalModal from '@/components/UniversalModal';
import { ONLY_KEYBOARD } from '@/enums';

type VectorModelType = {
  visible: boolean;
  data: undefined | { device: string; host?: string }; // 编辑的数据
  onCancel: () => void;
  onOk: (data: any) => void;
  setEmError: (data: any) => void;
};
const MODEL_TYPE = 'embbeding_model'; // 外接向量模型
const VectorModel = (props: VectorModelType) => {
  const { visible, data, onCancel, onOk, setEmError } = props;
  const [form] = Form.useForm();
  const [subType, setSubType] = useState<string>('CPU');
  const [isTest, setIsTest] = useState<boolean>(false);
  const onFieldsChange = () => {};

  useEffect(() => {
    if (data?.device) {
      const [ip, port] = _.split(data?.host, ':');
      setSubType(data?.device);
      form.setFieldsValue({ device: data?.device, ip, port });
    }
  }, [visible]);

  const handleOk = () => {
    form.validateFields().then(async (values: any) => {
      const { ip, port, device } = values;

      try {
        if (device === 'gpu') {
          const host = `${ip}:${port}`;
          const res = await serviceCognitiveSearch.checkLink({ ip, port });
          if (res?.res) {
            onOk({ device, host, sub_type: MODEL_TYPE });
          }
          if (!res?.res) {
            message.error(intl.get('cognitiveSearch.resource.testError'));
          }
        }
        if (device === 'cpu') {
          onOk({ device, sub_type: MODEL_TYPE });
        }
      } catch (err) {
        const { Description, ErrorCode } = err?.response || err.data || err;
        message.error(Description);
      }
    });
  };

  /** 测试 */
  const onTest = () => {
    form.validateFields().then(async (values: any) => {
      const { ip, port } = values;
      try {
        setIsTest(true);
        const res = await serviceCognitiveSearch.checkLink({ ip, port });
        setIsTest(false);

        if (res?.res) {
          message.success(intl.get('datamanagement.testSuccessful'));
          setEmError(true);
        } else {
          message.error(intl.get('cognitiveSearch.resource.testError'));
        }
      } catch (err) {
        const { Description, ErrorCode } = err?.response || err.data || err;
        message.error(Description);
        setIsTest(false);
      }
    });
  };
  return (
    <UniversalModal
      className="search-create-edit-modal"
      open={visible}
      onCancel={onCancel}
      title={intl.get('cognitiveSearch.resource.addResource')}
      width={640}
      destroyOnClose={true}
      footerData={
        subType === 'gpu' ? (
          <div style={{ gap: 8 }}>
            <Button onClick={() => onCancel()}>{intl.get('global.cancel')}</Button>
            <Button onClick={() => onTest()}>
              {isTest && <LoadingOutlined />}
              {intl.get('global.linkTest')}
            </Button>
            <Button type="primary" onClick={() => handleOk()}>
              {intl.get('userManagement.ok')}
            </Button>
          </div>
        ) : (
          [
            { label: intl.get('global.cancel'), onHandle: onCancel },
            { label: intl.get('global.ok'), type: 'primary', onHandle: handleOk }
          ]
        )
      }
      maskClosable={false}
    >
      <div style={{ height: 320 }}>
        <Form
          form={form}
          layout={'vertical'}
          onFieldsChange={onFieldsChange}
          initialValues={{ sub_type: intl.get('cognitiveSearch.resource.vectorModel'), device: 'cpu' }}
        >
          <Form.Item
            label={intl.get('cognitiveSearch.resource.resourceType')}
            name="sub_type"
            rules={[{ required: true, message: intl.get('global.noNull') }]}
          >
            <Input disabled />
          </Form.Item>
          <Form.Item
            label={intl.get('cognitiveSearch.resource.platform')}
            name="device"
            rules={[{ required: true, message: intl.get('global.noNull') }]}
          >
            <Select placeholder={intl.get('cognitiveSearch.intention.select')} onChange={e => setSubType(e)}>
              <Select.Option value="cpu">CPU</Select.Option>
              <Select.Option value="gpu">GPU</Select.Option>
            </Select>
          </Form.Item>
          {subType === 'gpu' ? (
            <>
              <Form.Item
                label="IP"
                name="ip"
                rules={[
                  { required: true, message: intl.get('global.noNull') },
                  { pattern: ONLY_KEYBOARD, message: intl.get('global.onlyKeyboard') },
                  { max: 50, message: intl.get('global.lenErr', { len: 50 }) }
                ]}
              >
                <Input placeholder={`${intl.get('cognitiveSearch.resource.sample')}：10.4.123.45`} />
              </Form.Item>
              <Form.Item
                label="Port"
                name="port"
                rules={[
                  { required: true, message: intl.get('global.noNull') },
                  { pattern: ONLY_KEYBOARD, message: intl.get('global.onlyKeyboard') },
                  { max: 50, message: intl.get('global.lenErr', { len: 50 }) }
                ]}
              >
                <Input placeholder={`${intl.get('cognitiveSearch.resource.sample')}：8080"`} />
              </Form.Item>
            </>
          ) : null}
        </Form>
      </div>
    </UniversalModal>
  );
};
export default (props: VectorModelType) => (props?.visible ? <VectorModel {...props} /> : null);
