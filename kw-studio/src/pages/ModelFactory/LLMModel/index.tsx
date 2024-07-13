import React, { useState, useEffect, useReducer } from 'react';
import { message } from 'antd';
import classNames from 'classnames';
import intl from 'react-intl-universal';

import * as servicesLLMModel from '@/services/llmModel';
import NoDataBox from '@/components/NoDataBox';
import LoadingMask from '@/components/LoadingMask';
import HOOKS from '@/hooks';
import { sorter2sorter } from '@/enums';
import { getParam } from '@/utils/handleFunction';

import ToolBar from './components/ToolBar';
import DataCards from './DataCards';
import DataTable from './DataTable';
import OperateModal from './components/OperateModal';

import { TableState, DataItem } from './types';
import { INIT_STATE, stateReducer } from './enums';
import emptyImg from '@/assets/images/empty.svg';

import './style.less';

import { useModelConfig } from './useModelConfig';

let requestId = 0; // 标记网络请求

const LLMModel = (props: any) => {
  const { className } = props;
  const [modelList, setModelList] = useState<any[]>([]);
  const [tableState, dispatchTableState] = useReducer(stateReducer, INIT_STATE);
  const [opController, setOpController] = useState({ visible: false, action: '', data: {} as any }); // 各种弹窗操作控制器
  const closeModal = () => setOpController({ visible: false, action: '', data: {} });
  const [modelConfig] = useModelConfig();
  const disabledStatus = { disabled: false };

  useEffect(() => {
    getData(tableState);
  }, []);

  HOOKS.useInterval(() => {
    getData(tableState, false);
  }, 30 * 1000);

  const getData: Function = async (state: Partial<TableState>, needLoading = true) => {
    try {
      dispatchTableState({ ...state, loading: needLoading });
      const { name, page, order, rule, series } = { ...tableState, ...state };
      const signId = ++requestId;
      const { res } =
        (await servicesLLMModel.llmModelList({
          name,
          page,
          rule,
          series,
          order: sorter2sorter(order),
          size: 1000
        })) || {};

      if (signId < requestId) return;
      needLoading && dispatchTableState({ loading: false });
      if (res) {
        const { data, total } = res;
        setModelList(data || []);
        dispatchTableState({ total });
      }
    } catch (err) {
      dispatchTableState({ loading: false });
      const { description } = err?.response || err?.data || err || {};
      description && message.error(description);
    }
  };

  /**
   * 排序等状态更新
   * @param state 更新的状态
   */
  const onStateChange = (state: Partial<TableState>) => {
    getData({ ...tableState, ...(state || {}) });
  };

  /**
   * 各种操作的回调
   * @param key 操作的key标识
   * @param data 操作的模型数据
   */
  const onOperate = (key: string, data: DataItem) => {
    if (['create', 'edit', 'check'].includes(key)) {
      setOpController({ visible: true, action: key, data });
    }
    key === 'delete' && deleteModel(data);
    key === 'test' && testConnect(data);
    key === 'api' && toDocument(data);
  };

  /**
   * 跳转到文档
   */
  const toDocument = (data: DataItem) => {
    window.open(`/model-factory/doc/model?id=${getParam('id')}&llm_id=${data.model_id}&name=${data.model}`, '_blank');
  };

  /**
   * 删除模型
   * @param data 删除的模型数据
   */
  const deleteModel = async (data: DataItem) => {
    try {
      const { res }: any = (await servicesLLMModel.llmModelRemove({ model_id: data.model_id })) || {};
      res && message.success(intl.get('global.delSuccess'));
    } catch (err) {
      const { description } = err?.response || err?.data || err || {};
      description && message.error(description);
    } finally {
      getData(tableState);
    }
  };

  /**
   * 测试连接
   * @param data 测试的模型数据
   */
  const testConnect = async (data: DataItem) => {
    try {
      dispatchTableState({ testLoadingId: data.model_id });
      const { res } = (await servicesLLMModel.llmModelTest({ model_id: data.model_id })) || {};
      res?.status ? message.success(intl.get('global.testSuccessful')) : message.error(intl.get('llmModel.testFailed'));
    } catch (err) {
      let { description } = err?.response || err?.data || err || {};
      if (!description) description = intl.get('llmModel.testFailed');
      message.error(description);
    } finally {
      dispatchTableState({ testLoadingId: '' });
    }
  };

  /**
   * 操作后刷新
   */
  const onAfterOperate = () => {
    closeModal();
    getData(tableState);
  };

  return (
    <div className={classNames(className, 'llm-model-root kw-flex-column kw-h-100')}>
      <div className="kw-flex-column kw-flex-item-full-height">
        <ToolBar
          className="kw-mb-2"
          disabledStatus={disabledStatus}
          tableState={tableState}
          onOperate={onOperate}
          onStateChange={onStateChange}
        />
        <div className="llm-content-box kw-flex-item-full-height kw-p-6 kw-pt-0">
          <LoadingMask loading={tableState.loading} />

          {!modelList.length && !tableState.name ? (
            <div className="kw-center kw-h-100">
              <NoDataBox
                style={{ marginTop: -32 }}
                imgSrc={emptyImg}
                desc={
                  <>
                    {intl.get('llmModel.createTip').split('|')[0]}
                    <span
                      // className={disabledStatus.create ? 'kw-c-watermark kw-not-allowed' : 'kw-c-primary kw-pointer'}
                      // onClick={() => !disabledStatus.create && onOperate('create', {} as any)}
                      className={disabledStatus.disabled ? 'kw-c-watermark kw-not-allowed' : 'kw-c-primary kw-pointer'}
                      onClick={() => !disabledStatus.disabled && onOperate('create', {} as any)}
                    >
                      {intl.get('llmModel.createTip').split('|')[1]}
                    </span>
                    {intl.get('llmModel.createTip').split('|')[2]}
                  </>
                }
              />
            </div>
          ) : (
            <>
              {tableState.viewType === 'list' ? (
                <DataTable
                  tableData={modelList}
                  disabledStatus={disabledStatus}
                  tableState={tableState}
                  modelConfig={modelConfig}
                  onStateChange={onStateChange}
                  onOperate={onOperate}
                />
              ) : (
                <DataCards
                  cardsData={modelList}
                  disabledStatus={disabledStatus}
                  tableState={tableState}
                  modelConfig={modelConfig}
                  onOperate={onOperate}
                />
              )}
            </>
          )}
        </div>
      </div>

      <OperateModal
        visible={opController.visible && ['create', 'edit', 'check'].includes(opController.action)}
        modelConfig={modelConfig}
        data={opController.data}
        action={opController.action}
        onCancel={closeModal}
        onOk={onAfterOperate}
      />
    </div>
  );
};

export default LLMModel;
