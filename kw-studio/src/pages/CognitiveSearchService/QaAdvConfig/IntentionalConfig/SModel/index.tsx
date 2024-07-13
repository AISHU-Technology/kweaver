import React, { useEffect, useState } from 'react';
import { Button, Select, message } from 'antd';
import _ from 'lodash';
import intl from 'react-intl-universal';
import intentionService from '@/services/intention';
import { tipModalFunc } from '@/components/TipModal';

import RenderStep from '../../components/RenderStep';
import './style.less';
import { IntentionConfigType } from '..';
import TestSModel from './Test';
import { getIntionListByFile } from '../assistant';
import IntentTable from './IntentTable';

interface SModelType extends IntentionConfigType {
  onChangeView: (type: string, data: any) => void;
}

const SModel = (props: SModelType) => {
  const { configData, updateConfig, onChangeView, onPrev, onNext } = props;
  const [IntentList, setIntentList] = useState<any[]>([]); // 意图列表
  const [slotsList, setSlotsList] = useState<any[]>([]);
  const [intentId, setIntentId] = useState<number | string>('');

  const leftstep = [
    { label: 1, height: 62 },
    { label: 2, height: 0 }
  ];

  useEffect(() => {
    getIntentList();
  }, []);

  useEffect(() => {
    setIntentId(configData?.intent_config?.intent_pool_id);
    getSlotList(configData?.intent_config?.intent_pool_id);
  }, [configData?.intent_config?.intent_pool_id]);

  const getIntentList = async () => {
    try {
      const body = { page: 1, size: 1000, order: 'desc', rule: 'create_time', filter_status: '训练成功' };
      const { res } = await intentionService.getIntentPoolList(body);
      if (res) {
        const { res_list } = res;
        setIntentList(res_list);
      }
    } catch (err) {
      //
    }
  };

  const changeIntention = async (key: any) => {
    const isChange = !_.isEmpty(configData?.ga_config?.intent_binding) && intentId;
    const isOk = isChange
      ? await tipModalFunc({
          title: intl.get('cognitiveSearch.qaAdvConfig.changeIntentTitle'),
          content: intl.get('cognitiveSearch.qaAdvConfig.changeIntentContent'),
          closable: false
        })
      : true;
    if (!isOk) return;
    updateConfig({ ga_config: {} }); // 清空配置
    getSlotList(key);
    setIntentId(key);
  };

  const getSlotList = async (id: number) => {
    if (!id) return;
    try {
      const { res } = await intentionService.editIntentPool({ intentpool_id: id });
      if (res) {
        const intentEntityList = getIntionListByFile(res?.intent_entity_list);

        setSlotsList(intentEntityList);
        const intent_list = _.map(intentEntityList, item => {
          const slots = _.map(item?.entity_name, i => ({ name: i }));
          return { intent: item?.intent_name, slots };
        });
        updateConfig({
          intent_config: {
            intent_pool_id: id,
            model_type: 'default',
            intent_list
          }
        });
      }
    } catch (err) {
      //
    }
  };

  /**
   * 下一步
   */
  const handleNext = () => {
    if (!intentId) return message.error(intl.get('cognitiveSearch.qaAdvConfig.noIntentError'));
    onNext();
  };

  return (
    <div className="configSModelRoot">
      <div className="kw-flex kw-w-100" style={{ height: 'calc(100% - 56px)' }}>
        <div className="sModelLeft kw-flex">
          {/* 步骤条 */}
          <div className="kw-mr-6">
            {leftstep?.map(item => {
              return <RenderStep key={item?.label} index={item?.label} height={item?.height} />;
            })}
          </div>
          <div className="kw-flex-item-full-width">
            <div>
              <div className="kw-space-between kw-mb-2" style={{ width: 432, whiteSpace: 'nowrap' }}>
                <span>
                  <span className="kw-c-error">*</span>
                  {intl.get('cognitiveSearch.qaAdvConfig.noIntentError')}
                </span>
                <span className="kw-c-primary kw-pointer kw-ml-2" onClick={() => onChangeView('large', !!intentId)}>
                  {intl.get('cognitiveSearch.qaAdvConfig.switchLModel')}
                </span>
              </div>
              <Select
                placeholder={intl.get('global.pleaseSelect')}
                style={{ width: 432 }}
                value={intentId}
                onChange={changeIntention}
              >
                {_.map(IntentList, item => {
                  return (
                    <Select.Option key={item?.intentpool_id} value={item?.intentpool_id}>
                      {item.intentpool_name}
                    </Select.Option>
                  );
                })}
              </Select>
            </div>
            <IntentTable slotsList={slotsList} />
          </div>
        </div>
        {/* 测试 */}
        <div className="sModelTest">
          <TestSModel intentpoolId={intentId} />
        </div>
      </div>

      <div className="config-footer kw-center">
        <div>
          <Button onClick={onPrev}>{intl.get('global.cancel')}</Button>
          <Button className="kw-ml-2" type="primary" onClick={handleNext}>
            {intl.get('global.next')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SModel;
