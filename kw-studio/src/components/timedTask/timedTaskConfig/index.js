import React, { Component } from 'react';
import { Radio, message } from 'antd';
import intl from 'react-intl-universal';
import moment from 'moment';
import serviceTimedTask from '@/services/timedTask';
import ByTime from './ByTime';
import ByDay from './ByDay';
import ByWeek from './ByWeek';
import ByMonth from './ByMonth';
import './style.less';

class TimedTaskConfig extends Component {
  state = {
    selectedTag: 'one',
    updateType: 'increment',
    enabled: 1,
    byTimeRef: '',
    byDayRef: '',
    byWeekRef: '',
    byMonthRef: ''
  };

  isLoading = false;

  componentDidMount() {
    if (this.props.viewType === 'editConfig') {
      this.setState({
        selectedTag: this.props.editData.cycle,
        updateType: this.props.editData.task_type,
        enabled: this.props.editData.enabled
      });
    }
  }

  /**
   * @description 选择定时模式
   */
  setSelectedTag = selectedTag => {
    this.setState({
      selectedTag
    });
  };

  /**
   * @description 改变更新方式
   */
  changeUpdateType = e => {
    this.setState({
      updateType: e.target.value
    });
  };

  /**
   * @description 保存/编辑 定时任务
   */
  save = async () => {
    const { graphId, changeViewType, viewType, editData } = this.props;
    const { selectedTag, byTimeRef, byDayRef, byWeekRef, byMonthRef, updateType, enabled } = this.state;

    let data = '';

    if (this.isLoading) {
      return;
    }

    this.isLoading = true;

    if (selectedTag === 'one') {
      if (!byTimeRef.state.selectTime) {
        message.error(intl.get('graphList.taskNeedConfig'));

        this.isLoading = false;

        return;
      }

      data = {
        task_type: updateType,
        cycle: 'one',
        datetime: moment(byTimeRef.state.selectTime).format('YYYY-MM-DD HH:mm'),
        enabled,
        date_list: []
      };
    }

    if (selectedTag === 'day') {
      if (!byDayRef.state.selectTime) {
        message.error(intl.get('graphList.taskNeedConfig'));

        this.isLoading = false;

        return;
      }

      data = {
        task_type: updateType,
        cycle: 'day',
        datetime: moment(byDayRef.state.selectTime).format('HH:mm'),
        enabled,
        date_list: []
      };
    }

    if (selectedTag === 'week') {
      if (!byWeekRef.state.runTime || !byWeekRef.state.selectWeek.length) {
        message.error(intl.get('graphList.taskNeedConfig'));

        this.isLoading = false;

        return;
      }

      data = {
        task_type: updateType,
        cycle: 'week',
        datetime: moment(byWeekRef.state.runTime).format('HH:mm'),
        enabled,
        date_list: byWeekRef.state.selectWeek
      };
    }

    if (selectedTag === 'month') {
      if (!byMonthRef.state.runTime || !byMonthRef.state.selectedDay.length) {
        message.error(intl.get('graphList.taskNeedConfig'));

        this.isLoading = false;

        return;
      }

      data = {
        task_type: updateType,
        cycle: 'month',
        datetime: moment(byMonthRef.state.runTime).format('HH:mm'),
        enabled,
        date_list: byMonthRef.state.selectedDay
      };
    }

    let res = '';

    if (viewType === 'crateConfig') {
      res = await serviceTimedTask.timerCreate(graphId, data);
    }

    if (viewType === 'editConfig') {
      data.task_id = editData.task_id;
      res = await serviceTimedTask.timerUpdate(graphId, data);
    }

    if (res && res.state === 'success') {
      changeViewType('list');
    }

    if (res && res.ErrorCode === '500021') {
      message.error(intl.get('graphList.hasBeenDel'));

      setTimeout(() => {
        window.location.replace('/home');
      }, 2000);
    }

    if (res && res.ErrorCode === '500051') {
      message.error(intl.get('graphList.timeNoE'));
    }

    if (res && res.ErrorCode === '500053') {
      message.error(intl.get('graphList.timeOut'));
    }
    if (res && res.ErrorCode === 'Manager.SoftAuth.UnknownServiceRecordError') {
      message.error(intl.get('graphList.noP'));

      setTimeout(() => {
        window.location.replace('/home');
      }, 2000);
    }

    this.isLoading = false;
  };

  /**
   * @description 绑定按次模块
   */
  onByTimeRef = ref => {
    this.setState({
      byTimeRef: ref
    });
  };

  /**
   * @description 绑定按天模块
   */
  onByDayRef = ref => {
    this.setState({
      byDayRef: ref
    });
  };

  /**
   * @description 绑定按周模块
   */
  onByWeekRef = ref => {
    this.setState({
      byWeekRef: ref
    });
  };

  /**
   * @description 绑定按月模块
   */
  onByMonthRef = ref => {
    this.setState({
      byMonthRef: ref
    });
  };

  render() {
    const { editData } = this.props;
    const { selectedTag, updateType } = this.state;

    return (
      <div className="time-task-config">
        <div className="tent">
          <div className="tab">
            <div className="tab-item">
              <div
                className={selectedTag === 'one' ? 'line line-selected' : 'line'}
                onClick={() => {
                  this.setSelectedTag('one');
                }}
              >
                {intl.get('graphList.time')}
              </div>
            </div>

            <div className="tab-item">
              <div
                className={selectedTag === 'day' ? 'line line-selected' : 'line'}
                onClick={() => {
                  this.setSelectedTag('day');
                }}
              >
                {intl.get('graphList.day')}
              </div>
            </div>

            <div className="tab-item">
              <div
                className={selectedTag === 'week' ? 'line line-selected' : 'line'}
                onClick={() => {
                  this.setSelectedTag('week');
                }}
              >
                {intl.get('graphList.week')}
              </div>
            </div>

            <div className="tab-item">
              <div
                className={selectedTag === 'month' ? 'line line-selected' : 'line'}
                onClick={() => {
                  this.setSelectedTag('month');
                }}
              >
                {intl.get('graphList.month')}
              </div>
            </div>
          </div>

          <div className="content">
            <div className="model">
              <div className="title">{intl.get('graphList.runModel')}</div>
              <div className="update-type">
                <Radio.Group onChange={this.changeUpdateType} value={updateType}>
                  <div className="radio-box">
                    <Radio value={'increment'}>
                      <div className="name">{intl.get('task.iu')}</div>
                      <div className="des">{intl.get('task.am')}</div>
                    </Radio>
                  </div>
                  <div className="radio-box">
                    <Radio value={'full'}>
                      <div className="name">{intl.get('task.fu')}</div>
                      <div className="des">{intl.get('task.fm')}</div>
                    </Radio>
                  </div>
                </Radio.Group>
              </div>
            </div>

            {selectedTag === 'one' ? <ByTime onByTimeRef={this.onByTimeRef} editData={editData} /> : null}
            {selectedTag === 'day' ? <ByDay onByDayRef={this.onByDayRef} editData={editData} /> : null}
            {selectedTag === 'week' ? <ByWeek onByWeekRef={this.onByWeekRef} editData={editData} /> : null}
            {selectedTag === 'month' ? <ByMonth onByMonthRef={this.onByMonthRef} editData={editData} /> : null}
          </div>
        </div>
      </div>
    );
  }
}

export default TimedTaskConfig;
