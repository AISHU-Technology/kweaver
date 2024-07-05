import React from 'react';
import intl from 'react-intl-universal';
import serviceTaskManagement from '@/services/taskManagement';
import { message } from 'antd';
import BuildGraphModel from '@/components/BuildGraphModel';

const RunNowTask = ({ onCancel, graphId, onUpdateGraphStatus, firstBuild }: any) => {
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
