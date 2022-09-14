import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, message } from 'antd';
import _ from 'lodash';
import intl from 'react-intl-universal';

import serverThesaurus from '@/services/thesaurus';
import Labels from '../../../Labels';
import './style.less';

const { TextArea } = Input;
const ERROR_CODE: Record<string, string> = {
  'Builder.LexiconController.DeleteLexicon.LexiconIdNotExist': 'ThesaurusManage.nullThesaurusId',
  'Builder.LexiconController.GetLabels.KnowledgeIdNotExist': 'ThesaurusManage.nullKnowlegeId'
}
const EditThesaurusModal = (props: any) => {
  const [form] = Form.useForm();
  const { isVisible, knowledge, closeModal, getThesaurusList, selectedThesaurus } = props;
  const [tags, setTags] = useState<string[]>([]);
  const [selectOption, setSlectOption] = useState<Array<string>>([]); // 候选的标签

  useEffect(() => {
    if (isVisible) {
      getLabels();
    }
    const initvalue = {
      name: selectedThesaurus?.lexicon_name,
      description: selectedThesaurus?.description
    }
    form.setFieldsValue({ ...initvalue });

    const { labels } = selectedThesaurus;
    setTags(labels);
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
  }

  // 提交
  const onSubmit = () => {
    form
      .validateFields()
      .then(async values => {
        const { name, description } = values;
        const data = {
          name,
          description: description?.trim() || '',
          labels: tags,
          id: selectedThesaurus?.id
        }

        const response = await serverThesaurus.thesaurusEdit(data);
        const { ErrorCode } = response || {};
        if (ErrorCode === 'Builder.LexiconController.EditLexicon.DuplicatedName') {
          // 重复的名字
          form.setFields([
            {
              name: 'name',
              errors: [intl.get('ThesaurusManage.nameRepeat')]
            }
          ]);
          return;
        }
        // 其他错误
        if (ErrorCode) {
          ERROR_CODE[ErrorCode] ? message.error(intl.get(ERROR_CODE[ErrorCode]))
            : message.error(response?.ErrorDetails);
          closeModal();
          return;
        }
        message.success(intl.get('graphList.editSuccess'));
        closeModal();
        getThesaurusList({});
      })
  }
  // 取消
  const onCancel = () => { closeModal() }

  return (
    <Modal
      visible={isVisible}
      width={460}
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
    >
      <Form
        form={form}
        layout="vertical"
        validateTrigger={['onChange', 'onBlur']}
        initialValues={{
          name: selectedThesaurus?.lexicon_name,
          description: selectedThesaurus?.description
        }}
      >

        <Form.Item
          name="name"
          label={intl.get('graphList.name')}
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
          name="labels"
          label={intl.get('ThesaurusManage.labels')}
        >
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
  )
}
export default EditThesaurusModal