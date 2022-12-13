import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, message, Upload, Button } from 'antd';
import { InboxOutlined, UploadOutlined } from '@ant-design/icons';
import _ from 'lodash';
import intl from 'react-intl-universal';

import UploadCommon from '@/components/UploadCommon';
import { UPLOAD_FAIL_TYPE } from '@/enums';

import serverThesaurus from '@/services/thesaurus';
import Labels from '../../Labels';
import UploadShowLine from '../../UploadShowLine';
import './style.less';

const { TextArea } = Input;
const ERROR_CODE: Record<string, string> = {
  'Builder.LexiconController.CreateLexicon.KnowledgeIdNotExist': 'ThesaurusManage.nullKnowlegeId',
  'Builder.LexiconController.CreateLexicon.DuplicatedName': 'ThesaurusManage.nameRepeat',
  'Builder.LexiconController.CreateLexicon.DatabaseError': 'ThesaurusManage.DBerror',
  'Builder.LexiconController.CreateLexicon.FileUploadError': 'ThesaurusManage.uploadFileFailed',
  'Builder.LexiconController.GetLabels.KnowledgeIdNotExist': 'ThesaurusManage.nullKnowlegeId'
  // 'Builder.LexiconController.CreateLexicon.FileFormatError': 'ThesaurusManage.FileFormatError',
  // 'Builder.LexiconController.CreateLexicon.ContentFormatError': 'ThesaurusManage.ContentFormatError'
};
const { OVER_MAX_FILES_COUNT, OVER_SINGLE_FILE_SIZE } = UPLOAD_FAIL_TYPE;
const UPLOAD_ERROR = {
  [OVER_MAX_FILES_COUNT]: intl.get('ThesaurusManage.fileCountMessage'),
  [OVER_SINGLE_FILE_SIZE]: intl.get('ThesaurusManage.DataExceeded')
};
const CreateThesaurusModal = (props: any) => {
  const [form] = Form.useForm();
  const { isVisible, knowledge, closeModal, getThesaurusList, setPage } = props;
  const [tags, setTags] = useState<string[]>([]); // 已选择的标签
  const [selectOption, setSlectOption] = useState<Array<string>>([]); // 候选的标签

  useEffect(() => {
    if (isVisible) {
      getLabels();
    }
  }, [isVisible]);

  /**
   * 获取labels
   */
  const getLabels = async () => {
    if (!knowledge?.id) return;
    try {
      const response = await serverThesaurus.thesaurusLabelList({ knowledge_id: knowledge?.id });
      const { ErrorCode, ErrorDetails } = response || {};
      if (ErrorCode) {
        ERROR_CODE[ErrorCode] ? message.error(intl.get(ERROR_CODE[ErrorCode])) : message.error(ErrorDetails);
      }
      if (response?.res) {
        setSlectOption(response?.res);
      }
    } catch (err) {
      //
    }
  };

  // 提交
  const onSubmit = () => {
    form.validateFields().then(async values => {
      const { name, description, file } = values;
      const files = _.isEmpty(file) ? JSON.stringify([]) : file;

      const data = {
        name,
        file: files,
        description: description?.trim() || '',
        labels: JSON.stringify(tags),
        knowledge_id: knowledge?.id
      };
      try {
        const response = await serverThesaurus.thesaurusCreate(data);
        const { ErrorCode, ErrorDetails } = response || {};
        if (ErrorCode === 'Builder.LexiconController.CreateLexicon.DuplicatedName') {
          // 重复的名字
          form.setFields([
            {
              name: 'name',
              errors: [intl.get('ThesaurusManage.nameRepeat')]
            }
          ]);
          return;
        }
        if (ErrorCode) {
          ERROR_CODE[ErrorCode] ? message.error(intl.get(ERROR_CODE[ErrorCode])) : message.error(ErrorDetails);
          closeModal();
          return;
        }
        if (response?.res) {
          message.success(intl.get('graphList.addSuccess'));
        }
        setPage(1);
        closeModal();
        getThesaurusList({});
      } catch (err) {
        closeModal();
      }
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
    <Modal
      visible={isVisible}
      width={460}
      keyboard={false}
      forceRender={true}
      maskClosable={false}
      wrapClassName="modal-create-thesaurus"
      title={intl.get('ThesaurusManage.createThesaurus')}
      onOk={onSubmit}
      onCancel={onCancel}
      afterClose={() => {
        form.resetFields();
        setTags([]);
      }}
      okText={intl.get('global.ok')}
      cancelText={intl.get('global.cancel')}
    >
      <Form form={form} layout="vertical" validateTrigger={['onChange', 'onBlur']}>
        <Form.Item
          name="name"
          label={intl.get('ThesaurusManage.name')}
          rules={[
            { required: true, message: intl.get('graphList.cannotEmpty') },
            { max: 50, message: intl.get('graphList.max50') },
            {
              pattern: /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/,
              message: intl.get('datamanagement.onlyContain')
            }
          ]}
        >
          <Input
            autoComplete="off"
            placeholder={intl.get('ThesaurusManage.nameInput')}
            onChange={e => {
              const { value } = e.target;
              form.setFieldsValue({ name: value.trim() });
            }}
          />
        </Form.Item>
        <Form.Item
          label={intl.get('ThesaurusManage.fileUpload')}
          name="file"
          extra={
            <div className="createThessurus-extraBox">
              <div className="fileExtra">• {intl.get('ThesaurusManage.filetype')}</div>
              <div className="fileExtra ad-flex">
                •<div className="ad-ml-1">{intl.get('ThesaurusManage.fileSize')}</div>
              </div>
              <div>
                •{' '}
                <span className="ad-c-primary down-style" onClick={() => download()}>
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

        <Form.Item name="labels" label={intl.get('ThesaurusManage.labels')}>
          <Labels setTags={setTags} tags={tags} selectOption={selectOption} />
        </Form.Item>

        <Form.Item
          name="description"
          label={intl.get('datamanagement.description')}
          validateFirst={true}
          rules={[
            {
              type: 'string'
            },
            { max: 150, message: intl.get('workflow.basic.maxLong', { length: 150 }) },
            {
              pattern: /^[!-~a-zA-Z0-9_\u4e00-\u9fa5 ！￥……（）——“”：；，。？、‘’《》｛｝【】·\s]+$/,
              message: intl.get('workflow.basic.desConsists')
            }
          ]}
        >
          <TextArea rows={3} autoComplete="off" />
        </Form.Item>
      </Form>
    </Modal>
  );
};
export default CreateThesaurusModal;
