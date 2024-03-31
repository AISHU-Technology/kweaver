import React, { useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Button, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';

import IconFont from '@/components/IconFont';
import { copyToBoard } from '@/utils/handleFunction';

import documentHtml from './document';
import { downloadDoc } from './download';

import './style.less';

const Type2 = (props: any) => {
  const { serviceId, origin, appid } = props;
  const timer = useRef<any>(null);

  const onCopyCode = async (text: string) => {
    const isSuccess = await copyToBoard(text);
    message.success(isSuccess ? intl.get('global.copySuccess') : intl.get('global.copyFail'));
  };

  const addButton = (target: any) => {
    const domCode = target.getElementsByTagName('code')?.[0];
    const span = document.createElement('span');
    span.classList.add('button_copy');
    span.onclick = () => onCopyCode(domCode.innerHTML);
    ReactDOM.createRoot(span).render(<IconFont type="icon-copy" title={intl.get('global.copy')} />);
    target.appendChild(span);
  };
  const removeButton = (target: any) => {
    const button = document.querySelector('.button_copy');
    if (button) target.removeChild(button);
  };

  useEffect(() => {
    const domCodes = document.getElementsByTagName('pre');
    _.forEach(domCodes, item => {
      item.onmouseenter = (e: any) => {
        clearTimeout(timer.current);
        timer.current = setTimeout(() => addButton(e.target), 500);
      };
      item.onmouseleave = (e: any) => {
        clearTimeout(timer.current);
        removeButton(e.target);
      };
    });
  }, []);

  return (
    <div className="type2" style={{ position: 'relative' }}>
      <div className="kw-mt-3">{intl.get('cognitiveService.iframeDocument.type2Explain')}</div>
      <Button
        type="primary"
        icon={<DownloadOutlined style={{ fontSize: 16 }} />}
        style={{ position: 'absolute', top: 49, right: 16, zIndex: 10 }}
        onClick={() => downloadDoc()}
      >
        {intl.get('cognitiveService.iframeDocument.download')}
      </Button>
      <div
        style={{ position: 'relative' }}
        dangerouslySetInnerHTML={{ __html: documentHtml({ serviceId, origin, appid }) }}
      />
    </div>
  );
};

export default Type2;
