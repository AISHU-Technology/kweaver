import React, { useReducer, useState, useEffect, useRef } from 'react';

import { message } from 'antd';

import Format from '@/components/Format';
import ContainerIsVisible from '@/components/ContainerIsVisible';
import { useHistory } from 'react-router-dom';
import intl from 'react-intl-universal';
import HOOKS from '@/hooks';
import _ from 'lodash';

import CustomHead from './CustomHead';
import CustomTable from './CustomTable';
import CreateModal from './CreateModal';

import cognitiveSearchService from '@/services/cognitiveSearch';
import servicesPermission from '@/services/rbacPermission';
import customService from '@/services/customService';
import { PERMISSION_CODES, PERMISSION_KEYS } from '@/enums';

import { paramBody } from './assistFunction';
import { ListItem, TableState, KnwItem } from './types';
import { ASC, DESC, PAGE_SIZE, FILTER_OPTION, SORTER_MENU, QUERY_OPTION, INIT_STATE } from './enum';

import './style.less';
import { getTextByHtml } from '@/utils/handleFunction';
const { useRouteCache, useAdHistory } = HOOKS;

let requestId = 0; // 标记网络请求
const reducer = (state: TableState, action: Partial<TableState>) => ({ ...state, ...action });
const CustomService = (props: any) => {
  const sortRef = useRef<any>(null);
  const history = useHistory();
  const adHistory = useAdHistory();
  const [routeCache, setRouteCache] = useRouteCache<any>();
  const [sorter, setSorter] = useState<any>({ rule: 'edit_time', order: 'descend' });
  const [tableState, dispatchTableState] = useReducer(reducer, { ...INIT_STATE, ...routeCache }); // 表格分页、loading、等状态变量
  const [tableData, setTableData] = useState<ListItem[]>([]); // 表格数据
  const [correlateGraph, setCorrelateGraph] = useState<any>([]); // 关联图谱名称
  const [showModal, setShowModal] = useState(false); // 是否显示弹窗
  const [modalEditData, setModalEditData] = useState({ name: '', env: '0', description: '', init: true, id: '' }); // 弹窗的数据

  useEffect(() => {
    document.title = `${intl.get('customService.customTitle')}_KWeaver`;
  }, []);

  useEffect(() => {
    getData({});
  }, []);

  /**
   * 获取自定义认知服务列表数据
   * @param state 分页、排序等参数
   * @param kId 知识网络id
   * @param needLoading 是否需要触发loading
   */
  const getData: Function = async (state: Partial<TableState>, needLoading = true) => {
    try {
      const { query, page, order_type, order_field, kg_id, status, knw_id, env } = { ...tableState, ...state };
      const dataBody: any = {
        page,
        order_type,
        size: PAGE_SIZE,
        order_field,
        type: 'custom'
      };
      const arrayData: Record<string, any> = { query, kg_id, status, knw_id, env };
      // 搜索条件默认为全部的不需要传参
      _.forEach(_.keys(arrayData), key => {
        const value = arrayData[key];
        if (!['', '-1', 'all', '全部'].includes(value) && value !== -1) dataBody[key] = value;
      });
      dispatchTableState({ ...state, loading: !!needLoading });
      const signId = ++requestId;

      const { res }: any = (await customService.customList(dataBody)) || {};
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
        const postData = { dataType: PERMISSION_KEYS.TYPE_SERVICE, dataIds };
        // const authCode = await servicesPermission.dataPermission(postData);
        // const codesData = _.keyBy(authCode?.res, 'dataId');
        // const newTableData = _.map(results, item => {
        //   item.__codes = codesData?.[item.id]?.codes;
        //   return item;
        // });
        setTableData(results);

        // setTableData(results);
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
   * 表格状态变更
   * @param state 变化的状态
   */
  const onTableChange = (state: Partial<TableState>) => {
    getData({ ...tableState, ...state });
    sortRef?.current?.onChangeSorter({ ...tableState, ...state });
  };

  /**
   * 编辑-发布-复制
   */
  const onEdit = (data: ListItem, type: string) => {
    if (type === 'copy') {
      setShowModal(true);
      setModalEditData(pre => {
        return {
          ...pre,
          env: data.env || '0',
          name: data.name,
          description: getTextByHtml(data.description),
          init: false,
          id: data.id
        };
      });
      return;
    }

    // 添加应用环境
    history.push(`/custom/service?action=${type}&s_id=${data.id}&name=${data?.name}&env=${data?.env}`);
  };

  // 打开权限管理页面
  const onSetAuthData = (record: any) => {
    setRouteCache({ ...tableState });
    adHistory.push(`/cognitive-application/custom-auth?id=${record?.id}&name=${record?.name}`);
  };

  return (
    <div className="custom-config-service-root">
      <Format.Title className="configTitle">{intl.get('customService.customTitle')}</Format.Title>
      <CustomHead
        tableState={tableState}
        correlateGraph={correlateGraph}
        onChange={onTableChange}
        onShowModal={setShowModal}
        onSetModalEditData={setModalEditData}
      />
      <CustomTable
        ref={sortRef}
        tableData={tableData}
        tableState={tableState}
        onChange={onTableChange}
        onEdit={onEdit}
        onSetAuthData={onSetAuthData}
        sorter={sorter}
        setSorter={setSorter}
        onShowModal={setShowModal}
      />
      <ContainerIsVisible isVisible={showModal}>
        <CreateModal onClose={() => setShowModal(false)} editData={modalEditData} />
      </ContainerIsVisible>
    </div>
  );
};

export default CustomService;
