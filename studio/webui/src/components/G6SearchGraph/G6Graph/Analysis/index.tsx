import React, { useEffect, useState, memo } from 'react';
import intl from 'react-intl-universal';

import { Modal, message } from 'antd';
import Analysis from '@/components/analysisInfo';
import servicesExplore from '@/services/explore';

import './style.less';

const AnalysisModal = (props: any) => {
  const { visible, analysisTitle, selectGraph, selectedNode, onCancel } = props;
  const [reportData, setReportData] = useState<any>();

  useEffect(() => {
    if (!visible) {
      return;
    }
    if (selectedNode) {
      getReport({ id: selectGraph.kg_id, rid: selectedNode?.id?.replace('#', '%23') });
    }
  }, [selectedNode, visible]);

  /**
   * @description 获取分析报告
   */
  const getReport = async (data: { id: string; rid: string }) => {
    const res = await servicesExplore.analysisReportGet(data);

    if (res && res.ErrorCode === 'EngineServer.ErrNebulaStatsErr') {
      message.error(intl.get('graphQL.errNebulaStatsErr'));
      return;
    }

    if (res && res.ErrorCode === 'EngineServer.ErrVClassErr') {
      message.error(intl.get('graphQL.e500500'));
      return;
    }

    if (res && res.ErrorCode === 'EngineServer.ErrRightsErr') {
      message.error(intl.get('graphList.authErr'));
      setTimeout(() => {
        window.location.replace('/home/graph-list');
      }, 2000);
      return;
    }

    if (res && res.ErrorCode === 'EngineServer.ErrInternalErr') {
      message.error(intl.get('graphList.hasbeenDel'));
      setTimeout(() => {
        window.location.replace('/home/graph-list');
      }, 2000);
      return;
    }

    if (res && res.ErrorCode) {
      setReportData(res.res);
      return res.res;
    }

    if (res && res.res) {
      setReportData(res.res || res);
      return res.res;
    }
  };

  return (
    <div>
      <Modal
        title={
          <>
            <div className="left-title">{intl.get('searchGraph.report')}</div>
            <div className="right-title">{intl.get('searchGraph.Summary')}</div>
          </>
        }
        className="modal-multlist-anlys"
        width="auto"
        visible={visible}
        maskClosable={false}
        onCancel={() => {
          onCancel();
        }}
        footer={null}
        forceRender
      >
        {/* {reportData?.content ? <Analysis reportData={reportData} analysisTitle={analysisTitle} /> : null} */}
        <Analysis reportData={reportData} analysisTitle={analysisTitle} />
      </Modal>
    </div>
  );
};

export default memo(AnalysisModal);
