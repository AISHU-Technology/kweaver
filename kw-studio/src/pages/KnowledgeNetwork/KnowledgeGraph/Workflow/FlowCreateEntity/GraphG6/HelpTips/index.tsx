import React, { memo, useState, useEffect, useRef } from 'react';
import { InfoCircleFilled } from '@ant-design/icons';
import intl from 'react-intl-universal';
import _ from 'lodash';
import { localStore } from '@/utils/handleFunction';
import './style.less';

const KEY = 'graph_never_notify_help_tips';

export interface HelpTipsProps {
  visible: boolean;
}

const HelpTips = (props: HelpTipsProps) => {
  const { visible } = props;
  const isRendered = useRef(false);
  const [isLocked] = useState(() => {
    const cacheUserIds = localStore.get(KEY) || [];
    const loginUserId = localStore.get('userInfo')?.id;
    return _.includes(cacheUserIds, loginUserId);
  });
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

  const onNeverNotify = () => {
    const cacheUserIds = localStore.get(KEY) || [];
    const loginUserId = localStore.get('userInfo')?.id;
    if (!loginUserId) return setIsShow(false);
    localStore.set(KEY, _.uniq([...cacheUserIds, loginUserId]));
    setIsShow(false);
  };

  return !isLocked && isShow ? (
    <div className="graph-operation-help-tips kw-space-between">
      <span className="kw-space-between">
        <InfoCircleFilled className="kw-mr-2 kw-c-primary" style={{ fontSize: 16 }} />
        <span className="kw-c-text">{intl.get('createEntity.brushTip')}</span>
      </span>
      <span className="never-notify kw-ml-4 kw-pointer kw-c-primary" onClick={onNeverNotify}>
        {intl.get('createEntity.notRemind')}
      </span>
    </div>
  ) : null;
};

export default memo(HelpTips);
