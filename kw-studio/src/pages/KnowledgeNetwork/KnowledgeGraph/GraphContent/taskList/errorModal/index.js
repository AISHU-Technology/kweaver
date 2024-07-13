import React, { memo } from 'react';
import { Button, Modal } from 'antd';
import intl from 'react-intl-universal';
import './style.less';
import UniversalModal from '@/components/UniversalModal';
// 弹窗内容
const ModalContent = memo(props => {
  const { handleCancel, errorReport } = props;

  return (
    <div className="kw-h-100">
      <div className="error-modal-body">
        <pre className="error-pre">{errorReport ? JSON.stringify(errorReport, null, 2) : ''}</pre>
      </div>

      {/* <div className="error-modal-footer">*/}
      {/*  <Button className="ant-btn-default error-modal-button" onClick={handleCancel}>*/}
      {/*    {intl.get('task.close')}*/}
      {/*  </Button>*/}
      {/* </div>*/}
    </div>
  );
});

const errorModal = props => {
  const { errorModal, handleCancel, setOperationId, errorReport, ...otherProps } = props;

  return (
    <UniversalModal
      title={intl.get('task.errorReport')}
      open={errorModal}
      onCancel={handleCancel}
      wrapClassName="task-error-modal"
      focusTriggerAfterClose={false}
      closable={true}
      afterClose={() => setOperationId && setOperationId(null)}
      maskClosable={false}
      width="800px"
    >
      <ModalContent {...otherProps} errorReport={errorReport} handleCancel={handleCancel} />
    </UniversalModal>
  );
};

export default errorModal;
