import React, { useState } from 'react';
import intl from 'react-intl-universal';
import { Modal, Button, ConfigProvider } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

import EntityImport from './EntityImport';
import ModelImport from './ModelImport';
import SourceImport from './SourceImport';
import './style.less';
import _ from 'lodash';

const ExportModal = props => {
  const { graphId, dbType, osId, isVisible } = props;
  const { onOk, onClose } = props;
  const [data, setData] = useState({});
  const [selectedTag, setSelectedTag] = useState('entity');
  const [selectLoadingTop, setSelectLoadingTop] = useState(false);

  /**
   * @description 开启加载动画
   */
  const openLoading = () => {
    setSelectLoadingTop(true);
  };

  /**
   * @description 关闭
   */
  const closedLoading = () => {
    setSelectLoadingTop(false);
  };

  /**
   * @description  选择导入类型
   */
  const getTabContent = type => {
    if (type === 'entity') {
      return (
        <EntityImport openLoading={openLoading} closedLoading={closedLoading} setSaveData={data => setData(data)} />
      );
    }

    if (type === 'source') {
      return (
        <SourceImport
          graphId={graphId}
          openLoading={openLoading}
          closedLoading={closedLoading}
          setSaveData={data => setData(data)}
        />
      );
    }

    if (type === 'model') {
      return <ModelImport osId={osId} dbType={dbType} setSaveData={data => setData(data)} />;
    }
  };

  const setTitle = () => {
    if (selectedTag === 'entity') return intl.get('createEntity.selectO');
    if (selectedTag === 'source') return intl.get('createEntity.dataName');
    if (selectedTag === 'model') return intl.get('createEntity.selectModel');
  };

  const onModalOk = () => {
    if (_.isEmpty(data)) return;
    onOk(data);
  };

  return (
    <Modal
      className="add-modal-create-entity-model"
      width={1000}
      maskClosable={false}
      destroyOnClose={true}
      visible={isVisible}
      onCancel={onClose}
      footer={null}
    >
      <div className="export-modal">
        <div className="side-bar">
          <div
            className={selectedTag === 'entity' ? 'tag tag-selected' : 'tag'}
            onClick={() => setSelectedTag('entity')}
          >
            {selectedTag === 'entity' ? <div className="left-mark"></div> : null}
            {[intl.get('createEntity.ontologyImport')]}
          </div>

          <div
            className={selectedTag === 'source' ? 'tag tag-selected' : 'tag'}
            onClick={() => setSelectedTag('source')}
          >
            {selectedTag === 'source' ? <div className="left-mark"></div> : null}
            {[intl.get('createEntity.dataSourceImport')]}
          </div>

          <div className={selectedTag === 'model' ? 'tag tag-selected' : 'tag'} onClick={() => setSelectedTag('model')}>
            {selectedTag === 'model' ? <div className="left-mark"></div> : null}
            {[intl.get('createEntity.modelImport')]}
          </div>
        </div>

        <div className="content">
          <div className="title" style={{ marginLeft: 40 }}>
            {setTitle()}
          </div>
          <div className="srcoll-box">{getTabContent(selectedTag)}</div>
        </div>

        {selectLoadingTop ? (
          <div className="loading-4qwaqq">
            <LoadingOutlined className="icon" />
          </div>
        ) : null}

        <div className="m-footer">
          <ConfigProvider key="entityInfoMadalControl" autoInsertSpaceInButton={false}>
            <Button onClick={onClose}>{intl.get('createEntity.cancel')}</Button>
            {/* 预测本体弹框确定 */}
            <Button type="primary" className="ad-ml-3" onClick={onModalOk}>
              {intl.get('createEntity.ok')}
            </Button>
          </ConfigProvider>
        </div>
      </div>
    </Modal>
  );
};

export default ExportModal;
