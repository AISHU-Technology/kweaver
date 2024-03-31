import React, { useState, useEffect, useRef } from 'react';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import { Table, Select, Button, Tooltip, Dropdown, Menu } from 'antd';
import { LoadingOutlined, CheckCircleFilled, ArrowDownOutlined } from '@ant-design/icons';
import { UPLOAD_RECORD_STATUS } from '@/enums';
import _ from 'lodash';
import IconFont from '@/components/IconFont';
import Format from '@/components/Format';
import SearchInput from '@/components/SearchInput';
import AvatarName from '@/components/Avatar';
import kongImg from '@/assets/images/kong.svg';
import noResultImg from '@/assets/images/noResult.svg';
import { RecordItem, TableState, RelationKnw } from '../types';
import './style.less';

interface RecordTableProps {
  tabsKey: string;
  className?: string;
  pageSize: number;
  data: RecordItem[];
  tableState: any;
  isIq?: true | false; // 是否是领域智商进来的
  filterKgData: any[]; // 知识网络列表
  onChange: (state?: Partial<TableState>) => void;
}

const { WAIT, PROGRESS, COMPLETE, FAILED } = UPLOAD_RECORD_STATUS;
const CREATED = 'created'; // 按开始时间排序
const UPDATED = 'updated'; // 按结束时间排序
const START = 'started'; // 按开始时间
const { Option } = Select;

const SORTER_MENU = [
  { key: 'created', text: intl.get('knowledge.byCreate') },
  { key: 'started', text: intl.get('uploadService.byStartTime') },
  { key: 'updated', text: intl.get('uploadService.byEndTime') }
];
const sort2Reverse = (sort: string) => (sort === 'descend' ? 1 : 0);
const reverse2Sort = (reverse: number) => (reverse ? 'descend' : 'ascend');

