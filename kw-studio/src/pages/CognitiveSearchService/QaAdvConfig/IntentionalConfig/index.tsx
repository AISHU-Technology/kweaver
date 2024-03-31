import React, { useEffect, useState } from 'react';

import _ from 'lodash';
import { message } from 'antd';
import intl from 'react-intl-universal';

import emptyImg from '@/assets/images/empty.svg';
import LargeModel from '@/components/LargeModel';
import { tipModalFunc } from '@/components/TipModal';

import Empty from './Empty';
import LModel from './LModel';
import SModel from './SModel';
import { onAddEditLargeModel } from '@/pages/CognitiveSearchService/SearchConfigStep/FirstSearchResource/assistFunction';

import './style.less';

export interface IntentionConfigType {
  configData: any;
  updateConfig: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
  onUpdateTableForLarge?: (data: any) => void;
  setTestData?: (data: any) => void;
  testData?: any;
  onUpdateTableData?: (data: any) => void;
}
const IntentionConfig = (props: IntentionConfigType) => {
  const { configData, updateConfig, onNext, onPrev, testData, onUpdateTableForLarge } = props;
  const [showModel, setShowModel] = useState<string>('small');
  const [isShowEmpty, setIsShowEmpty] = useState(false);
  const [isLargeModel, setIsLargeModel] = useState(false); // 添加大模型弹窗
  const [sourceModel, setSourceModel] = useState<any>([]);
  useEffect(() => {
    onIsConfigLarge();
  }, [testData?.props?.data_all_source]);

  useEffect(() => {
    if (!configData?.intent_config?.model_type) return;
    if (['private_llm', 'openai'].includes(configData?.intent_config?.model_type)) {
      setShowModel('large');
    } else {
      setShowModel('small');
    }
  }, [configData?.intent_config?.model_type]);

  /**
   * 是否配置大模型(决定页面展示)
   */
  const onIsConfigLarge = () => {
    const allSource = testData?.props?.data_all_source;
    const largeModalConfigData = _.filter(_.cloneDeep(allSource), (item: any) =>
      ['private_llm', 'openai'].includes(item?.sub_type)
    );
    setSourceModel(largeModalConfigData);
    if (_.isEmpty(largeModalConfigData)) {
      setIsShowEmpty(true);
    }
  };

  /**
   * 确定添加
   * @param data 表单数据
   */
  const onCreateLargeModel = (data: any) => {
    const addData = onAddEditLargeModel(data, _.cloneDeep(testData));
    return addData;
  };

  const onSave = (data: any) => {
    onUpdateTableForLarge?.(data);
    setIsLargeModel(false);
    setIsShowEmpty(false);
  };

  /**
   * 取消
   */
  const onHandleCancel = () => {
    setIsLargeModel(false);
  };

  /**
   *
   * @param type 切换的类型
   * @param isTip 是否需要提示
   * @returns
   */
  const onChangeView = async (type: string, isTip: boolean) => {
    const isOk = !isTip
      ? true
      : await tipModalFunc({
          title: intl.get('cognitiveSearch.qaAdvConfig.changeModeTitle'),
          content: intl.get('cognitiveSearch.qaAdvConfig.changModeContent'),
          closable: false
        });
    if (!isOk) return;
    setShowModel(type);
    // 清空配置
    updateConfig({ intent_config: {}, ga_config: {} });
  };

  return (
    <div className="IntentionConfigRoot">
      {isShowEmpty ? (
        <Empty setIsLargeModel={setIsLargeModel} onPrev={onPrev} />
      ) : (
        <>
          {showModel === 'small' ? (
            <SModel
              configData={configData}
              updateConfig={updateConfig}
              onChangeView={onChangeView}
              onPrev={onPrev}
              onNext={onNext}
            />
          ) : (
            <LModel
              configData={configData}
              sourceModel={sourceModel}
              updateConfig={updateConfig}
              onPrev={onPrev}
              onChangeView={onChangeView}
              onNext={onNext}
            />
          )}
        </>
      )}

      <LargeModel
        visible={isLargeModel}
        onHandleCancel={onHandleCancel}
        onCreateLargeModel={onCreateLargeModel}
        onUpdateTableForLarge={onSave}
      />
    </div>
  );
};
export default IntentionConfig;
