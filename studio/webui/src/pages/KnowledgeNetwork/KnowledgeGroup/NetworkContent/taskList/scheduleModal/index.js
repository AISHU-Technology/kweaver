import React, { memo } from 'react';
import { Button, Modal, Steps } from 'antd';
import { SearchOutlined, EllipsisOutlined, LoadingOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import intl from 'react-intl-universal';
import IconFont from '@/components/IconFont';

const { Step } = Steps;
const stepMap = {
  failed: -1,
  running: -1,
  stop: -1,
  waiting: -1,
  normal: 4,
  '-1': -1,
  0: 0,
  1: 1,
  2: 2,
  3: 4
};
// 弹窗内容
const ModalContent = memo(props => {
  const { handleCancel, scheduleRefresh, scheduleData } = props;

  return (
    <div>
      <div className="schedule-modal-title">
        {intl.get('task.details')}&nbsp;
        <IconFont type="icon-tongyishuaxin" onClick={scheduleRefresh} className="schedule-refresh" />
      </div>

      <div className="schedule-modal-body">
        <div className="list-box">
          <div className="list-item">
            <span className="name-box">{intl.get('task.graphName')}</span>
            <span className="text-box-small" title={scheduleData.graph_name}>
              {scheduleData.graph_name}
            </span>
            <span className="name-box">{intl.get('task.operationTime')}</span>
            <span className="text-box-small">{scheduleData.create_time}</span>
          </div>
          <div className="list-item">
            <span className="name-box">{intl.get('task.operator')}</span>
            <span className="text-box-small" title={scheduleData.create_user_name}>
              {scheduleData.create_user_name ? scheduleData.create_user_name : '--'}
            </span>
            <span className="name-box">{intl.get('task.email')}</span>
            <span className="text-box-small" title={scheduleData.create_user_email}>
              {scheduleData.create_user_email ? scheduleData.create_user_email : '--'}
            </span>
          </div>
        </div>

        <div>
          <Steps current={stepMap[scheduleData.task_status]} className="schedule-step">
            <Step
              icon={stepMap[scheduleData.task_status] === 0 ? <LoadingOutlined className="schedule-loading" /> : null}
            />
            <Step
              icon={stepMap[scheduleData.task_status] === 1 ? <LoadingOutlined className="schedule-loading" /> : null}
            />
            <Step
              icon={stepMap[scheduleData.task_status] === 2 ? <LoadingOutlined className="schedule-loading" /> : null}
            />
            <Step
              icon={stepMap[scheduleData.task_status] === 3 ? <LoadingOutlined className="schedule-loading" /> : null}
            />
          </Steps>

          <div className="steps-title">
            <div
              className={`step-title-item ${stepMap[scheduleData.task_status] === 0 ? 'step-title-item-blod' : ''}`}
              title={intl.get('task.basic')}
            >
              {intl.get('task.getInfo')}
            </div>
            <div
              className={`step-title-item ${stepMap[scheduleData.task_status] === 1 ? 'step-title-item-blod' : ''}`}
              title={intl.get('task.dataSource')}
            >
              {intl.get('task.extracting')}
            </div>
            <div
              className={`step-title-item ${stepMap[scheduleData.task_status] === 2 ? 'step-title-item-blod' : ''}`}
              title={intl.get('task.ontology')}
            >
              {intl.get('task.transfer')}
            </div>
            <div
              className={`step-title-item ${stepMap[scheduleData.task_status] === 3 ? 'step-title-item-blod' : ''}`}
              title={intl.get('task.extraction')}
            >
              {intl.get('task.completed')}
            </div>
          </div>
        </div>
      </div>

      <div className="schedule-modal-footer">
        <Button className="ant-btn-default schedule-modal-button" onClick={handleCancel}>
          {intl.get('task.close')}
        </Button>
      </div>
    </div>
  );
});

const Schedulemodal = props => {
  const { scheduleModal, handleCancel, setOperationId, scheduleRefresh, scheduleData } = props;

  return (
    <Modal
      visible={scheduleModal}
      onCancel={handleCancel}
      wrapClassName="task-schedule-modal"
      focusTriggerAfterClose={false}
      afterClose={() => setOperationId(null)}
      closable={true}
      maskClosable={false}
      width="800px"
      footer={null}
    >
      <ModalContent
        handleCancel={handleCancel}
        scheduleRefresh={scheduleRefresh}
        scheduleData={scheduleData}
      ></ModalContent>
    </Modal>
  );
};

export default Schedulemodal;
