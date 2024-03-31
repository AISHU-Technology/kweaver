import React, { useMemo, useState, useEffect, useRef } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Button, message, Tabs } from 'antd';

import classNames from 'classnames';
import { Editor } from '@wangeditor/editor-for-react';
import moment from 'moment';
import { defaultEditorConfig } from '@/components/WangEditor/defaultConfig';
import TitleBox from '@/components/TitleBox';
import IconFont from '@/components/IconFont';
import HOOKS from '@/hooks';
import { formatTime, getParam, getTextByHtml } from '@/utils/handleFunction';
import analysisService from '@/services/analysisService';
import ServiceDrawer from '@/components/ServiceDescription';
import Type1 from './Type1';
import Type2 from './Type2';
import './style.less';

const IframeDocument = () => {
  const locationData = useMemo(() => {
    const { service_id, s_name } = getParam(['service_id', 's_name']);
    const { origin } = window.location;
    return { serviceId: service_id, sName: s_name, origin };
  }, [window.location]);

  const language = HOOKS.useLanguage();
  const [serviceData, setServiceData] = useState<any>({});
  const [appidVisible, setAppidVisible] = useState(false);
  const [appid, setAppid] = useState('');

  const [showDes, setShowDes] = useState<boolean>(false);
  const [selectMenu, setSelectMenu] = useState<string>('introduction');
  const desRef = useRef<HTMLDivElement>(null);
  const containerSize = HOOKS.useSize(desRef);

  useEffect(() => {
    const doc = document.getElementsByClassName('iframeDocumentContent')?.[0];

    const scrollDom = (e: any) => {
      const scrollHeight = window.scrollY || doc.scrollTop;
      const editor = document.getElementsByClassName('kw-c-wang-editor')?.[0];
      const desHeight = showDes ? editor?.clientHeight - 120 : 0;
      const introHeight = serviceData?.description ? 300 : 102;
      if (scrollHeight - desHeight >= introHeight) {
        setSelectMenu('apiDoc');
      } else {
        setSelectMenu('introduction');
      }
    };
    if (doc) {
      doc.addEventListener('scroll', scrollDom);

      return () => doc.removeEventListener('scroll', scrollDom);
    }
  });

  useEffect(() => {
    getData();
  }, []);

  const getData = async () => {
    try {
      const { res } = (await analysisService.analysisServiceGet(locationData.serviceId, 'ad')) || {};
      if (!res) return;
      setServiceData(_.omit(res, 'document'));
    } catch (error) {
      //
    }
  };

  /**
   * 获取appid
   * @param data appid 和 密码
   * @param type 触发类型 'get' | 'copy'
   */
  const autoGenerateAppid = (data: { appid: string }, type: string) => {
    message.success(intl.get('cognitiveService.iframeDocument.getIDSuccess'));
    setAppid(data.appid);
  };

  const openAppidModal = () => setAppidVisible(true);

  return (
    <div className="iframeDocumentRoot">
      <div className="document-menu">
        <div className="kw-c-header" style={{ height: 32, paddingLeft: 14 }}>
          {intl.get('cognitiveService.restAPI.documentMenu')}
        </div>
        <div
          className={classNames('document-menu-item', { menuSelected: selectMenu === 'introduction' })}
          onClick={() => setSelectMenu('introduction')}
        >
          <a href="#introduction"> {intl.get('cognitiveService.restAPI.productIntro')}</a>
        </div>

        <div
          className={classNames('document-menu-item', { menuSelected: selectMenu === 'apiDoc' })}
          onClick={() => setSelectMenu('apiDoc')}
        >
          <a href="#apiDoc">{intl.get('cognitiveService.iframeDocument.pCWebDescription')}</a>
        </div>
      </div>
      <div className="iframeDocumentTop">
        <div className="kw-c-header name kw-ellipsis" title={locationData.sName}>
          {locationData.sName || '--'}
        </div>
        <span className="kw-c-subtext" style={{ fontSize: 12 }}>
          ID：{locationData?.serviceId || '--'}
        </span>
      </div>
      <div className="iframeDocumentContent">
        <div style={{ maxWidth: 1000, minWidth: 1000 }}>
          <TitleBox
            id="introduction"
            text={intl.get('cognitiveService.restAPI.productIntro')}
            style={{ fontSize: 16 }}
          />
          <div className="kw-align-center kw-mt-6">
            <span
              className="kw-c-subtext kw-ellipsis"
              title={serviceData?.editor_name}
              style={{ display: 'inline-block', maxWidth: 280 }}
            >
              {serviceData?.editor_name}
            </span>
            <span className="kw-c-subtext kw-ml-1 kw-mr-1">{intl.get('exploreAnalysis.changeBy')}</span>
            <span className="kw-c-subtext">{formatTime(serviceData?.edit_time * 1000)}</span>
          </div>
          {/* 描述 */}
          {serviceData?.description && (
            <>
              <div className="kw-mb-2 kw-mt-6" style={{ maxHeight: showDes ? 'none' : 132, overflow: 'hidden' }}>
                <div ref={desRef}>
                  <Editor
                    className="kw-c-wang-editor kw-rich-text-wrap"
                    defaultConfig={{ ...defaultEditorConfig, readOnly: true }}
                    value={serviceData?.description}
                    mode="simple"
                  />
                </div>
              </div>

              <div
                className="kw-c-primary kw-pointer kw-w-100"
                style={{ textAlign: 'center', display: containerSize?.height < 132 ? 'none' : 'block' }}
                onClick={() => setShowDes(!showDes)}
              >
                {intl.get(showDes ? 'global.unExpand' : 'cognitiveService.restAPI.showMore')}

                <IconFont
                  type="icon-xiala"
                  className="kw-ml-1"
                  style={{ fontSize: 10, transform: showDes ? 'rotate(180deg)' : '' }}
                />
              </div>
            </>
          )}
          <div className="kw-mt-6">
            <TitleBox id="apiDoc" text={intl.get('cognitiveService.iframeDocument.pCWebDescription')} />
          </div>

          <div>
            <Button
              className="kw-mt-6"
              type="primary"
              ghost
              style={{ height: 40, minWidth: 120 }}
              onClick={() => openAppidModal()}
            >
              {intl.get('cognitiveService.iframeDocument.getID')}
            </Button>
            <div className="kw-mt-2 kw-c-subtext">
              <span>
                {/* 说明：APPID是数据科学家/开发者使用或调用KWeaver服务的唯一标识。通过登录KWeaver的user/appId获取KWeaver账户的APPID。详情见 */}
                {intl.get('cognitiveService.iframeDocument.appidExplain1')}
              </span>
              <span className="appid-text kw-c-primary kw-pointer" onClick={() => window.open('/swagger')}>
                {/* 获取APPID接口说明 */}
                {intl.get('cognitiveService.iframeDocument.appidExplain')}
              </span>
              <span>
                {/* 文档 */}
                {intl.get('cognitiveService.iframeDocument.appidExplain2')}
              </span>
            </div>
          </div>
          <Tabs className="kw-mt-3">
            <Tabs.TabPane tab={intl.get('cognitiveService.iframeDocument.type1')} key="1">
              <Type1 {...locationData} appid={appid} serviceData={serviceData} openAppidModal={openAppidModal} />
            </Tabs.TabPane>

            <Tabs.TabPane tab={intl.get('cognitiveService.iframeDocument.type2')} key="2">
              <Type2 {...locationData} appid={appid} />
            </Tabs.TabPane>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default IframeDocument;
