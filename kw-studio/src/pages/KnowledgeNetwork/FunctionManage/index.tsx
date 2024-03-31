import React, { useReducer, useState, useEffect, useMemo } from 'react';
import { message } from 'antd';
import intl from 'react-intl-universal';
import serviceFunction from '@/services/functionManage';
import { getParam, sessionStore } from '@/utils/handleFunction';
import Format from '@/components/Format';
import _ from 'lodash';
import FunctionTable from './FunctionTable';
import CreateDrawer from './CreateDrawer';
import './style.less';
import useRouteCache from '@/hooks/useRouteCache';

const SIZE = 10;
type FunctionTableState = {
  loading: boolean;
  search: string;
  page: number;
  total: number;
  order: string;
  rule: string;
  kw_id: number;
  name: string;
};
const initState: FunctionTableState = {
  loading: false, // 搜索加载中
  search: '', // 搜索关键字
  page: 1, // 当前页码
  total: 0, // 总数
  order: 'desc', // 时间排序方式
  rule: 'create_time', // 排序规则
  kw_id: 0, // 绑定的知识网络
  name: 'nGQL' // 函数名字
};
const reducer = (state: FunctionTableState, action: Partial<FunctionTableState>) => ({ ...state, ...action });
const FunctionManagement = (props: any) => {
  const [routeCache, setRouteCache] = useRouteCache<any>();
  const { knData } = props;
  const [tableState, dispatchTableState] = useReducer(reducer, {
    ...initState,
    page: routeCache.page ?? 1,
    order: routeCache.filterOrder ?? 'desc',
    rule: routeCache.filterRule ?? 'create_time'
  }); // 表格分页、loading、等状态变量
  const [dataSource, setDataSource] = useState([]); // 表格数据
  const [isOpenDrawer, setIsOpenDrawer] = useState(false); // 右侧新建弹窗
  const [editInfo, setEditInfo] = useState<any>({}); // 编辑的函数
  const [isDisabled, setIsDisabled] = useState(false); // 没有编辑权限,禁用
  const kwId = useMemo(() => getParam('id'), [location?.search]);

  useEffect(() => {
    getTableData({});
  }, []);

  /**
   * 获取列表数据
   */
  const getTableData = async ({ page = 1, order = 'desc', search = '', rule = 'create_time', language = '' }) => {
    dispatchTableState({ search, page, order, rule, loading: false });
    // setEditInfo({});
    try {
      const data = {
        knw_id: kwId,
        page,
        size: SIZE,
        search,
        language,
        order_type: order,
        order_field: rule
      };
      const response = await serviceFunction.functionList(data);
      if (response?.res) {
        setDataSource(response?.res?.functions || []);
        dispatchTableState({ total: response?.res?.count });
      }
      if (response === null) {
        setDataSource([]);
        dispatchTableState({ total: 0 });
      }
    } catch (err) {
      //
    }
  };

  /**
   * 表格操作
   * @param state 变化的状态
   */
  const onChangeState = (state: Partial<FunctionTableState>) => {
    getTableData({ ...tableState, ...state });
  };

  // 控制右侧抽屉
  const onChangeDrawer = (isOpen: false | true, isEdit = false) => {
    setIsOpenDrawer(isOpen);
    if (!isEdit) {
      setEditInfo({});
    }
  };

  // 编辑函数
  const onSetFunctionInfo = (info: any, disabled: true | false) => {
    setIsDisabled(disabled); // 是否有编辑权限
    setEditInfo(info);
    onChangeDrawer(true, true);
  };

  // 删除回调函数
  const onDelete = async (id?: any) => {
    try {
      const response = await serviceFunction.functionDelete({ function_ids: id });
      if (response?.res) {
        message.success(intl.get('function.deleteSuccess'));
        onChangeState({ page: 1 });
        onChangeDrawer(false, true);
      }
      if (response?.ErrorCode) {
        message.error(response?.ErrorDetails);
      }
    } catch (err) {
      //
    }
  };

  return (
    <div className="functionManagement">
      <Format.Title className="kw-c-header" style={{ marginBottom: 18 }}>
        {intl.get('global.functionManage')}
      </Format.Title>
      <FunctionTable
        tableState={tableState}
        dataSource={dataSource}
        kgData={knData}
        onChangeState={onChangeState}
        onChangeDrawer={onChangeDrawer}
        onSetFunctionInfo={onSetFunctionInfo}
        onDelete={onDelete}
        refreshTable={() => {
          getTableData({});
        }}
        routeCache={routeCache}
        setRouteCache={setRouteCache}
      />

      <CreateDrawer
        isOpen={isOpenDrawer}
        editInfo={editInfo}
        isDisabled={isDisabled}
        onChangeDrawer={onChangeDrawer}
        onChangeState={onChangeState}
        onDelete={onDelete}
      />
    </div>
  );
};
export default FunctionManagement;
