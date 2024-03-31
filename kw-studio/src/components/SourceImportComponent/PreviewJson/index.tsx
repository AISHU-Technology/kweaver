import React, { memo } from 'react';
import { Input } from 'antd';
import classNames from 'classnames';
import './style.less';

const { TextArea } = Input;

export interface PreviewJsonProps {
  className?: string;
  data: string;
}

const PreviewJson = (props: PreviewJsonProps) => {
  const { data } = props;
  return (
    <div className={classNames('extract-preview-json', classNames)}>
      <TextArea value={data} autoSize={true} disabled={true} />
    </div>
  );
};

export default memo(PreviewJson);
