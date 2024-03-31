import React from 'react';
import { LoadingOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import _ from 'lodash';

import Markdown from '@/components/Markdown';
import IconFont from '@/components/IconFont';
import { avatar } from '@/assets/images/base64';

import MoreInfo from '../../components/MoreInfo';
import { TChatInfo } from '../../types';
import './style.less';

export interface ChatProps {
  className?: string;
  data?: TChatInfo;
  prologue?: string;
}

const Avatar = ({ role }: Pick<TChatInfo[number], 'role'>) => {
  if (role === 'ai') {
    return (
      <div className="ai-avatar kw-center">
        <IconFont type="icon-color-jiqiren" />
      </div>
    );
  }
  return <img src={avatar} alt="user" className="user-avatar" />;
};

const Chat = (props: ChatProps) => {
  const { className, data, prologue } = props;

  return (
    <div className={classNames(className, 'mf-chat-content-box')}>
      {prologue?.trim?.() && (
        <div className="mf-chat-message-card kw-flex kw-mb-8 position-left">
          <div className="role-avatar kw-center">
            <Avatar role="ai" />
          </div>
          <div className="chat-content kw-c-header">
            <div className="kw-mb-1">
              <IconFont className="kw-mr-2" type="icon-kaichangbai" style={{ color: 'rgba(88, 80, 236, 1)' }} />
              <span className="kw-c-subtext">{intl.get('prompt.prologue')}</span>
            </div>
            {prologue}
          </div>
        </div>
      )}

      {_.map(data, item => {
        const { id, role, message, status } = item;
        return (
          <div
            key={id}
            className={classNames(
              'mf-chat-message-card kw-flex kw-mb-8',
              `position-${role === 'human' ? 'right' : 'left'}`
            )}
            style={{ flexDirection: role === 'human' ? 'row-reverse' : 'row' }}
          >
            <div className="role-avatar kw-center">
              <Avatar role={role} />
            </div>
            <div>
              <div className="chat-content kw-c-header">
                {status === 'loading' ? <LoadingOutlined className="kw-c-primary" /> : <Markdown content={message} />}
              </div>
              <MoreInfo data={item} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Chat;
