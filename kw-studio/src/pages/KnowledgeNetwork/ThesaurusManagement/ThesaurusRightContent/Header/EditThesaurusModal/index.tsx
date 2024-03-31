import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, message } from 'antd';
import _ from 'lodash';
import intl from 'react-intl-universal';
import TrimmedInput from '@/components/TrimmedInput';

import serverThesaurus from '@/services/thesaurus';
import Tags from '@/components/Tags';
import { ONLY_KEYBOARD } from '@/enums';
import UniversalModal from '@/components/UniversalModal';

import './style.less';

const { TextArea } = Input;
const ERROR_CODE: Record<string, string> = {
  'Builder.LexiconController.DeleteLexicon.LexiconIdNotExist': 'ThesaurusManage.nullThesaurusId',
  'Builder.LexiconController.GetLabels.KnowledgeIdNotExist': 'ThesaurusManage.nullKnowlegeId'
};
const EditThesaurusModal = (props: any) => {
  const [form] = Form.useForm();
  const { isVisible, knowledge, closeModal, getThesaurusList, selectedThesaurus, onClearInput } = props;

  useEffect(() => {
    if (selectedThesaurus && isVisible) {
      const initvalue = {
        name: selectedThesaurus?.lexicon_name,
        description: selectedThesaurus?.description ? JSON.parse(selectedThesaurus?.description) : ''
      };
      form.setFieldsValue({ ...initvalue });
    }
  }, [isVisible]);

  // 提交
  const onSubmit = () => {
    form.validateFields().then(async values => {
      const { name, description } = values;
      const data = {
        name,
        description: description?.trim() || '',
        id: selectedThesaurus?.id
      };

      const response = await serverThesaurus.thesaurusEdit(data);
      const { ErrorCode } = response || {};
      if (ErrorCode === 'Builder.LexiconController.EditLexicon.DuplicatedName') {
        // 重复的名字
        form.setFields([
          {
            name: 'name',
            errors: [intl.get('global.repeatName')]
          }
        ]);
        return;
      }
      // 其他错误
      if (ErrorCode) {
        ERROR_CODE[ErrorCode] ? message.error(intl.get(ERROR_CODE[ErrorCode])) : message.error(response?.ErrorDetails);
        closeModal();
        return;
      }
      message.success(intl.get('graphList.editSuccess'));
      closeModal();
      getThesaurusList({});
      onClearInput();
    });
  };
  // 取消
  const onCancel = () => {
    closeModal();
  };

  return (
    <UniversalModal
      visible={isVisible}
      width={480}
      keyboard={false}
      forceRender={true}
      maskClosable={false}
      wrapClassName="modal-edit-thesaurus"
      title={intl.get('ThesaurusManage.editThesaurus')}
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
      <Form
        form={form}
        layout="vertical"
        // validateTrigger={['onChange', 'onBlur']}
        initialValues={{
          name: selectedThesaurus?.lexicon_name,
          description: selectedThesaurus?.description
        }}
      >
        <Form.Item
          name="name"
          label={intl.get('ThesaurusManage.createMode.lexiconName')}
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
          name="description"
          label={intl.get('datamanagement.description')}
          validateFirst={true}
          rules={[
            {
              type: 'string'
            },
            { max: 255, message: intl.get('workflow.basic.maxLong', { length: 255 }) },
            {
              pattern: /^[!-~a-zA-Z0-9_\u4e00-\u9fa5 ！￥……（）——“”：；，。？、‘’《》｛｝【】·\s]+$/,
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
export default EditThesaurusModal;
