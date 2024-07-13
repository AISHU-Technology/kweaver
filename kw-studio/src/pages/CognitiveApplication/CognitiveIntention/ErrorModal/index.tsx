import React, { memo } from 'react';
import intl from 'react-intl-universal';
import { Modal, Button } from 'antd';

import './style.less';

const ModalContent = memo((props: any) => {
  const { handleCancel } = props;

  return (
    <div className="">
      <div className="error-modal-title">{intl.get('task.errorReport')}</div>

      <div className="error-modal-body"></div>

      <div className="error-modal-footer">
        <Button className="ant-btn-default error-modal-button" onClick={handleCancel}>
          {intl.get('task.close')}
        </Button>
      </div>
    </div>
  );
});

const ErrorModal = (props: any) => {
  const { errorModal, handleCancel } = props;
  return (
    <Modal
      open={errorModal}
      onCancel={handleCancel}
      wrapClassName="task-error-modal"
      focusTriggerAfterClose={false}
      closable={true}
      //   afterClose={}
      maskClosable={false}
      width="800px"
      footer={null}
    >
      <ModalContent handleCancel={handleCancel} />
    </Modal>
  );
};

export default ErrorModal;
