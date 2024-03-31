import React, { useState, useEffect, useRef } from 'react';
import { Alert, Button } from 'antd';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import IconFont from '@/components/IconFont';
import { localStore } from '@/utils/handleFunction';
import './style.less';

export interface RemindTipProps {
  className?: string;
  style?: React.CSSProperties;
  selectedItem: any;
  iframeStyle?: boolean; // 是否是服务内嵌页面
  content?: string; // 欢迎语内容
}

const RemindTip = (props: any) => {
  const { className, style, selectedItem, iframeStyle = true, content } = props;
  const isFaker = selectedItem?.faker;
  const interval = iframeStyle ? 5 * 1000 : 10 * 1000; // 嵌入界面仅显示5秒
  const TIMER = useRef<any>(null);
  const [isHideReminder, setIsHideReminder] = useState(!isFaker);
  const isReady = selectedItem?.configReady;

  useEffect(() => {
    if (isFaker) return;
    if (
      selectedItem?.newTabData?.type === 'add' ||
      (!selectedItem?.detail?.c_id && !selectedItem?.detail?.kg?.service_id)
    ) {
      setIsHideReminder(false);
      TIMER.current = setTimeout(() => {
        setIsHideReminder(true);
      }, interval);
      return () => clearTimeout(TIMER.current);
    }

    const _isHideReminder =
      localStore.get('reminders')?.[selectedItem?.detail?.c_id] ||
      localStore.get('reminders')?.[selectedItem?.detail?.kg?.service_id];

    setIsHideReminder(_isHideReminder);
    TIMER.current = setTimeout(() => {
      setIsHideReminder(true);
    }, interval);
    return () => clearTimeout(TIMER.current);
  }, [selectedItem.detail?.c_id, selectedItem.detail?.kg?.service_id]);

  const onNotRemind = () => {
    if (isFaker) return;
    setIsHideReminder(true);
    const reminders = localStore.get('reminders') || {};
    if (selectedItem?.detail?.c_id) {
      localStore.set('reminders', { ...reminders, [selectedItem.detail.c_id]: true });
    }
    if (selectedItem?.detail?.kg?.service_id) {
      localStore.set('reminders', { ...reminders, [selectedItem.detail.kg?.service_id]: true });
    }
  };

  if (isHideReminder || selectedItem?.exploring?.isExploring) return null;

  return (
    <div className={classNames('canvas-reminder-tip-root', className)} style={style}>
      {iframeStyle ? (
        isReady && content ? (
          <div className="iframe-welcome">
            <IconFont type="icon-huanying" className="kw-mr-2" style={{ fontSize: 16, transform: 'translateY(1px)' }} />
            {content}
            <Button type="link" style={{ paddingLeft: 8, minWidth: 0 }} onClick={onNotRemind}>
              {intl.get('exploreGraph.notRemind')}
            </Button>
          </div>
        ) : null
      ) : (
        <Alert
          showIcon
          type="warning"
          style={{ padding: '0px 12px', fontSize: 12, background: '#FFFBE6' }}
          message={
            <div>
              {intl.get('exploreGraph.note')}
              <Button type="link" style={{ paddingLeft: 8, fontSize: 12, minWidth: 0 }} onClick={onNotRemind}>
                {intl.get('exploreGraph.notRemind')}
              </Button>
            </div>
          }
        />
      )}
    </div>
  );
};

export default RemindTip;
