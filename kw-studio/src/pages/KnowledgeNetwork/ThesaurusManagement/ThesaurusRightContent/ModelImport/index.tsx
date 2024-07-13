import React from 'react';
import { Form, message, Radio, Space } from 'antd';
import _ from 'lodash';
import intl from 'react-intl-universal';

import serverThesaurus from '@/services/thesaurus';
import { UPLOAD_FAIL_TYPE } from '@/enums';

import UploadCommon from '@/components/UploadCommon';
import UploadShowLine from '../../UploadShowLine';
import UniversalModal from '@/components/UniversalModal';

import './style.less';
const ERROR_CODE: Record<string, string> = {
  'Builder.LexiconController.ImportWord2Lexicon.LexiconIdNotExist': 'ThesaurusManage.nullThesaurusId',
  'Builder.LexiconController.ImportWord2Lexicon.FileUploadFailed': 'ThesaurusManage.uploadFileFailed',
  'Builder.LexiconController.ImportWord2Lexicon.FormatMismatch': 'ThesaurusManage.formatMismatch',
  'Builder.LexiconController.ImportWord2Lexicon.FileFormatError': 'ThesaurusManage.FileFormatError',
  'Builder.LexiconController.ImportWord2Lexicon.ContentFormatError': 'ThesaurusManage.ContentFormatError',
  'Builder.LexiconController.ImportWord2Lexicon.InvalidStatus': 'ThesaurusManage.editwordsError',
  'Builder.LexiconController.KnowledgeCapacityError': 'license.operationFailed' // 容量达上限
};
const { OVER_MAX_FILES_COUNT, OVER_SINGLE_FILE_SIZE } = UPLOAD_FAIL_TYPE;
const UPLOAD_ERROR = {
  [OVER_MAX_FILES_COUNT]: intl.get('ThesaurusManage.fileCountMessage'),
  [OVER_SINGLE_FILE_SIZE]: intl.get('ThesaurusManage.DataExceeded')
};
const ModalImport = (props: any) => {
  const [form] = Form.useForm();

  const { isVisible, closeModal, selectedThesaurus, page } = props;
  const { getThesaurusList, setPage, setErrorInfo, getThesaurusById } = props;

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
      };
      try {
        const response: any = await serverThesaurus.thesaurusImportWords(data);
        const { ErrorCode, ErrorDetails } = response || {};
        if (ErrorCode) {
          //
          setTimeout(() => {
            ERROR_CODE[ErrorCode] ? message.error(intl.get(ERROR_CODE[ErrorCode])) : message.error(ErrorDetails);
            closeModal();
            setErrorInfo(ErrorDetails);
            getThesaurusById(selectedThesaurus?.id, page);
          }, 1000);
          return;
        }
        setTimeout(() => {
          message.success(intl.get('knowledge.importSuccess'));
        }, 1000);
        setPage(1);
        closeModal();
        getThesaurusList({});
      } catch (err) {
        closeModal();
      }
    });
  };

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
  };

  return (
    <UniversalModal
      open={isVisible}
      width={480}
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
      footerData={[
        { label: intl.get('graphList.cancel'), onHandle: onCancel },
        { label: intl.get('graphList.sure'), type: 'primary', onHandle: onSubmit }
      ]}
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
                <div className="fileExtra kw-c-text">• {intl.get('ThesaurusManage.filetype')}</div>
                <div className="fileExtra kw-flex kw-c-text">
                  •<div className="kw-ml-1">{intl.get('ThesaurusManage.fileSize')}</div>
                </div>
                <div className="fileExtra kw-c-text">
                  •{' '}
                  <span className="kw-c-primary down-style" onClick={() => download()}>
                    {intl.get('ThesaurusManage.tamplate')}
                  </span>
                </div>
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
          <Form.Item name="mode" label={intl.get('ThesaurusManage.importPolicy')}>
            <Radio.Group>
              <Space direction="vertical">
                <Radio value="add">
                  <div className="kw-c-text">{intl.get('ThesaurusManage.addData')}</div>
                  <div className="kw-c-subtext">{intl.get('ThesaurusManage.duplicate')}</div>
                </Radio>
                <Radio value="replace">
                  <div className="kw-c-text">{intl.get('ThesaurusManage.replace')}</div>
                  <div className="kw-c-subtext">{intl.get('ThesaurusManage.repl')}</div>
                </Radio>
              </Space>
            </Radio.Group>
          </Form.Item>
        </Form>
      </div>
    </UniversalModal>
  );
};
export default ModalImport;
