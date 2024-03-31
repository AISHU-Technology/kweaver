import React, { useState } from 'react';
import './style.less';
import UniversalModal from '@/components/UniversalModal';
import intl from 'react-intl-universal';
import serviceLicense from '@/services/license';
import { message } from 'antd';
import serviceTaskManagement from '@/services/taskManagement';
import { graphTipModal } from '@/pages/KnowledgeNetwork/KnowledgeGraph/Workflow/GraphTipModal';

const RunNowTask = ({ onCancel, graphId, onOk }: any) => {
  const [updateType, setUpdateType] = useState<'increment' | 'full'>('full'); // 增量更新 | 全量构建

  const onCalculate = async () => {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async resolve => {
      try {
        const res = await serviceLicense.graphCountAll();
        if (res && res !== undefined) {
          const { all_knowledge, knowledge_limit } = res;
          if (knowledge_limit === -1) {
            resolve(true);
            return;
          } // 无限制
          if (knowledge_limit - all_knowledge >= 0 && knowledge_limit - all_knowledge < knowledge_limit * 0.1) {
            resolve(true);
            message.warning({
              content: intl.get('license.remaining'),
              className: 'custom-class',
              style: {
                marginTop: '6vh'
              }
            });
            return;
          }
          if (knowledge_limit - all_knowledge < 0) {
            resolve(false);
            message.error({
              content: intl.get('license.operationFailed'),
              className: 'custom-class',
              style: {
                marginTop: '6vh'
              }
            });
            return;
          }
          resolve(true);
        }
      } catch (error) {
        resolve(false);
        if (!error.type) return;
        const { Description } = error.response || {};
        // Description && message.error(Description);
        Description &&
          message.error({
            content: Description,
            className: 'custom-class',
            style: {
              marginTop: '6vh'
            }
          });
      }
    });
  };

  const handleRunNow = async () => {
    const data = await onCalculate();
    if (data) {
      const response = await serviceTaskManagement.taskCreate(graphId, { tasktype: updateType });
      const { res, Code, Cause } = response || {};
      if (res && !Code) {
        onOk?.();
      }
      if (Code) {
        handleError(response);
      }
    }
  };

  const handleError = (res: any) => {
    if (res) {
      const { Code, Cause, ErrorCode, Description } = res;
      const curCode = Code || ErrorCode;
      const curCause = Cause || Description;

      // 权限错误
      if (curCode === 500403) {
        graphTipModal.open(intl.get('graphList.authErr'));

        return;
      }

      // 图谱不存在
      if ((curCode === 500001 && curCause?.includes('not exist')) || curCode === 500357) {
        graphTipModal.open(intl.get('graphList.hasBeenDel'));

        return;
      }

      // 知识量已超过量级限制
      if (curCode === 500055) {
        // message.error(intl.get('license.operationFailed'));
        message.error({
          content: intl.get('license.operationFailed'),
          className: 'custom-class',
          style: {
            marginTop: '6vh'
          }
        });
        return;
      }
      // 上传中的图谱不能运行
      if (curCode === 500065) {
        // message.error(intl.get('uploadService.runfailed'));
        message.error({
          content: intl.get('uploadService.runfailed'),
          className: 'custom-class',
          style: {
            marginTop: '6vh'
          }
        });
        return;
      }

      // curCause && message.error(curCause);
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
      visible
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
