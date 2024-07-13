import React, { useEffect, useState } from 'react';
import { Button, message } from 'antd';
import _ from 'lodash';
import intl from 'react-intl-universal';

import servicesPermission from '@/services/rbacPermission';

import LeftIntention from './LeftIntention';
import GraphConfigTest from './GraphConfigTest';
import { tipModalFunc } from '@/components/TipModal';

import './style.less';

const GraphAnaConfig = (props: any) => {
  const { graphSources, configData, updateConfig, onPrev, onNext } = props;
  const [gaConfigData, setGaConfigData] = useState<any>([]); // 图分析配置的数据
  const [currentIntention, setCurrentIntention] = useState<any>({}); // 选择的意图

  useEffect(() => {
    init();
  }, [JSON.stringify(configData?.intent_config)]);

  /**
   * 初始化意图列表
   */
  const init = async () => {
    const intentBindKV = _.keyBy(configData?.ga_config?.intent_binding, 'intent_name');
    const intentList = configData?.intent_config?.intent_list || [];
    const kgId = _.map(configData?.ga_config?.intent_binding, item => String(item?.kg_id));
    const hasAuthKg = await getKgAuth(kgId); // 获取有权限并存在的资源id

    const data = _.map(intentList, item => {
      if (_.has(intentBindKV, item?.intent)) {
        const { kg_id } = intentBindKV[item?.intent];
        const error = kg_id ? !_.includes(hasAuthKg, kg_id) : false;
        return { ...intentBindKV[item?.intent], error };
      }
      return { intent_name: item?.intent, binding_info: [], graph_info: null, kg_id: '', canvas_body: '' };
    });
    setCurrentIntention({ ...data?.[0], slots: intentList?.[0]?.slots });
    setGaConfigData(data);
  };

  /** 获取配置过图谱的权限
   * 资源是否被删除
   */
  const getKgAuth = async (dataIds: any[]) => {
    // 查询权限
    const uniqId = _.uniq(_.filter(dataIds, item => !!item));
    const resourceId = _.map(graphSources, item => item?.kg_id);
    // const result = await servicesPermission.dataPermission(postData);
    // if (result?.res) {
    //   const codesData = _.keyBy(result?.res, 'dataId');
    //   const resultKg = _.filter(uniqId, item => {
    //     const hasAuth = _.includes(codesData?.[item]?.codes, 'KG_VIEW');
    //     const existKg = _.includes(resourceId, parseInt(item)) || _.includes(resourceId, item);

    //     return hasAuth && existKg;
    //   });
    //   return resultKg;
    // }
    return [];
  };

  const getSlots = (name: string) => {
    const slots = _.find(configData?.intent_config?.intent_list, item => item?.intent === name)?.slots || [];
    return slots;
  };

  const updateGaConfig = (data: any) => {
    const intent = _.find(data, item => item?.intent_name === currentIntention?.intent_name);
    const slots = getSlots(currentIntention?.intent_name);
    setCurrentIntention({ ...intent, slots });
    setGaConfigData(data);
  };

  /**
   * @param data 当前意图
   *  没有语句 未配置
   *  有语句无参数 配置完成
   *  有参数没绑定槽位未完成
   */
  const isFinish = (data: any) => {
    if (!data?.graph_info?.statements) {
      return false;
    } else if (_.isEmpty(data?.binding_info) && data?.graph_info?.params?.length > 0) {
      return false;
    }
    return _.every(data?.binding_info, i => i?.slot && i.param);
  };

  /** 切换至别的意图时判断配置完毕 */
  const onChangeIntent = (intent: any) => {
    const complete_config = isFinish(currentIntention);
    const data = _.map(gaConfigData, item => {
      if (item?.intent_name === currentIntention?.intent_name) {
        return { ...item, complete_config };
      }
      return item;
    });
    const slots = getSlots(intent?.intent_name);
    setGaConfigData(data);
    setCurrentIntention({ ...intent, slots });
  };

  /** 清除配置 */
  const onClear = async (selected: string[]) => {
    const isOk = await tipModalFunc({
      title: intl.get('cognitiveSearch.qaAdvConfig.clearTitle'),
      content: intl.get('cognitiveSearch.qaAdvConfig.clearcontent'),
      closable: false
    });
    if (!isOk) return;
    const data = _.map(gaConfigData, item => {
      if (_.includes(selected, item?.intent_name)) {
        return { ...item, binding_info: [], graph_info: null, canvas_body: '', kg_id: '', complete_config: false };
      }
      return item;
    });
    updateGaConfig(data);
  };

  /** 校验是否有完整配置的意图 */
  const checkHasConfig = () => {
    const result = _.some(gaConfigData, item => {
      // 只有语句无参数
      const noParams = !!item?.graph_info?.statements && item.graph_info?.params?.length === 0;
      // 有参数需绑定槽位
      const hasBind = item.graph_info?.params?.length > 0 && _.every(item?.binding_info, b => b?.slot);
      return noParams || hasBind;
    });

    return result;
  };

  /**
   * 上一步
   * 需要更新配置信息
   * */
  const onClickPrev = () => {
    const complete_config = isFinish(currentIntention);
    const data = _.map(gaConfigData, item => {
      if (item?.intent_name === currentIntention?.intent_name) {
        return { ...item, complete_config };
      }
      return item;
    });
    updateConfig({ ga_config: { intent_binding: data } });
    setGaConfigData(data);
    onPrev();
  };

  /**
   * 下一步
   * 更新图分析配置的信息
   */
  const onClickNext = () => {
    const hasConfig = checkHasConfig();
    if (!hasConfig) return message.error(intl.get('cognitiveSearch.qaAdvConfig.complateOne'));
    const complete_config = isFinish(currentIntention);
    const data = _.map(gaConfigData, item => {
      if (item?.intent_name === currentIntention?.intent_name) {
        return { ...item, complete_config };
      }
      return item;
    });
    setGaConfigData(data);
    updateConfig({ ga_config: { intent_binding: data } });
    onNext();
  };
  return (
    <div className="graphAnalysisConfigRoot">
      <div className="config-content kw-flex">
        <LeftIntention
          gaConfigData={gaConfigData}
          currentIntention={currentIntention}
          onChangeIntent={onChangeIntent}
          onClear={(data: string[]) => onClear(data)}
        />
        <GraphConfigTest
          graphSources={graphSources}
          currentIntention={currentIntention}
          gaConfigData={gaConfigData}
          updateGaConfig={updateGaConfig}
          onClear={(data: string[]) => onClear(data)}
        />
      </div>
      <div className="config-footer kw-center">
        <div>
          <Button onClick={onClickPrev}>{intl.get('global.previous')}</Button>
          <Button className="kw-ml-2" type="primary" onClick={onClickNext}>
            {intl.get('global.next')}
          </Button>
        </div>
      </div>
    </div>
  );
};
export default GraphAnaConfig;
