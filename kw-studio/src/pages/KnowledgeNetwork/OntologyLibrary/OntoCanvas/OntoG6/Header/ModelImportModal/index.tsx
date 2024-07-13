/**
 * 一键导入弹窗
 */
import React, { useState, useRef } from 'react';
import { Modal, Button, ConfigProvider, message } from 'antd';
import _ from 'lodash';
import classnames from 'classnames';
import intl from 'react-intl-universal';
import OntoEntityPanel from './EntityPanel';
import OntoModelPanel from './ModelPanel';
import UniversalModal from '@/components/UniversalModal';
import './style.less';

const ENTITY = 'entity';
const MODEL = 'model';

export interface ModelImportModalProps {
  knData: Record<string, any>;
  osId: number; // 图数据库绑定的 openserch id
  dbType: string; // 图数据库类型
  visible: boolean;
  onCancel: () => void;
  onOk: (data: Data) => void;
  checkVectorServiceStatus?: () => any;
}

type Data = {
  type?: string;
  data?: any;
};

const OntoModelImportModal = (props: ModelImportModalProps) => {
  const { osId, dbType, visible, onOk, onCancel, knData, checkVectorServiceStatus } = props;
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
    if (tabKey === ENTITY) {
      const entityHasVector = graph.nodes.find((item: any) => item.vector_generation.length > 0);
      // 图谱实体中有已经配置向量的话，则去检测向量服务状态
      if (entityHasVector) {
        checkVectorServiceStatus?.();
      }
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
    <UniversalModal
      title={intl.get('createEntity.clickI')}
      className="flow-3-model-import-modal"
      width={1000}
      maskClosable={false}
      destroyOnClose={true}
      open={visible}
      // visible
      onCancel={onCancel}
      footerData={
        <ConfigProvider autoInsertSpaceInButton={false}>
          <Button onClick={onCancel}>{intl.get('global.cancel')}</Button>
          <Button type="primary" onClick={onHandleOk}>
            {intl.get('global.ok')}
          </Button>
        </ConfigProvider>
      }
    >
      <div className="m-main kw-flex">
        <div className="side-bar">
          <div className={classnames('tab-item', { selected: tabKey === ENTITY })} onClick={() => onTabChange(ENTITY)}>
            {intl.get('createEntity.ontologyImport')}
          </div>

          {/* <div className={classnames('tab-item', { selected: tabKey === MODEL })} onClick={() => onTabChange(MODEL)}>
            {intl.get('createEntity.modelImport')}
          </div> */}
        </div>

        <div className="m-content">
          <div className="child-wrapper">
            {tabKey === ENTITY && (
              <OntoEntityPanel knData={knData} ref={entityTabRef} isError={isError} onChange={onEntityChange} />
            )}
            {tabKey === MODEL && <OntoModelPanel ref={modelTabRef} dbType={dbType} osId={osId} />}
          </div>
          {/* <div className="m-footer kw-p-6">
            <ConfigProvider autoInsertSpaceInButton={false}>
              <Button onClick={onCancel}>{intl.get('global.cancel')}</Button>
              <Button type="primary" onClick={onHandleOk}>
                {intl.get('global.ok')}
              </Button>
            </ConfigProvider>
          </div> */}
        </div>
      </div>
    </UniversalModal>
  );
};

export default OntoModelImportModal;
