import React, { memo, useState, useEffect, useReducer } from 'react';
import { message } from 'antd';
import _ from 'lodash';
import HOOKS from '@/hooks';
import servicesIntelligence from '@/services/intelligence';
import KnowledgeInfo from './KnowledgeInfo';
import IQTable from './IQTable';
import { KgInfo, ListItem, TableState } from './types';
import './style.less';
import AdExitBar from '@/components/AdExitBar/AdExitBar';
import intl from 'react-intl-universal';

interface DomainIQProps {
  knData: Record<string, any>;
  setKnData: Function;
}

let requestId = 0; // 标记网络请求
const PAGE_SIZE = 10;
const initState: TableState = {
  loading: false, // 搜索加载中
  query: '', // 搜索关键字
  page: 1, // 当前页码
  total: 0, // 总数
  order: 'desc', // 时间排序方式
  rule: 'update_time' // 排序规则
};
const reducer = (state: TableState, action: Partial<TableState>) => ({ ...state, ...action });

const DomainIQ: React.FC<DomainIQProps> = ({ knData, setKnData }) => {
  const [kgInfo, setKgInfo] = useState<KgInfo>({} as KgInfo); // 与 `knData` 不同, 它需要保持更新
  const [tableState, dispatchTableState] = useReducer(reducer, initState); // 表格分页、loading、等状态变量
  const [tableData, setTableData] = useState<ListItem[]>([]); // 表格数据

  useEffect(() => {
    if (!knData.id) return;
    setKgInfo({ ...(knData as KgInfo) });
    getData({}, knData.id);
  }, [knData.id]);

  /**
   * 轮询数据
   */
  HOOKS.useInterval(() => {
    if (!knData.id) return;
    getData(tableState, knData.id, false);
  }, 30 * 1000);

  /**
   * 获取数据
   * @param param0 接口参数
   * @param id 知识网络id
   * @param needLoading 是否需要loading
   */
  const getData = async (
    { page = 1, query = '', order = 'desc', rule = 'update_time' }: Partial<TableState>,
    id?: number,
    needLoading = true
  ) => {
    try {
      const knw_id = id || knData.id;
      dispatchTableState({ query, page, order, rule, loading: !!needLoading });
      const signId = ++requestId;
      const res = await servicesIntelligence.intelligenceGetByKnw({
        knw_id,
        graph_name: query,
        page,
        order,
        size: PAGE_SIZE,
        rule
      });
      if (signId < requestId) return;
      dispatchTableState({ loading: false });
      if (res?.res) {
        const { total_graph, graph_intelligence_list, ...info } = res.res;
        dispatchTableState({ total: total_graph });
        setKgInfo({ ...knData, ...info });
        setTableData(graph_intelligence_list);
        if (knData.intelligence_score !== info.intelligence_score || knData.knw_name !== info.knw_name) {
          setKnData({ ...knData, ...info });
        }
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
    <div className="kg-domain-iq kw-flex-column">
      <AdExitBar style={{ padding: '0 20px' }} title={`${intl.get('global.domainIQ')}：${kgInfo.knw_name}`} />
      <div className="kw-flex kw-flex-item-full-height">
        <KnowledgeInfo kgInfo={kgInfo} onEditSuccess={onEditSuccess} />
        <IQTable kgInfo={kgInfo} knData={knData} data={tableData} tableState={tableState} onChange={onTableChange} />
      </div>
    </div>
  );
};

export default memo(DomainIQ);
