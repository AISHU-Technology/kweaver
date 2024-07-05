import React, { useState, useEffect, useReducer } from 'react';
import { Tabs } from 'antd';
import intl from 'react-intl-universal';
import HOOKS from '@/hooks';
import { getParam } from '@/utils/handleFunction';
import serviceUploadKnowledge from '@/services/uploadKnowledge';
import RecordFinishTable from './RecordTable';
import UploadingTable from './UploadingTable';
import UploadSetting from './UploadSetting';
import { RecordItem, TableState } from './types';
import './style.less';

const TABLE = 'table';
const DETAIL = 'detail';
const PAGE_SIZE = 10;
let requestId = 0;
const initState: TableState = {
  loading: false,
  keyword: '',
  page: 1,
  total: 0,
  order: 'created',
  reverse: 1,
  kId: 0,
  finished: 'True'
};
type ContentProps = {
  isIq: boolean;
};
const reducer = (state: TableState, action: Partial<TableState>) => ({ ...state, ...action });

const Content = (props: ContentProps) => {
  const { isIq } = props;
  const [viewType, setViewType] = useState(TABLE);
  const [tableState, dispatchTableState] = useReducer(reducer, initState);
  const [tableData, setTableData] = useState<any>([]);
  const [detailData, setDetailData] = useState<any>({});
  const [tabsKey, setTabsKey] = useState('uploading');
  const [filterKgData, setFilterKgData] = useState<any>([]);
  const kwId = getParam('id');

  useEffect(() => {
    getData({});
    if (!isIq) getRelationKg();
  }, []);

  useEffect(() => {
    if (tabsKey === 'setting') return;
    setTableData([]);
    const finished = tabsKey === 'finish' ? 'True' : 'False';
    getData({ finished });
  }, [tabsKey]);

  /**
   * 轮询数据
   */
  HOOKS.useInterval(async () => {
    if (tabsKey !== 'setting') getData(tableState, true);
  }, 5000);

  /**
   * 发起请求获取数据
   * @param param0 接口参数
   * @param isTimer 是否由定时器触发, 此时不添加loading
   */
  const getData: Function = async (
    { page = 1, keyword = '', order = 'created', reverse = 1, kId = 0 }: Partial<TableState>,
    isTimer = false
  ) => {
    const signId = ++requestId;
    const finished = tabsKey === 'finish' ? 'True' : 'False';
    dispatchTableState({ loading: !isTimer, page, keyword, order, reverse, kId, finished });
    let knId = kId;
    if (isIq) knId = Number(kwId);
    const data = { page, keyword, order, reverse, size: PAGE_SIZE, knId: knId || undefined, finished };
    const { res, ErrorCode }: any = (await serviceUploadKnowledge.uploadServiceTaskGet(data)) || {};
    dispatchTableState({ loading: false });

    if (signId < requestId) return;
    if (!res && !ErrorCode) getData({});
    if (res) {
      const { data, total } = res;
      if (!data.length && total) {
        const newPage = Math.ceil(total / PAGE_SIZE);
        return getData({ page: newPage, keyword, order, reverse, kId, finished }, isTimer);
      }

      setTableData(data);
      dispatchTableState({ total });

      if (viewType !== DETAIL) return;
      const d = data.find((item: any) => item.id === detailData.id);
      if (d?.id) {
        setDetailData(d);
      } else {
        setDetailData({ ...detailData, transferState: '4', transferStatus: '2' });
      }
    }
  };

  const getRelationKg = async () => {
    const { res } = (await serviceUploadKnowledge.taskGetRelationKN()) || {};
    res && setFilterKgData(res);
  };

  /**
   * 表格状态变更重新请求
   * @param state 新的状态
   */
  const onTableChange = (state?: Partial<TableState>) => {
    getData({ ...tableState, ...(state || {}) });
  };

  /**
   * 查看详情
   */
  const onDetail = (record: RecordItem) => {
    if (!record?.id) {
      setViewType('');
      return;
    }
    setDetailData(record);
    setViewType(DETAIL);
  };

  return (
    <div className="uploadRecordRoot kw-h-100">
      <Tabs activeKey={tabsKey} onChange={e => setTabsKey(e)}>
        <Tabs.TabPane tab={intl.get('uploadService.uploading')} key="uploading">
          <UploadingTable
            tabsKey={tabsKey}
            tableState={tableState}
            pageSize={PAGE_SIZE}
            data={tableData}
            detailData={detailData}
            isIq={isIq}
            filterKgData={filterKgData}
            onChange={onTableChange}
            onDetail={onDetail}
          />
        </Tabs.TabPane>
        <Tabs.TabPane tab={intl.get('uploadService.uploaded')} key="finish">
          <RecordFinishTable
            tabsKey={tabsKey}
            pageSize={PAGE_SIZE}
            data={tableData}
            tableState={tableState}
            isIq={isIq}
            filterKgData={filterKgData}
            onChange={onTableChange}
          />
        </Tabs.TabPane>
        {isIq && (
          <Tabs.TabPane tab={intl.get('uploadService.uploadSet')} key="setting">
            <UploadSetting tabsKey={tabsKey} />
          </Tabs.TabPane>
        )}
      </Tabs>
    </div>
  );
};

export default Content;
