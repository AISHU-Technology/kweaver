import React, { memo } from 'react';
import { Button, Modal } from 'antd';
import intl from 'react-intl-universal';

// 弹窗内容
const ModalContent = memo(props => {
  const { handleCancel, errorReport } = props;

  return (
    <div className="">
      <div className="error-modal-title">{intl.get('task.errorReport')}</div>

      <div className="error-modal-body">
        <pre className="error-pre">{errorReport ? JSON.stringify(errorReport, null, 2) : ''}</pre>
      </div>

      <div className="error-modal-footer">
        <Button className="ant-btn-default error-modal-button" onClick={handleCancel}>
          {intl.get('task.close')}
        </Button>
      </div>
    </div>
  );
});

const errorModal = props => {
  const { errorModal, handleCancel, setOperationId, errorReport, ...otherProps } = props;

  return (
    <Modal
      visible={errorModal}
      onCancel={handleCancel}
      wrapClassName="task-error-modal"
      focusTriggerAfterClose={false}
      closable={true}
      afterClose={() => setOperationId(null)}
      maskClosable={false}
      width="800px"
      footer={null}
    >
      <ModalContent {...otherProps} errorReport={errorReport} handleCancel={handleCancel} />
    </Modal>
  );
};

export default errorModal;
