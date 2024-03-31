import React from 'react';
import intl from 'react-intl-universal';
import { Table, Tag } from 'antd';
import { LoadingOutlined, EllipsisOutlined } from '@ant-design/icons';
import moment from 'moment';
import PaginationCommon from '@/components/PaginationCommon';
import NoDataBox from '@/components/NoDataBox';

import noResImg from '@/assets/images/noResult.svg';
import emptyImg from '@/assets/images/empty.svg';
import './style.less';
const M_TYPE: Record<any, string> = {
  1: 'intention.intentPool',
  2: 'modelService.bigModel',
  3: 'modelService.customModel'
};
const SERVICE_STATUS: Record<number, any> = {
  1: { label: 'modelService.unpublished', color: '#00000040' },
  2: { label: 'modelService.published', color: '#52C41AFF' }
};
const ModelTable = (props: any) => {
  const { filters, pagination, loading, tableData, onChangeFilter, onUpdatePagination } = props;

  const getSortOrder = (field: string) => {
    if (filters?.orderField !== field) return null;
    return filters?.orderType === 'asc' ? 'ascend' : 'descend';
  };

  // 点击表头排序
  const sortOrderChange = (_: any, __: any, sorter: any, extra: any) => {
    if (extra.action !== 'sort') return;
    const orderType = sorter.order === 'ascend' ? 'asc' : 'desc';
    const orderField = sorter.field;
    onChangeFilter({ orderType, orderField });
  };

  const columns: any = [
    {
      title: intl.get('modelService.serviceName'),
      dataIndex: 'name',
      width: 300,
      sorter: true,
      sortOrder: getSortOrder('name'),
      sortDirections: ['ascend', 'descend', 'ascend'],
      render: (text: any, record: any) => {
        return (
          <div className="kw-w-100">
            <div className="kw-w-100 kw-c-text kw-ellipsis" title={text}>
              {text || '--'}
            </div>
            {record?.desc ? (
              <div className="kw-c-subtext kw-ellipsis kw-w-100" title={record?.desc}>
                {record?.desc}
              </div>
            ) : (
              <div className="kw-c-watermark">{intl.get('global.notDes')}</div>
            )}
          </div>
        );
      }
    },
    {
      title: intl.get('modelService.operation'),
      width: 120,
      render: (_: any, record: any) => {
        return (
          <div>
            <EllipsisOutlined className="option-icon" />
          </div>
        );
      }
    },
    {
      title: intl.get('modelService.mType'),
      dataIndex: 'm_type',
      width: 120,
      render: (text: string, record: any) => {
        const intlText = M_TYPE?.[parseInt(text)] || 'modelService.customModel';
        return (
          <div>
            <Tag className="kw-ellipsis" title={intl.get(intlText)} style={{ maxWidth: 90, background: '#fff' }}>
              {intl.get(intlText)}
            </Tag>
          </div>
        );
      }
    },
    {
      title: intl.get('modelService.mVersion'),
      dataIndex: 'new_version',
      width: 120
    },
    {
      title: intl.get('modelService.status'),
      dataIndex: 'status',
      width: 120,
      render: (status: any, record: any) => {
        return (
          <div className="kw-align-center">
            <div
              className="kw-mr-2"
              style={{ width: 8, height: 8, borderRadius: '50%', background: SERVICE_STATUS[parseInt(status)]?.color }}
            />
            {intl.get(SERVICE_STATUS[parseInt(status)]?.label)}
            {status}
          </div>
        );
      }
    },
    {
      title: intl.get('global.creator'),
      dataIndex: 'create_by',
      width: 100,
      render: (text: any) => text || '--'
    },
    {
      title: intl.get('global.creationTime'),
      dataIndex: 'create_time',
      width: 200,
      sorter: true,
      sortOrder: getSortOrder('create_time'),
      sortDirections: ['ascend', 'descend', 'ascend'],
      render: (text: any) => moment(parseInt(text)).format('YYYY-MM-DD:HH:mm:ss')
    },
    {
      title: intl.get('modelService.updateBy'),
      dataIndex: 'update_by',
      width: 200,
      render: (text: any) => text || '--'
    },
    {
      title: intl.get('modelService.updateTime'),
      dataIndex: 'update_time',
      width: 220,
      sorter: true,
      sortOrder: getSortOrder('update_time'),
      sortDirections: ['ascend', 'descend', 'ascend'],
      render: (text: any) => (text ? moment(parseInt(text)).format('YYYY-MM-DD:HH:mm:ss') : '--')
    }
  ];

  return (
    <div className="kw-w-100 modelServiceTable">
      <Table
        dataSource={tableData}
        columns={columns}
        rowKey={({ id }) => id}
        scroll={{ x: '100%' }}
        tableLayout="fixed"
        onChange={sortOrderChange}
        pagination={false}
        loading={
          loading && {
            indicator: <LoadingOutlined className="kw-c-primary" style={{ fontSize: 24 }} />
          }
        }
        locale={{
          emptyText: (
            <div>
              {filters?.status !== '0' || filters?.name ? (
                <NoDataBox imgSrc={noResImg} desc={intl.get('global.noResult')} />
              ) : (
                <NoDataBox imgSrc={emptyImg} desc={intl.get('global.noData')} />
              )}
            </div>
          )
        }}
      />
      <PaginationCommon
        isHide={pagination.count === 0}
        className="kw-pt-4"
        paginationData={pagination}
        onChange={onUpdatePagination}
      />
    </div>
  );
};
export default ModelTable;
