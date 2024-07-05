import React, { useEffect } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Form, Input } from 'antd';

import TemplateModal from '@/components/TemplateModal';
import UniversalModal from '@/components/UniversalModal';
import { ONLY_KEYBOARD } from '@/enums';
import TrimmedInput from '@/components/TrimmedInput';

const DES_REG = /^[\s\n\u4e00-\u9fa5a-zA-Z0-9!-~？！，、；：“”‘'（）《》【】～￥—]+$/;
const SaveAnalysisGraph = (props: any) => {
  const [form] = Form.useForm();
  const { detail = {}, selectedItem, saveModalFields = [] } = props;
  const { onClose, onSaveOk } = props;

  useEffect(() => {
    if (!detail?.name) return;
    form.setFieldsValue({ name: detail?.canvas_name, description: detail?.canvas_info });
  }, [detail]);
  useEffect(() => {
    if (_.isEmpty(saveModalFields)) return;
    form.setFields(saveModalFields);
  }, [JSON.stringify(saveModalFields)]);

  const onOK = () => {
    form
      .validateFields()
      .then(async (values: any) => {
        onSaveOk(values);
      })
      .catch(() => {});
  };
  useEffect(() => {
    const { canvas_info, canvas_name } = selectedItem?.detail;
    const newData = {
      name: selectedItem?.title === '未命名' ? canvas_name : selectedItem?.title,
      description: canvas_info
    };

    form.setFieldsValue({ ...newData });
  }, []); // selectedItem

  return (
    <UniversalModal
      className="saveAnalysisRoot"
      okText={intl.get('exploreGraph.save')}
      title={intl.get('exploreGraph.saveAnalysis')}
      open={true}
      zIndex={1052}
      onOk={onOK}
      onCancel={onClose}
      footerData={[
        { label: intl.get('global.cancel'), onHandle: onClose },
        { label: intl.get('exploreGraph.save'), type: 'primary', onHandle: onOK }
      ]}
    >
      <div className="modal-content">
        <Form form={form} layout="vertical">
          <Form.Item
            label={intl.get('exploreGraph.name')}
            name="name"
            validateFirst
            rules={[
              { required: true, message: intl.get('global.noNull') },
              { pattern: ONLY_KEYBOARD, message: intl.get('global.onlyKeyboard') },
              { max: 50, message: intl.get('global.lenErr', { len: 50 }) },
              { validator: async (_, value) => {} }
            ]}
          >
            <TrimmedInput placeholder={intl.get('exploreGraph.enterName')} autoComplete="off" />
          </Form.Item>
          <Form.Item
            name="description"
            label={intl.get('exploreGraph.description')}
            rules={[
              { max: 255, message: intl.get('global.lenErr', { len: 255 }) },
              { pattern: ONLY_KEYBOARD, message: intl.get('global.onlyKeyboard') }
            ]}
          >
            <Input.TextArea rows={4} autoComplete="off"></Input.TextArea>
          </Form.Item>
        </Form>
      </div>
    </UniversalModal>
  );
};
export default SaveAnalysisGraph;
