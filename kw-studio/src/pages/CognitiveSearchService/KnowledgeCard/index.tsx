import React, { useState, useEffect, useMemo, useReducer } from 'react';
import { Button, message } from 'antd';
import _ from 'lodash';
import intl from 'react-intl-universal';
import TopStep from '@/components/TopSteps';
import TipModal, { tipModalFunc } from '@/components/TipModal';

import BlockSource from './BlockSource';
import BlockComponents from './BlockComponents';
import BlockPreview from './BlockPreview';
import BlockConfig from './BlockConfig';
import OntoPreview from './components/OntoPreview';
import configEmpty from '@/assets/images/strategyEmpty.svg';
import './style.less';

import { SavedConfigs } from './types';
import KNOWLEDGE_CARD from './enums';
import { getSortedComponents, isConfigChanged } from './utils';
import { verifyComponents } from './validator';
import { initState, cardReduce, CardProvider } from './useCard';
import AdExitBar from '@/components/AdExitBar/AdExitBar';

export interface KnowledgeCardProps {
  type: 'card' | 'recommend' | string;
  knwId: number;
  data: SavedConfigs;
  graphSources?: any[];
  testOptions?: any;
  externalModel?: any[]; // 外接模型
  onExit?: () => void;
  onSave?: (data: SavedConfigs) => void;
}

