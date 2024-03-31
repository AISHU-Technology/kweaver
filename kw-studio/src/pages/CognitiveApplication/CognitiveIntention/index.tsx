import React, { useEffect, useState, useReducer } from 'react';
import { Table, Button, Dropdown, Menu, Select, message } from 'antd';
import intl from 'react-intl-universal';
import { useHistory } from 'react-router-dom';
import _ from 'lodash';
import HOOKS from '@/hooks';
import HELPER from '@/utils/helper';
import Format from '@/components/Format';
import IconFont from '@/components/IconFont';
import SearchInput from '@/components/SearchInput';
import ContainerIsVisible from '@/components/ContainerIsVisible';
import servicesPermission from '@/services/rbacPermission';

import { paramBody } from './assistFunction';
import { ListItem, TableState, KnwItem } from './types';
import ServiceTable from './ServiceTable';

import { ArrowDownOutlined } from '@ant-design/icons';
import { PERMISSION_CODES, PERMISSION_KEYS } from '@/enums';
import { ASC, DESC, PAGE_SIZE, FILTER_OPTION, SORTER_MENU, QUERY_OPTION, INIT_STATE } from './enum';

import './style.less';
import cognitiveSearchService from '@/services/cognitiveSearch';

import KnowledgeModal from './KnowledgeModal';
import FilterHeader from './Header';

const { Option } = Select;
let requestId = 0; // 标记网络请求
const reducer = (state: TableState, action: Partial<TableState>) => ({ ...state, ...action });

const { useRouteCache, useAdHistory } = HOOKS;
const SearchConfig = (props: any) => {
  const history = useHistory();
  const adHistory = useAdHistory();
  const [routeCache, setRouteCache] = useRouteCache<any>();
  const [tableState, dispatchTableState] = useReducer(reducer, { ...INIT_STATE, ...routeCache }); // 表格分页、loading、等状态变量
  const [tableData, setTableData] = useState<ListItem[]>([]); // 表格数据
  const [correlateGraph, setCorrelateGraph] = useState<any>([]); // 关联图谱名称
  const [isDrawer, setIsDrawer] = useState(false); // 描述抽屉
  const [visible, setVisible] = useState<any>(false);

  useEffect(() => {
    document.title = `${intl.get('cognitiveSearch.cognitive')}_KWeaver`;
    const cognitive = document.getElementsByClassName('cognitive-service-list-root')[0];
    const cognitiveParent = cognitive?.parentElement?.parentElement?.parentElement;
    cognitiveParent?.addEventListener('click', () => {
      setIsDrawer(false);
    });
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
      // const knw_id = knData.id;
      const { query, page, order_type, order_field, kg_id, status, knw_id } = { ...tableState, ...state };
      const dataBody: any = {
        page,
        order_type,
        size: PAGE_SIZE,
        order_field
      };
      const arrayData: Record<string, any> = { query, kg_id, status, knw_id };
      // 搜索条件默认为全部的不需要传参
      _.forEach(_.keys(arrayData), key => {
        const value = arrayData[key];
        if (!['', '-1', 'all', '全部'].includes(value) && value !== -1) dataBody[key] = value;
      });

      dispatchTableState({ ...state, loading: !!needLoading });
      const signId = ++requestId;
      const { res }: any = (await cognitiveSearchService.cognitiveSearchList(dataBody)) || {};
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
        const postData = { dataType: PERMISSION_KEYS.TYPE_SERVICE, dataIds, subDataType: 'cogSearchSvc' };
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
   * 按状态筛选
   * @param status 发布状态
   */
  const onStatusChange = (status?: number) => {
    getData({ page: 1, status });
  };

  /**
   * 按图谱筛选
   * @param kgId 图谱id
   */
  const onGraphChange = (kgId?: string) => {
    getData({ page: 1, kg_id: kgId });
  };

  /**
   * 按网络筛选
   * @param knwId 知识网络id
   */
  const onKnwChange = (knwId: string) => {
    getData({ page: 1, knw_id: knwId, kg_id: '-1' });
  };

  /**
   * 触发搜索
   */
  const onSearch = _.debounce(query => {
    getData({ page: 1, query });
  }, 300);

  /**
   * 点击排序按钮
   */
  const onSortMenuClick = (key: string) => {
    const { order_field, order_type } = tableState;
    getData({
      page: 1,
      order_field: key,
      order_type:
        order_field === key ? (order_type === DESC.slice(0, 4) ? ASC.slice(0, 3) : DESC.slice(0, 4)) : order_type
    });
  };

  /**
   * 刷新
   */
  const onRefresh = () => {
    getData({});
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
    setVisible(true);
  };

  const onCreating = (data: any) => {
    setVisible(false);
    history.push(`/search/resource?action=create&knw_id=${data?.id}`);
  };

  /**
   * 编辑-发布-复制
   */
  const onEdit = (data: ListItem, type: string) => {
    const knw_id = data?.resource_knws?.[0]?.knw_id || data?.knw_id;
    history.push(
      `/search/resource?action=${type}&knw_id=${knw_id}&s_id=${data.id}&name=${data?.name}&status=${data?.openai_status}`
    );
  };

  const onTest = (record: ListItem) => {
    const knw_id = record?.resource_knws?.[0]?.knw_id || record?.knw_id;
    history.push(`/search/test?action=test&knw_id=${knw_id}&service_id=${record?.id}`);
  };

  /**
   * 表格状态变更
   * @param state 变化的状态
   */
  const onTableChange = (state: Partial<TableState>) => {
    getData({ ...tableState, ...state });
  };

  // 打开权限管理页面
  const onSetAuthData = (record: any) => {
    setRouteCache({ ...tableState });
    adHistory.push(`/cognitive-application/cognitiveSearch-auth?id=${record?.id}&name=${record?.name}`);
  };

  return (
    <div className="search-config-wrap-root">
      <Format.Title style={{ marginBottom: 18 }}>{intl.get('cognitiveSearch.cognitive')}</Format.Title>
      <FilterHeader
        tableState={tableState}
        correlateGraph={correlateGraph}
        onKnwChange={onKnwChange}
        onStatusChange={onStatusChange}
        onGraphChange={onGraphChange}
        onSearch={onSearch}
        onSortMenuClick={onSortMenuClick}
        onRefresh={onRefresh}
        onCreate={onCreate}
        onChange={onTableChange}
      />
      <div className="kw-mt-4">
        <ServiceTable
          tableState={tableState}
          data={tableData}
          isDrawer={isDrawer}
          correlateGraph={correlateGraph}
          onChange={onTableChange}
          onCreate={onCreate}
          onEdit={onEdit}
          setIsDrawer={setIsDrawer}
          onTest={onTest}
          setAuthData={onSetAuthData}
        />
      </div>
      <KnowledgeModal visible={visible} onOk={(data: any) => onCreating(data)} onCancel={() => setVisible(false)} />
    </div>
  );
};

export default SearchConfig;
