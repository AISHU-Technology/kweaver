/**
 * 导入rabbitMQ数据源
 */

import React, { memo, useEffect } from 'react';
import { Input } from 'antd';
import intl from 'react-intl-universal';
import './style.less';

const { TextArea } = Input;

const RabbitMQ = props => {
  const { selectedValue, setSaveData } = props;

  useEffect(() => {
    if (!selectedValue.id) return;

    setSaveData({
      type: 'rabbitmq',
      data: selectedValue
    });
  }, [selectedValue, setSaveData]);

  return (
    <div className="source-import-rabbitmq">
      {/* 基本信息 */}
      <div className="basic-info">
        <div className="head">{[intl.get('createEntity.basicInfo')]}</div>

        <div className="info">
          <div className="line">
            <label className="start">{[intl.get('createEntity.dataSource')]}</label>：
            <span className="tent">RabbitMQ</span>
          </div>
          <div className="line">
            <label className="start">{intl.get('datamanagement.queue')}</label>：
            <span className="tent" title={selectedValue.queue}>
              {selectedValue.queue}
            </span>
          </div>
        </div>
      </div>

      {/* 预览 */}
      <div className="preview">
        <div className="content-pre">
          <div className="title-pre">
            <span className="big">{intl.get('createEntity.preview')}</span>&nbsp;
            <span className="little">{intl.get('workflow.information.showSchema')}</span>
          </div>

          <TextArea className="text-area" autoSize disabled value={selectedValue.json_schema} />
        </div>
      </div>
    </div>
  );
};

RabbitMQ.defaultProps = {
  selectedValue: {},
  setSaveData: () => {}
};

export default memo(RabbitMQ);
