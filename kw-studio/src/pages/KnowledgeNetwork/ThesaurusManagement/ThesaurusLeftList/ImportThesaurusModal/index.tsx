import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, message } from 'antd';
import _ from 'lodash';
import intl from 'react-intl-universal';

import UploadCommon from '@/components/UploadCommon';
import { UPLOAD_FAIL_TYPE, ONLY_KEYBOARD } from '@/enums';

import serviceLicense from '@/services/license';
import serverThesaurus from '@/services/thesaurus';
import Tags from '@/components/Tags';
import TrimmedInput from '@/components/TrimmedInput';

import UniversalModal from '@/components/UniversalModal';
import UploadShowLine from '../../UploadShowLine';
import './style.less';
import { sessionStore } from '@/utils/handleFunction';

const { TextArea } = Input;
const ERROR_CODE: Record<string, string> = {
  // 'Builder.LexiconController.CreateLexicon.KnowledgeIdNotExist': 'ThesaurusManage.nullKnowlegeId',
  // 'Builder.LexiconController.CreateLexicon.DuplicatedName': 'ThesaurusManage.nameRepeat',
  // 'Builder.LexiconController.CreateLexicon.DatabaseError': 'ThesaurusManage.DBerror',
  // 'Builder.LexiconController.CreateLexicon.FileUploadError': 'ThesaurusManage.uploadFileFailed',
  // 'Builder.LexiconController.GetLabels.KnowledgeIdNotExist': 'ThesaurusManage.nullKnowlegeId',
  'Builder.LexiconController.KnowledgeCapacityError': 'license.operationFailed' // 容量达上限
  // 'Builder.LexiconController.CreateLexicon.FileFormatError': 'ThesaurusManage.FileFormatError',
  // 'Builder.LexiconController.CreateLexicon.ContentFormatError': 'ThesaurusManage.ContentFormatError'
};
const { OVER_MAX_FILES_COUNT, OVER_SINGLE_FILE_SIZE } = UPLOAD_FAIL_TYPE;
const UPLOAD_ERROR = {
  [OVER_MAX_FILES_COUNT]: intl.get('ThesaurusManage.fileCountMessage'),
  [OVER_SINGLE_FILE_SIZE]: intl.get('ThesaurusManage.DataExceeded')
};
const ImportThesaurusModal = (props: any) => {
  const [form] = Form.useForm();
  const { isVisible, knowledge, closeModal, getThesaurusList, setPage } = props;

  // 提交
  const onSubmit = () => {
    onCalculate();
    form.validateFields().then(async values => {
      const { name, description, file } = values;
      const files = _.isEmpty(file) ? JSON.stringify([]) : file;

      const data = {
        name,
        file: files,
        description: JSON.stringify(description) || '',
        knowledge_id: knowledge?.id
      };

      const response = await serverThesaurus.thesaurusCreate(data);
      const { ErrorCode, ErrorDetails } = response || {};
      if (ErrorCode === 'Builder.LexiconController.CreateLexicon.DuplicatedName') {
        // 重复的名字
        form.setFields([
          {
            name: 'name',
            errors: [intl.get('global.repeatName')]
          }
        ]);
        return;
      }
      if (ErrorCode) {
        setTimeout(() => {
          ERROR_CODE[ErrorCode] ? message.error(intl.get(ERROR_CODE[ErrorCode])) : message.error(ErrorDetails);
          closeModal();
        }, 1000);
        return;
      }
      if (response?.res) {
        setTimeout(() => {
          response?.res?.status === 'success'
            ? message.success(intl.get('graphList.addSuccess'))
            : response?.res?.status === 'failed'
            ? message.success(intl.get('knowledge.importFailed'))
            : null;
        }, 1000);
      }
      setPage(1);
      closeModal();
      setTimeout(() => {
        getThesaurusList({}); // 因为是异步任务，所以需要延迟查询
        sessionStore.remove('thesaurusSelectedId');
      }, 100);
    });
  };
  // 取消
  const onCancel = () => {
    closeModal();
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
   * 获取知识量
   */
  const onCalculate = async () => {
    try {
      const res = await serviceLicense.graphCountAll();
      if (res) {
        const { all_knowledge, knowledge_limit } = res;
        if (knowledge_limit === -1) return; // 无限制
        if (knowledge_limit - all_knowledge >= 0 && knowledge_limit - all_knowledge < knowledge_limit * 0.1) {
          message.warning(intl.get('license.remaining'));
        }
      }
    } catch (error) {
      if (!error.type) return;
      const { Description } = error.response || {};
      Description && message.error(Description);
    }
  };

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
        message.warning(response?.Description);
      }
    } catch (error) {
      //
    }
  };

  return (
    <UniversalModal
      visible={isVisible}
      width={480}
      keyboard={false}
      forceRender={true}
      maskClosable={false}
      wrapClassName="modal-create-thesaurus"
      title={intl.get('ThesaurusManage.importLibrary')}
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
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label={intl.get('ThesaurusManage.name')}
          rules={[
            { required: true, message: intl.get('global.noNull') },
            { max: 50, message: intl.get('global.lenErr', { len: 50 }) },
            {
              pattern: ONLY_KEYBOARD,
              message: intl.get('global.onlyKeyboard')
            }
          ]}
        >
          <TrimmedInput autoComplete="off" placeholder={intl.get('ThesaurusManage.nameInput')} />
        </Form.Item>
        <Form.Item
          label={intl.get('ThesaurusManage.fileUpload')}
          name="file"
          extra={
            <div className="createThessurus-extraBox">
              <div className="fileExtra kw-c-text">• {intl.get('ThesaurusManage.filetype')}</div>
              <div className="fileExtra kw-flex kw-c-text">
                •<div className="kw-ml-1">{intl.get('ThesaurusManage.fileSize')}</div>
              </div>
              <div className="fileExtra kw-pointer kw-c-text">
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

        <Form.Item
          name="description"
          label={intl.get('datamanagement.description')}
          validateFirst={true}
          rules={[
            // {
            //   type: 'string'
            // },
            { max: 255, message: intl.get('workflow.basic.maxLong', { length: 255 }) },
            {
              pattern: ONLY_KEYBOARD,
              message: intl.get('workflow.basic.desConsists')
            }
          ]}
        >
          <TextArea rows={3} autoComplete="off" />
        </Form.Item>
      </Form>
    </UniversalModal>
  );
};
export default ImportThesaurusModal;
