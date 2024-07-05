import React, { useEffect, useRef, useState } from 'react';
import { Divider, Spin, message } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import Format from '@/components/Format';
import IconFont from '@/components/IconFont';
import SearchInput from '@/components/SearchInput';
import intentionService from '@/services/intention';
// import smileSvg from '@/assets/images/xiaolian.svg';
import configChange from '@/assets/images/config_change.svg';

import noResImg from '@/assets/images/noResult.svg';

import './style.less';

const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;
const TestSModel = (props: any) => {
  const { intentpoolId, onText } = props;
  const inputRef = useRef<any>(null);
  const [result, setResult] = useState<any>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string>(''); // 模型加载是否成功

  useEffect(() => {
    loadModel();
  }, [intentpoolId]);

  const loadModel = async () => {
    if (!intentpoolId) return;
    const data = {
      intentpool_id: intentpoolId
    };
    try {
      const { res } = await intentionService.loadModel(data);
      if (res?.res) {
        setLoadError('');
      }
    } catch (err) {
      setLoadError('模型初始化失败');
    }
  };

  const onRun = async () => {
    try {
      if (!intentpoolId) return message.error(intl.get('cognitiveSearch.qaAdvConfig.noIntentError'));
      // 先加载模型
      if (loadError) await loadModel();
      const query_text = inputRef?.current?.input?.value;
      const body = { query_text, intentpool_id: intentpoolId };
      setLoading(true);
      setResult('');
      const res = await intentionService.testIntentModel(body);
      if (res?.res) {
        setResult(res?.res);
        setLoading(false);
      }
      setLoading(false);
    } catch (err) {
      //
      setLoading(false);
    }
  };
  return (
    <div className="testSMallRoot kw-w-100">
      <Format.Title className="kw-mb-2">{intl.get('global.test')}</Format.Title>
      <SearchInput
        style={{ width: '100%' }}
        placeholder={intl.get('cognitiveSearch.qaAdvConfig.pleaseEnterQuery')}
        ref={inputRef}
        suffix={
          <div>
            <Divider type="vertical" />
            <IconFont className="kw-c-primary" type="icon-qidong" onClick={onRun} />
          </div>
        }
        onPressEnter={onText}
      />
      <div className="kw-mt-6 kw-flex-item-full-height">
        {loading ? (
          <div className="kw-mt-9 loading kw-center">
            <Spin indicator={antIcon} />
          </div>
        ) : result ? (
          <div>
            <Format.Text className="kw-c-text kw-mb-2">{intl.get('cognitiveSearch.qaAdvConfig.result')}</Format.Text>
            <div
              className="kw-w-100 kw-border"
              style={{ minHeight: 264, maxHeight: 600, overflowY: 'auto', background: '#fff' }}
            >
              {JSON.stringify(result)}
            </div>
          </div>
        ) : (
          <div className="no-query-box kw-center">
            <div>
              <img src={inputRef?.current?.input?.value ? noResImg : configChange} alt="" />
              <div style={{ width: 152, textAlign: 'center' }}>
                {inputRef?.current?.input?.value
                  ? intl.get('global.noResult')
                  : intl.get('cognitiveSearch.qaAdvConfig.enterQuery')}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default TestSModel;
