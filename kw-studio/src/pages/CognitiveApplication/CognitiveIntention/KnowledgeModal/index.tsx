import React, { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import _ from 'lodash';
import { Form, Select } from 'antd';

import servicesKnowledgeNetwork from '@/services/knowledgeNetwork';
import servicesPermission from '@/services/rbacPermission';
import UniversalModal from '@/components/UniversalModal';
import { PERMISSION_KEYS } from '@/enums';

const KnowledgeModal = (props: any) => {
  const { visible, onCancel, onOk } = props;
  const [form] = Form.useForm();
  const [kwList, setKwList] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>({});

  useEffect(() => {
    getKwList();
  }, [visible]);

  /** 获取列表 */
  const getKwList = async () => {
    try {
      const params = { size: 1000, page: 1, rule: 'update', order: 'desc' };
      const { res = {}, ErrorCode = '' } = (await servicesKnowledgeNetwork.knowledgeNetGet(params)) || {};
      const dataIds = _.map(res?.df, item => String(item.id));
      const postData = { dataType: PERMISSION_KEYS.TYPE_KN, dataIds };
      // servicesPermission.dataPermission(postData).then(result => {
      //   const codesData = _.keyBy(result?.res, 'dataId');
      //   const authData = _.filter(res?.df, item => {
      //     return _.includes(codesData?.[item.id]?.codes, 'KN_VIEW');
      //   });

      //   setKwList(authData || []);
      // });
      setKwList(res?.df || []);
    } catch (error) {}
  };

  const onChange = (value: any, op: any) => {
    setSelected(op?.data);
  };

  const onHandle = async () => {
    form.validateFields().then(() => {
      onOk(selected);
    });
  };

  return (
    <UniversalModal
      visible={visible}
      className="searchKnowSelectModal"
      title={intl.get('homepage.selectKnowledgeNetwork')}
      footer={null}
      maskClosable={false}
      destroyOnClose={true}
      width={480}
      focusTriggerAfterClose={false}
      onCancel={onCancel}
      footerData={[
        { label: intl.get('userManagement.cancel'), onHandle: onCancel },
        { label: intl.get('userManagement.ok'), type: 'primary', onHandle }
      ]}
    >
      <div style={{ height: 72, padding: '20px 38px 0' }}>
        <Form form={form}>
          <Form.Item
            label={intl.get('global.kgNet')}
            name="knw"
            rules={[{ required: true, message: intl.get('global.noNull') }]}
          >
            <Select style={{ width: 274 }} placeholder={intl.get('global.pleaseSelect')} onChange={onChange}>
              {_.map(kwList, item => {
                return (
                  <Select.Option key={item.id} value={item.id} label={item.knw_name} data={item}>
                    {item.knw_name}
                  </Select.Option>
                );
              })}
            </Select>
          </Form.Item>
        </Form>
      </div>
    </UniversalModal>
  );
};
export default (props: any) => (props.visible ? <KnowledgeModal {...props} /> : null);
