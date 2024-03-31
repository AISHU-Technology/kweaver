import React from 'react';
import intl from 'react-intl-universal';

import { Button, Modal } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';

import './style.less';

const ModalDelete = (props: any) => {
  const { isVisible, onOk, onCancel } = props;

  return (
    <Modal
      width="470px"
      footer={null}
      maskClosable={false}
      visible={isVisible}
      focusTriggerAfterClose={false}
      wrapClassName="search-graph-delete-modal"
      onCancel={e => {
        onCancel();
      }}
    >
      <div className="delete-modal-title">
        <ExclamationCircleFilled className="title-icon" />
        <span className="title-text">{intl.get('searchGraph.clearo')}</span>
      </div>
      <div className="delete-modal-body">{intl.get('searchGraph.cleart')}</div>

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
