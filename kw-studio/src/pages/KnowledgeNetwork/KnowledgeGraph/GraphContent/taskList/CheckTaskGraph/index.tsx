import React, { useState, useEffect } from 'react';
import { Modal, message } from 'antd';
import intl from 'react-intl-universal';
import servicesSubGraph from '@/services/subGraph';
import servicesCreateEntity from '@/services/createEntity';
import serviceGraphDetail from '@/services/graphDetail';

import Subgraph from '@/components/Subgraph';
import UniversalModal from '@/components/UniversalModal';

import './style.less';
const CheckTaskGraph = (props: any) => {
  const { visible, handleCancel, taskId, ontoId, graphId } = props;
  const [graphData, setGraphData] = useState<Array<any>>([]); // 子图数据
  const [ontoData, setOntoData] = useState<Array<any>>([]); // 子图数据

  useEffect(() => {
    if (visible) {
      if (ontoId) {
        getOntoData();
        return;
      }
      getConfigDetail();
    }
  }, [visible]);

  /**
   * 查询本体数据
   */
  const getOntoData = async () => {
    try {
      const res = await serviceGraphDetail.graphGetInfoOnto({ graph_id: graphId });
      if (res?.res) {
        setOntoData(res?.res);
      }
      res?.ErrorCode && message.error(res?.Description);
    } catch (err) {
      //
    }
  };

  const getConfigDetail = async () => {
    try {
      const data = { task_id: taskId };
      const res = await servicesSubGraph.subgraphHistoryDetail(data);
      if (res?.res) {
        setGraphData(res?.res);
      }
      res?.Description && message.error(res?.Description);
    } catch (err) {
      //
    }
  };

  return (
    <UniversalModal
      title={intl.get('global.check')}
      className="modal-check-graph"
      footer={null}
      destroyOnClose={true}
      maskClosable={false}
      width={'100vw'}
      // style={{ left: 0, margin: 0, padding: 0, maxWidth: '100vw' }}
      visible={visible}
      onCancel={handleCancel}
    >
      <div className="modal-content">
        <Subgraph graphData={ontoId ? ontoData : graphData} />
      </div>
    </UniversalModal>
  );
};
export default CheckTaskGraph;
