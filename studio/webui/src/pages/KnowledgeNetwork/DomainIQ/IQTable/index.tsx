import React, { useRef } from 'react';
import { Table, Button, Dropdown, Menu } from 'antd';
import type { TableProps } from 'antd';
import type { ColumnsType } from 'antd/es/table/interface';
import { LoadingOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { useHistory } from 'react-router-dom';
import intl from 'react-intl-universal';
import Format from '@/components/Format';
import IconFont from '@/components/IconFont';
import SearchInput from '@/components/SearchInput';
import ExplainTip from '@/components/ExplainTip';
import { formatID } from '@/utils/handleFunction';
import { CALCULATE_STATUS } from '@/enums';
import servicesKnowledgeNetwork from '@/services/knowledgeNetwork';
import { ListItem, TableState } from '../types';
import noResImg from '@/assets/images/noResult.svg';
import emptyImg from '@/assets/images/empty.svg';
import './style.less';

const PAGE_SIZE = 10;
const DESC = 'descend' as const;
const ASC = 'ascend' as const;
const URL_ANALYSIS = 'analysis';
const URL_GRAPH = 'graph';
const URL_ENGINE = 'search';
const SORTER_MENU = [
  { key: 'last_task_time', text: intl.get('knowledge.byUpdate') },
  { key: 'data_quality_score', text: intl.get('intelligence.byKnwSource') },
  { key: 'data_quality_B', text: intl.get('intelligence.byQualitySource') }
];
const ORDER_MAP: Record<string, string> = {
  [DESC]: 'desc',
  [ASC]: 'asc',
  desc: DESC,
  asc: ASC
};
const order2order = (order: string) => ORDER_MAP[order] || order;

/**
 * 提前查询图谱所在的页数
 * @param knw_id 知识网络id
 * @param id 图谱id
 */
const queryPage = async (knw_id: number, id: number) => {
  const data = { knw_id, page: 1, size: 1000, order: 'desc', name: '', rule: 'update' };
  try {
    const res = await servicesKnowledgeNetwork.graphGetByKnw(data);
    if (!res?.res) return 1;
    const { df } = res.res;
    const index = df.findIndex((d: any) => d.id === id);
    return Math.ceil((index + 1) / 20) || 1;
  } catch (error) {
    return 1;
  }
};

interface QTableProps {
  kid: number;
  data: ListItem[];
  tableState: TableState;
  onChange: (state: Partial<TableState>) => void;
}

const IQTable: React.FC<QTableProps> = ({ kid, data, tableState, onChange }) => {
  const inputRef = useRef<any>();
  const history = useHistory();

  /**
   * 触发搜索
   */
  const onSearch = () => {
    onChange({ page: 1, query: inputRef.current.input.value });
  };

  /**
   * 点击排序按钮
   */
  const onSortMenuClick = (key: string) => {
    const { rule, order } = tableState;
    onChange({
      rule: key,
      order: rule === key ? (order === order2order(DESC) ? order2order(ASC) : order2order(DESC)) : order
    });
  };

  /**
   * 翻页
   */
  const onPageChange = (page: number) => {
    onChange({ page });
  };

  /**
   * 表格变化回调
   * @param sorter 排序
   * @param extra 变化信息
   */
  const onTableChange: TableProps<ListItem>['onChange'] = (_, __, sorter, extra) => {
    if (extra.action !== 'sort') return;
    const { order, field } = sorter as any;
    onChange({ page: 1, order, rule: field });
  };

  /**
   * 点击操作栏链接按钮跳转
   * @param url 跳转的地址
   * @param record 列表行数据
   */
  const onJump = async (url: string, record: ListItem) => {
    const { graph_id } = record;

    if (url === URL_ENGINE) return history.push(`/knowledge/engine/search?id=${kid}`);

    const page = await queryPage(kid, graph_id);
    url === URL_GRAPH && history.push(`/knowledge/network?id=${kid}&gid=${graph_id}&page=${page}`);
    url === URL_ANALYSIS && history.push(`/knowledge/network?id=${kid}&gid=${graph_id}&page=${page}&tab=2`);
  };

  /**
   * 渲染分数
   * @param source 分数
   * @param status 计算状态
   */
  const renderSource = (source: number, status: string) => {
    return status === CALCULATE_STATUS.IN_CALCULATING ? (
      <>
        <LoadingOutlined className="ad-c-primary ad-mr-1" />
        {intl.get('intelligence.calculating')}
      </>
    ) : typeof source === 'undefined' || source < 0 ? (
      '--'
    ) : (
      source
    );
  };

  const columns: ColumnsType<ListItem> = [
    {
      title: <p title={intl.get('global.graphID')}>ID</p>,
      dataIndex: 'graph_id',
      width: 96,
      render: id => formatID(id)
    },
    {
      title: intl.get('global.graphName'),
      dataIndex: 'graph_name',
      ellipsis: true,
      width: 220,
      render: name => (
        <div className="name-column">
          <IconFont type="icon-zhishiwangluo" className="g-icon" />
          <Format.Text className="name-column-text ad-ellipsis" title={name}>
            {name}
          </Format.Text>
        </div>
      )
    },
    {
      title: (
        <>
          {intl.get('intelligence.knwSource')}
          <ExplainTip.KNW_SOURCE />
        </>
      ),
      dataIndex: 'data_quality_score',
      width: 170,
      sorter: true,
      sortOrder: tableState.rule === 'data_quality_score' && (order2order(tableState.order) as any),
      sortDirections: [ASC, DESC, ASC],
      render: (source, record) => renderSource(source, record.calculate_status)
    },
    {
      title: (
        <>
          {intl.get('intelligence.qualitySource')}
          <ExplainTip.QUALITY_SOURCE />
        </>
      ),
      dataIndex: 'data_quality_B',
      width: 170,
      sorter: true,
      sortOrder: tableState.rule === 'data_quality_B' && (order2order(tableState.order) as any),
      sortDirections: [ASC, DESC, ASC],
      render: (source, record) => renderSource(source, record.calculate_status)
    },
    {
      title: intl.get('global.finalOperatorTime'),
      dataIndex: 'last_task_time',
      width: 170,
      sorter: true,
      sortOrder: tableState.rule === 'last_task_time' && (order2order(tableState.order) as any),
      sortDirections: [ASC, DESC, ASC]
    },
    {
      title: intl.get('global.operation'),
      dataIndex: 'op',
      width: 280,
      fixed: 'right',
      render: (_: unknown, record: ListItem) => {
        return (
          <div className="ad-center op-column">
            <Button type="link" onClick={() => onJump(URL_GRAPH, record)}>
              {intl.get('graphDetail.graphOverview')}
            </Button>
            <Button type="link" onClick={() => onJump(URL_ANALYSIS, record)}>
              {intl.get('intelligence.opAnalysis')}
            </Button>
            <Button type="link" onClick={() => onJump(URL_ENGINE, record)}>
              {intl.get('global.cognitiveEngine')}
            </Button>
          </div>
        );
      }
    }
  ];

  return (
    <div className="kg-iq-table">
      <Format.Title className="ad-m-5 ad-ml-6">{intl.get('intelligence.domainDetail')}</Format.Title>
      <div className="tool-box">
        <SearchInput ref={inputRef} placeholder={intl.get('knowledge.search')} onPressEnter={onSearch} />

        <Dropdown
          placement="bottomLeft"
          overlay={
            <Menu selectedKeys={[tableState.rule]} onClick={({ key }) => onSortMenuClick(key)}>
              {SORTER_MENU.map(({ key, text }) => (
                <Menu.Item key={key}>
                  <ArrowDownOutlined
                    className="ad-mr-2"
                    rotate={tableState.order === 'desc' ? 0 : 180}
                    style={{ opacity: tableState.rule === key ? 0.8 : 0, fontSize: 15 }}
                  />
                  {text}
                </Menu.Item>
              ))}
            </Menu>
          }
        >
          <Button className="ad-ml-3 tool-btn">
            <IconFont type="icon-paixu11" className="sort-icon" />
          </Button>
        </Dropdown>

        <Button className="ad-ml-3 tool-btn" onClick={() => onChange({})}>
          <IconFont type="icon-tongyishuaxin" />
        </Button>
      </div>
      <div className="main-table ad-pl-6 ad-pr-6">
        <Table
          dataSource={data}
          columns={columns}
          rowKey="graph_id"
          tableLayout="fixed"
          scroll={{ x: '100%' }}
          onChange={onTableChange}
          pagination={{
            current: tableState.page,
            total: tableState.total,
            pageSize: PAGE_SIZE,
            onChange: onPageChange,
            className: 'data-table-pagination',
            showTitle: false,
            showSizeChanger: false
          }}
          loading={
            tableState.loading && {
              indicator: <LoadingOutlined className="ad-c-primary" style={{ fontSize: 24 }} />
            }
          }
          locale={{
            emptyText: (
              <div className="ad-mt-9 ad-mb-9">
                <img src={tableState.query ? noResImg : emptyImg} alt="nodata" className="ad-tip-img" />
                <p className="ad-c-text">{intl.get(`global.${tableState.query ? 'noResult1' : 'noContent'}`)}</p>
              </div>
            )
          }}
        />
      </div>
    </div>
  );
};

export default IQTable;
