import React, { memo } from 'react';
import intl from 'react-intl-universal';
import IconFont from '@/components/IconFont';
import './style.less';

export interface BrushSelectDialogProps {
  visible?: boolean;
  nodeLen?: number;
  edgeLen?: number;
  onCancel?: () => void;
  onOk?: () => void;
}

const BrushSelectDialog = (props: BrushSelectDialogProps) => {
  const { visible, nodeLen, edgeLen, onCancel, onOk } = props;
  return (
    <div className="group-op-dialog ad-space-between" style={{ display: visible ? undefined : 'none' }}>
      <div className="op-text">
        <IconFont type="icon-Add" className="ad-mr-2" />
        {intl.get('createEntity.groupOpTip1')}
        <span className="ad-c-primary">&nbsp;{nodeLen || 0}&nbsp;</span>
        {intl.get('createEntity.groupOpTip2')}
        <span className="ad-c-primary">&nbsp;{edgeLen || 0}&nbsp;</span>
        {intl.get('createEntity.groupOpTip3')}
      </div>
      <div className="btn-box ad-ml-8">
        <span className="g-btn ad-c-subtext ad-pointer" onClick={() => onCancel?.()}>
          {intl.get('global.cancel')}
        </span>
        <span className="g-btn ad-ml-2 ad-c-header ad-pointer" onClick={() => onOk?.()}>
          {intl.get('global.ok')}
        </span>
      </div>
    </div>
  );
};

export default memo(BrushSelectDialog);