const KnowledgeCard = (props: KnowledgeCardProps) => {
  const { type, knwId, data, graphSources, testOptions, externalModel, onExit, onSave } = props;
  const [card, dispatch] = useReducer(cardReduce, _.cloneDeep(initState));
  const store = useMemo(() => ({ state: card, dispatch }), [card]);

  const [ontoPreviewVisible, setOntoPreviewVisible] = useState(false); // 本体预览界面可见性
  const [existVisible, setExistVisible] = useState(false); // 退出弹窗

  // 外部是真条件渲染可以这样写
  useEffect(() => {
    dispatch({
      batch: true,
      data: {
        knwId,
        configType: type,
        savedData: [...(data || [])],
        graphSources: [...(graphSources || [])],
        testOptions,
        externalModel
      }
    });
  }, []);

  /**
   * 点击退出, 退出前通知外部组件保存
   */
  const handleExit = async () => {
    if (isConfigChanged(card.configs)) {
      return setExistVisible(true);
    }
    confirmExist(true);
  };

  /**
   * 确认退出
   * @param saved 是否已保存
   */
  const confirmExist = (saved: boolean) => {
    if (saved) {
      onSave?.(card.savedData);
      onExit?.();
      return;
    }
    const savedData = handleSave();
    if (!savedData) return setExistVisible(false);
    onSave?.(savedData);
    onExit?.();
  };

  /**
   * 点击查看本体
   */
  const onViewOntology = () => {
    setOntoPreviewVisible(true);
  };

  /**
   * 清除配置
   */
  const onClear = async () => {
    const isOk = await tipModalFunc({
      title: intl.get('knowledgeCard.clearTitle'),
      content: intl.get('knowledgeCard.clearTip'),
      closable: false
    });
    if (!isOk) return;
    const { savedData, configs, selectedGraph, configType } = card;
    dispatch({
      key: 'configs',
      data: KNOWLEDGE_CARD.getDefaultConfig(
        configType,
        configType === 'card' ? { title: configs.node.default_tag } : undefined
      )
    });
    // 如果已配置的数据中包含, 也要删除
    if (!selectedGraph) return;
    const boolKey = selectedGraph.kg_id + configs.node.name;
    const configuredIndex = _.findIndex(savedData, d => d.kg_id + d.entity === boolKey);
    if (configuredIndex === -1) return;
    const updateData = [...savedData];
    updateData.splice(configuredIndex, 1);
    dispatch({ key: 'savedData', data: updateData });
  };

  /**
   * 保存, 这里的保存不会通知外部组件, 以减少外部更新次数
   */
  const handleSave = () => {
    const { savedData, configs, selectedGraph } = card;
    if (!selectedGraph || !configs.node) return;
    const components = getSortedComponents(configs.components, configs.sort);

    // 校验
    const { components: verifiedComponents, firstErrorIndex } = verifyComponents(components);
    const activeIndex = _.findIndex(verifiedComponents, c => c.id === configs.activeID);
    if (firstErrorIndex > -1) {
      message.error(intl.get('knowledgeCard.cardError'));
      const activeID = _.isEmpty(verifiedComponents[activeIndex].error)
        ? verifiedComponents[firstErrorIndex].id
        : configs.activeID;
      dispatch({
        key: 'configs',
        data: { activeID, components: verifiedComponents }
      });
      return;
    }

    const data = {
      kg_id: selectedGraph.kg_id,
      entity: configs.node.name,
      components: _.map(
        components,
        c => _.cloneDeep({ ..._.omit(c, 'id', 'error'), kg_id: selectedGraph.kg_id }) as any
      )
    } as SavedConfigs[number];
    const updateIndex = _.findIndex(savedData, d => d.kg_id + d.entity === data.kg_id + data.entity);
    const updateData = [...savedData];
    if (updateIndex > -1) {
      updateData[updateIndex] = data;
    } else {
      updateData.push(data);
    }
    dispatch({ key: 'savedData', data: updateData });
    dispatch({ key: 'configs', data: { components, componentsCache: _.cloneDeep(components) } }); // 更新缓存
    message.success(intl.get('global.saveSuccess'));
    return updateData;
  };

  return (
    <div className="knowledgeCardRoot">
      {/* <TopStep
        isHideStep
        title={type === 'card' ? intl.get('knowledgeCard.cardConfigT') : intl.get('knowledgeCard.recommendConfigT')}
        exitText={intl.get('global.back')}
        onExit={handleExit}
      /> */}
      <AdExitBar
        style={{ height: 48 }}
        onExit={handleExit}
        title={type === 'card' ? intl.get('knowledgeCard.cardConfigT') : intl.get('knowledgeCard.recommendConfigT')}
      />
      <div className="knowledgeCardContainer">
        <CardProvider value={store}>
          <BlockSource triggerSave={handleSave} />
          <BlockComponents />
          <div className="kw-flex-item-full-width" style={{ position: 'relative' }}>
            <BlockPreview />
            <div className="config-op-btn">
              <Button onClick={onClear}>{intl.get('knowledgeCard.clearBtn')}</Button>
              <Button type="primary" onClick={handleSave}>
                {intl.get('global.save')}
              </Button>
            </div>
          </div>
          {!!card.configs?.activeID && (
            <BlockConfig key={card.configs?.node?.name + card.configs?.activeID} onViewOntology={onViewOntology} />
          )}
        </CardProvider>

        {/* 空白引导 */}
        {!card.configs?.node?.name && (
          <div className="empty-tip kw-center">
            <div className="kw-flex">
              <img src={configEmpty} alt="empty" style={{ width: 'auto' }} />
              <div className="kw-ml-8">
                {KNOWLEDGE_CARD.getEmptyTip(type).map((text, index) => (
                  <div key={index} className="kw-c-subtext" style={{ lineHeight: '32px' }}>
                    {text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 本体预览 */}
        <OntoPreview
          visible={ontoPreviewVisible}
          ontoData={card.selectedGraph}
          onClose={() => setOntoPreviewVisible(false)}
        />
      </div>

      <TipModal
        title={intl.get('knowledgeCard.changedTipTitle')}
        content={intl.get('knowledgeCard.changedTip')}
        okText={intl.get('global.save')}
        visible={existVisible}
        onOk={() => confirmExist(false)}
        onCancel={() => setExistVisible(false)}
        extractBtn={<Button onClick={() => onExit?.()}>{intl.get('global.notSave')}</Button>}
      />
    </div>
  );
};

export default KnowledgeCard;
