import React from 'react';
import './style.less';
import UniversalModal from '@/components/UniversalModal';
import intl from 'react-intl-universal';
import { message } from 'antd';
import serviceTaskManagement from '@/services/taskManagement';
import { graphTipModal } from '@/pages/KnowledgeNetwork/KnowledgeGraph/Workflow/GraphTipModal';

const RunNowTask = ({ onCancel, graphId, onOk }: any) => {
  const updateType = 'full';

  const handleRunNow = async () => {
    const response = await serviceTaskManagement.taskCreate(graphId, { tasktype: updateType });
    const { res, Code } = response || {};
    if (res && !Code) {
      onOk?.();
    }
    if (Code) {
      handleError(response);
    }
  };

  const handleError = (res: any) => {
    if (res) {
      const { Code, Cause, ErrorCode, Description } = res;
      const curCode = Code || ErrorCode;
      const curCause = Cause || Description;

      if (curCode === 500403) {
        graphTipModal.open(intl.get('graphList.authErr'));

        return;
      }

      if ((curCode === 500001 && curCause?.includes('not exist')) || curCode === 500357) {
        graphTipModal.open(intl.get('graphList.hasBeenDel'));

        return;
      }

      if (curCode === 500055) {
        message.error({
          content: intl.get('license.operationFailed'),
          className: 'custom-class',
          style: {
            marginTop: '6vh'
          }
        });
        return;
      }
      if (curCode === 500065) {
        message.error({
          content: intl.get('uploadService.runfailed'),
          className: 'custom-class',
          style: {
            marginTop: '6vh'
          }
        });
        return;
      }

      curCause &&
        message.error({
          content: curCause,
          className: 'custom-class',
          style: {
            marginTop: '6vh'
          }
        });
    }
  };

  return (
    <UniversalModal
      open
      className="RunNowTask-modal"
      title={intl.get('task.selectType')}
      width={480}
      footerData={[
        {
          label: intl.get('global.cancel'),
          onHandle: () => {
            onCancel?.();
          }
        },
        {
          label: intl.get('global.ok'),
          type: 'primary',
          onHandle: handleRunNow
        }
      ]}
    ></UniversalModal>
  );
};
export default RunNowTask;
