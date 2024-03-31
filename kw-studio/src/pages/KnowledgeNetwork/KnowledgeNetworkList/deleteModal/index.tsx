import React, { memo } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Modal, Button, message, ConfigProvider } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';

import servicesKnowledgeNetwork from '@/services/knowledgeNetwork';

import './index.less';

const ERROR_CODE: any = {
  'Builder.service.knw_service.knwService.deleteKnw.GraphNotEmptyError': 'graphList.delFailed', // 知识网络下还有图谱
  'Builder.service.knw_service.knwService.deleteKnw.PermissionError': 'graphList.delperMissionError', // 没有权限删除
  'Builder.service.knw_service.knwService.deleteKnw.RequestError': 'graphList.deleteError', // 删除失败
  'Builder.service.knw_service.knwService.deleteKnw.LexiconNotEmptyError': 'graphList.failedByWord', // 还有词库
  'Builder.service.knw_service.knwService.deleteKnw.DataSourceNotEmptyError': 'graphList.failedBySource', // 还有数据源
  'Builder.service.knw_service.knwService.deleteKnw.CanvasNotEmptyError': 'graphList.failedByCanvas', // 还有画布
  'Builder.service.knw_service.knwService.deleteKnw.FunctionNotEmptyError': 'graphList.failedByFunction' // 还有函数
};

type DelNetworkModalType = {
  visible: boolean;
  delId: number;
  onCloseDelete: () => void;
  onRefreshList: () => void;
};
const DelNetworkModal = (props: DelNetworkModalType) => {
  const { visible, delId, onCloseDelete, onRefreshList } = props;

  const onOk = async () => {
    const result: any = await servicesKnowledgeNetwork.knowledgeNetDelete(delId);
    const { res = {}, ErrorCode = '', Description } = result;
    if (!_.isEmpty(res) || result === null) {
      message.success(intl.get('graphList.delSuccess'));
      onRefreshList();
    }
    if (ERROR_CODE[ErrorCode] || Description) message.error(intl.get('graphList.deleteFailed'));
    // if (ERROR_CODE[ErrorCode] || Description) message.error(intl.get(ERROR_CODE[ErrorCode]) || Description);
    onCloseDelete();
  };

  return (
    <Modal
      visible={visible}
      className="network-delete-modal"
      width={432}
      footer={null}
      closable={false}
      maskClosable={false}
      destroyOnClose={true}
      focusTriggerAfterClose={false}
      onCancel={e => {
        e.stopPropagation();
        onCloseDelete();
      }}
    >
      <div className="">
        <div className="delete-modal-title">
          <ExclamationCircleFilled className="title-icon" />
          <span className="title-text">{intl.get('graphList.sureDelNetwork')}</span>
        </div>
        <div className="delete-modal-body">{intl.get('graphList.delNetworkDes')}</div>
        <div className="delete-modal-footer">
          <ConfigProvider>
            <Button className="ant-btn-default delete-cancel" onClick={() => onCloseDelete()}>
              {intl.get('global.cancel')}
            </Button>
            <Button type="primary" className="delete-ok" onClick={onOk}>
              {intl.get('global.ok')}
            </Button>
          </ConfigProvider>
        </div>
      </div>
    </Modal>
  );
};

export default memo(DelNetworkModal);
