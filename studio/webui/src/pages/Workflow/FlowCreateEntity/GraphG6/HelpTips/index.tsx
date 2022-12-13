import React, { memo, useState, useEffect, useRef } from 'react';
import { InfoCircleFilled } from '@ant-design/icons';
import intl from 'react-intl-universal';
import { localStore } from '@/utils/handleFunction';
import './style.less';

const KEY = 'graph_never_notify_help_tips';

export interface HelpTipsProps {
  visible: boolean;
}

const HelpTips = (props: HelpTipsProps) => {
  const { visible } = props;
  const isRendered = useRef(false);
  const [isLocked] = useState(() => localStore.get(KEY));
  const [isShow, setIsShow] = useState(false);

  useEffect(() => {
    if (!visible || isRendered.current) {
      setIsShow(false);
      return;
    }
    isRendered.current = true;
    setIsShow(true);
    const timer = setTimeout(() => setIsShow(false), 3000);
    return () => clearTimeout(timer);
  }, [visible]);

  return !isLocked && isShow ? (
    <div className="graph-operation-help-tips ad-space-between">
      <span className="ad-space-between">
        <InfoCircleFilled className="ad-mr-2 ad-c-primary" style={{ fontSize: 16 }} />
        <span className="ad-c-text">{intl.get('createEntity.brushTip')}</span>
      </span>
      <span
        className="never-notify ad-ml-4 ad-pointer ad-c-primary"
        onClick={() => {
          localStore.set(KEY, true);
          setIsShow(false);
        }}
      >
        {intl.get('createEntity.notRemind')}
      </span>
    </div>
  ) : null;
};

export default memo(HelpTips);
