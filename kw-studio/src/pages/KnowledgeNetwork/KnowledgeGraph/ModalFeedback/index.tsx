import React from 'react';
import intl from 'react-intl-universal';
import { Modal, Button } from 'antd';
import { ClockCircleFilled, CheckCircleFilled, ExclamationCircleFilled } from '@ant-design/icons';

import './index.less';

type ModalFeedbackType = {
  isVisible: boolean;
  data: {
    type: string;
    fileCount: number;
    message: string;
  };
  onCancel: (isSelectedFirst?: any) => void;
};

/**
 * 导入反馈弹窗
 */
const ModalFeedback = (props: ModalFeedbackType) => {
  const { isVisible = false, data, onCancel } = props;
  const { type = 'loading', fileCount, message } = data;
  const failMessage = message === undefined ? intl.get('license.operationFailed') : message;
  return (
    <Modal
      open={isVisible}
      width={460}
      footer={null}
      keyboard={false}
      closable={!(type === 'loading')}
      maskClosable={false}
      destroyOnClose={true}
      wrapClassName="modalFeedbackRoot"
      onCancel={() => onCancel()}
    >
      <div className="container">
        {type === 'loading' && (
          <React.Fragment>
            <ClockCircleFilled className="icon" style={{ color: '#52c41a' }} />
            <div className="title">{intl.get('knowledge.waiting')}</div>
            <div className="subTitle">{intl.get('knowledge.waitPatiently', { fileCount })}</div>
          </React.Fragment>
        )}
        {type === 'success' && (
          <React.Fragment>
            <CheckCircleFilled className="icon" style={{ color: '#126EE3 ' }} />
            <div className="title">{intl.get('knowledge.importSuccess')}</div>
            <div className="subTitle">{intl.get('knowledge.countImportSuccess', { fileCount })}</div>
            <Button className="bottom" type="primary" onClick={() => onCancel(true)}>
              {intl.get('knowledge.goToCheck')}
            </Button>
          </React.Fragment>
        )}
        {type === 'fail' && (
          <React.Fragment>
            <ExclamationCircleFilled className="icon" style={{ color: '#ff4d4f' }} />
            <div className="title">{intl.get('knowledge.importFailed')}</div>
            <div className="subTitle">{failMessage}</div>
            <Button className="bottom" onClick={() => onCancel()}>
              {intl.get('knowledge.close')}
            </Button>
          </React.Fragment>
        )}
        {type === 'failNotEnoughSpace' && (
          <React.Fragment>
            <ExclamationCircleFilled className="icon" style={{ color: '#ff4d4f' }} />
            <div className="title">{intl.get('knowledge.importFailed')}</div>
            <div className="subTitle">{intl.get('knowledge.insufficientSpace')}</div>
            <Button className="bottom" onClick={() => onCancel()}>
              {intl.get('knowledge.close')}
            </Button>
          </React.Fragment>
        )}
      </div>
    </Modal>
  );
};

export default ModalFeedback;
