import React from 'react';
import intl from 'react-intl-universal';
import { LoadingOutlined } from '@ant-design/icons';
import moment from 'moment';
import PaginationCommon from '@/components/PaginationCommon';
import IconFont from '@/components/IconFont';
import { MODEL_TYPE } from '../enum';
import KwTable, { ITable } from '@/components/KwTable';

import noResImg from '@/assets/images/noResult.svg';
import emptyImg from '@/assets/images/empty.svg';

import './style.less';
import hexToRgba from '@/utils/helper/hexToRgba';

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

  const getIconColor = (color: any) => {
    if (!color) return {};
    return {
      background: hexToRgba(color, 0.06),
      border: `1px solid ${hexToRgba(color, 0.15)}`
    };
  };

  const columns: any = [
    {
      title: intl.get('modelService.serviceName'),
      dataIndex: 'pod_name',
      width: 238,
      sorter: true,
      sortOrder: getSortOrder('pod_name'),
      sortDirections: ['ascend', 'descend', 'ascend'],
      render: (text: any, record: any) => {
        return (
          <div className="kw-w-100">
            <div className="kw-w-100 kw-c-text kw-ellipsis" title={text}>
              {text || '--'}
            </div>
            {record?.remark ? (
              <div className="kw-c-subtext kw-ellipsis kw-w-100" title={record?.remark}>
                {record?.remark}
              </div>
            ) : (
              <div className="kw-c-watermark">{intl.get('global.notDes')}</div>
            )}
          </div>
        );
      }
    },
    {
      title: intl.get('modelService.modelName'),
      dataIndex: 'name',
      width: 220,
      render: (text: string, record: any) => {
        const color = MODEL_TYPE?.[record?.type]?.[record?.c_type]?.color || '#1677FF';
        const colorStyle = getIconColor(color);
        return (
          <div className="kw-flex kw-w-100">
            <div className="kw-center modelIcon" style={{ ...colorStyle }}>
              <IconFont
                style={{ fontSize: record?.type === 2 ? '22px' : '14px' }}
                type={MODEL_TYPE?.[record?.type]?.[record?.c_type]?.icon || 'icon-color-zidingyi'}
              />
            </div>

            <div className="kw-ellipsis" style={{ flex: '1' }} title={text}>
              {text || '--'}
            </div>
          </div>
        );
      }
    },
    {
      title: intl.get('modelService.mType'),
      width: 150,
      ellipsis: true,
      dataIndex: 'm_type',
      render: (text: any, record: any) => {
        const label = MODEL_TYPE?.[record?.type]?.[record?.c_type]?.label;
        return <div>{label ? intl.get(MODEL_TYPE?.[record?.type]?.[record?.c_type]?.label) : ''}</div>;
      }
    },
    {
      title: intl.get('modelService.mVersion'),
      dataIndex: 'new_version',
      width: 105
    },
    {
      title: intl.get('modelService.dStatus'),
      dataIndex: 'status',
      width: 110,
      render: (status: any, record: any) => {
        return (
          <div className="kw-align-center">
            <div
              className="kw-mr-2"
              style={{ width: 8, height: 8, borderRadius: '50%', background: SERVICE_STATUS[parseInt(status)]?.color }}
            />
            {intl.get(SERVICE_STATUS[parseInt(status)]?.label)}
          </div>
        );
      }
    },
    {
      title: intl.get('modelService.doc'),
      width: 138,
      render: (_: any, record: any) => {
        return (
          <div
            className="kw-c-primary kw-pointer kw-align-center"
            onClick={() => {
              window.open(`/cognitive/rest-api?service_id=${record.id}&type=model`);
            }}
          >
            RESTful API
            {/* <ExportOutlined className="kw-ml-2" /> */}
            <IconFont type="icon-zhuanfa_xiantiao" className="kw-c-primary kw-ml-1" />
          </div>
        );
      }
    },
    {
      title: intl.get('global.creator'),
      dataIndex: 'create_by',
      // width: 110,
      ellipsis: true,
      render: (text: any) => '--'
    },
    {
      title: intl.get('global.creationTime'),
      dataIndex: 'create_time',
      // width: 200,
      sorter: true,
      sortOrder: getSortOrder('create_time'),
      sortDirections: ['ascend', 'descend', 'ascend'],
      render: (text: any) => moment(parseInt(text) * 1000).format('YYYY-MM-DD:HH:mm:ss')
    },
    {
      title: intl.get('modelService.updateBy'),
      dataIndex: 'update_by',
      ellipsis: true,
      // width: 110,
      render: (text: any) => '--'
    },
    {
      title: intl.get('modelService.updateTime'),
      dataIndex: 'update_time',
      // width: 200,
      sorter: true,
      sortOrder: getSortOrder('update_time'),
      sortDirections: ['ascend', 'descend', 'ascend'],
      render: (text: any) => '--'
    }
  ];

  return (
    <div className="kw-w-100 modelServiceTable kw-mt-2">
      <ITable
        dataSource={tableData}
        columns={columns}
        rowKey={({ id }) => id}
        scroll={{ x: '100%' }}
        tableLayout="fixed"
        // lastColWidth={150}
        onChange={sortOrderChange}
        pagination={false}
        loading={
          loading && {
            indicator: <LoadingOutlined className="kw-c-primary" style={{ fontSize: 24 }} />
          }
        }
        emptyImage={filters?.status !== '0' || filters?.name ? noResImg : emptyImg}
        emptyText={filters?.status !== '0' || filters?.name ? intl.get('global.noResult') : intl.get('global.noData')}
      />
      <PaginationCommon
        isHide={pagination.count === 0}
        showTotal={false}
        className="kw-pt-4"
        paginationData={pagination}
        onChange={onUpdatePagination}
      />
    </div>
  );
};
export default ModelTable;
