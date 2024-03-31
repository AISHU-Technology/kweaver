import React, { useRef, useState, useEffect } from 'react';
import _ from 'lodash';
import classnames from 'classnames';
import { connect } from 'react-redux';
import intl from 'react-intl-universal';
import { Button, Modal } from 'antd';
import { MinusOutlined, BorderOutlined, ExclamationCircleFilled } from '@ant-design/icons';

import { onChangeUploadVisible, onChangeUploadStatus } from '@/reduxConfig/action/uploadFile';
import { PENDING, UPLOADING, SUCCESS, FAIL } from '@/reduxConfig/reducers/uploadFile';
import IconFont from '@/components/IconFont';
import UploadLine from './UploadLine';

import './style.less';

export interface FileType extends Blob {
  uid: string;
  status: string;
}

const UploadDrawer = (props: any) => {
  const { visible, modelData, status: uploadStatus, onChangeUploadStatus, onChangeUploadVisible } = props; // redux 注入属性

  const [items, setItem] = useState<any>([]);
  const [isIncompletion, setIsIncompletion] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<'ONLINE' | 'OFFLINE'>('ONLINE');

  const updateOnlineStatus = () => {
    const condition = navigator.onLine ? 'ONLINE' : 'OFFLINE';
    setNetworkStatus(condition || 'ONLINE');
  };
  useEffect(() => {
    if (visible) {
      window.addEventListener('online', updateOnlineStatus);
      window.addEventListener('offline', updateOnlineStatus);
    } else {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    }
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, [visible]);

  useEffect(() => {
    if (!modelData.file) return;
    const uid = modelData.file.name + modelData.file.size + new Date().valueOf();
    modelData.file.uid = uid;
    modelData.file.status = 'pending';
    setItem([...items, modelData]);
    onTriggerDrawerSize(false);
  }, [modelData.file]);

  /** 最小化或展开上传进度框 */
  const onTriggerDrawerSize = (flag?: boolean) => {
    setIsIncompletion(flag ?? !isIncompletion);
  };

  /** 关闭上传抽屉 */
  const onCloseDrawer = () => {
    const uploadingLength = _.filter(items, item => item.file.status === 'uploading')?.length;
    if (uploadingLength) {
      Modal.confirm({
        zIndex: 9999,
        icon: <ExclamationCircleFilled style={{ color: '#F5222D' }} />,
        title: intl.get('modelLibrary.areYouSureExit'),
        content: intl.get('modelLibrary.importingWillNotContinue'),
        onOk: async () => {
          setItem([]);
          onChangeUploadStatus({ status: PENDING });
          onChangeUploadVisible({ visible: false });
        }
      });
    } else {
      setItem([]);
      onChangeUploadStatus({ status: PENDING });
      onChangeUploadVisible({ visible: false });
    }
  };

  /** 取消上传 */
  const onCancel = (fileId: string) => {
    const newItems = _.filter(items, item => item.file.uid !== fileId);
    setItem(newItems);
    onChangeUploadStatus({ status: SUCCESS });
  };

  /** 修改文件状态 */
  const onChangeFileStatus = (fileId: string, fileStatus: string) => {
    const newItems = _.map(items, item => {
      if (item.file.uid !== fileId) return item;
      item.file.status = fileStatus;
      return item;
    });
    setItem(newItems);
  };

  if (!visible) return null;

  /** 正在上传的文件数量 */
  const uploadingFileNumber = _.filter(items, item => item?.file?.status === 'uploading')?.length;

  return (
    <div className={classnames('uploadDrawerRoot', { incompletion: isIncompletion })}>
      <div className="header">
        <div className="title">
          {uploadStatus === UPLOADING && intl.get('modelLibrary.uploadingNumber', { number: uploadingFileNumber })}
          {uploadStatus === SUCCESS && intl.get('modelLibrary.importsClosure')}
          {uploadStatus === FAIL && intl.get('modelLibrary.importFailed')}
        </div>
        <div className="operation">
          <span className="icon" onClick={() => onTriggerDrawerSize()}>
            {isIncompletion ? <BorderOutlined /> : <MinusOutlined />}
          </span>
          <IconFont className="icon" type="icon-guanbiquxiao" onClick={onCloseDrawer} />
        </div>
      </div>
      <div className="reminder">
        <ExclamationCircleFilled style={{ color: '#FAAD14', marginRight: 8 }} />
        {intl.get('modelLibrary.uploadWaringTip')}
      </div>
      <div className="content">
        {_.map(items, item => {
          return (
            <UploadLine
              key={item.file.uid}
              source={item}
              uploadStatus={uploadStatus}
              networkStatus={networkStatus}
              onCancel={onCancel}
              onChangeFileStatus={onChangeFileStatus}
              onTriggerDrawerSize={onTriggerDrawerSize}
              onChangeUploadStatus={onChangeUploadStatus}
            />
          );
        })}
      </div>
      <div className="footer">
        <Button onClick={onCloseDrawer}>{intl.get('global.cancel')}</Button>
      </div>
    </div>
  );
};

const mapStateToProps = (state: any) => {
  return {
    /** 上传弹窗的展示控制 */
    visible: state.getIn(['uploadFile', 'visible']),
    /** 上传任务的状态 */
    status: state.getIn(['uploadFile', 'status']),
    /** 模型数据（文件和需要创建的模型） */
    modelData: state.getIn(['uploadFile', 'modelData']).toJS()
  };
};
const mapDispatchToProps = (dispatch: any) => ({
  /** 控制上传弹窗的展示 */
  onChangeUploadVisible: (data: { visible: boolean }) => dispatch(onChangeUploadVisible(data)),
  /** 上传任务状态变更 */
  onChangeUploadStatus: (data: { status: string }) => dispatch(onChangeUploadStatus(data))
});

export default connect(mapStateToProps, mapDispatchToProps)(UploadDrawer);
