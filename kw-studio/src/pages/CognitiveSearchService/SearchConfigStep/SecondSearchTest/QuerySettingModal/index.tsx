import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { ConfigProvider, Button, Modal, message } from 'antd';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { getParam } from '@/utils/handleFunction';
import { knowModalFunc } from '@/components/TipModal';
import UniversalModal from '@/components/UniversalModal';

import intentionService from '@/services/intention';
import Intention from './Intention';
import './style.less';

export const QuerySettingContent = forwardRef((props: any, ref) => {
  const {
    onHandleCancel,
    testData,
    visible,
    setTestData,
    checked,
    onSaveDefault,
    operateFail,
    setOperateFail,
    setOperateSave
  } = props;
  const saveRef = useRef<any>(null);
  const [radioOpen, setRadioOpen] = useState(0);
  const [intentId, setIntentId] = useState(0); // 意图池id

  useImperativeHandle(ref, () => ({
    handleOk
  }));

  useEffect(() => {
    if (visible && testData?.props?.query_understand?.intention_recognition?.intent_pool_id) {
      onSelectChange(testData);
    }
  }, [visible]);

  /**
   * 获取指定意图数据
   */
  const onSelectChange = async (test: any) => {
    const data = _.cloneDeep(test);
    const intentionEdit = data?.props?.query_understand?.intention_recognition;
    try {
      const { res } = await intentionService.editIntentPool({
        intentpool_id: intentionEdit.intent_pool_id
      });
      if (res?.train_status !== '训练成功') {
        message.error(intl.get('cognitiveSearch.intention.saveFail'));
        setOperateFail(true);
      }
    } catch (err) {
      if (err?.ErrorDetails?.[0]?.detail.includes('does not exist')) {
        message.error(intl.get('cognitiveSearch.intention.saveFail'));
        setOperateFail(true);
      }
    }
  };

  /**
   * 获取意图数据
   */
  const getIntentList = async () => {
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
        const trainSuccessList: any = [];
        _.map(res_list, (item: any) => {
          if (item.train_status === '训练成功') {
            trainSuccessList.push(item.intentpool_name);
          }
        });
        return trainSuccessList;
      }
    } catch (err) {
      return [];
    }
  };

  /**
   * 保存
   * P_BUTTON 意图
   */
  const handleOk = async () => {
    const intentPoolMes = await saveRef?.current?.onSave();
    const isExistSuccess = await getIntentList();
    const newQuery = testData?.props?.query_understand;
    const newIntention = newQuery?.intention_recognition;
    if (intentPoolMes?.intentName && !_.includes(isExistSuccess, intentPoolMes?.intentName)) {
      newIntention.intent_pool_id = 0;
      newIntention.intent_pool_name = '';
      newIntention.intentListTable = [];
      setTestData(testData);
      setOperateFail(true);
      setOperateSave(false);
      message.error(intl.get('cognitiveSearch.intention.saveFail'));
      return;
    }

    newQuery.switch = checked.queryChecked;
    newIntention.intent_pool_id = intentPoolMes?.intentId;
    newIntention.intent_pool_name = intentPoolMes?.intentName;
    newIntention.intentListTable = intentPoolMes?.intentionList;
    setTestData(testData);
    setOperateFail(false);
    setOperateSave(true);
    message.success(intl.get('global.saveSuccess'));
    onSaveDefault();
    onHandleCancel();
  };

  return (
    <>
      {/* 意图识别 */}
      <div className="m-content">
        <Intention
          radioOpen={radioOpen}
          testData={testData}
          setRadioOpen={setRadioOpen}
          intentId={intentId}
          setIntentId={setIntentId}
          saveRef={saveRef}
          operateFail={operateFail}
        />
      </div>
      {/* <UniversalModal.Footer
        source={
          [
            {
              label: intl.get('cognitiveSearch.cancelTwo'),
              onHandle: () => {
                onHandleCancel();
              }
            },
            {
              label: intl.get('cognitiveSearch.save'),
              type: 'primary',
              onHandle: handleOk
            }
          ]
          // <ConfigProvider autoInsertSpaceInButton={false}>
          //   <Button
          //     className="ant-btn-default btn normal"
          //     onClick={() => {
          //       onHandleCancel();
          //     }}
          //   >
          //     {intl.get('cognitiveSearch.cancelTwo')}
          //   </Button>
          //   <Button type="primary" className="btn primary" onClick={handleOk}>
          //     {intl.get('cognitiveSearch.save')}
          //   </Button>
          // </ConfigProvider>
        }
      /> */}
    </>
  );
});

const QuerySettingModal = (props: any) => {
  const {
    visible,
    onHandleCancel,
    testData,
    setTestData,
    intentionRef,
    checked,
    operateFail,
    setOperateFail,
    onSaveDefault,
    setOperateSave
  } = props;
  const QuerySettingContentRef = useRef(null);

  return (
    <UniversalModal
      className="search-query-know-modal"
      open={visible}
      title={intl.get('cognitiveSearch.recognition')}
      okText={intl.get('cognitiveSearch.save')}
      width={'800px'}
      destroyOnClose={true}
      maskClosable={false}
      onCancel={onHandleCancel}
      footerData={[
        {
          label: intl.get('cognitiveSearch.cancelTwo'),
          onHandle: () => {
            onHandleCancel();
          }
        },
        {
          label: intl.get('cognitiveSearch.save'),
          type: 'primary',
          onHandle: () => (QuerySettingContentRef.current as any).handleOk()
        }
      ]}
    >
      <QuerySettingContent
        ref={QuerySettingContentRef}
        onHandleCancel={onHandleCancel}
        testData={testData}
        setTestData={setTestData}
        intentionRef={intentionRef}
        checked={checked}
        onSaveDefault={onSaveDefault}
        setOperateFail={setOperateFail}
        operateFail={operateFail}
        visible={visible}
        setOperateSave={setOperateSave}
      />
    </UniversalModal>
  );
};

export default QuerySettingModal;
