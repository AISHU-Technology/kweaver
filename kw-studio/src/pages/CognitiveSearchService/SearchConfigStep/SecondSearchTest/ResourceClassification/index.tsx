import React, { useState, useReducer, useEffect, useRef } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import servicesPermission from '@/services/rbacPermission';
import { PERMISSION_KEYS } from '@/enums';
import LeftSourceTree from './LeftSourceTree';
import IconFont from '@/components/IconFont';
import fileGraph from '@/assets/images/fileGraph.svg';
import { onDeleteClassify, getList, onHandleTree } from './assistFunction';

import ClassifyHead from './ClassifyHead';
import ClassifyTable from './ClassifyTable';

import './style.less';
import { message } from 'antd';

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

const INIT_STATE: any = {
  loading: false, // 搜索加载中
  name: '', // 搜索关键字
  page: 1, // 当前页码
  count: 0, // 总数
  order: 'descend', // 时间排序方式
  rule: 'edit_time', // 排序规则
  type: '全部' // 资源类别 0-知识图谱
};
const reducer = (state: TableState, action: Partial<TableState>) => ({ ...state, ...action });

const ResourceClassification = (props: any) => {
  const { visible, onAuthError, testData, setTestData, isClassifySetting, onNotUpdate } = props;

  const sortRef = useRef<any>(null);
  const addRef = useRef<any>(null);
  const [tableState, dispatchTableState] = useReducer(reducer, INIT_STATE);
  const [tableData, setTableData] = useState<any>([]); // 表格数据
  const [selectedRowKeys, setSelectedRowKeys] = useState<any>([]);
  const [selectedRows, setSelectedRows] = useState<any>();
  const [selectMes, setSelectMes] = useState<any>('');
  const [authData, setAuthData] = useState<{ checked: boolean; data: any[] }>({ checked: false, data: [] }); // 有权限的分类资源

  useEffect(() => {
    // 资源分类弹窗校验权限;
    const dataIds = _.map(testData?.props?.data_source_scope, item => String(item.kg_id));
    const postData = { dataType: PERMISSION_KEYS.TYPE_KG, dataIds };
    let error = false;
    // servicesPermission.dataPermission(postData).then(result => {
    //   const codesData = _.keyBy(result?.res, 'dataId');
    //   const newGraphData = _.filter(testData?.props?.data_source_scope, item => {
    //     const hasAuth = _.includes(codesData?.[item.kg_id]?.codes, 'KG_VIEW');
    //     if (!hasAuth) error = true;
    //     return hasAuth;
    //   });
    //   const ids = _.map(newGraphData, item => String(item?.kg_id));
    //   setAuthData({ checked: true, data: ids });
    //   if (error) {
    //     onAuthError({ classify: true });
    //     message.error(intl.get('global.graphNoPeromission'));
    //   }
    // });
    const ids = _.map(testData?.props?.data_source_scope, item => String(item?.kg_id));
    setAuthData({ checked: true, data: ids });
    if (error) {
      onAuthError({ classify: true });
      message.error(intl.get('global.graphNoPeromission'));
    }
  }, [testData?.props?.full_text?.search_config, testData]);

  useEffect(() => {
    // selectMes 为空表示全部资源 否则是某一具体分类名称
    if (selectMes) {
      setTableData(testData?.props?.data_source_scope);
    } else {
      const data = testData?.props?.full_text?.search_config;
      const concreteData: any = [];
      _.map(data, (item: any) => {
        if (item?.class_name === selectMes) {
          concreteData.push(item?.kgs);
        }
      });
      setTableData(concreteData[0]);
    }
    getSearchList({ page: 1 }, testData, selectMes);
  }, [testData?.props?.full_text?.search_config, testData, selectMes]);

  /**
   * 列表排序 查询
   * @param isSourceAll 是否全部资源
   */
  const getSearchList = async (state: Partial<TableState>, saveData: any, classyName: string) => {
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
    const { res } = await getList(saveData, classyName, data);
    if (res) {
      const { count, df } = res;
      setTableData(df);
      dispatchTableState({ count, loading: false });
    }
  };

  /**
   * 更新参数状态，重新获取表格数据
   * @param data 表格参数状态
   * @param testUpdate 处理后的testData
   * @param classify 分类名
   */
  const onChangeTable = (data = {}, testUpdate?: any, classify?: string) => {
    dispatchTableState({ ...tableState, ...data });
    getSearchList(data, testUpdate || testData, classify || selectMes);
    sortRef?.current?.onChangeSorter({ ...tableState, ...data });
    setSelectedRows([]);
    setSelectedRowKeys([]);
  };

  /**
   * 添加分类
   */
  const onAddClassify = () => {
    addRef?.current?.onAddEdit('add');
  };

  return (
    <div className="second-step-classification kw-flex">
      <LeftSourceTree
        authData={authData}
        testData={testData}
        setTestData={setTestData}
        selectMes={selectMes}
        setSelectMes={setSelectMes}
        isClassifySetting={isClassifySetting}
        onChangeTable={onChangeTable}
        onNotUpdate={onNotUpdate}
      />

      <div className="right-resource-for-classify-box">
        <div className="kw-flex file-title">
          {!selectMes ? (
            <IconFont type="icon-putongwenjianjia" style={{ fontSize: '23px' }} />
          ) : (
            <img src={fileGraph} alt="" className="file-icon" />
          )}
          <div
            className="right-format-title kw-ml-2 kw-ellipsis"
            title={selectMes || intl.get('cognitiveSearch.classify.allResource')}
          >
            {selectMes || intl.get('cognitiveSearch.classify.allResource')}
          </div>
        </div>
        <ClassifyHead
          authData={authData}
          testData={testData}
          setTestData={setTestData}
          onChangeTable={onChangeTable}
          tableState={tableState}
          selectedRowKeys={selectedRowKeys}
          selectedRows={selectedRows}
          ref={addRef}
        />
        <ClassifyTable
          authData={authData}
          testData={testData}
          setTestData={setTestData}
          onChangeTable={onChangeTable}
          tableData={tableData}
          tableState={tableState}
          selectedRowKeys={selectedRowKeys}
          setSelectedRowKeys={setSelectedRowKeys}
          setSelectedRows={setSelectedRows}
          onAddClassify={onAddClassify}
          ref={sortRef}
        />
      </div>
    </div>
  );
};

export default ResourceClassification;
