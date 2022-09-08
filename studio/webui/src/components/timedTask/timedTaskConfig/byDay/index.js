import React, { Component } from 'react';
import { TimePicker } from 'antd';
import intl from 'react-intl-universal';
import moment from 'moment';
import './style.less';

class ByDay extends Component {
  state = {
    selectTime: ''
  };

  componentDidMount() {
    this.props.onByDayRef(this);

    this.initData();
  }

  /**
   * @description 编辑时初始化数据
   */
  initData = () => {
    const { editData } = this.props;

    if (editData && editData.cycle === 'day') {
      this.setState({
        selectTime: moment(editData.date_time, 'HH:mm')
      });
    }
  };

  render() {
    const { selectTime } = this.state;

    return (
      <div className="time-task-config-by-day">
        <div className="time">{intl.get('graphList.runTime')}</div>

        <div className="by-day-tent">
          <span className="by-day-des">{intl.get('graphList.everyDay')}</span>
          <TimePicker
            className="by-day-time"
            format={'HH:mm'}
            showNow={false}
            value={selectTime}
            onChange={time => {
              this.setState({
                selectTime: time
              });
            }}
            getPopupContainer={triggerNode => triggerNode.parentElement}
          />
          <span className="by-day-des">{intl.get('graphList.runOnce')}</span>
        </div>
      </div>
    );
  }
}

export default ByDay;

ByDay.defaultProps = {
  onByDayRef: () => {}
};
