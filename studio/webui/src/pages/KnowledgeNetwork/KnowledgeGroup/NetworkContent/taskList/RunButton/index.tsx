import React, { useState } from 'react';
import { Dropdown, Menu, Button, ConfigProvider, Modal, Radio } from 'antd';
import { CaretDownOutlined } from '@ant-design/icons';

import intl from 'react-intl-universal';
import IconFont from '@/components/IconFont';
import TimedTask from '@/components/timedTask';
import ModalBranchTask from '@/components/ModalBranchTask';

import full from '@/assets/images/quanliang.svg';
import increment from '@/assets/images/zengliang.svg';

import './style.less';
const RunButton = (props: any) => {
  const { handleRunNow, selectedGraph, isRunning, Ok } = props;
  const [branchTaskVisible, setbranchTaskVisible] = useState(false);
  const [timedTaskVisible, settimedTaskVisible] = useState(false);
  const [updateVisible, setUpdateVisible] = useState(false);
  const [updateType, setUpdateType] = useState('increment'); // 更新方式
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
                const id = selectedGraph?.otl.replace(/[^0-9]/gi, '');
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
        disabled={isRunning}
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
        graphId={selectedGraph?.kg_conf_id}
        goToTask={() => {
          Ok();
          setbranchTaskVisible(false);
        }}
        ontoId={ontoId}
      />
      {/* 定时任务 */}
      <TimedTask
        graphId={selectedGraph?.kg_conf_id}
        visible={timedTaskVisible}
        onCancel={() => settimedTaskVisible(false)}
        onOk={() => {
          onImplementClick();
          settimedTaskVisible(false);
        }}
      />

      <Modal
        className="mix-modal select"
        title={intl.get('task.mt')}
        width={480}
        footer={null}
        maskClosable={false}
        keyboard={false}
        destroyOnClose={true}
        visible={updateVisible}
        onCancel={() => {
          setUpdateVisible(false);
        }}
      >
        <div className="mix-select-content">
          <div className="select-box">
            <div className="box">
              <div
                className={updateType === 'increment' ? 'update-type update-type-seleted' : 'update-type'}
                onClick={() => {
                  setUpdateType('increment');
                }}
              >
                <div className="radio-select">
                  <Radio checked={updateType === 'increment'}></Radio>
                </div>
                <div>
                  <img src={increment} className="image"></img>
                </div>
                <div className="word">
                  <div className="title">{intl.get('task.iu')}</div>
                  <div className="des">{intl.get('task.am')}</div>
                </div>
              </div>

              <div
                className={updateType === 'full' ? 'update-type update-type-seleted' : 'update-type'}
                onClick={() => {
                  setUpdateType('full');
                }}
              >
                <div className="radio-select">
                  <Radio checked={updateType === 'full'}></Radio>
                </div>
                <div>
                  <img src={full} className="image"></img>
                </div>
                <div className="word">
                  <div className="title">{intl.get('task.fu')}</div>
                  <div className="des">{intl.get('task.fm')}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bottom">
            <ConfigProvider autoInsertSpaceInButton={false}>
              <Button
                className="ant-btn-default cancel"
                onClick={() => {
                  setUpdateVisible(false);
                }}
              >
                {[intl.get('createEntity.cancel')]}
              </Button>

              <Button
                type="primary"
                className="save"
                onClick={() => {
                  handleRunNow(selectedGraph?.kg_conf_id, updateType);
                  setUpdateVisible(false);
                }}
              >
                {[intl.get('createEntity.ok')]}
              </Button>
            </ConfigProvider>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default RunButton;
