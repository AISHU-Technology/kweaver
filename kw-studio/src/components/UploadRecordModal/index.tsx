import React from 'react';
import intl from 'react-intl-universal';

import Format from '@/components/Format';
import IconFont from '@/components/IconFont';
import Content from './Content';
import './style.less';
export interface UploadRecordManageProps {
  visible: boolean;
  isIq: boolean;
  onCancel: () => void;
}

const UploadRecordManage = (props: UploadRecordManageProps) => {
  const { isIq, onCancel } = props;
  return (
    <div className="uploadRecordManageRoot">
      <div className="kw-pl-6  kw-bg-white kw-space-between" style={{ height: 52 }}>
        <div className="kw-center kw-pointer" onClick={onCancel}>
          <IconFont className="kw-mr-1" type="icon-shangfanye" />
          <Format.Title tipPosition="bottom" className="kw-ellipsis">
            {intl.get('uploadService.uploadManage')}
          </Format.Title>
        </div>
      </div>
      <div className="kw-pl-5 kw-pr-5 uploadRecordContent">
        <Content isIq={isIq} />
      </div>
    </div>
  );
};

export default (props: any) => {
  const { visible } = props;
  if (!visible) return null;
  return <UploadRecordManage {...props} />;
};
