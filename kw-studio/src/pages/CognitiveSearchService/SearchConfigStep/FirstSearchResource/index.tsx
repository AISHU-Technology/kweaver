import React, { useState, useEffect, useReducer, useRef, forwardRef, useImperativeHandle } from 'react';
import { Select, Button, message } from 'antd';
import _ from 'lodash';
import intl from 'react-intl-universal';

import LargeModel from '@/components/LargeModel';
import { tipModalFunc } from '@/components/TipModal';

import VectorModel from './VectorModel';
import ResourceHead from './ResourceHead';
import ResourceTable from './ResourceTable';
import ResourceCreateModal from './ResourceCreateModal';
import {
  getGraphListTable,
  deleteGraphList,
  onAddModel,
  onAddEditLargeModel,
  onTableExitLargeData
} from './assistFunction';

import './style.less';

/**
 * 表格参数状态
 */
export type TableState = {
  loading: boolean;
  name: string;
  page: number;
  count: number;
  order: string;
  rule: string;
  type: string;
};

export const INIT_STATE: TableState = {
  loading: false, // 搜索加载中
  name: '', // 搜索关键字
  page: 1, // 当前页码
  count: 0, // 总数
  order: 'descend', // 时间排序方式
  rule: 'create_time', // 排序规则
  type: 'all' // 资源类别 kg-知识图谱 model-模型
};

