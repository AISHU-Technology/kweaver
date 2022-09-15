import React from 'react'
import { Modal, Form, message, Radio, Space } from 'antd';
import _ from 'lodash';
import intl from 'react-intl-universal';

import serverThesaurus from '@/services/thesaurus';
import { UPLOAD_FAIL_TYPE } from '@/enums';

import UploadCommon from '@/components/UploadCommon';
import UploadShowLine from '../../UploadShowLine';

import './style.less';
const ERROR_CODE: Record<string, string> = {
  'Builder.LexiconController.ImportWord2Lexicon.LexiconIdNotExist': 'ThesaurusManage.nullThesaurusId',
  'Builder.LexiconController.ImportWord2Lexicon.FileUploadFailed': 'ThesaurusManage.uploadFileFailed',
  'Builder.LexiconController.ImportWord2Lexicon.FormatMismatch': 'ThesaurusManage.formatMismatch',
  'Builder.LexiconController.ImportWord2Lexicon.FileFormatError': 'ThesaurusManage.FileFormatError',
  'Builder.LexiconController.ImportWord2Lexicon.ContentFormatError': 'ThesaurusManage.ContentFormatError',
  'Builder.LexiconController.ImportWord2Lexicon.InvalidStatus': 'ThesaurusManage.editwordsError'
}
const { OVER_MAX_FILES_COUNT, OVER_SINGLE_FILE_SIZE } = UPLOAD_FAIL_TYPE;
const UPLOAD_ERROR = {
  [OVER_MAX_FILES_COUNT]: intl.get('ThesaurusManage.fileCountMessage'),
  [OVER_SINGLE_FILE_SIZE]: intl.get('ThesaurusManage.DataExceeded'),
};
const ModalImport = (props: any) => {
  const [form] = Form.useForm();

  const { isVisible, closeModal, selectedThesaurus, page } = props;
  const { getThesaurusList, setpage, setErrorInfo, getThesaurusById } = props;

  /**
   * 确认导入
   */
  const onSubmit = () => {
    form.validateFields().then(async values => {
      const { file, mode } = values;
      const data = {
        id: selectedThesaurus?.id,
        file,
        mode
      }
      try {
        const response = await serverThesaurus.thesaurusImportWords(data);
        const { ErrorCode, ErrorDetails } = response || {};
        if (ErrorCode) {
          ERROR_CODE[ErrorCode] ? message.error(intl.get(ERROR_CODE[ErrorCode])) : message.error(ErrorDetails);
          closeModal();
          setErrorInfo(ErrorDetails);
          getThesaurusById(selectedThesaurus, page);
          return;
        }
        if (response?.res) {
          message.success(intl.get('knowledge.importSuccess'));
          setpage(1);
          closeModal();
          getThesaurusList({});
        }
      } catch (err) {
        closeModal();
      }
    })
  }

  const onCancel = () => closeModal();

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
   * 上传，选中文件后回调
   */
  const onCallBackFileChange = (value: Blob) => {
    form.setFieldsValue({ file: value });
  };

  /**
   * 删除一个选中的文件
   */
  const onDeleteFile = (uid: string) => {
    const file = form.getFieldValue('file');
    const newFile = _.filter(file, item => item.uid !== uid);
    form.setFieldsValue({ file: newFile });
  };

  /**
  * 下载示例
  */
  const download = async () => {
    try {
      const response = await serverThesaurus.downloadTemplate();
      if (response?.ErrorCode) {
        message.error(response?.Description);
      }
    } catch (error) {
      //
    }
  }

  return (
    <Modal
      visible={isVisible}
      width={460}
      keyboard={false}
      forceRender={true}
      maskClosable={false}
      wrapClassName="modal-import-words"
      title={intl.get('ThesaurusManage.importData')}
      onOk={onSubmit}
      onCancel={onCancel}
      afterClose={() => {
        form.resetFields();
      }}
    >
      <div>
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          validateTrigger={['onChange', 'onBlur']}
          initialValues={{
            mode: 'add'
          }}
        >
          <Form.Item
            label={intl.get('ThesaurusManage.fileUpload')}
            name="file"
            rules={[{ required: true, message: intl.get('ThesaurusManage.noFile') }]}
            extra={
              <div className="importWords-extraBox">
                <div className="fileExtra">• {intl.get('ThesaurusManage.filetype')}</div>
                <div className="fileExtra ad-flex">•<div className="ad-ml-1">{intl.get('ThesaurusManage.fileSize')}</div></div>
                <div>• <span className="ad-c-primary down-style" onClick={() => download()}>{intl.get('ThesaurusManage.tamplate')}</span></div>
              </div>
            }
          >
            <UploadCommon
              accept="text/plain,.csv"
              largestFileCount={1}
              limitSize={1024 * 1024 * 10}
              multiple={false}
              renderButton={(value: { uid: string; name: string }[]) => (
                <UploadShowLine value={value} onDeleteFile={onDeleteFile} />
              )}
              onError={onError}
              onCallBackFileChange={onCallBackFileChange}
            />
          </Form.Item>
          <Form.Item
            name="mode"
            label={intl.get('ThesaurusManage.importPolicy')}
          >
            <Radio.Group>
              <Space direction="vertical">
                <Radio value="add">
                  <div className="ad-c-text">{intl.get('ThesaurusManage.addData')}</div>
                  <div className="ad-c-subtext">{intl.get('ThesaurusManage.duplicate')}</div>
                </Radio>
                <Radio value="replace">
                  <div className="ad-c-text">{intl.get('ThesaurusManage.replace')}</div>
                  <div className="ad-c-subtext">{intl.get('ThesaurusManage.repl')}</div>
                </Radio>
              </Space>
            </Radio.Group>
          </Form.Item>
        </Form>
      </div>
    </Modal>
  )
}
export default ModalImport;
