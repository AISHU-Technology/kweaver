import React, { useMemo } from 'react';
import { Popover, Select, Slider, Empty, Alert } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import intl from 'react-intl-universal';

import Format from '@/components/Format';
import IconFont from '@/components/IconFont';
import ExplainTip from '@/components/ExplainTip';

import ModelIcon from '@/pages/ModelFactory/LLMModel/components/ModelIcon';
import VarNumberInput from '../VarNumberInput';
import { getCorrectModelOptions } from '../../utils';
import kongImg from '@/assets/images/kong.svg';
import './style.less';

import useConfigStore from '../../useConfigStore';

export interface ModelParameterConfigProps {
  className?: string;
  children?: React.ReactNode;
}

const DEFAULT_CONFIG = [
  {
    key: 'temperature',
    label: intl.get('prompt.temperature'),
    tip: intl.get('prompt.temperatureTip'),
    props: { min: 0, max: 2, defaultValue: 1, step: 0.1, precision: 2 }
  },
  {
    key: 'top_p',
    label: intl.get('prompt.top_p'),
    tip: intl.get('prompt.top_pTip'),
    props: { min: 0, max: 1, defaultValue: 1, step: 0.1, precision: 2 }
  },
  {
    key: 'presence_penalty',
    label: intl.get('prompt.presence_penalty'),
    tip: intl.get('prompt.presence_penaltyTip'),
    props: { min: -2, max: 2, defaultValue: 0, step: 0.1, precision: 2 }
  },
  {
    key: 'frequency_penalty',
    label: intl.get('prompt.frequency_penalty'),
    tip: intl.get('prompt.frequency_penaltyTip'),
    props: { min: -2, max: 2, defaultValue: 0, step: 0.1, precision: 2 }
  },
  {
    key: 'max_tokens',
    label: intl.get('prompt.max_tokens'),
    tip: intl.get('prompt.max_tokensTip'),
    props: { min: 10, max: 8192, defaultValue: 16, step: 1, precision: 0 }
  }
];

/**
 * 模型配置气泡卡片
 */
const ModelParameterConfig = (props: any) => {
  const { className, children } = props;
  const { configStore, setConfigStore } = useConfigStore();
  const { modelList, modelData, modelOptions, promptInfo } = configStore;
  const CONFIG_ROWS = useMemo(() => {
    const modelParams = modelData.model_para || {};
    return _.map(DEFAULT_CONFIG, item => {
      const [min = item.props.min, max = item.props.max, defaultValue = item.props.defaultValue] =
        modelParams[item.key] || [];
      const curProps = { min, max, defaultValue };
      return { ...item, props: { ...item.props, ...curProps } };
    });
  }, [modelData]);
  const shouldSelectedModels = useMemo(() => {
    return promptInfo.prompt_type === 'chat'
      ? _.filter(modelList, item => item.model_type === promptInfo.prompt_type)
      : modelList;
  }, [modelList, promptInfo.prompt_type]);

  const isShowTokenWarning = () => {
    const tokenConfig = CONFIG_ROWS.find(item => item.key === 'max_tokens');
    if (!tokenConfig) return false;
    return modelOptions.max_tokens / tokenConfig.props.max > 2 / 3;
  };

  const handleModelChange = (data: any) => {
    if (!data) return;
    const newOptions = getCorrectModelOptions(modelOptions, data.model_para);
    const newInfo = { ...promptInfo, model_id: data.model_id };
    setConfigStore(pre => ({ ...pre, modelData: data, modelOptions: newOptions, promptInfo: newInfo }));
  };

  const handleValueChange = (key: string, value: any) => {
    const newData = { ...modelOptions, [key]: value };
    setConfigStore(pre => ({ ...pre, modelOptions: newData }));
  };

  return (
    <Popover
      overlayClassName="mf-model-parameter-config-popover"
      trigger={['click']}
      placement="bottomRight"
      content={
        <div className={classNames(className, 'mf-model-parameter-config')}>
          <div className="parameter-header kw-align-center kw-mb-4">
            <IconFont type="icon-color-zidingyi" />
            <Format.Title className="kw-ml-2"> {intl.get('prompt.modelConfig')}</Format.Title>
          </div>
          <div className="kw-c-header kw-mb-2">{intl.get('prompt.llmModel')}</div>
          <Select
            className="kw-w-100 kw-mb-3"
            value={modelData.model_id}
            placeholder={intl.get('global.pleaseSelect')}
            showSearch
            getPopupContainer={triggerNode => triggerNode?.parentElement || document.body}
            onChange={(__, option: any) => handleModelChange(option.data)}
            optionFilterProp="label"
            notFoundContent={<Empty image={kongImg} description={intl.get('global.noData')} />}
          >
            {_.map(shouldSelectedModels, item => {
              const { model_id, model_name, model_series } = item;
              return (
                <Select.Option key={model_id} value={model_id} data={item} label={model_name}>
                  <div className="kw-align-center">
                    <ModelIcon size={16} type={model_series} />
                    <div className="kw-flex-item-full-width kw-pl-2 kw-ellipsis">{model_name}</div>
                  </div>
                </Select.Option>
              );
            })}
          </Select>
          {_.map(CONFIG_ROWS, config => {
            const { key, label, tip, props } = config;
            return (
              <React.Fragment key={key}>
                <div>
                  <span className="kw-c-header">{label}</span>
                  <ExplainTip title={tip} />
                </div>
                <div className="kw-align-center">
                  <Slider
                    className="kw-flex-item-full-width"
                    {..._.pick(props, 'min', 'max', 'step', 'defaultValue')}
                    value={modelOptions[key]}
                    onChange={value => handleValueChange(key, value)}
                  />
                  <VarNumberInput
                    className="kw-ml-4"
                    size="small"
                    {...props}
                    value={modelOptions[key]}
                    onChange={value => handleValueChange(key, value)}
                  />
                </div>
              </React.Fragment>
            );
          })}
          {isShowTokenWarning() && (
            <Alert
              className="token-alert kw-mt-3"
              message={intl.get('prompt.tokenWaring')}
              type="warning"
              showIcon
              style={{ backgroundColor: '#fffbe6', borderColor: '#fffbe6' }}
            />
          )}
        </div>
      }
    >
      {children}
    </Popover>
  );
};

export default ModelParameterConfig;
