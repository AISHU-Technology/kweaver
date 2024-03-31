import React from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Modal, Input, Form, message } from 'antd';
import UniversalModal from '@/components/UniversalModal';
import { ONLY_KEYBOARD } from '@/enums';
import snapshotsService from '@/services/snapshotsService';

import './style.less';

const DES_REG = /^[\s\n\u4e00-\u9fa5a-zA-Z0-9!-~？！，、；：“”‘'（）《》【】～￥—]+$/;
const SnapshootsCreate = (props: any) => {
  const { updateData, selectedItem, serviceData } = props;
  const { onOk, onCancel } = props;
  const { kg_id, service_id } = serviceData;
  const [form] = Form.useForm();
  const isCreate = !updateData?.s_id;

  const onSubmit = async () => {
    form.validateFields().then(async (value: any) => {
      const { snapshot_name, snapshot_info } = value;
      try {
        if (updateData?.s_id) {
          const postData: any = { kg_id, snapshot_name, snapshot_info };
          const result = await snapshotsService.snapshotsPostUpdate(updateData.s_id, postData);
          if (result?.res?.s_id) onOk('update');
        } else {
          const graphData: any = { nodes: [], edges: [] };
          graphData.nodes = _.unionBy(selectedItem?.graphData?.nodes, (n: any) => n?.id);
          graphData.edges = _.unionBy(selectedItem?.graphData?.edges, (e: any) => e?.id);
          const snapshotBody = {
            graphData,
            layoutConfig: selectedItem.layoutConfig,
            sliced: selectedItem?.sliced
          };
          const postData: any = { kg_id, service_id, snapshot_name, snapshot_body: JSON.stringify(snapshotBody) };
          if (snapshot_info) postData.snapshot_info = snapshot_info;
          const result = await snapshotsService.snapshotsPostCreate(postData);
          if (result?.res?.s_id) onOk('create');
        }
      } catch (error) {
        if (error.type !== 'message') return;
        if (error?.response?.ErrorCode === 'Cognitive.AlreadyExistsErr') {
          return form.setFields([{ name: 'snapshot_name', errors: [intl.get('global.repeatName')] }]);
        }
        if (error?.response?.ErrorDetails?.[0]?.detail) {
          message.error(error?.response?.ErrorDetails?.[0]?.detail);
        } else {
          message.error(error?.response?.ErrorCode);
        }
      }
    });
  };

  return (
    <UniversalModal
      className="snapshootsCreateRoot"
      visible={true}
      width={640}
      zIndex={2000}
      title={
        isCreate ? intl.get('exploreGraph.snapshots.newSnapshot') : intl.get('exploreGraph.snapshots.editSnapshot')
      }
      destroyOnClose={true}
      onOk={onSubmit}
      onCancel={onCancel}
      footerData={[
        { label: intl.get('global.cancel'), onHandle: onCancel },
        { label: intl.get('global.ok'), type: 'primary', onHandle: onSubmit }
      ]}
    >
      <Form form={form} layout="vertical" scrollToFirstError initialValues={updateData}>
        <Form.Item
          label={intl.get('exploreGraph.snapshots.snapshotName')}
          name="snapshot_name"
          validateFirst
          rules={[
            { required: true, message: intl.get('global.noNull') },
            { max: 50, message: intl.get('global.lenErr', { len: 50 }) },
            {
              pattern: /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/,
              message: intl.get('global.onlyNormalName')
            }
          ]}
        >
          <Input placeholder={intl.get('exploreGraph.snapshots.pleaseEnterSnapshotName')} autoComplete="off" />
        </Form.Item>
        <Form.Item
          label={intl.get('exploreGraph.snapshots.description')}
          name="snapshot_info"
          rules={[
            { max: 255, message: intl.get('global.lenErr', { len: 255 }) },
            { pattern: ONLY_KEYBOARD, message: intl.get('global.onlyKeyboard') }
          ]}
        >
          <Input.TextArea rows={4} placeholder={intl.get('exploreGraph.snapshots.pleaseEnterSnapshotDescription')} />
        </Form.Item>
      </Form>
    </UniversalModal>
  );
};

export default SnapshootsCreate;
