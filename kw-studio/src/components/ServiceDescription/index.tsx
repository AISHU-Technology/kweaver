import React, { useState } from 'react';
import intl from 'react-intl-universal';
import { Divider } from 'antd';
import moment from 'moment';
import { Editor } from '@wangeditor/editor-for-react';
import { defaultEditorConfig } from '@/components/WangEditor/defaultConfig';
import '@wangeditor/editor/dist/css/style.css'; // 引入编辑器css
import IconFont from '@/components/IconFont';
import HOOKS from '@/hooks';
import { onGoLang, onPython, onPythonExample, onJava, onDocument } from './assistFunction';
import './style.less';

type ServiceDesType = {
  setIsDrawer: any;
  serviceData: any;
  apiDrawer?: string;
};

const ServiceDescription = (props: ServiceDesType) => {
  const { setIsDrawer, serviceData, apiDrawer } = props;
  const { width: widthScreen } = HOOKS.useWindowSize(); // 屏幕宽度
  const [tabKey, setTabKey] = useState<'go' | 'python' | 'java'>('go');
  const onChange = (key: any) => {
    setTabKey(key);
  };
  return (
    <div className="kw-h-100 kw-w-100 serviceDescriptionRoot">
      <div className="kw-border-b kw-align-center serviceDesHeader">
        <span className="kw-pointer" onClick={() => setIsDrawer(false)}>
          <IconFont type="icon-shangfanye" style={{ transform: 'translateY(1px)' }} />
          <span className="kw-ml-2 kw-mr-2 ">{intl.get('global.exit')}</span>
        </span>
        <Divider type="vertical" />
        <span className="kw-ml-2">
          {apiDrawer === 'key' ? intl.get('cognitiveService.restAPI.keyDes') : intl.get('exploreAnalysis.detailDesc')}
        </span>
      </div>
      <div className=" serviceDesContent">
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
          <div>
            <div className="kw-c-header serviceTitle">{serviceData?.name}</div>
            <div className="kw-align-center">
              <span
                className="kw-c-subtext kw-ellipsis"
                title={serviceData?.editor_name}
                style={{ display: 'inline-block', maxWidth: 280 }}
              >
                {serviceData?.editor_name}
              </span>
              <span className="kw-c-subtext kw-ml-1 kw-mr-1">{intl.get('exploreAnalysis.changeBy')}</span>
              <span className="kw-c-subtext">{serviceData?.edit_time}</span>
            </div>
            <div style={{ paddingTop: 40 }}>
              <Editor
                className="kw-c-wang-editor kw-rich-text-wrap"
                defaultConfig={{ ...defaultEditorConfig, readOnly: true }}
                value={serviceData?.description}
                mode="simple"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default ServiceDescription;
