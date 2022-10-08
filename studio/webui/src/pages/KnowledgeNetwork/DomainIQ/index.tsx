import React, { memo, useState, useEffect, useReducer } from 'react';
import { message } from 'antd';
import _ from 'lodash';
import HOOKS from '@/hooks';
import servicesIntelligence from '@/services/intelligence';
import KnowledgeInfo from './KnowledgeInfo';
import IQTable from './IQTable';
import { KgInfo, ListItem, TableState } from './types';
import './style.less';
import { knwIQGet } from './__tests__/mockData';

interface DomainIQProps {
  kgData: Record<string, any>;
}

let requestId = 0; // 标记网络请求
const PAGE_SIZE = 10;
const DESC = 'descend' as const;
const ASC = 'ascend' as const;
const initState: TableState = {
  loading: false, // 搜索加载中
  query: '', // 搜索关键字
  page: 1, // 当前页码
  total: 0, // 总数
  order: DESC // 时间排序方式
};
const reducer = (state: TableState, action: Partial<TableState>) => ({ ...state, ...action });

const DomainIQ: React.FC<DomainIQProps> = ({ kgData }) => {
  const [kgInfo, setKgInfo] = useState<KgInfo>({} as KgInfo); // 与 `kgData` 不同, 它需要保持更新
  const [tableState, dispatchTableState] = useReducer(reducer, initState); // 表格分页、loading、等状态变量
  const [tableData, setTableData] = useState<ListItem[]>([]); // 表格数据

  useEffect(() => {
    if (!kgData.id) return;
    setKgInfo({ ...(kgData as KgInfo) });
    getData({}, kgData.id);
  }, [kgData.id]);

  /**
   * 轮询数据
   */
  HOOKS.useInterval(() => {
    if (!kgData.id) return;
    getData(tableState, kgData.id, false);
  }, 30 * 1000);

  /**
   * 获取数据
   * @param param0 接口参数
   * @param id 知识网络id
   * @param needLoading 是否需要loading
   */
  const getData = async (
    { page = 1, query = '', order = DESC }: Partial<TableState>,
    id?: number,
    needLoading = true
  ) => {
    try {
      const knw_id = id || kgData.id;
      dispatchTableState({ query, page, order, loading: !!needLoading });
      // const res = await knwIQGet({ knw_id, graph_name: query, page, order,
      // size: PAGE_SIZE, rule: 'last_task_time' });
      const signId = ++requestId;
      const res = await servicesIntelligence.intelligenceGetByKnw({
        knw_id,
        graph_name: query,
        page,
        order,
        size: PAGE_SIZE,
        rule: 'last_task_time'
      });
      if (signId < requestId) return;
      dispatchTableState({ loading: false });
      if (res?.res) {
        const { total, graph_intelligence_list, ...info } = res.res;
        dispatchTableState({ total: res.res.total });
        setKgInfo(info);
        setTableData(graph_intelligence_list);
      }
      res?.Description && message.error(res?.Description);
    } catch {
      dispatchTableState({ loading: false });
    }
  };

  /**
   * 编辑后刷新
   */
  const onEditSuccess = () => {
    getData(tableState, undefined, false);
  };

  /**
   * 表格操作
   * @param state 变化的状态
   */
  const onTableChange = (state: Partial<TableState>) => {
    getData({ ...tableState, ...state });
  };

  return (
    <div className="kg-domain-iq">
      <div className="ad-flex ad-h-100">
        <KnowledgeInfo kgInfo={kgInfo} onEditSuccess={onEditSuccess} />
        <IQTable kid={kgData.id} data={tableData} tableState={tableState} onChange={onTableChange} />
      </div>
    </div>
  );
};

export default memo(DomainIQ);
