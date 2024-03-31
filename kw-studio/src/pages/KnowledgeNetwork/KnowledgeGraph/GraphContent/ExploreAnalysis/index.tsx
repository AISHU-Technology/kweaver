import React, { useState, useReducer, useMemo, useEffect } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import { useLocation } from 'react-router-dom';

import { getParam } from '@/utils/handleFunction';
import servicesVisualAnalysis from '@/services/visualAnalysis';

import AnalysisTable from './AnalysisTable';
import { AnalysisTableState } from './types';

import './style.less';

import { message } from 'antd';
const SIZE = 10;
const initState: AnalysisTableState = {
  loading: false, // 搜索加载中
  query: '', // 搜索关键字
  page: 1, // 当前页码
  total: 0, // 总数
  order_type: 'desc', // 时间排序方式
  order_field: 'update_time', // 排序规则
  kg_id: 0, // 绑定的图谱
  kg_name: '' // 关联的图谱名
};
const reducer = (state: AnalysisTableState, action: Partial<AnalysisTableState>) => ({ ...state, ...action });
const ExploreAnalysis = (props: any) => {
  const { kwLang, ad_graphStatus } = props;
  const { selectedGraph, onRefreshLeftSpace } = props;
  const [tableState, dispatchTableState] = useReducer(reducer, initState); // 表格分页、loading、等状态变量
  const [tableData, setTableData] = useState([]); // 分析列表
  const location = useLocation();
  const kwId = useMemo(() => getParam('id'), [location?.search]);
  useEffect(() => {
    getTableData({});
  }, [JSON.stringify(selectedGraph)]);

  /**
   * 获取分析列表数据
   */
  const getTableData = async (data: any, paraData = {}) => {
    const { page = 1, order_type = 'desc', query = '', order_field = 'update_time' } = data || {};
    dispatchTableState({ query, page, order_type, order_field, loading: false, ...paraData });
    const knw_id = kwId;
    try {
      const data = {
        page,
        size: SIZE,
        query,
        kg_id: selectedGraph?.id,
        order_type,
        order_field,
        ...paraData
      };
      const res = await servicesVisualAnalysis.visualAnalysisList(knw_id, data);
      if (res?.res || res === null) {
        setTableData(res?.res?.canvases || []);
        dispatchTableState({ total: res?.res?.count });
      }
      if (res?.ErrorCode) {
        message.error(res?.Description);
      }
    } catch (err) {
      dispatchTableState({ loading: false });
    }
  };

  /**
   * 表格操作
   * @param state 变化的状态
   */
  const onChangeState = (state: Partial<AnalysisTableState>) => {
    if (state?.kg_name === '--') {
      dispatchTableState({ ...tableState, kg_name: state?.kg_name });
      getTableData({ ...tableState }, { kg_id: state?.kg_id });
      return;
    }
    if (typeof state?.kg_id === 'string') {
      getTableData({ ...tableState });
    } else {
      getTableData({ ...tableState }, state);
    }
  };

  return (
    <div className="kg-explore-analysis">
      <AnalysisTable
        dataSource={tableData}
        tableState={tableState}
        kwLang={kwLang}
        selectedGraph={selectedGraph}
        ad_graphStatus={ad_graphStatus}
        onRefreshLeftSpace={onRefreshLeftSpace}
        onChangeState={onChangeState}
      />
    </div>
  );
};

const mapStateToProps = (state: any) => ({
  kwLang: state.getIn(['changekwLang', 'kwLang']),
  ad_graphStatus: state?.getIn(['knowledgeGraph'])?.toJS()?.ad_graphStatus || ''
});

export default connect(mapStateToProps, null)(ExploreAnalysis);
