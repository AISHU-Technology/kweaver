import React, { memo, useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import { Modal, Button, message } from 'antd';

import './style.less';

const ModalContent = memo((props: any) => {
  const { handleCancel, errorDes } = props;

  return (
    <div className="">
      <div className="error-modal-title">{'失败详情'}</div>

      <div className="error-modal-body">
        <pre className="error-pre">{errorDes ? JSON.stringify(errorDes, null, 2) : ''}</pre>
      </div>

      <div className="error-modal-footer">
        <Button className="ant-btn-default error-modal-button" onClick={handleCancel}>
          {intl.get('task.close')}
        </Button>
      </div>
    </div>
  );
});

const ErrorModal = (props: any) => {
  const { isErrorModal, handleCancel, errorDes } = props;
  return (
    <Modal
      visible={isErrorModal}
      onCancel={handleCancel}
      wrapClassName="task-error-modal"
      focusTriggerAfterClose={false}
      closable={true}
      maskClosable={false}
      width="800px"
      footer={null}
    >
      <ModalContent handleCancel={handleCancel} errorDes={errorDes} />
    </Modal>
  );
};

export default ErrorModal;
