import React, { useState, useRef } from 'react';
import { Button } from 'antd';
import classNames from 'classnames';
import intl from 'react-intl-universal';

import ComposInput from '@/components/ComposInput';
import IconFont from '@/components/IconFont';
import Format from '@/components/Format';

import './style.less';

export interface ChatEnhanceProps {
  className?: string;
  value?: string;
  disabled?: boolean;
  onSave?: (value: string) => void;
}

/**
 * 聊天增强配置项
 */
const ChatEnhance = (props: ChatEnhanceProps) => {
  const { className, value = '', disabled, onSave } = props;
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');
  const textareaRef = useRef<any>();

  const clickEditBtn = () => {
    setEditedText(value);
    setIsEditing(true);
    setTimeout(() => {
      textareaRef.current.focus({ preventScroll: false, cursor: 'end' });
    }, 0);
  };

  const clickCancel = () => {
    setIsEditing(false);
    setEditedText('');
  };

  const clickSave = () => {
    onSave?.(editedText);
    clickCancel();
  };

  return (
    <div className={classNames(className, 'mf-prompt-chat-enhance')}>
      <div className="enhance-title kw-align-center kw-mb-5">
        <div className="kw-mr-2" style={{ fontSize: 12 }}>
          {intl.get('prompt.chatEnhance')}
        </div>
        <div className="t-line kw-flex-item-full-width" />
      </div>

      <div className={classNames('config-item', { focused: isEditing })}>
        <div className="kw-space-between kw-mb-2">
          <div>
            <IconFont type="icon-kaichangbai" style={{ color: 'rgba(88, 80, 236, 1)' }} />
            <Format.Title className="kw-ml-2">{intl.get('prompt.prologue')}</Format.Title>
          </div>
          {!disabled && (
            <div className="kw-c-text-link" onClick={clickEditBtn}>
              <IconFont type="icon-edit" />
              <span className="kw-ml-2">{intl.get('global.edit')}</span>
            </div>
          )}
        </div>

        <ComposInput
          ref={textareaRef}
          placeholder={intl.get('prompt.prologuePlace')}
          className={!isEditing && !value ? 'kw-c-subtext' : ''}
          style={{ fontSize: 12 }}
          useAntd
          textarea
          autoSize
          value={isEditing ? editedText : value || intl.get('prompt.prologueTip')}
          bordered={false}
          readOnly={!isEditing}
          onChange={e => setEditedText(e.target.value)}
        />
        {isEditing && (
          <div className="kw-mt-5" style={{ textAlign: 'right' }}>
            <Button onClick={clickCancel}>{intl.get('global.cancel')}</Button>
            <Button type="primary" className="kw-ml-3" onClick={clickSave}>
              {intl.get('global.save')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatEnhance;
