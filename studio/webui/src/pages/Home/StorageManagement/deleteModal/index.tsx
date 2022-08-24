import React, { memo, useState, useRef } from 'react';
import intl from 'react-intl-universal';
import { Modal, Button, message, Input } from 'antd';

import serviceStorageManagement from '@/services/storageManagement';

import './style.less';

const ERROR_CODE: any = {
  'Manager.GraphDB.GraphDBRecordNotFoundError': 'configSys.NotFoundError', // 次记录不存在
  'Manager.Account.InsufficientAccountPermissionsError': 'configSys.PermissionsError', // 全选不足
  'Manager.Common.ServerError': 'configSys.delError', // 删除失败
  'Manager.OpenSearch.OSRecordNotFoundError': 'configSys.NotFoundError', // opensearch记录不存在
  'Manager.OpenSearch.OsIsUsedError': 'configSys.delUseing' // 配置正被使用
};

type DeleteModalType = {
  visible: boolean;
  delType: string;
  deleteItem: any;
  getData: () => void;
  setVisible: () => void;
};
const DeleteModal = (props: DeleteModalType) => {
  const { visible, deleteItem, delType, getData, setVisible } = props;
  const [isError, setIsError] = useState(false);
  const inputRef = useRef<any>(null);

  const onOk = async () => {
    const name = inputRef?.current?.input?.value;
    if (name !== deleteItem.name) return setIsError(true);

    try {
      let result;
      if (delType === 'graph') result = await serviceStorageManagement.graphDBDelete({ id: deleteItem.id });
      if (delType === 'index') result = await serviceStorageManagement.openSearchDelete({ id: deleteItem.id });
      if (result?.res) {
        message.success(intl.get('configSys.delSuccess'));
        getData();
        setVisible();
      }

      if (ERROR_CODE[result?.ErrorCode]) message.error(intl.get(ERROR_CODE[result?.ErrorCode]));
    } catch (error) {
      // console.log('error')
    }
  };

  const title = delType === 'graph' ? intl.get('configSys.delStorage') : intl.get('configSys.delIndex');
  const inputPlaceholder =
    delType === 'graph' ? intl.get('configSys.delGraphPlace') : intl.get('configSys.delIndexPlace');

  return (
    <Modal
      visible={visible}
      width={480}
      title={title}
      footer={null}
      maskClosable={false}
      destroyOnClose={true}
      focusTriggerAfterClose={false}
      className="storage-delete-modal"
      onCancel={e => {
        e.stopPropagation();
        setVisible();
      }}
    >
      <div className="delete-modal-body">
        <p className="input-label"> {intl.get('configSys.deldes')}</p>
        <Input className="input" ref={inputRef} placeholder={inputPlaceholder} />
        {isError ? <p className="error">{intl.get('configSys.delNameInconsistent')}</p> : null}
      </div>

      <div className="delete-modal-footer">
        <Button className="ant-btn-default delete-cancel" onClick={() => setVisible()}>
          {intl.get('configSys.Cancel')}
        </Button>
        <Button className="delete-ok" type="primary" onClick={onOk}>
          {intl.get('datamanagement.delete')}
        </Button>
      </div>
    </Modal>
  );
};

export default memo(DeleteModal);
