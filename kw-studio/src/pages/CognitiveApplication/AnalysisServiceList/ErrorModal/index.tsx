import React, { memo } from 'react';
import intl from 'react-intl-universal';
import { Modal, Button } from 'antd';

import './style.less';

const ModalContent = memo((props: any) => {
  const { onHandleCancel } = props;

  return (
    <div className="">
      <div className="error-modal-title">{intl.get('task.errorReport')}</div>

      <div className="error-modal-body"></div>

      <div className="error-modal-footer">
        <Button className="ant-btn-default error-modal-button" onClick={onHandleCancel}>
          {intl.get('task.close')}
        </Button>
      </div>
    </div>
  );
});

const ErrorModal = (props: any) => {
  const { errorModal, onHandleCancel } = props;
  return (
    <Modal
      open={errorModal}
      onCancel={onHandleCancel}
      wrapClassName="task-error-modal"
      focusTriggerAfterClose={false}
      closable={true}
      //   afterClose={}
      maskClosable={false}
      width="800px"
      footer={null}
    >
      <ModalContent onHandleCancel={onHandleCancel} />
    </Modal>
  );
};

export default ErrorModal;
