import React, { useRef, useState } from 'react';
import { Select, Divider, Spin, message } from 'antd';
import _ from 'lodash';
import { LoadingOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import Format from '@/components/Format';
import SearchInput from '@/components/SearchInput';
import IconFont from '@/components/IconFont';
import searchServices from '@/services/cognitiveSearch';

// import smileSvg from '@/assets/images/xiaolian.svg';
import configChange from '@/assets/images/config_change.svg';

import noResImg from '@/assets/images/noResult.svg';
import { intentConfig } from '../assistant';

import './style.less';
const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;
const TestLModel = (props: any) => {
  const { sourceModel, modelConfig, intentList, onTextCheck } = props;
  const inputRef = useRef<any>(null);
  const [result, setResult] = useState<any>('');
  const [loading, setLoading] = useState<boolean>(false);

  /** 测试 */
  const onText = async () => {
    const data = await onTextCheck();
    if (!data) return;
    try {
      const modelKV = _.keyBy(sourceModel, 'sub_type');
      const selectModel = modelKV?.[data?.model_type];
      let llm_config: any = '';
      if (data?.model_type === 'openai') {
        const { api_type, api_version, api_endpoint, api_key, model } = selectModel?.model_conf;
        llm_config = {
          model_type: data?.model_type,
          openai_api_type: api_type,
          openai_api_version: api_version,
          openai_api_endpoint: api_endpoint,
          openai_api_key: api_key,
          model_name: model
        };
      }
      if (data?.model_type === 'private_llm') {
        const { api_endpoint, model } = selectModel?.model_conf;
        llm_config = {
          model_type: data?.model_type,
          openai_api_endpoint: api_endpoint,
          model_name: model
        };
      }
      const body = {
        query: inputRef?.current?.input.value,
        llm_config,
        intent_prompt: data?.intent_prompt,
        entity_prompt: data?.entity_prompt,
        intent_config: intentConfig(intentList)
      };
      setLoading(true);
      setResult('');
      const res = await searchServices.testPrompt(body);
      if (res?.res) {
        setResult(res?.res);
      }
      setLoading(false);
    } catch (err) {
      const { Description } = err?.response || err?.data || err || {};

      message.error(Description);
      setLoading(false);
    }
  };

  return (
    <div className="testLMallRoot kw-flex-column kw-w-100">
      <Format.Title>{intl.get('global.test')}</Format.Title>
      <div className="kw-flex kw-mt-2">
        <SearchInput
          style={{ width: '100%' }}
          placeholder={intl.get('cognitiveSearch.qaAdvConfig.pleaseEnterQuery')}
          ref={inputRef}
          suffix={
            <div>
              <Divider type="vertical" />
              <IconFont className="kw-c-primary" type="icon-qidong" onClick={onText} />
            </div>
          }
          onPressEnter={onText}
        />
      </div>
      <div className="kw-mt-6 kw-w-100 kw-flex-item-full-height">
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
            <img src={inputRef?.current?.input?.value ? noResImg : configChange} alt="" />
            <div style={{ width: 152, textAlign: 'center' }}>
              {inputRef?.current?.input?.value
                ? intl.get('global.noResult')
                : intl.get('cognitiveSearch.qaAdvConfig.enterQuery')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestLModel;
