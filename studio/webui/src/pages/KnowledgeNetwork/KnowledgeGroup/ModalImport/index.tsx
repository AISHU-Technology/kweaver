import React, { useEffect } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Modal, Form, Radio, Space, message } from 'antd';

import { UPLOAD_FAIL_TYPE } from '@/enums';
import serverKnowledgeNetwork from '@/services/knowledgeNetwork';
import UploadCommon from '@/components/UploadCommon';

import SelectStore from './SelectStore';
import UploadShowLine from './UploadShowLine';

import './index.less';

const layout = { labelCol: { span: 24 }, wrapperCol: { span: 24 } };

const { OVER_MAX_FILES_COUNT, OVER_ALL_FILES_SIZE } = UPLOAD_FAIL_TYPE;
const UPLOAD_ERROR = {
  [OVER_MAX_FILES_COUNT]: intl.get('knowledge.fileCountMessage'),
  [OVER_ALL_FILES_SIZE]: intl.get('knowledge.allLimitMessage'),
  [`${OVER_MAX_FILES_COUNT}-${OVER_ALL_FILES_SIZE}`]: intl.get('knowledge.allLimitMessage')
};

/**
 * 导入弹窗
 */
const ModalImport = (props: any) => {
  const [form] = Form.useForm();
  const { isVisible, isVisibleModalFeedback, knowledge } = props;
  const { onOk, onClose, closeModalFeedback } = props;

  useEffect(() => {
    if (!isVisibleModalFeedback) form.resetFields(['file']);
  }, [isVisibleModalFeedback]);

  /**
   * 上传，选中文件后回调
   */
  const onCallBackFileChange = (value: Blob) => {
    form.setFieldsValue({ file: value });
  };

  /**
   * 上传，选中文件后的报错信息
   */
  const onError = _.debounce(errorList => {
    if (_.isEmpty(errorList)) return null;
    _.forEach(errorList, item => {
      const { type } = item;
      return message.warning(UPLOAD_ERROR[type] || item.message);
    });
  }, 300);

  /**
   * 删除一个选中的文件
   */
  const onDeleteFile = (uid: string) => {
    const file = form.getFieldValue('file');
    const newFile = _.filter(file, item => item.uid !== uid);
    form.setFieldsValue({ file: newFile });
  };

  /**
   * 提交导入数据
   */
  const onSubmit = () => {
    form
      .validateFields()
      .then(async values => {
        const { method, ...elseData } = values;
        const postData = { knw_id: knowledge.id, method: parseInt(method), ...elseData };
        const fileCount = elseData?.file?.length || 0;
        if (onOk) onOk({ type: 'loading', fileCount });
        serverKnowledgeNetwork.graphInput(postData).then(result => {
          if (!result) closeModalFeedback();
          const { type, message } = result;
          if (onOk) {
            if (type === 'success') onOk({ type: 'success', fileCount });
            if (type === 'fail') onOk({ type: 'fail', message });
          }
        });
      })
      .catch(errorInfo => {
        const errorField = errorInfo?.errorFields?.[0]?.name?.[0];
        if (errorField) form.scrollToField(errorField);
      });
  };

  const onCancel = () => {
    onClose();
  };

  return (
    <Modal
      visible={isVisible}
      width={460}
      keyboard={false}
      forceRender={true}
      maskClosable={false}
      wrapClassName="modalImportRoot"
      title={intl.get('knowledge.importKnowledgeNetwork')}
      onOk={onSubmit}
      onCancel={onCancel}
      afterClose={() => {
        form.resetFields();
      }}
    >
      <div className="formContainer">
        <Form {...layout} form={form} name="importForm" requiredMark={false} initialValues={{ method: '1' }}>
          <Form.Item
            label={intl.get('knowledge.importFiles')}
            name="file"
            rules={[{ required: true, message: intl.get('knowledge.pleaseSelectFile') }]}
            extra={
              <div className="extraBox">
                <div className="fileExtra">{intl.get('knowledge.importFileSizeLimit')}</div>
                <div className="fileExtra">{intl.get('knowledge.importFileMax')}</div>
              </div>
            }
          >
            <UploadCommon
              accept="text/plain"
              largestFileCount={5}
              limitSizeAll={1024 * 1024 * 2} // 2M
              renderButton={(value: { uid: string; name: string }[]) => (
                <UploadShowLine value={value} onDeleteFile={onDeleteFile} />
              )}
              onError={onError}
              onCallBackFileChange={onCallBackFileChange}
            />
          </Form.Item>
          <Form.Item
            label={intl.get('knowledge.knowledgeGraphLocation')}
            name="graph_id"
            rules={[{ required: true, message: intl.get('knowledge.pleaseSelectLocation') }]}
          >
            <SelectStore placeholder={intl.get('knowledge.pleaseSelectLocation')} />
          </Form.Item>
          <Form.Item label={intl.get('knowledge.importStrategy')} name="method">
            <Radio.Group>
              <Space direction="vertical">
                <Radio className="methodOption" value="0">
                  {intl.get('knowledge.strategyOverwrite')}
                </Radio>
                <Radio className="methodOption" value="1">
                  {intl.get('knowledge.strategyKeep')}
                </Radio>
              </Space>
            </Radio.Group>
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};

export default ModalImport;
