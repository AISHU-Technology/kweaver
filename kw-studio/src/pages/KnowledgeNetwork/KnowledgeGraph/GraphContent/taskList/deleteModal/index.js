import React, { memo } from 'react';
import { Button, Modal } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';
import intl from 'react-intl-universal';
import './index.less';

// 弹窗内容
const ModalContent = memo(props => {
  const { handleCancel, handleDeleteOk } = props;

  return (
    <div className="">
      <div className="stop-modal-title">
        <ExclamationCircleFilled className="title-icon" />
        <span className="title-text">{intl.get('task.confirmDelete')}</span>
      </div>

      <div className="stop-modal-body">{intl.get('task.confirmDeleteText')}</div>

      <div className="stop-modal-footer">
        <Button className="ant-btn-default stop-modal-cannal-button" onClick={handleCancel}>
          {intl.get('task.cancel')}
        </Button>
        <Button type="primary" className="stop-modal-ok-button" onClick={handleDeleteOk}>
          {intl.get('task.ok')}
        </Button>
      </div>
    </div>
  );
});

const DeleteModal = props => {
  const { deleteModal, handleCancel, setOperationId, handleDeleteOk, ...otherProps } = props;

  return (
    <Modal
      open={deleteModal}
      onCancel={handleCancel}
      wrapClassName="task-stop-modal"
      focusTriggerAfterClose={false}
      // getContainer={false}
      closable={false}
      destroyOnClose={true}
      afterClose={() => setOperationId(null)}
      maskClosable={false}
      width="432px"
      style={{ top: '20vh' }}
      footer={null}
    >
      <ModalContent {...otherProps} handleDeleteOk={handleDeleteOk} handleCancel={handleCancel} />
    </Modal>
  );
};

export default DeleteModal;
