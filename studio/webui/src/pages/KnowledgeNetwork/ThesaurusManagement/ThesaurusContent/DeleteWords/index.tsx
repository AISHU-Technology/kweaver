import React from 'react'
import { Modal, Button, message } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';
import intl from 'react-intl-universal';

import serverThesaurus from '@/services/thesaurus';

import './style.less';
const ERROR_CODE: Record<string, string> = {
  'Builder.LexiconController.DeleteLexiconWord.LexiconIdNotExist': 'ThesaurusManage.nullThesaurusId',
  'Builder.LexiconController.DeleteLexiconWord.WordNotExist': 'ThesaurusManage.delWordNotExist'
}
const DeleteWordsModal = (props: any) => {
  const { isVisible, deleteType, deleteValue, closeModal, selectedThesaurus, getThesaurusById, page } = props;
  const onCancel = () => { closeModal() }
  const onOk = async () => {
    const list = deleteValue;

    const data = {
      word_info_list: list,
      id: selectedThesaurus?.id
    }

    try {
      const response = await serverThesaurus.thesaurusDeleteWords(data);
      const { ErrorCode, Descrition } = response || {};
      if (ErrorCode) {
        ERROR_CODE[ErrorCode] ? message.error(intl.get(ERROR_CODE[ErrorCode])) : message.error(Descrition);
        closeModal();
        return;
      }
      closeModal();
      getThesaurusById(selectedThesaurus, page);
      message.success(intl.get('global.deleteSuccess'));
    } catch (err) {
      closeModal();
    }
  }
  return (
    <Modal
      width="432px"
      footer={null}
      closable={false}
      maskClosable={false}
      visible={isVisible}
      focusTriggerAfterClose={false}
      wrapClassName="words-delete-modal"
    >
      <div className="delete-modal-title">
        <ExclamationCircleFilled className="title-icon" />
        <span className="title-text">
          {
            deleteType === 'one' ? intl.get('ThesaurusManage.delOneWordTitle') : intl.get('ThesaurusManage.delmoreTitle')
          }

        </span>
      </div>
      <div className="delete-modal-body">
        {
          deleteType === 'one' ? <span>{intl.get('ThesaurusManage.delOneDes')}</span> :
            <div>{intl.get('ThesaurusManage.delmoreDes').split('|')[0]}<span className="ad-c-error ad-ml-1 ad-mr-1">{deleteValue.length}</span>{intl.get('ThesaurusManage.delmoreDes').split('|')[1]}</div>
        }

      </div>

      <div className="delete-modal-footer">
        <Button className="ant-btn-default delete-cancel" onClick={onCancel}>
          {intl.get('datamanagement.cancel')}
        </Button>
        <Button type="primary" className="delete-ok" onClick={onOk}>
          {intl.get('datamanagement.ok')}
        </Button>
      </div>
    </Modal>
  )
}
export default DeleteWordsModal;