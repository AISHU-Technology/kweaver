import React, { useState, useEffect, useReducer } from 'react';
import { message } from 'antd';
import { useHistory } from 'react-router-dom';
import intl from 'react-intl-universal';
import _ from 'lodash';
import HOOKS from '@/hooks';
import Format from '@/components/Format';
import ServiceTable from './ServiceTable';
import analysisService from '@/services/analysisService';
import servicesPermission from '@/services/rbacPermission';
import { PERMISSION_KEYS } from '@/enums';
import FilterHeader from './Header';
import ImportModal from './ImportModal';

import { INIT_STATE, PAGE_SIZE } from './enum';
import { ListItem, TableState, KnwItem } from './types';

import './style.less';

let requestId = 0; // 标记网络请求
const reducer = (state: TableState, action: Partial<TableState>) => ({ ...state, ...action });
const { useRouteCache, useAdHistory } = HOOKS;

const ServiceList = (props: any) => {
  const history = useHistory();
  const adHistory = useAdHistory(); // 需要缓存跳转前的数据
  const [routeCache, setRouteCache] = useRouteCache<any>();
  const [tableState, dispatchTableState] = useReducer(reducer, { ...INIT_STATE, ...routeCache }); // 表格分页、loading、等状态变量
  const [tableData, setTableData] = useState<ListItem[]>([]); // 表格数据
  const [correlateGraph, setCorrelateGraph] = useState<any>([]); // 关联图谱名称
  const [isDrawer, setIsDrawer] = useState(false); // 描述抽屉
  const [isImport, setIsImport] = useState(false); // 导入弹窗

  useEffect(() => {
    document.title = `${intl.get('global.domain')}_KWeaver`;
  }, []);

  useEffect(() => {
    getData({});
  }, []);

  /**
   * 获取认知服务列表数据
   * @param state 分页、排序等参数
   * @param kId 知识网络id
   * @param needLoading 是否需要触发loading
   */
  const getData: Function = async (state: Partial<TableState>, needLoading = true) => {
    try {
      const { query, page, order_type, order_field, kg_id, operation_type, status, knw_id } = {
        ...tableState,
        ...state
      };
      const dataBody: any = {
        page,
        order_type,
        size: PAGE_SIZE,
        order_field
      };
      const arrayData: Record<string, any> = { query, kg_id, status, operation_type, knw_id };
      // 搜索条件默认为全部的不需要传参
      _.forEach(_.keys(arrayData), key => {
        const value = arrayData[key];
        if (!['', '-1', 'all'].includes(value) && value !== -1) dataBody[key] = value;
      });

      dispatchTableState({ ...state, loading: !!needLoading });
      const signId = ++requestId;
      const { res }: any = (await analysisService.analysisServiceList(dataBody)) || {};
      if (signId < requestId) return;
      if (res) {
        const { results, count, kg_names, resource_knws } = res;
        setCorrelateGraph(resource_knws);
        if (!results.length && count) {
          const newPage = Math.ceil(count / PAGE_SIZE);
          return getData({ ...state, page: newPage }, needLoading);
        }
        // 获取权限
        const dataIds = _.map(results, item => String(item.id));
        const postData = { dataType: PERMISSION_KEYS.TYPE_SERVICE, dataIds, subDataType: 'graphAnalSvc' };
        // const authCode = await servicesPermission.dataPermission(postData);
        // const codesData = _.keyBy(authCode?.res, 'dataId');
        // const newTableData = _.map(results, item => {
        //   item.__codes = codesData?.[item.id]?.codes;
        //   return item;
        // });
        setTableData(results);

        dispatchTableState({ count });
      }
      dispatchTableState({ loading: false });
    } catch (err) {
      dispatchTableState({ loading: false });
      if (!err?.type) return;
      const { Description } = err.response || {};
      Description && message.error(Description);
    }
  };

  /**
   * 每30s刷新
   */
  HOOKS.useInterval(() => {
    getData({ ...tableState }, false);
  }, 1000 * 30);

  /**
   * 新建认知服务
   */
  const onCreate = () => {
    history.push('/cognitive/config?action=create');
  };

  /**
   * 编辑-发布
   */
  const onEdit = (data: ListItem, type: string) => {
    const knw_name = data?.resource_knws?.[0]?.name;
    history.push(`/cognitive/config?action=${type}&service_id=${data.id}&knw_name=${knw_name}`);
  };

  /**
   * 表格状态变更
   * @param state 变化的状态
   */
  const onTableChange = (state: Partial<TableState>) => {
    getData({ ...tableState, ...state });
  };

  // 打开权限管理页面
  const setAuthData = (record: any) => {
    setRouteCache({ ...tableState });
    adHistory.push(`/cognitive-application/analysis-auth?id=${record?.id}&name=${record?.name}`);
  };

  /**
   * 添加 | 导入
   */
  const onSelectMenu = (e: any) => {
    const value = e?.key;
    if (value === 'add') {
      onCreate();
    }
    if (value === 'import') {
      setIsImport(true);
    }
  };

  return (
    <div className="cognitive-service-list-root">
      <Format.Title style={{ marginBottom: 18 }}>{intl.get('cognitiveService.analysis.graphService')}</Format.Title>
      <FilterHeader
        tableState={tableState}
        kgList={correlateGraph}
        onChange={onTableChange}
        onSelectMenu={onSelectMenu}
      />
      <ServiceTable
        tableState={tableState}
        data={tableData}
        isDrawer={isDrawer}
        correlateGraph={correlateGraph}
        onChange={onTableChange}
        onCreate={onCreate}
        onEdit={onEdit}
        setIsDrawer={setIsDrawer}
        setAuthData={setAuthData}
      />
      {/* 导入弹窗 */}

      <ImportModal visible={isImport} onHandleCancel={() => setIsImport(false)} />
    </div>
  );
};

export default ServiceList;
