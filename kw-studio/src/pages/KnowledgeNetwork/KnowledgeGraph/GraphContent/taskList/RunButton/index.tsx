import React, { useState } from 'react';
import { Dropdown, Menu, Button } from 'antd';
import { CaretDownOutlined } from '@ant-design/icons';

import intl from 'react-intl-universal';
import IconFont from '@/components/IconFont';
import TimedTask from '@/components/TimedTask';
import ModalBranchTask from '@/components/ModalBranchTask';
import BuildGraphModel from '@/components/BuildGraphModel';

import './style.less';
import classNames from 'classnames';

const RunButton = (props: any) => {
  const { handleRunNow, selectedGraph, isRunning, Ok, isDisabled } = props;
  const [branchTaskVisible, setbranchTaskVisible] = useState(false);
  const [timedTaskVisible, settimedTaskVisible] = useState(false);
  const [updateVisible, setUpdateVisible] = useState(false);
  const [ontoId, setOntoId] = useState(0); // 图谱本体id

  /**
   * 点击执行任务
   */
  const onImplementClick = async () => {};

  return (
    <div>
      <Dropdown
        overlay={
          <Menu>
            <Menu.Item
              key="branch"
              onClick={() => {
                const id = selectedGraph?.otl;
                setOntoId(id);
                setbranchTaskVisible(true);
              }}
            >
              <span>{intl.get('task.groupRun')}</span>
            </Menu.Item>

            <Menu.Item key="timeTask" onClick={() => settimedTaskVisible(true)}>
              <span> {intl.get('workflow.conflation.timedrun')}</span>
            </Menu.Item>

            <Menu.Item key="now" onClick={() => setUpdateVisible(true)}>
              <span>{intl.get('workflow.conflation.RunNow')}</span>
            </Menu.Item>
          </Menu>
        }
        trigger={['click']}
        overlayClassName="task-run-overlay"
        getPopupContainer={triggerNode => triggerNode?.parentElement?.parentElement || document.body}
        disabled={isRunning || isDisabled}
      >
        <Button type="primary" className="run">
          <IconFont type="icon-qidong" />
          {intl.get('task.run')}
          <CaretDownOutlined style={{ fontSize: 12 }} />
        </Button>
      </Dropdown>

      {/* 分批任务 */}
      <ModalBranchTask
        visible={branchTaskVisible}
        handleCancel={() => setbranchTaskVisible(false)}
        graphId={selectedGraph?.id}
        goToTask={() => {
          Ok();
          setbranchTaskVisible(false);
        }}
        ontoId={ontoId}
      />
      {/* 定时任务 */}
      <TimedTask
        graphId={selectedGraph?.id}
        visible={timedTaskVisible}
        onCancel={() => settimedTaskVisible(false)}
        onOk={() => {
          onImplementClick();
          settimedTaskVisible(false);
        }}
      />

      <BuildGraphModel
        firstBuild={false}
        visible={updateVisible}
        onCancel={() => setUpdateVisible(false)}
        onOk={(type: string) => {
          handleRunNow(selectedGraph?.id, type);
          setUpdateVisible(false);
        }}
      />
    </div>
  );
};
export default RunButton;
