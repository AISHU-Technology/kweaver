import React, { Component } from 'react';
import { Checkbox, TimePicker } from 'antd';
import intl from 'react-intl-universal';
import moment from 'moment';
import './style.less';

class ByWeek extends Component {
  state = {
    selectWeek: [], // 每周几运行
    runTime: '' // 运行时间
  };

  week = [
    intl.get('graphList.Mon'),
    intl.get('graphList.Tue'),
    intl.get('graphList.Wed'),
    intl.get('graphList.Thu'),
    intl.get('graphList.Fri'),
    intl.get('graphList.Sat'),
    intl.get('graphList.Sun')
  ]; // 星期国际化

  componentDidMount() {
    this.props.onByWeekRef(this);

    this.initData();
  }

  /**
   * @description 编辑时初始化数据
   */
  initData = () => {
    const { editData } = this.props;

    if (editData && editData.cycle === 'week') {
      this.setState({
        selectWeek: editData.date_list,
        runTime: moment(editData.date_time, 'HH:mm')
      });
    }
  };

  /**
   * @description 选择天
   */
  checkDay = (checked, day) => {
    let { selectWeek } = this.state;

    if (checked) {
      selectWeek = [...selectWeek, day];
    }

    if (!checked) {
      selectWeek = selectWeek.filter(item => {
        return item !== day;
      });
    }

    this.setState({
      selectWeek
    });
  };

  /**
   * @description 选择全部
   */
  checkAll = checked => {
    if (checked) {
      this.setState({
        selectWeek: [1, 2, 3, 4, 5, 6, 7]
      });

      return;
    }

    this.setState({
      selectWeek: []
    });
  };

  render() {
    const { selectWeek, runTime } = this.state;

    return (
      <div className="time-task-config-by-week">
        <div className="time">{intl.get('graphList.repetition')}</div>

        <div className="week-select">
          <Checkbox
            className="by-week-check-box"
            checked={selectWeek.length === 7}
            onChange={e => {
              this.checkAll(e.target.checked);
            }}
          >
            {intl.get('graphList.all')}
          </Checkbox>

          {this.week.map((item, index) => {
            return (
              <Checkbox
                className="by-week-check-box"
                key={item}
                checked={selectWeek.includes(index + 1)}
                onChange={e => {
                  this.checkDay(e.target.checked, index + 1);
                }}
              >
                {item}
              </Checkbox>
            );
          })}
        </div>

        <div className="time">{intl.get('graphList.runTime')}</div>

        <TimePicker
          className="by-week-time"
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

export default ByWeek;

ByWeek.defaultProps = {
  onByWeekRef: () => {}
};
