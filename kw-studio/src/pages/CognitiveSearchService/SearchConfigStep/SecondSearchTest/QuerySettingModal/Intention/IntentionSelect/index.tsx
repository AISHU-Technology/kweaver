import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Form, Select } from 'antd';
import KwSpin from '@/components/KwSpin';

import { getParam } from '@/utils/handleFunction';
import HOOKS from '@/hooks';
import _ from 'lodash';
import intl from 'react-intl-universal';

import intentionService from '@/services/intention';

import './style.less';

const IntentionSelect: React.ForwardRefRenderFunction<any, any> = (
  { operateFail, setIntentId, setLoading, intentionList, setIntentionList, testData },
  ref
) => {
  const language = HOOKS.useLanguage();
  const [form] = Form.useForm();
  const [selectIntentData, setSelectIntentData] = useState<any>([]); // 下拉框中的数据
  const [intentName, setIntentName] = useState(''); // 选择的意图名
  const [loadingQuery, setLoadingQuery] = useState(false);
  const [nameToId, setNameToId] = useState<any>({});

  useImperativeHandle(ref, () => ({
    onSave
  }));

  useEffect(() => {
    getIntentList({});
    const intentPool = testData?.props?.query_understand?.intention_recognition;
    if (operateFail) {
      setLoadingQuery(true);
      form.resetFields(); // 清空重置意图
      setIntentionList([]);
      setIntentName('');
      setLoadingQuery(false);
      return;
    }
    if (intentPool?.intent_pool_name) {
      form.setFieldsValue({ intention: intentPool?.intent_pool_name });
      setIntentName(intentPool?.intent_pool_name);
    }
    if (intentPool?.intentListTable) {
      setIntentionList(intentPool?.intentListTable);
    }
  }, [testData.props.query_understand, operateFail]);

  /**
   * 获取意图数据
   */
  const getIntentList = async (state: any) => {
    try {
      const data: any = {
        page: 1,
        size: 10000,
        order: 'desc',
        rule: 'create_time'
      };
      const { res } = await intentionService.getIntentPoolList(data);
      if (res) {
        const { res_list } = res;
        const trainSuccessList = _.filter(res_list, (item: any) => item.train_status === '训练成功');
        const idAndName = _.reduce(
          trainSuccessList,
          (pre: any, key: any) => {
            pre[key.intentpool_name] = key.intentpool_id;
            return pre;
          },
          {}
        );
        setNameToId(idAndName);
        setSelectIntentData(trainSuccessList);
      }
    } catch (err) {
      //
    }
  };

  /**
   * 下拉选择指定意图数据
   */
  const onSelectChange = async (data: any) => {
    setLoading(true);
    setIntentId(nameToId[data]);
    try {
      const { res } = await intentionService.editIntentPool({ intentpool_id: nameToId[data] });
      if (res) {
        setIntentName(res.intentpool_name);
        setIntentionList(res?.intent_entity_list);
        setLoading(false);
      }
    } catch (err) {
      //
    }
  };

  /**
   * 保存
   */
  const onSave = async () => {
    const values = await form.validateFields();
    if (typeof values.intention === 'string') {
      const intentionId = _.filter(selectIntentData, (item: any) => {
        return item.intentpool_name === values.intention;
      });

      return { intentId: intentionId?.[0]?.intentpool_id, intentName, intentionList };
    }
    return { intentId: values?.intention, intentName, intentionList };
  };

  /**
   * 搜索
   */
  const onSearch = (e: any) => {
    //
  };

  return (
    <>
      <div className={language === 'zh-CN' ? 'intention-recognition-modal-table' : 'intention-recognition-us-table'}>
        <div className={`loading-mask ${loadingQuery && 'spinning'}`}>
          <KwSpin />
        </div>
        <Form form={form}>
          <Form.Item
            name="intention"
            label={intl.get('cognitiveSearch.intentPool')}
            colon={false}
            rules={[{ required: true, message: intl.get('cognitiveSearch.intention.select') }]}
          >
            <Select
              showSearch={true}
              onSearch={onSearch}
              className="kw-ellipsis intention-select"
              placeholder={intl.get('cognitiveSearch.intention.select')}
              listHeight={128}
              onChange={onSelectChange}
              getPopupContainer={node => node?.parentElement?.parentElement || document.body}
            >
              {_.map(selectIntentData, (item: any) => {
                return (
                  <Select.Option key={item.intentpool_id} value={item.intentpool_name}>
                    {item.intentpool_name}
                  </Select.Option>
                );
              })}
            </Select>
          </Form.Item>
        </Form>
      </div>
    </>
  );
};

export default forwardRef(IntentionSelect);
