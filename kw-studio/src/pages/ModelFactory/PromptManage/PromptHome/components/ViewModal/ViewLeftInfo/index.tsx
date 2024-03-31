import React from 'react';

import { message } from 'antd';
import intl from 'react-intl-universal';

import Format from '@/components/Format';
import IconFont from '@/components/IconFont';
import { copyToBoard } from '@/utils/handleFunction';

import './style.less';

const ViewLeftInfo = (props: any) => {
  const { recordData } = props;

  /**
   * 复制ID
   */
  const onCopy = (value: string) => {
    copyToBoard(value);
    message.success(intl.get('global.copySuccess'));
  };

  return (
    <div className="prompt-modal-view-left-info-root">
      <Format.Title>{intl.get('analysisService.baseInfoT')}</Format.Title>
      <div className="kw-mt-4">
        <div className="kw-c-subtext">{intl.get('prompt.id')}:</div>
        <div className="kw-align-center view-info-height kw-mb-2">
          {recordData?.prompt_id}{' '}
          <Format.Button
            tipPosition="top"
            size="small"
            type="icon"
            tip={intl.get('prompt.copyID')}
            onClick={() => onCopy(recordData?.prompt_id)}
          >
            <IconFont type="icon-copy" />
          </Format.Button>
        </div>
        <div className="kw-c-subtext">{intl.get('prompt.promptName')}:</div>
        <div className="kw-c-text kw-ellipsis kw-align-center prompt-ellipsis kw-mb-2" title={recordData?.prompt_name}>
          {recordData?.prompt_name}
        </div>
        <div className="kw-c-subtext">{intl.get('prompt.promptType')}:</div>
        <div className="kw-c-text kw-align-center view-info-height kw-mb-2">{recordData?.prompt_type}</div>
        <div className="kw-c-subtext">{intl.get('prompt.promptGroup')}:</div>
        <div className="kw-c-text prompt-ellipsis kw-ellipsis kw-mb-2" title={recordData?.prompt_item_type}>
          {recordData?.prompt_item_type}
        </div>
        <div className="kw-c-subtext" title={recordData?.prompt_desc || '--'}>
          {intl.get('cognitiveService.iframeDocument.description')}:
        </div>
        <div
          className="kw-c-text kw-ellipsis-2 kw-pr-6 prompt-desc kw-align-center"
          title={recordData?.prompt_desc || '--'}
        >
          {recordData?.prompt_desc || '--'}
        </div>
      </div>
    </div>
  );
};

export default ViewLeftInfo;
