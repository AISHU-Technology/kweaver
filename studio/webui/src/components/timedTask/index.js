/**
 * 定时任务弹窗
 *
 * @author Eden
 * @date 2021/12/21
 *
 */

import React, { Component } from 'react';
import { Modal } from 'antd';
import intl from 'react-intl-universal';
import TimedTaskList from './timedTaskList';
import TimedTaskConfig from './timedTaskConfig';
import './style.less';

class TimedTask extends Component {
  state = {
    viewType: 'list', // 当前弹窗展示的内容(list:任务列表; crateConfig:创建定时任务; editConfig:编辑定时任务)
    allTaskNumber: 0, // 任务总数
    editData: '' // 编辑进入时的数据
  };

  /**
   * @description 修改弹窗显示内容
   * @param {string} viewType 弹窗内容
   */
  changeViewType = viewType => {
    this.setState({
      viewType
    });
  };

  /**
   * @description 任务总数
   */
  setAllTaskNumber = allTaskNumber => {
    this.setState({
      allTaskNumber
    });
  };

  /**
   * @description 设置初始编辑数据
   */
  setEditData = editData => {
    this.setState({
      editData
    });
  };

  render() {
    const { visible, onCancel, onOk, graphId } = this.props;
    const { viewType, allTaskNumber, editData } = this.state;

    return (
      <Modal
        className="time-task"
        title={
          <div className="title">
            {viewType === 'list' ? (
              <>
                <div className="word">{intl.get('graphList.timedTask')}</div>
                <div className="count">{allTaskNumber}</div>
              </>
            ) : viewType === 'crateConfig' ? (
              <div className="word">{intl.get('graphList.createTimedTask')}</div>
            ) : (
              <div className="word">{intl.get('graphList.editTimedTask')}</div>
            )}
          </div>
        }
        visible={visible}
        destroyOnClose={true}
        onCancel={onCancel}
        footer={null}
        width={1000}
        maskClosable={false}
        afterClose={() => {
          this.changeViewType('list');
        }}
      >
        {viewType === 'list' ? (
          <TimedTaskList
            onCancel={onCancel}
            onOk={onOk}
            viewType={viewType}
            changeViewType={this.changeViewType}
            graphId={graphId}
            setAllTaskNumber={this.setAllTaskNumber}
            setEditData={this.setEditData}
          />
        ) : (
          <TimedTaskConfig
            changeViewType={this.changeViewType}
            graphId={graphId}
            editData={editData}
            viewType={viewType}
          />
        )}
      </Modal>
    );
  }
}

export default TimedTask;
