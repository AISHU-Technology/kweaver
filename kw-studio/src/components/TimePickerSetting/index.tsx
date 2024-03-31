import React, { useEffect, useState, useRef } from 'react';

import _ from 'lodash';
import moment from 'moment';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import { Tooltip, DatePicker } from 'antd';

import IconFont from '../IconFont';

import './style.less';

const TimePickerSetting = (props: any) => {
  const { arFileSave, selectedKey, setArFileSave, onSetTimeToPreview, editData, type } = props;
  const [timeValue, setTimeValue] = useState<any>('');
  const selectedFileRef = useRef<any>();
  const selectedKeyRef = useRef<any>();
  const timeValueRef = useRef<any>();

  useEffect(() => {
    if (!_.isEmpty(editData)) {
      selectedKeyRef.current = selectedKey || editData?.files?.[0]?.file_name;
      if (!_.isEmpty(arFileSave[selectedKeyRef.current])) {
        selectedFileRef.current = arFileSave;
        onMatchTimeToSelectedKey(selectedKeyRef.current);
      } else {
        const data = onHandleFormat();
        selectedFileRef.current = data;
        onMatchTimeToSelectedKey(editData?.files?.[0]?.file_name);
      }
    } else {
      selectedKeyRef.current = selectedKey;
      selectedFileRef.current = arFileSave;
      onMatchTimeToSelectedKey(selectedKey);
    }
  }, [selectedKey]);

  /**
   * 编辑进入数据保存
   */
  const onHandleFormat = () => {
    const filesEdit = _.cloneDeep(editData?.files);
    const reduceData = _.reduce(
      _.cloneDeep(filesEdit),
      (pre: any, key: any) => {
        pre[key.file_name] = {
          name: key.file_source,
          data_source: 'AnyRobot',
          start_time: Number(key.start_time),
          end_time: Number(key.end_time)
        };
        return pre;
      },
      {}
    );
    setArFileSave(reduceData);
    return reduceData;
  };

  /**
   * 根据文件名匹配选择的时间
   */
  const onMatchTimeToSelectedKey = (name: any) => {
    const isExit = selectedFileRef.current[name];
    if (!_.isEmpty(isExit)) {
      // 两者都为空默认不填 否则填入已选择的
      if (!isExit?.start_time && !isExit?.end_time) {
        setTimeValue('');
      } else {
        setTimeValue([moment(Number(isExit?.start_time)), moment(Number(isExit?.end_time))]);
      }
    } else {
      setTimeValue('');
    }
  };

  /**
   * 时间变更
   */
  const onDateChange = (date: any) => {
    timeValueRef.current = date;
    setTimeValue(date);
    onSetTimeToFile(date);
  };

  /**
   * 给文件添加设置的时间
   */
  const onSetTimeToFile = (date: any) => {
    if (!date) {
      selectedFileRef.current[selectedKeyRef.current].start_time = 0;
      selectedFileRef.current[selectedKeyRef.current].end_time = 0;
    } else {
      selectedFileRef.current[selectedKeyRef.current].start_time = moment(date[0] * 1000).unix();
      selectedFileRef.current[selectedKeyRef.current].end_time = moment(date[1] * 1000).unix();
    }
    setArFileSave(selectedFileRef.current);
    onSetTimeToPreview(selectedFileRef.current[selectedKeyRef.current]);
  };

  return (
    <div className={classNames('ar-time-picker-setting-root kw-mt-8', { 'kw-ml-5 kw-mr-5': type !== 'four' })}>
      <div className="kw-flex title-box kw-mb-2">
        <div className="title kw-mr-1">{intl.get('workflow.information.timeSelect')}</div>
        <Tooltip title={intl.get('workflow.information.timeToolTip')} placement="top">
          <IconFont type="icon-wenhao" style={{ opacity: '0.45', fontSize: '14px' }} />
        </Tooltip>
      </div>

      <DatePicker.RangePicker
        showTime
        className={classNames('time-picker', { 'kw-mb-5': type === 'four' })}
        value={timeValue}
        onChange={onDateChange}
      />
    </div>
  );
};

export default TimePickerSetting;
