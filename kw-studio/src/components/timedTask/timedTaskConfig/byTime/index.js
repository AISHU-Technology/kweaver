/**
 * 按次配置任务
 *
 * @author Eden
 * @date 2021/12/21
 *
 */

import React, { Component } from 'react';
import { DatePicker } from 'antd';
import intl from 'react-intl-universal';
import moment from 'moment';
import './style.less';

class ByTime extends Component {
  state = {
    selectTime: moment().add('1', 'H')
  };

  componentDidMount() {
    this.props.onByTimeRef(this);

    this.initData();
  }

  /**
   * @description 编辑时初始化数据
   */
  initData = () => {
    const { editData } = this.props;

    if (editData && editData.cycle === 'one') {
      this.setState({
        selectTime: moment(editData.date_time, 'YYYY-MM-DD HH:mm')
      });
    }
  };

  /**
   * @description 限制可选的时(可选时间为当前时间往后推移1小时)
   */
  setDisabledTime = current => {
    if (current && current > moment().endOf('day')) {
      return;
    }

    const hh = moment().format('HH');
    const mm = moment().format('mm');

    const selectHH = current && current.format('HH');

    let disabledHours = [];
    let disabledMinutes = [];

    for (let i = 0; i < 24; i++) {
      if (i < hh) {
        disabledHours = [...disabledHours, i];
      }
    }

    if (selectHH && parseInt(selectHH) === parseInt(hh)) {
      for (let i = 0; i < 60; i++) {
        if (i < mm) {
          disabledMinutes = [...disabledMinutes, i];
        }
      }
    }

    return { disabledHours: () => disabledHours, disabledMinutes: () => disabledMinutes };
  };

  render() {
    const { selectTime } = this.state;

    return (
      <div className="time-task-config-by-time">
        <div className="time">{intl.get('graphList.runTime')}</div>

        <div className="time-pick">
          <DatePicker
            className="time-box"
            showTime
            getPopupContainer={triggerNode => triggerNode.parentElement}
            format="YYYY-MM-DD HH:mm"
            showNow={false}
            value={selectTime}
            disabledDate={current => {
              return current && current < moment().startOf('day');
            }}
            disabledTime={this.setDisabledTime}
            onChange={date => {
              this.setState({
                selectTime: date
              });
            }}
          />
        </div>
      </div>
    );
  }
}

export default ByTime;

ByTime.defaultProps = {
  onByTimeRef: () => {}
};
