import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import intl from 'react-intl-universal';
import { Modal, Form, Input, ConfigProvider, Button } from 'antd';
import { onEditGraph } from '../../assistFunction';
import UniversalModal from '@/components/UniversalModal';

import './style.less';

const { TextArea } = Input;
const DES_REG = /^[\s\n\u4e00-\u9fa5a-zA-Z0-9!-~？！，、；：“”‘'（）《》【】～￥—]+$/;
const EditGraphContent = forwardRef((props: any, ref) => {
  const { onHandleCancel, editMes, testData, setTestData, onChangeTable } = props;
  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue({ name: editMes?.kg_name, des: editMes?.description });
  }, []);

  useImperativeHandle(ref, () => ({
    onSave
  }));

  /**
   * 保存
   */
  const onSave = async () => {
    form.validateFields().then(async values => {
      const editData = onEditGraph(values, testData);
      onChangeTable({ page: 1 }, editData);
      setTestData(editData);
      onHandleCancel();
    });
  };

  const onGraphDes = (e: any, key: any) => {};
  return (
    <>
      <Form form={form} layout="vertical">
        <Form.Item name="name" label={intl.get('cognitiveSearch.resource.resourceName')} colon={false}>
          <Input disabled />
        </Form.Item>
        <Form.Item name="des" label={intl.get('cognitiveSearch.resource.description')} colon={false}>
          <TextArea
            placeholder={intl.get('cognitiveSearch.resource.resourceDescription')}
            onChange={(e: any) => onGraphDes(e, editMes?.key)}
            className="graph-textarea kw-ellipsis"
            showCount={false}
            onKeyPress={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
              }
            }}
            style={{ height: '33px' }}
          />
        </Form.Item>
      </Form>
      {/* <UniversalModal.Footer
        source={
          <ConfigProvider autoInsertSpaceInButton={false}>
            <Button className="ant-btn-default btn normal" onClick={onHandleCancel}>
              {intl.get('cognitiveSearch.cancel')}
            </Button>

            <Button type="primary" className="btn primary" onClick={onSave}>
              {intl.get('global.save')}
            </Button>
          </ConfigProvider>
        }
      /> */}
    </>
  );
});

const EditGraphDescription = (props: any) => {
  const { visible, onHandleCancel, setIsAddModal, editMes, testData, setTestData, onChangeTable } = props;
  const EditGraphContentRef = useRef(null);

  return (
    <UniversalModal
      width={480}
      open={visible}
      title={intl.get('cognitiveSearch.resource.editResource')}
      destroyOnClose={true}
      maskClosable={false}
      className="edit-graph-modal-root"
      onCancel={onHandleCancel}
      footerData={
        <ConfigProvider autoInsertSpaceInButton={false}>
          <Button className="ant-btn-default btn normal" onClick={onHandleCancel}>
            {intl.get('cognitiveSearch.cancel')}
          </Button>

          <Button type="primary" className="btn primary" onClick={() => (EditGraphContentRef.current as any).onSave()}>
            {intl.get('global.save')}
          </Button>
        </ConfigProvider>
      }
    >
      <EditGraphContent
        ref={EditGraphContentRef}
        onHandleCancel={onHandleCancel}
        editMes={editMes}
        setIsAddModal={setIsAddModal}
        testData={testData}
        setTestData={setTestData}
        onChangeTable={onChangeTable}
      />
    </UniversalModal>
  );
};

export default EditGraphDescription;
