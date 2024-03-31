import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import { Prompt, useHistory } from 'react-router-dom';
import { Modal } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';

import Format from '@/components/Format';

const ReactRouterPrompt = (props: any) => {
  const history = useHistory();
  const { isIntercept = false, title = '', content = '' } = props;
  const { onCancel } = props;

  const [isPrompt, setIsPrompt] = useState(false);
  useEffect(() => {
    setIsPrompt(isIntercept);
  }, [isIntercept]);

  return (
    <Prompt
      when={isPrompt}
      message={location => {
        Modal.confirm({
          zIndex: 2000,
          title: <Format.Title>{title}</Format.Title>,
          content,
          icon: <ExclamationCircleFilled style={{ color: 'rgb(245, 34, 45)' }} />,
          onOk: () => {
            setIsPrompt(false);
            Promise.resolve().then(() => {
              const { search, pathname } = location;
              history.push({ pathname, search });
            });
          },
          onCancel: () => {
            onCancel();
          }
        });
        return false;
      }}
    />
  );
};

export default ReactRouterPrompt;
