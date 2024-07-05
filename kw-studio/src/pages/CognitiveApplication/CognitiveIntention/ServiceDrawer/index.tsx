import React, { useState, memo } from 'react';
import { Drawer } from 'antd';
import intl from 'react-intl-universal';

import IconFont from '@/components/IconFont';
import _ from 'lodash';

import './style.less';
import HOOKS from '@/hooks';
import { onGoLang, onPython, onPythonExample, onJava, onDocument } from './assistFunction';

export interface ServiceDrawerType {
  isDrawer: boolean;
  setIsDrawer: any;
  serviceData: any;
  apiDrawer?: string;
}

function ServiceDrawer(props: ServiceDrawerType) {
  const { isDrawer, setIsDrawer, serviceData, apiDrawer } = props;
  const { width: widthScreen } = HOOKS.useWindowSize(); // 屏幕宽度
  const [tabKey, setTabKey] = useState<'go' | 'python' | 'java'>('go');
  const onChange = (key: any) => {
    setTabKey(key);
  };

  return (
    <Drawer
      open={isDrawer}
      closable={false}
      className="service-drawer"
      title={
        <div
          className="title-modal kw-ellipsis"
          title={apiDrawer === 'key' ? intl.get('cognitiveService.restAPI.keyDes') : serviceData?.name}
        >
          {apiDrawer === 'key' ? intl.get('cognitiveService.restAPI.keyDes') : serviceData?.name}
        </div>
      }
      mask={false}
      placement="right"
      width={
        apiDrawer === 'api' || apiDrawer === 'key'
          ? widthScreen !== 0 && widthScreen <= 1247
            ? 'calc(100% - 0px)'
            : '1247px'
          : widthScreen !== 0 && widthScreen <= 1335
          ? 'calc(100% - 213px)'
          : '1247px'
      }
      onClose={() => setIsDrawer(false)}
      extra={<IconFont type="icon-guanbiquxiao" className="drawer-close" onClick={() => setIsDrawer(false)}></IconFont>}
      footer={null}
    >
      <div className="drawer-line kw-mb-6"></div>
      {apiDrawer === 'key' ? (
        <div>
          <div className="key-title kw-mb-4">{intl.get('cognitiveService.restAPI.introduce')}</div>
          <div>{intl.get('cognitiveService.restAPI.authentication')}</div>
          <div>
            {' '}
            {intl.get('cognitiveService.restAPI.appId')}
            {intl.get('cognitiveService.restAPI.only')}
          </div>
          <div> {intl.get('cognitiveService.restAPI.appKey')}</div>
          <div className="key-example">{intl.get('cognitiveService.restAPI.use')}</div>
          <pre>{onDocument()}</pre>
          <div className="key-algorithm kw-mb-5">{intl.get('cognitiveService.restAPI.generation')}</div>
          <div className="kw-mb-4">
            <span
              onClick={() => onChange('go')}
              className={`${tabKey === 'go' ? 'black-color' : 'grey-color'} kw-pr-3 kw-mr-3 go-border kw-pointer`}
            >
              Golang
            </span>
            <span
              onClick={() => onChange('python')}
              className={`${tabKey === 'python' ? 'black-color' : 'grey-color'} kw-pointer`}
            >
              Python
            </span>
            <span
              onClick={() => onChange('java')}
              className={`${tabKey === 'java' ? 'black-color' : 'grey-color'} kw-ml-3 kw-pl-3 kw-pointer java-border`}
            >
              JavaScript
            </span>
          </div>
          {tabKey === 'go' && (
            <div className="app-key">
              <pre>{onGoLang()}</pre>
            </div>
          )}
          {tabKey === 'python' && (
            <>
              <pre className="app-key">{onPython()}</pre>
              <div className="kw-mt-5 kw-mb-4">{intl.get('cognitiveService.restAPI.example')}</div>
              <pre className="app-key">{onPythonExample()}</pre>
            </>
          )}
          {tabKey === 'java' && <pre className="app-key">{onJava()}</pre>}
        </div>
      ) : (
        <div
          className="drawer-content-head kw-rich-text-wrap"
          dangerouslySetInnerHTML={{ __html: serviceData?.description }}
        ></div>
      )}
    </Drawer>
  );
}

export default memo(ServiceDrawer);
