import React, { Component } from 'react';
import { Checkbox, TimePicker } from 'antd';
import intl from 'react-intl-universal';
import moment from 'moment';
import './style.less';

class ByMonth extends Component {
  state = {
    day: [],
    selectedDay: [],
    runTime: ''
  };

  componentDidMount() {
    this.setDay();
    this.props.onByMonthRef(this);

    this.initData();
  }

  /**
   * @description 编辑时初始化数据
   */
  initData = () => {
    const { editData } = this.props;

    if (editData && editData.cycle === 'month') {
      this.setState({
        selectedDay: editData.date_list,
        runTime: moment(editData.date_time, 'HH:mm')
      });
    }
  };

  /**
   * @description 生成日期
   */
  setDay = () => {
    let day = [];

    for (let i = 1; i <= 31; i++) {
      day = [...day, i];
    }

    this.setState({
      day
    });
  };

  /**
   * @description 选择天
   */
  checkDay = (checked, day) => {
    let { selectedDay } = this.state;

    if (checked) {
      selectedDay = [...selectedDay, day];
    }

    if (!checked) {
      selectedDay = selectedDay.filter(item => {
        return item !== day;
      });
    }

    this.setState({
      selectedDay
    });
  };

  /**
   * @description 选择全部
   */
  checkAll = checked => {
    const { day } = this.state;

    if (checked) {
      this.setState({
        selectedDay: day
      });

      return;
    }

    this.setState({
      selectedDay: []
    });
  };

  /**
   * @description 设置显示日期
   */
  setShowDay = day => {
    if (day === 1 || day === 21 || day === 31) {
      return `${day}${intl.get('graphList.st')}`;
    }

    if (day === 2 || day === 22) {
      return `${day}${intl.get('graphList.nd')}`;
    }

    if (day === 3 || day === 23) {
      return `${day}${intl.get('graphList.rd')}`;
    }

    return `${day}${intl.get('graphList.th')}`;
  };

  render() {
    const { day, selectedDay, runTime } = this.state;

    return (
      <div className="time-task-config-by-month">
        <div className="time">{intl.get('graphList.repetition')}</div>

        <div className="by-month-day-select">
          <Checkbox
            className="by-month-check-box"
            checked={selectedDay.length === 31}
            onChange={e => {
              this.checkAll(e.target.checked);
            }}
          >
            {intl.get('graphList.all')}
          </Checkbox>

          {day.map(item => {
            return (
              <Checkbox
                className="by-month-check-box"
                key={item}
                checked={selectedDay.includes(item)}
                onChange={e => {
                  this.checkDay(e.target.checked, item);
                }}
              >
                {this.setShowDay(item)}
              </Checkbox>
            );
          })}
        </div>

        <div className="time">{intl.get('graphList.runTime')}</div>

        <TimePicker
          className="by-month-time"
          format={'HH:mm'}
          showNow={false}
          value={runTime}
          onChange={time => {
            this.setState({
              runTime: time
            });
          }}
          getPopupContainer={triggerNode => triggerNode.parentElement}
        />
      </div>
    );
  }
}

export default ByMonth;

ByMonth.defaultProps = {
  onByMonthRef: () => {}
};
