import { Dropdown, message } from 'antd';
import React from 'react';
import intl from 'react-intl-universal';
import { QuestionCircleOutlined } from '@ant-design/icons';
import searchServices from '@/services/cognitiveSearch';

export default function UploadFileTip(props: any) {
  const wrapperStyle = {
    background: '#FFFFFF',
    boxShadow: '0px 2px 12px 0px rgba(0,0,0,0.06)',
    borderRadius: 3,
    padding: 16
  };

  const downTemplate = async () => {
    try {
      await searchServices.exportModelTemplate();
    } catch (err) {
      message.error('下载失败');
    }
  };

  const tipWrapper = (
    <div style={wrapperStyle}>
      <div>{intl.get('cognitiveSearch.qaAdvConfig.uploadHelp1')}</div>
      <div>{intl.get('cognitiveSearch.qaAdvConfig.uploadHelp2')}</div>
      <div>
        {intl.get('cognitiveSearch.qaAdvConfig.uploadHelp3').split('|')[0]}
        <span className="kw-c-primary kw-pointer" onClick={downTemplate}>
          {intl.get('cognitiveSearch.qaAdvConfig.uploadHelp3').split('|')[1]}
        </span>
      </div>
      <div>{intl.get('cognitiveSearch.qaAdvConfig.uploadHelp4')}</div>
    </div>
  );
  return (
    <Dropdown overlay={tipWrapper} trigger={['hover']}>
      <QuestionCircleOutlined className="kw-pointer kw-c-subtext" />
    </Dropdown>
  );
}
