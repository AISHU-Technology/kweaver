import React from 'react';
import intl from 'react-intl-universal';
import { Radio, Space, Popover } from 'antd';
import { SettingOutlined } from '@ant-design/icons';

import './style.less';

const DisplayResult = (props: any) => {
  const { value, onChange } = props;
  return (
    <Popover
      trigger="click"
      placement="bottomRight"
      overlayClassName="displayResultRoot"
      getPopupContainer={triggerNode => triggerNode?.parentElement || document.body}
      content={
        <div>
          <span className="kw-c-watermark">{intl.get('analysisService.resultSubText')}</span>
          <Radio.Group value={value} onChange={e => onChange(e?.target?.value)}>
            <Space direction="vertical">
              <Radio value="notDisplayResult">{intl.get('analysisService.notDisplayResult')}</Radio>
              <Radio value="displayResult">{intl.get('analysisService.displayResult')}</Radio>
              <Radio value="notDisplayPanel">{intl.get('analysisService.notDisplayPanel')}</Radio>
            </Space>
          </Radio.Group>
        </div>
      }
    >
      <SettingOutlined className="kw-mr-2" title={intl.get('analysisService.queryT')} />
    </Popover>
  );
};

export default DisplayResult;
