import React, { memo, useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import { Modal, Button, message } from 'antd';
import UniversalModal from '@/components/UniversalModal';

import './style.less';

const ModalContent = memo((props: any) => {
  const { handleCancel, errorDes } = props;

  return (
    <div className="kw-flex thesaurus-error-info-modal-root">
      <div className="error-modal-body kw-pl-6 kw-pr-6">
        <pre className="error-pre kw-mb-0">{errorDes ? JSON.stringify(errorDes, null, 2) : ''}</pre>
      </div>

      {/* <div className="error-modal-footer kw-flex">
        <Button className="ant-btn-default error-modal-button" onClick={handleCancel}>
          {intl.get('task.close')}
        </Button>
      </div> */}
    </div>
  );
});

const ErrorModal = (props: any) => {
  const { isErrorModal, handleCancel, errorDes } = props;
  return (
    <UniversalModal
      open={isErrorModal}
      onCancel={handleCancel}
      title={intl.get('ThesaurusManage.failInfo')}
      wrapClassName="thesaurus-error-modal"
      focusTriggerAfterClose={false}
      closable={true}
      maskClosable={false}
      width="800px"
      footer={null}
    >
      <ModalContent handleCancel={handleCancel} errorDes={errorDes} />
    </UniversalModal>
  );
};

export default ErrorModal;
