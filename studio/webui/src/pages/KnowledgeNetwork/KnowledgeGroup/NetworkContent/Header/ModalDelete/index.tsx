import React from 'react';
import intl from 'react-intl-universal';
import { Button, Modal } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';

import './style.less';

interface ModalDeleteInterface {
  visible: boolean;
  onOk: () => void;
  onCancel: () => void;
}

const ModalDelete = (props: ModalDeleteInterface) => {
  const { visible, onOk, onCancel } = props;

  return (
    <Modal
      width="470px"
      footer={null}
      closable={false}
      maskClosable={false}
      visible={visible}
      focusTriggerAfterClose={false}
      wrapClassName="graph-delete-modal"
    >
      <div className="delete-modal-title">
        <ExclamationCircleFilled className="title-icon" />
        <span className="title-text">{intl.get('knowledge.deleteTitle')}</span>
      </div>
      <div className="delete-modal-body">{intl.get('knowledge.deleteDes')}</div>

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

export default ModalDelete;
