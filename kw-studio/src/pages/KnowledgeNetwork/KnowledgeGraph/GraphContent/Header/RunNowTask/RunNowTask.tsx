import React, { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import serviceTaskManagement from '@/services/taskManagement';
import { message, Radio } from 'antd';
import UniversalModal from '@/components/UniversalModal';
import serviceLicense from '@/services/license';
import classNames from 'classnames';
import BuildGraphModel from '@/components/BuildGraphModel';

const RunNowTask = ({ onCancel, graphId, onUpdateGraphStatus, firstBuild }: any) => {
  // const [runNowModal, setRunNowModal] = useState({
  //   visible: false,
  //   updateType: 'increment'
  // });

  // useEffect(() => {
  //   if (firstBuild) {
  //     setRunNowModal(prevState => ({
  //       ...prevState,
  //       updateType: 'full'
  //     }));
  //   }
  // }, [firstBuild]);

  /**
   * 获取知识量
   */
  const onCalculate = async () => {
    try {
      const res = await serviceLicense.graphCountAll();
      if (res && res !== undefined) {
        const { all_knowledge, knowledge_limit } = res;
        if (knowledge_limit === -1) return; // 无限制
        if (knowledge_limit - all_knowledge >= 0 && knowledge_limit - all_knowledge < knowledge_limit * 0.1) {
          message.warning(intl.get('license.remaining'));
        }
      }
    } catch (error) {
      if (!error.type) return;
      const { Description } = error.response || {};
      Description && message.error(Description);
    }
  };

  const handleRefreshStatus = async () => {
    const getData = {
      page: 1,
      size: 1,
      status: 'all',
      order: 'desc',
      graph_name: '',
      task_type: 'all',
      trigger_type: 'all',
      rule: 'start_time'
    };
    const response = await serviceTaskManagement.taskGet(graphId, getData);
    const { ErrorCode, Description } = response || {};
    if (response?.res) {
      onUpdateGraphStatus(response?.res?.graph_status);
    }
    ErrorCode && message.error(Description);
  };

  // 运行
  const onHandleOk = async (type: string) => {
    onCalculate();
    const response = await serviceTaskManagement.taskCreate(graphId, { tasktype: type });
    const { res, Code, Cause } = response || {};
    if (res && !Code) message.success(intl.get('task.startRun'));
    if (Code) {
      switch (true) {
        case Code === 500403 || Code === 'Studio.SoftAuth.UnknownServiceRecordError':
          message.error(intl.get('graphList.authErr'));
          break;
        case Code === 'Studio.Graph.KnowledgeNetworkNotFoundError':
          message.error(intl.get('graphList.hasBeenDel'));
          break;
        case Code === 500055:
          message.error(intl.get('graphList.errorByCapacity'));
          break; // 知识量已超过量级限制
        case Code === 500065:
          message.error(intl.get('uploadService.runfailed'));
          break;
        default:
          Cause && message.error(Cause);
      }
    }
    handleRefreshStatus();
    onCancel();
  };

  return (
    <div>
      <BuildGraphModel visible firstBuild={firstBuild} onCancel={onCancel} onOk={onHandleOk} />
    </div>
  );
};

export default RunNowTask;
