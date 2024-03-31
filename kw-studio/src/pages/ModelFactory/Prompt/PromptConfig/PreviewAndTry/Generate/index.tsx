import React from 'react';
import { LoadingOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import _ from 'lodash';

import Markdown from '@/components/Markdown';

import MoreInfo from '../../components/MoreInfo';
import { TChatInfo } from '../../types';
import './style.less';

export interface GenerateProps {
  className?: string;
  data: TChatInfo;
}

const Generate = (props: GenerateProps) => {
  const { className, data } = props;
  const { message = '', status } = data[0] || {};
  return (
    <div className={classNames(className, 'mf-chat-generate-box kw-p-6')}>
      <div className="chat-generate-content" style={{ display: data.length ? undefined : 'none' }}>
        {status === 'loading' ? <LoadingOutlined className="kw-c-primary" /> : <Markdown content={message} />}
      </div>
      {!_.isEmpty(data) && _.includes(Object?.keys(data?.[0]), 'time') ? <MoreInfo data={data[0]} /> : null}
    </div>
  );
};

export default Generate;
