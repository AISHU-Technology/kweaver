import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { Table } from 'antd';
import HOOKS from '@/hooks';
import intl from 'react-intl-universal';
import _ from 'lodash';
import classNames from 'classnames';
import moment from 'moment';
import { SORTER_MAP } from '../../../enum';
import { LoadingOutlined } from '@ant-design/icons';
import noResImg from '@/assets/images/noResult.svg';

import createImg from '@/assets/images/create.svg';
import ClassifyConfigModal from './ClassifyConfigModal';
import './style.less';
import KwTable from '@/components/KwTable';

const PAGE_SIZE = 10;
const sorter2sorter = (key: string) => SORTER_MAP[key] || key;
const ClassifyTable: React.ForwardRefRenderFunction<any, any> = (
  {
    authData,
    onChangeTable,
    tableData,
    tableState,
    testData,
    setTestData,
    selectedRowKeys,
    onAddClassify,
    setSelectedRows,
    setSelectedRowKeys
  },
  ref
) => {
  const language = HOOKS.useLanguage();
  const [sorter, setSorter] = useState({ rule: 'edit_time', order: 'descend' });
  const [isConfigModal, setIsConfigModal] = useState(false); // 分类配置弹窗
  const [configRecord, setConfigRecord] = useState<any>({}); // 表格行信息

  useImperativeHandle(ref, () => ({ onChangeSorter }));

  const columnsSelect: any = [
    {
      title: intl.get('cognitiveSearch.resource.name'),
      key: 'kg_name',
      dataIndex: 'kg_name',
      width: 242,
      sorter: true,
      fixed: 'left',
      sortDirections: ['ascend', 'descend', 'ascend'],
      sortOrder: sorter.rule === 'kg_name' && sorter2sorter(sorter.order),
      showSorterTooltip: false,
      render: (text: any, record: any) => (
        <div className="kw-ellipsis source-name" title={text}>
          {text}
        </div>
      )
    },
    {
      title: intl.get('cognitiveSearch.categoryThree'),
      key: 'category',
      dataIndex: 'category',
      width: 229,
      render: (text: any, record: any) => (
        <div
          className={classNames('kw-ellipsis source-classify', { 'kw-c-watermark': _.isEmpty(text) })}
          title={text?.join('、') || intl.get('cognitiveSearch.noCategory')}
        >
          {text?.join('、') || intl.get('cognitiveSearch.noCategory')}
        </div>
      )
    },
    {
      title: intl.get('cognitiveSearch.resource.description'),
      key: 'description',
      dataIndex: 'description',
      width: 242,
      render: (text: any, record: any) => (
        <div
          className={classNames('kw-ellipsis source-name', { 'kw-c-watermark': text === 'undefined' || !text })}
          title={text === 'undefined' || !text ? intl.get('cognitiveService.analysis.noDescription') : text}
        >
          {text === 'undefined' || !text ? intl.get('cognitiveService.analysis.noDescription') : text}
        </div>
      )
    },
    {
      title: intl.get('cognitiveSearch.resource.creator'),
      dataIndex: 'creater_name',
      width: 142,
      render: (text: any, record: any) => (
        <>
          {/* <div title={record?.creater_name} className="creator-style kw-ellipsis">
            {record?.creater_name}
          </div> */}
          <div title={text} className="creator-style kw-ellipsis">
            {text || '--'}
          </div>
        </>
      )
    },
    {
      title: intl.get('cognitiveSearch.resource.createTime'),
      key: 'create_time',
      dataIndex: 'create_time',
      width: 193,
      sorter: true,
      sortDirections: ['ascend', 'descend', 'ascend'],
      sortOrder: sorter.rule === 'create_time' && sorter2sorter(sorter.order),
      showSorterTooltip: false,
      render: (text: any, record: any) => moment(parseInt(text)).format('YYYY-MM-DD HH:mm:ss') || '--'
    },
    {
      title: intl.get('cognitiveSearch.resource.final'),
      dataIndex: 'editor_name',
      width: 142,
      render: (text: any, record: any) => (
        <>
          {/* <div title={record?.editor_name} className="creator-style kw-ellipsis">
            {record?.editor_name}
          </div> */}
          <div title={text} className="creator-style kw-ellipsis">
            {text || '--'}
          </div>
        </>
      )
    },
    {
      title: intl.get('cognitiveSearch.resource.finalTime'),
      key: 'edit_time',
      dataIndex: 'edit_time',
      width: 193,
      sorter: true,
      sortDirections: ['ascend', 'descend', 'ascend'],
      sortOrder: sorter.rule === 'edit_time' && sorter2sorter(sorter.order),
      showSorterTooltip: false,
      render: (text: any, record: any) => moment(parseInt(text)).format('YYYY-MM-DD HH:mm:ss') || '--'
    },
    {
      title: intl.get('cognitiveSearch.resource.operation'),
      dataIndex: 'op',
      width: language === 'zh-CN' ? 160 : 180,
      fixed: 'right',
      render: (_: any, record: any) => {
        return (
          <div className="kw-flex">
            <span
              className={classNames('kw-mr-8 kw-c-primary op-btn kw-pointer', {
                'kw-c-watermark': !authData?.data?.includes(String(record?.kg_id))
              })}
              onClick={() => onClassifyConfig(record)}
            >
              {intl.get('cognitiveSearch.classify.category')}
            </span>
          </div>
        );
      }
    }
  ];

  /**
   * 按钮点击排序同时更新表格的排序
   */
  const onChangeSorter = (state: any) => {
    const { rule, order } = state;
    setSorter({ rule, order });
  };

  /**
   * 表格变化
   * @param sorter 排序
   * @param extra 变化信息
   */
  const onTableChange = (_: any, __: any, sorter: any, extra: any) => {
    if (extra.action !== 'sort') return;
    const order = sorter2sorter(sorter.order);
    const rule = sorter2sorter(sorter.field);
    setSorter({ rule, order });
    if (order === 'ascend') {
      onChangeTable({ order: 'ascend', rule });
    } else {
      onChangeTable({ order: 'descend', rule });
    }
  };

  /**
   * 翻页
   */
  const onPageChange = (page: number) => {
    onChangeTable({ page });
  };

  const rowSelection: any = {
    fixed: true,
    type: 'checkbox',
    selectedRowKeys,
    onChange: (selectedRowKeys: any, selectedRows: any) => {
      setSelectedRowKeys(selectedRowKeys);
      setSelectedRows(selectedRows);
    },
    preserveSelectedRowKeys: false,
    getCheckboxProps: ({ kg_id }: any) => ({ disabled: !_.includes(authData?.data, String(kg_id)) })
  };

  /**
   * 取消弹窗
   */
  const onHandleCancel = () => {
    setIsConfigModal(false);
  };

  /**
   * 分类设置
   */
  const onClassifyConfig = (record: any) => {
    if (!_.includes(authData?.data, String(record?.kg_id))) return;
    setIsConfigModal(true);
    setConfigRecord(record);
  };

  return (
    <div className="source-for-classify-table-wrap">
      <KwTable
        className="search-table"
        showHeader={false}
        lastColWidth={170}
        rowClassName={({ kg_id }) =>
          classNames(
            { disabledRow: !_.includes(authData?.data, String(kg_id)) },
            { selectRow: selectedRowKeys.includes(kg_id) }
          )
        }
        columns={columnsSelect}
        dataSource={tableData}
        onChange={onTableChange}
        rowSelection={rowSelection}
        pagination={{
          total: tableState.count,
          current: tableState.page,
          pageSize: PAGE_SIZE,
          onChange: onPageChange,
          className: 'data-table-pagination',
          showTitle: false,
          showSizeChanger: false
        }}
        rowKey={record => record.kg_id}
        tableLayout="fixed"
        scroll={{ x: '100%', y: 520 }}
        loading={
          tableState.loading && {
            indicator: <LoadingOutlined className="kw-c-primary" style={{ fontSize: 24 }} />
          }
        }
        emptyImage={tableState.name ? noResImg : createImg}
        emptyText={
          tableState.name ? (
            intl.get('global.noResult')
          ) : (
            <div>
              <span>{intl.get('cognitiveSearch.clickAdd').split('|')[0]}</span>
              <span className="kw-c-primary kw-pointer" onClick={onAddClassify}>
                {intl.get('cognitiveSearch.clickAdd').split('|')[1]}
              </span>
              <span>{intl.get('cognitiveSearch.clickAdd').split('|')[2]}</span>
            </div>
          )
        }
      />
      <ClassifyConfigModal
        visible={isConfigModal}
        onHandleCancel={onHandleCancel}
        testData={testData}
        setTestData={setTestData}
        configRecord={configRecord}
        onChangeTable={onChangeTable}
      />
    </div>
  );
};

export default forwardRef(ClassifyTable);
