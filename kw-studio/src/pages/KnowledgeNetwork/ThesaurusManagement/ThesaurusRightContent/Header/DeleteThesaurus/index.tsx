import React from 'react';
import { Modal, Button, message } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';
import intl from 'react-intl-universal';

import serverThesaurus from '@/services/thesaurus';

import './style.less';
import { sessionStore } from '@/utils/handleFunction';
const ERROR_CODE: Record<string, string> = {
  'Builder.LexiconController.DeleteLexicon.LexiconIdNotExist': 'ThesaurusManage.nullThesaurusId'
};
const DeleteThesaurus = (props: any) => {
  const { isVisible, closeModal, thesaId, getThesaurusList, onClearInput } = props;

  // 取消
  const onCancel = () => {
    closeModal();
  };

  // 确定
  const onOk = async () => {
    const data = { id_list: [thesaId] };
    try {
      const response = await serverThesaurus.thesaurusDelete(data);
      const { ErrorCode, Description } = response || {};
      if (ErrorCode) {
        ERROR_CODE[ErrorCode] ? message.error(intl.get(ERROR_CODE[ErrorCode])) : message.error(response?.ErrorDetails);
        closeModal();
        return;
      }
      closeModal();
      onClearInput();
      sessionStore.remove('thesaurusSelectedId');
      getThesaurusList({ page: 1, word: '' });
      message.success(intl.get('global.deleteSuccess'));
    } catch (err) {
      closeModal();
    }
  };

  return (
    <Modal
      width="432px"
      footer={null}
      closable={false}
      maskClosable={false}
      open={isVisible}
      focusTriggerAfterClose={false}
      wrapClassName="thesaurus-delete-modal"
    >
      <div className="delete-modal-title">
        <ExclamationCircleFilled className="title-icon" />
        <span className="title-text">{intl.get('ThesaurusManage.delThesaurusTitle')}</span>
      </div>
      <div className="delete-modal-body">{intl.get('ThesaurusManage.delThesaurusDes')}</div>

      <div className="delete-modal-footer">
        <Button className="ant-btn-default delete-cancel" onClick={onCancel}>
          {intl.get('datamanagement.cancel')}
        </Button>
        <Button type="primary" className="delete-ok" onClick={onOk}>
          {intl.get('datamanagement.ok')}
        </Button>
      </div>
    </Modal>
  );
};
export default DeleteThesaurus;
