import React, { Component, createRef } from 'react';
import { Button } from 'antd';
import intl from 'react-intl-universal';
import TimedTaskList from './TimedTaskList';
import TimedTaskConfig from './TimedTaskConfig';
import UniversalModal from '../UniversalModal';

import './style.less';

class TimedTask extends Component {
  state = {
    viewType: 'list',
    allTaskNumber: 0,
    editData: ''
  };

  TimedTaskListRef = createRef();
  TimedTaskConfigRef = createRef();

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
    const { visible, onCancel, onOk, graphId, listFooterVisible = true } = this.props;
    const { viewType, allTaskNumber, editData } = this.state;

    return (
      <UniversalModal
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
        open={visible}
        destroyOnClose={true}
        onCancel={onCancel}
        footerData={
          viewType === 'list' ? (
            listFooterVisible && null
          ) : (
            <>
              <Button
                className="ant-btn-default cancel button-style"
                onClick={() => {
                  this.changeViewType('list');
                }}
              >
                {intl.get('graphList.cancel')}
                {''}
              </Button>
              <Button className="button-style" type="primary" onClick={() => this.TimedTaskConfigRef.current.save()}>
                {intl.get('createEntity.save')}
                {''}
              </Button>
            </>
          )
        }
        width={1000}
        maskClosable={false}
        afterClose={() => {
          this.changeViewType('list');
        }}
      >
        {viewType === 'list' ? (
          <TimedTaskList
            ref={this.TimedTaskListRef}
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
            ref={this.TimedTaskConfigRef}
            changeViewType={this.changeViewType}
            graphId={graphId}
            editData={editData}
            viewType={viewType}
          />
        )}
      </UniversalModal>
    );
  }
}

export default TimedTask;
