/**
 * 一键导入弹窗
 */
import React, { useState, useRef } from 'react';
import { Modal, Button, ConfigProvider, message } from 'antd';
import _ from 'lodash';
import classnames from 'classnames';
import intl from 'react-intl-universal';
import EntityPanel from './EntityPanel';
import ModelPanel from './ModelPanel';
import './style.less';

const ENTITY = 'entity';
const MODEL = 'model';

export interface ModelImportModalProps {
  osId: number; // 图数据库绑定的 openserch id
  dbType: string; // 图数据库类型
  visible: boolean;
  onCancel: () => void;
  onOk: (data: Data) => void;
}

type Data = {
  type?: string;
  data?: any;
};

const ModelImportModal = (props: ModelImportModalProps) => {
  const { osId, dbType, visible, onOk, onCancel } = props;
  const entityTabRef = useRef<any>(); // 实体tab
  const modelTabRef = useRef<any>(); // 模型tab
  const [tabKey, setTabKey] = useState(ENTITY); // 选中的tab
  const [isError, setIsError] = useState(false);

  /**
   * 点击确定
   */
  const onHandleOk = () => {
    const { current } = tabKey === ENTITY ? entityTabRef : modelTabRef;
    const graph = current?.getGraph();
    if (_.isEmpty(graph)) {
      if (tabKey === ENTITY) {
        // message.error(intl.get('createEntity.importNullTip'));
        message.error({
          content: intl.get('createEntity.importNullTip'),
          className: 'custom-class',
          style: {
            marginTop: '6vh'
          }
        });
        setIsError(true);
      }
      return;
    }
    onOk({ type: tabKey, data: { entity: graph.nodes, edge: graph.edges } });
  };

  /**
   * 切换tab
   */
  const onTabChange = (key: string) => {
    setTabKey(key);
  };

  const onEntityChange = (data: any) => {
    setIsError(!data);
  };

  return (
    <Modal
      className="flow-3-model-import-modal"
      width={1000}
      maskClosable={false}
      destroyOnClose={true}
      open={visible}
      // visible
      onCancel={onCancel}
      footer={null}
    >
      <div className="m-main kw-flex">
        <div className="side-bar">
          <div className={classnames('tab-item', { selected: tabKey === ENTITY })} onClick={() => onTabChange(ENTITY)}>
            {intl.get('createEntity.ontologyImport')}
          </div>

          <div className={classnames('tab-item', { selected: tabKey === MODEL })} onClick={() => onTabChange(MODEL)}>
            {intl.get('createEntity.modelImport')}
          </div>
        </div>

        <div className="m-content">
          <div className="child-wrapper">
            {tabKey === ENTITY && <EntityPanel ref={entityTabRef} isError={isError} onChange={onEntityChange} />}
            {tabKey === MODEL && <ModelPanel ref={modelTabRef} dbType={dbType} osId={osId} />}
          </div>
          <div className="m-footer kw-p-6">
            <ConfigProvider autoInsertSpaceInButton={false}>
              <Button onClick={onCancel}>{intl.get('global.cancel')}</Button>
              <Button type="primary" onClick={onHandleOk}>
                {intl.get('global.ok')}
              </Button>
            </ConfigProvider>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ModelImportModal;