const reducer = (state: TableState, action: Partial<TableState>) => ({ ...state, ...action });
const FirstSearchResource = (props: any, ref: any) => {
  const {
    onNext,
    onExit,
    basicData,
    setChecked,
    checked,
    testData,
    setTestData,
    setIsOpenQA,
    externalModel,
    setExternalModel,
    knwData,
    qaError,
    setQaError,
    setEmError,
    setAdvError,
    kgqaConfig,
    setKgqaConfig,
    kgqaData,
    setKgqaData,
    emError
  } = props;
  const sortRef = useRef<any>(null);
  const [tableState, dispatchTableState] = useReducer(reducer, INIT_STATE);
  const [isAddModal, setIsAddModal] = useState(false); // 添加弹窗
  const [tableData, setTableData] = useState<any[]>([]); // 表格数据
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [deleteIds, setDeleteIds] = useState([]);
  const [editMes, setEditMes] = useState({}); // 编辑时的信息
  const [operationType, setOperationType] = useState('');
  const [vectorModel, setVectorModel] = useState<{ visible: boolean; data?: any }>({ visible: false }); // 模型弹窗
  const [largeModelData, setLargeModelData] = useState<{ visible: boolean; data?: any }>({ visible: false }); // 大模型弹窗

  useImperativeHandle(ref, () => ({ onChangeTable, onUpdateTableForLarge }));

  useEffect(() => {
    getGraphList({}, testData);
  }, [testData?.props?.data_all_source]);
  // }, [testData?.props?.data_source_scope, JSON.stringify(externalModel)]);

  /**
   * 列表排序 查询
   * @param isSourceAll 是否全部资源
   */
  const getGraphList = async (state: Partial<TableState>, testAllData: any) => {
    const { page, order, rule, name, type } = { ...tableState, ...state };
    dispatchTableState({ ...state, loading: true });
    const data = {
      size: 10,
      page,
      order,
      rule,
      name,
      type
    };
    const { res } = await getGraphListTable(testAllData, data);

    if (res) {
      const { count, df } = res;
      setTableData(df);
      dispatchTableState({ count, loading: false });
    }
  };

  /**
   * 更新参数状态，重新获取表格数据
   */
  const onChangeTable = (data = {}, newTestData: any) => {
    dispatchTableState({ ...tableState, ...data });
    getGraphList(data, newTestData);
    sortRef?.current?.onChangeSorter({ ...tableState, ...data });
  };

  /**
   * 关闭弹窗
   */
  const onHandleCancel = () => {
    setIsAddModal(false);
    setOperationType('');
    setLargeModelData({ visible: false });
  };

  /**
   * 删除
   */
  const onDelete = async (record: any, type: any) => {
    const title = intl.get('cognitiveSearch.resource.deleteResourceTip');
    const content = intl.get('cognitiveSearch.resource.deleteResourceTip');
    const isOk = await tipModalFunc({ title, content, closable: false });
    if (!isOk) return;

    const { res } = await deleteGraphList(testData, record, type);
    if (res?.res) {
      const { df } = res;
      onChangeTable({ page: 1 }, df);
      setSelectedRowKeys([]);
      setSelectedRows([]);
      setDeleteIds([]);
      setTestData(df);
      onQaUsedModalIsDelete(record, df);
      message.success(intl.get('cognitiveSearch.resource.deleteThree'));
      if (_.isEmpty(df?.props?.data_source_scope)) {
        setChecked({ ...checked, ...{ checked: false, qAChecked: false } });
        setIsOpenQA(false);
      }
    }
  };

  /**
   * 流程二|三Qa中使用的模型是否被删除
   */
  const onQaUsedModalIsDelete = (record: any, data: any) => {
    const currentUsedOrganize = kgqaConfig?.ans_organize;
    const currentUsedAdvOrganize = kgqaConfig?.adv_config?.ans_config;
    let ansOrganize: any = {};
    if (record?.sub_type === currentUsedOrganize?.type) {
      setQaError(`${record?.sub_type}Delete`);
      ansOrganize = { type: '' };
      setKgqaConfig({
        ...kgqaConfig,
        ans_organize: ansOrganize
      });
      setKgqaData({ ...kgqaData, props: { ...kgqaData.props, ans_organize: ansOrganize } });
    }
    if (record?.sub_type === currentUsedAdvOrganize?.type) {
      setAdvError(`${record?.sub_type}Delete`);
    }
  };

  /**
   * 资源编辑弹窗
   */
  const onCreateEdit = (record: any) => {
    if (record?.resource_type === 'model') return editModel(record);
    setIsAddModal(true);
    setOperationType('edit');
    setEditMes(record);
  };

  /**
   * 文本向量模型|大模型编辑弹窗
   */
  const editModel = (record: any) => {
    if (['openai', 'private_llm'].includes(record?.sub_type)) {
      setLargeModelData({ visible: true, data: { ...record?.model_conf, sub_type: record?.sub_type } });
      return;
    }
    setVectorModel({ visible: true, data: record?.model_conf });
  };

  /**
   * 添加图谱配置弹窗
   */
  const onCreateModel = (data: { device: string; sub_type: string; host?: string }) => {
    const addModel = onAddModel(testData, data);
    setTestData(addModel);
    onChangeTable({ page: 1 }, addModel);
    setVectorModel({ visible: false });
    setEmError(true);
  };

  /**
   * 判断大模型是否重复添加
   */
  const onCreateLargeModel = (data: any) => {
    const addData = onAddEditLargeModel(data, _.cloneDeep(testData), largeModelData?.data);
    if (addData?.errorExitName) {
      message.error(
        addData?.errorExitName === 'openai'
          ? intl.get('cognitiveSearch.resource.openaiAlready')
          : intl.get('cognitiveSearch.resource.privateAlready')
      );
    }
    return addData;
  };

  /**
   * Qa连接成功去除对应的报错
   */
  const onUpdateTableForLarge = (addData: any) => {
    // 连接成功报错去除
    if (largeModelData?.data) {
      setQaError('');
    }
    onChangeTable({ page: 1 }, addData);
    setLargeModelData({ visible: false });
    setTestData(addData);
  };

  /**
   * 开启向量模型弹窗
   */
  const onOpenExternalModel = () => {
    const cloneData = _.cloneDeep(testData?.props?.data_all_source);
    const filterExternalModel = _.filter(cloneData, (item: any) => item?.sub_type === 'embbeding_model') || [];
    if (filterExternalModel?.length) return message.error(intl.get('cognitiveSearch.resource.hasModelTip'));
    setVectorModel({ visible: true });
  };

  /**
   * 大模型弹窗
   */
  const onOpenPrivateModel = () => {
    const tableLargeData = _.cloneDeep(testData);
    if (onTableExitLargeData(tableLargeData)?.length === 2) {
      message.error(intl.get('cognitiveSearch.resource.alreadyExit'));
      return;
    }
    setLargeModelData({ visible: true });
  };

  return (
    <div className="first-step-search-box kw-flex">
      <div className="first-step-box kw-flex">
        <ResourceHead
          tableState={tableState}
          basicData={basicData}
          knwData={knwData}
          onChangeTable={onChangeTable}
          tableData={tableData}
          setIsAddModal={setIsAddModal}
          onDelete={onDelete}
          setDeleteIds={setDeleteIds}
          deleteIds={deleteIds}
          setOperationType={setOperationType}
          onOpenExternalModel={onOpenExternalModel}
          onOpenPrivateModel={onOpenPrivateModel}
          testData={testData}
        />
        <ResourceTable
          testData={testData}
          setTestData={setTestData}
          tableState={tableState}
          setOperationType={setOperationType}
          setDeleteIds={setDeleteIds}
          onChangeTable={onChangeTable}
          tableData={tableData}
          setSelectedRows={setSelectedRows}
          selectedRowKeys={selectedRowKeys}
          setSelectedRowKeys={setSelectedRowKeys}
          onDelete={onDelete}
          onCreateEdit={onCreateEdit}
          setIsAddModal={setIsAddModal}
          onOpenExternalModel={onOpenExternalModel}
          onOpenPrivateModel={onOpenPrivateModel}
          ref={sortRef}
          qaError={qaError}
          emError={emError}
        />
        <ResourceCreateModal
          visible={isAddModal}
          testData={testData}
          operationType={operationType}
          editMes={editMes}
          setTestData={setTestData}
          onHandleCancel={onHandleCancel}
          setIsAddModal={setIsAddModal}
          basicData={basicData}
          onChangeTable={onChangeTable}
        />
        <VectorModel
          visible={vectorModel?.visible}
          data={vectorModel?.data}
          onCancel={() => setVectorModel({ visible: false })}
          onOk={onCreateModel}
          setEmError={setEmError}
        />
        <LargeModel
          visible={largeModelData?.visible}
          data={largeModelData?.data}
          onHandleCancel={onHandleCancel}
          onCreateLargeModel={onCreateLargeModel}
          onUpdateTableForLarge={onUpdateTableForLarge}
        />
      </div>
      {/* 底部 */}
      <div className="footer-box kw-center">
        <Button type="default" onClick={onExit}>
          {intl.get('cognitiveSearch.cancel')}
        </Button>
        <Button type="primary" onClick={() => onNext(1)}>
          {intl.get('cognitiveSearch.next')}
        </Button>
      </div>
    </div>
  );
};

export default forwardRef(FirstSearchResource);