const RecordTable = (props: RecordTableProps) => {
  const { className, tabsKey, pageSize, data, isIq, tableState, filterKgData, onChange } = props;
  const preTotal = useRef(0); // 标记总数, 总数变更时刷新关联的知识网络

  useEffect(() => {
    if (preTotal.current === tableState.total) return;
    preTotal.current = tableState.total;
  }, [tableState.total]);

  /**
   * 监听搜索框
   */
  const onSearch = (e: any) => {
    onChange({ page: 1, keyword: e?.target?.value });
  };

  /**
   * 按知识网络过滤
   * @param kId 知识网络id
   */
  const onKgChange = (kId: number) => {
    if (!kId) return onChange({ page: 1, kId: 0 });
    onChange({ page: 1, kId });
  };

  const onPageChange = (page: number) => onChange({ page });

  /**
   * 触发排序
   */
  const onTableChange = (_: any, __: any, sorter: any, extra: any) => {
    if (extra.action !== 'sort') return;
    const field = sorter.field === 'finished' ? 'updated' : sorter.field;
    onChange({ page: 1, order: field, reverse: sort2Reverse(sorter.order) });
  };

  const onChangeRule = (key: any) => {
    const { order, reverse } = tableState;
    if (key === order) {
      const or = reverse === 1 ? 0 : 1;
      onChange({ page: 1, order: key, reverse: or });
      return;
    }
    onChange({ page: 1, order: key });
  };

  // 定义表格列
  const columns: any = [
    {
      title: intl.get('uploadService.graphName'),
      dataIndex: 'graphName',
      ellipsis: true,
      fixed: 'left',
      width: 300,
      render: (name: string, record: any) => {
        return (
          <div className="kw-align-center kw-w-100">
            <div className="img kw-center kw-border">
              <IconFont type="icon-zhishiwangluo" className="icon"></IconFont>
            </div>
            <div className="kw-ml-3 kw-w-80">
              <div className="kw-ellipsis kw-c-header kw-w-100" title={name}>
                {name}
              </div>
              <div className="kw-ellipsis kw-c-text">ID: {record?.kg_id}</div>
            </div>
          </div>
        );
      }
    },
    {
      title: intl.get('uploadService.status'),
      dataIndex: 'progress',
      ellipsis: true,
      width: 180,
      render: (_: any, record: RecordItem) => {
        return (
          <div>
            <CheckCircleFilled className="kw-c-success kw-mr-2" />
            {intl.get('uploadService.uploaded')}
          </div>
        );
      }
    },
    {
      title: intl.get('uploadService.knowledgeName'),
      dataIndex: 'relatedGraphNetName',
      ellipsis: true,
      width: 300,
      render: (name: string, record: any) => {
        return (
          <div className="kw-align-center kw-w-100">
            <AvatarName str={name} color={record?.knw_color} />
            <div className="kw-ml-2 kw-w-80">
              <div className="kw-ellipsis kw-c-header kw-w-100" title={name}>
                {name}
              </div>
              <div className="kw-ellipsis kw-c-text">ID: {record.knw_id}</div>
            </div>
          </div>
        );
      }
    },
    {
      title: intl.get('uploadService.operator'),
      dataIndex: 'operator',
      ellipsis: true,
      width: 150,
      render: (text: any) => text || '- -'
    },
    {
      title: intl.get('uploadService.targetIp'),
      dataIndex: 'ip',
      ellipsis: true,
      width: 250
    },
    {
      title: intl.get('global.creationTime'),
      dataIndex: 'created',
      ellipsis: true,
      width: 190,
      sorter: true,
      sortDirections: ['ascend', 'descend', 'ascend'],
      sortOrder: tableState.order === CREATED && reverse2Sort(tableState.reverse),
      showSorterTooltip: false,
      render: (time: string) => time || '- -'
    },
    {
      title: intl.get('uploadService.startTime'),
      dataIndex: 'started',
      ellipsis: true,
      width: 190,
      sorter: true,
      sortDirections: ['ascend', 'descend', 'ascend'],
      sortOrder: tableState.order === START && reverse2Sort(tableState.reverse),
      showSorterTooltip: false,
      render: (time: string) => time || '- -'
    },
    {
      title: intl.get('uploadService.endTime'),
      dataIndex: 'finished',
      ellipsis: true,
      width: 190,
      sorter: true,
      sortDirections: ['ascend', 'descend', 'ascend'],
      sortOrder: tableState.order === UPDATED && reverse2Sort(tableState.reverse),
      showSorterTooltip: false,
      render: (_: string, record: RecordItem) => {
        const { transferStatus, updated, finished } = record;
        if (transferStatus === FAILED) return finished || updated || '- -';
        return finished || '- -';
      }
    }
  ];

  return (
    <div className={classNames('kw-h-100', 'upload-finish-table', className)}>
      <div className="kw-mb-5 kw-space-between">
        <div className="flex-left" />
        <div className="flex-right">
          {!isIq && (
            <>
              <Format.Text className="kw-mr-3">{intl.get('uploadService.relationKg')}</Format.Text>
              <Select
                allowClear
                className="kw-mr-3"
                style={{ width: 220 }}
                value={tableState.kId}
                onChange={onKgChange}
              >
                <Option value={0}>{intl.get('global.all')}</Option>
                {filterKgData.map(item => (
                  <Option key={item.id} value={item.id}>
                    {item.name}
                  </Option>
                ))}
              </Select>
            </>
          )}
          <SearchInput placeholder={intl.get('knowledge.search')} onChange={onSearch} debounce/>
          <Dropdown
            placement="bottomLeft"
            overlay={
              <Menu selectedKeys={[tableState?.order]} onClick={({ key }) => onChangeRule(key)}>
                {SORTER_MENU.map(({ key, text }) => (
                  <Menu.Item key={key}>
                    <ArrowDownOutlined
                      className="kw-mr-2"
                      rotate={tableState?.reverse === 1 ? 0 : 180}
                      style={{
                        opacity: tableState?.order === key ? 0.8 : 0,
                        fontSize: 16,
                        transform: 'translateY(1px)'
                      }}
                    />
                    {text}
                  </Menu.Item>
                ))}
              </Menu>
            }
          >
            <Button className="kw-ml-3 sortDataBtn">
              <IconFont type="icon-paixu11" className="sort-icon" />
            </Button>
          </Dropdown>
          <Tooltip placement="topLeft" title={intl.get('uploadService.refresh')}>
            <Button className="kw-ml-3 refreshBtn" style={{ minWidth: 32 }} onClick={() => onChange({})}>
              <IconFont type="icon-tongyishuaxin" />
            </Button>
          </Tooltip>
        </div>
      </div>

      <Table
        columns={columns}
        tableLayout="fixed"
        scroll={{ x: '100%' }}
        dataSource={data}
        rowKey="id"
        loading={tableState.loading && { indicator: <LoadingOutlined className="loading-icon" /> }}
        onChange={onTableChange}
        pagination={{
          className: 'kw-mt-6',
          showTitle: false,
          pageSize,
          total: tableState.total,
          onChange: onPageChange,
          showSizeChanger: false,
          current: tableState.page
        }}
        locale={{
          emptyText: (
            <div className="empty-box">
              <img src={tableState.keyword ? noResultImg : kongImg} alt="no data" className="kw-tip-img" />
              <div className="kw-c-text">
                {tableState.keyword ? intl.get('global.noResult2') : intl.get('uploadService.uploadFinishEmpty')}
              </div>
            </div>
          )
        }}
      />
    </div>
  );
};

export default (props: any) => {
  if (props?.tabsKey === 'finish') return <RecordTable {...props} />;
  return null;
};
