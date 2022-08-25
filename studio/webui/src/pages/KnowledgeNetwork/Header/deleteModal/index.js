/**
 * 激活/重置密码 弹窗
 * @author Haiyan
 * @date 2022/3/11
 *
 */

import React, { memo } from 'react';
import { Modal, Button, message } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';
import { useHistory } from 'react-router-dom';
import intl from 'react-intl-universal';
import servicesKnowledgeNetwork from '@/services/knowledgeNetwork';

import './index.less';

// 弹窗内容
const ModalContent = memo(props => {
  const { setVisible } = props;
  const history = useHistory();

  /**
   * 点击确定
   */
  const onOk = async e => {
    const { delId } = props;

    const res = await servicesKnowledgeNetwork.knowledgeNetDelete(delId);

    if (res && res.res) {
      message.success(intl.get('graphList.delSuccess'));
      history.push('/home/graph-list');
    }
    // 知识网络下还有图谱
    if (res.ErrorCode === 'Builder.service.knw_service.knwService.deleteKnw.GraphNotEmptyError') {
      message.error(intl.get('graphList.delFailed'));
    }
    // 没有权限删除
    if (res.ErrorCode === 'Builder.service.knw_service.knwService.deleteKnw.PermissionError') {
      message.error(intl.get('graphList.delperMissionError'));
    }
    // 删除处理失败
    if (res.ErrorCode === 'Builder.service.knw_service.knwService.deleteKnw.RequestError') {
      message.error(intl.get('graphList.deleteError'));
    }

    setVisible(false);
  };

  return (
    <div className="">
      <div className="delete-modal-title">
        <ExclamationCircleFilled className="title-icon" />
        <span className="title-text">{intl.get('graphList.sureDelNetwork')}</span>
      </div>

      <div className="delete-modal-body">{intl.get('graphList.delNetworkDes')}</div>

      <div className="delete-modal-footer">
        <Button
          className="ant-btn-default delete-cancel"
          onClick={() => {
            setVisible(false);
          }}
        >
          {intl.get('graphList.cancel')}
        </Button>
        <Button type="primary" className="delete-ok" onClick={onOk}>
          {intl.get('graphList.sure')}
        </Button>
      </div>
    </div>
  );
});

// 弹窗
const DelNetworkModal = props => {
  const { visible, setVisible, delId, ...otherProps } = props;

  return (
    <Modal
      visible={visible}
      onCancel={e => {
        e.stopPropagation();
        setVisible(false);
      }}
      className="network-delete-modal"
      destroyOnClose={true}
      focusTriggerAfterClose={false}
      width={432}
      closable={false}
      maskClosable={false}
      footer={null}
    >
      <ModalContent {...otherProps} setVisible={setVisible} delId={delId} />
    </Modal>
  );
};

DelNetworkModal.defaultProps = {
  visible: false,
  setVisible: () => {},
  id: Number
};

export default memo(DelNetworkModal);
