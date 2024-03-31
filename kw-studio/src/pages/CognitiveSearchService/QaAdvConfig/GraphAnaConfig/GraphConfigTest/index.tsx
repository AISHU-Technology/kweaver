import React, { useState } from 'react';
import Format from '@/components/Format';
import { Button, Select, message } from 'antd';
import _ from 'lodash';
import HOOKS from '@/hooks';
import ParamSlotConfig from './ParamSlotConfig';
import GaConfigModel from './GaConfigModel';
import ConfigGraphQuery from './ConfigGraphQuery/modal';
import intl from 'react-intl-universal';

import './style.less';
import { tipModalFunc } from '@/components/TipModal';

const GraphConfigTest = (props: any) => {
  const { graphSources, currentIntention, gaConfigData, updateGaConfig } = props;
  const [configModel, setConfigModel] = useState<{ visible: boolean; data: any }>({ visible: false, data: {} });
  const [graphVisible, setGraphVisible] = useState<boolean>(false); // 图语言配置与测试
  const [graphData, setGraphData] = useState<any>(); // 图分析配置弹窗id
  const language_zh = HOOKS.useLanguage() === 'zh-CN';
  /**
   *
   * @param e 图谱id
   */
  const onChangeGraph = (e: any) => {
    const data = _.map(gaConfigData, item => {
      if (item?.intent_name === currentIntention?.intent_name) {
        return { ...item, kg_id: e };
      }
      return item;
    });
    updateGaConfig(data);
  };

  /**
   * 配置与测试
   */
  const configAndTest = () => {
    if (!currentIntention?.kg_id) return message.error(intl.get('cognitiveSearch.qaAdvConfig.selectKgFirst'));
    // 已经配置过直接打开
    if (currentIntention?.graph_info?.statements) {
      return setGraphVisible(true);
    }
    setConfigModel({ visible: true, data: currentIntention });
  };

  /** 打开图语言配置 */
  const onGaOk = (data: any) => {
    setConfigModel({ visible: false, data: {} });
    setGraphData(data);
    setGraphVisible(true);
  };

  /** 保存图语言配置信息 */
  const onSaveGraph = (config: any) => {
    const { config_info, canvas_body } = config;
    const intentKV = _.keyBy(currentIntention?.binding_info, 'param');
    const binding_info = _.map(config_info?.params, p => {
      const { name, alias, example, param_type } = p;

      if (_.has(intentKV, name)) {
        // 已配置过的用配置过的数据
        return {
          param: name,
          slot: intentKV[name]?.slot,
          alias,
          type: param_type,
          example
        };
      }
      return { param: name, slot: '', alias, type: param_type, example };
    });

    // 是否配置完成
    const data = _.map(gaConfigData, item => {
      if (item?.intent_name === currentIntention?.intent_name) {
        return { ...item, graph_info: config_info, canvas_body, binding_info, complete_config: false };
      }
      return item;
    });
    setGraphData({});
    updateGaConfig(data);
    setGraphVisible(false);
  };

  /** 参数配置槽位 */
  const onChangeBindSlot = (record: any) => {
    const binding_info = _.map(currentIntention?.binding_info, p => {
      if (p?.param === record?.param) {
        return { ...record };
      }
      return p;
    });
    const data = _.map(gaConfigData, item => {
      if (item?.intent_name === currentIntention?.intent_name) {
        return { ...item, binding_info };
      }
      return item;
    });
    updateGaConfig(data);
  };

  /** 清空槽位配置 */
  const clearSlotConfig = async () => {
    const isOk = await tipModalFunc({
      title: intl.get('cognitiveSearch.qaAdvConfig.clearTitle'),
      content: intl.get('cognitiveSearch.qaAdvConfig.clearcontent'),
      closable: false
    });
    if (!isOk) return;
    const binding_info = _.map(currentIntention?.binding_info, p => {
      return { ...p, slot: '' };
    });
    const data = _.map(gaConfigData, item => {
      if (item?.intent_name === currentIntention?.intent_name) {
        return { ...item, binding_info, complete_config: false };
      }
      return item;
    });
    updateGaConfig(data);
  };

  /** 清空图分析配置 */
  const clearGaInfo = async () => {
    const isOk = await tipModalFunc({
      title: intl.get('cognitiveSearch.qaAdvConfig.clearTitle'),
      content: intl.get('cognitiveSearch.qaAdvConfig.clearcontent'),
      closable: false
    });
    if (!isOk) return;
    const data = _.map(gaConfigData, item => {
      if (item?.intent_name === currentIntention?.intent_name) {
        return { ...item, binding_info: [], graph_info: null, canvas_body: '', complete_config: false };
      }
      return item;
    });
    updateGaConfig(data);
  };

  /** 关闭 */
  const onCloseGraph = () => {
    // 关闭图分析配置弹窗，会触发父组件的init();
    // 直接手动更新现在的数据
    updateGaConfig(gaConfigData);
    setGraphVisible(false);
  };

  return (
    <div className="kw-flex-item-full-width graphConfigTestRoot">
      <div className="kw-mb-9">
        <Format.Title style={{ fontSize: 16 }}> {intl.get('cognitiveSearch.qaAdvConfig.gaConfigTest')} </Format.Title>
        <div className="kw-c-text-lower kw-mt-4">{intl.get('cognitiveSearch.qaAdvConfig.qaTip')}</div>
        <div className="kw-mt-6 kw-align-center">
          <span className="kw-mr-5 labelBox" style={{ width: language_zh ? 70 : 140 }}>
            {intl.get('global.graph')}
          </span>
          <Select
            style={{ width: 532 }}
            value={currentIntention?.kg_id || undefined}
            placeholder={intl.get('global.pleaseSelect')}
            onChange={onChangeGraph}
          >
            {_.map(graphSources, item => {
              return <Select.Option key={item?.kg_id}>{item?.kg_name}</Select.Option>;
            })}
          </Select>
        </div>
        <div className="kw-mt-6 kw-align-center">
          <span className="kw-mr-5 labelBox" style={{ width: language_zh ? 70 : 140 }}>
            {intl.get('cognitiveSearch.qaAdvConfig.graphConfig')}
          </span>
          <Button onClick={configAndTest}>{intl.get('cognitiveSearch.qaAdvConfig.configTest')}</Button>
          <Button className="kw-ml-3" onClick={clearGaInfo}>
            {intl.get('cognitiveSearch.qaAdvConfig.clear')}
          </Button>
        </div>
      </div>
      <ParamSlotConfig
        currentIntention={currentIntention}
        onChangeBindSlot={onChangeBindSlot}
        clearSlotConfig={clearSlotConfig}
      />
      <GaConfigModel
        visible={configModel?.visible}
        data={configModel?.data}
        onCancel={() => setConfigModel({ visible: false, data: {} })}
        onOk={(e: any) => onGaOk(e)}
      />
      <ConfigGraphQuery
        visible={graphVisible}
        graphData={graphData}
        currentIntention={currentIntention}
        onSaveGraph={onSaveGraph}
        onCancel={onCloseGraph}
      />
    </div>
  );
};
export default GraphConfigTest;
