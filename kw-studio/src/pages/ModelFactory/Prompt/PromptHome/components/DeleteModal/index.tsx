import React, { useState } from 'react';
import { Input } from 'antd';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import _ from 'lodash';

import UniversalModal from '@/components/UniversalModal';
import './style.less';

export interface DeleteModalProps {
  className?: string;
  visible: boolean;
  type: 'project' | 'category' | string;
  data?: any;
  onOk?: (action: string) => void;
  onCancel?: () => void;
}

const getInfo = (type: DeleteModalProps['type']) => {
  return {
    project: {
      title: intl.get('prompt.deleteGroup').split('\n')[0],
      desc: intl.get('prompt.deleteNote'),
      label: intl.get('prompt.deleteGroup').split('\n')[2]
    },
    category: {
      title: intl.get('prompt.deleteGroup').split('\n')[0],
      desc: intl.get('prompt.deleteNote'),
      label: intl.get('prompt.deleteGroup').split('\n')[2]
    }
  }[type];
};

const DeleteModal = (props: DeleteModalProps) => {
  const { className, visible, type, data, onOk, onCancel } = props;
  const info = getInfo(type);
  const [value, setValue] = useState('');
  const isOk = ['确定', 'YES', 'yes', 'Yes'].includes(value);

  const submit = () => {
    if (!isOk) return;
    onOk?.('delete');
  };

  return (
    <UniversalModal
      className={classNames(className, 'mf-prompt-delete-modal')}
      title={info!.title}
      visible={visible}
      width={480}
      zIndex={2000}
      onCancel={onCancel}
      footerData={[
        { label: intl.get('global.cancel'), onHandle: onCancel },
        {
          label: intl.get('global.delete'),
          type: 'primary',
          isDisabled: !isOk,
          btnProps: { danger: true },
          onHandle: submit
        }
      ]}
    >
      <div className="kw-mb-2 kw-c-header">{info!.desc}</div>
      <div className="kw-mb-2 kw-c-header">{info!.label}</div>
      <Input
        placeholder={intl.get('prompt.okPlace')}
        value={value}
        onChange={e => setValue(e.target.value)}
        onPressEnter={submit}
      />
    </UniversalModal>
  );
};

export default (props: DeleteModalProps) => (props.visible ? <DeleteModal {...props} /> : null);
