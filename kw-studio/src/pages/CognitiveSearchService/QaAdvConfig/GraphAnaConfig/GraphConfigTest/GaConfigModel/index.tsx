import { Form, Radio, Select } from 'antd';
import React, { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import UniversalModal from '@/components/UniversalModal';

import analysisService from '@/services/analysisService';
import _ from 'lodash';

const GaConfigModel = (props: any) => {
  const { visible, data, onCancel, onOk } = props;
  const [form] = Form.useForm();
  const [createType, setCreateType] = useState<string>('select');
  const [gaList, setGaList] = useState<any[]>();

  useEffect(() => {
    getGaData();
  }, []);

  const getGaData = async () => {
    const body = {
      page: 1,
      order_type: 'desc',
      size: 1000,
      kg_id: data?.kg_id,
      order_field: 'create_time',
      operation_type: 'custom-search'
    };
    const { res }: any = (await analysisService.analysisServiceList(body)) || {};
    if (res) {
      setGaList(res?.results);
    }
  };

  const handelOk = () => {
    form.validateFields().then(values => {
      onOk(values);
    });
  };

  return (
    <UniversalModal
      title={intl.get('cognitiveSearch.qaAdvConfig.graphConfig')}
      visible={visible}
      onCancel={onCancel}
      width={480}
      footerData={[
        { label: intl.get('userManagement.cancel'), onHandle: onCancel },
        { label: intl.get('userManagement.ok'), type: 'primary', onHandle: handelOk }
      ]}
      className="gaConfigModelRoot"
    >
      <Form form={form} initialValues={{ type: 'select' }} layout={'vertical'}>
        <Form.Item
          name="type"
          label={intl.get('cognitiveSearch.qaAdvConfig.method')}
          rules={[{ required: true, message: intl.get('global.pleaseSelect') }]}
        >
          <Radio.Group onChange={e => setCreateType(e?.target?.value)}>
            <Radio value={'select'}>{intl.get('cognitiveSearch.qaAdvConfig.selectMethod')}</Radio>
            <Radio value={'create'}>{intl.get('cognitiveSearch.qaAdvConfig.createGa')}</Radio>
          </Radio.Group>
        </Form.Item>
        {createType === 'select' && (
          <Form.Item
            label={intl.get('cognitiveSearch.qaAdvConfig.graphConfig')}
            name="service_id"
            rules={[{ required: true, message: intl.get('global.noNull') }]}
          >
            <Select placeholder={intl.get('global.pleaseSelect')}>
              {_.map(gaList, item => {
                return (
                  <Select.Option value={item?.id} key={item?.id}>
                    {item?.name}
                  </Select.Option>
                );
              })}
            </Select>
          </Form.Item>
        )}
      </Form>
    </UniversalModal>
  );
};

export default (props: any) => (props?.visible ? <GaConfigModel {...props} /> : null);
