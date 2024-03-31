import React from 'react';
import _ from 'lodash';
import Cookie from 'js-cookie';
import intl from 'react-intl-universal';
import { Table, Button, Popover, message, Dropdown, Tooltip } from 'antd';
import { EllipsisOutlined } from '@ant-design/icons';

import HELPER from '@/utils/helper';
import { PERMISSION_CODES } from '@/enums';
import serviceModelLibrary from '@/services/modelLibrary';

import Format from '@/components/Format';
import PaginationCommon from '@/components/PaginationCommon';
import ContainerEmptyOrResultType from '@/components/ContainerEmptyOrResult';
import { ITable } from '@/components/ADTable';
import { TYPE_CREATE, TYPE_EDIT } from '../enums';

import createSvg from '@/assets/images/create.svg';

import './style.less';
import { kwCookie } from '@/utils/handleFunction';

interface SortType {
  rule: string;
  order: string;
}

interface PaginationType {
  page: number;
  pageSize: number;
  count: number;
}

interface ModelTableType {
  sort: SortType;
  items: any[];
  filter: any;
  coverId: number | null | false;
  pagination: PaginationType;
  disabledImport: boolean;
  selectedRowKeys: string[];
  onDelete: (ids: number[]) => void;
  onChangeSort: (data: SortType) => void;
  onChangeSelected: (ids: string[]) => void;
  onOpenCreateModel: (type: string, data?: any) => void;
  onChangePagination: (data: PaginationType) => void;
}

const COLUMN_WIDTH: any = {
  'zh-CN': { operation: 76 },
  'en-US': { operation: 76 }
};

const ModelTable = (props: ModelTableType) => {
  const { sort, items, filter, coverId, pagination, disabledImport, selectedRowKeys } = props;
  const { onDelete, onChangeSort, onChangeSelected, onOpenCreateModel, onChangePagination } = props;
  const { pageSize, count } = pagination;
  const language = kwCookie.get('kwLang') || 'zh-CN';

  const getSortOrder = (rule: string) => {
    if (sort?.rule !== rule) return null;
    return sort?.order === 'asc' ? 'ascend' : 'descend';
  };

  const onChangeTable = (pagination: any, filters: any, sorter: any, extra: any) => {
    if (extra.action !== 'sort') return;
    const order = sorter.order === 'ascend' ? 'asc' : 'desc';
    const rule = sorter.field;
    onChangeSort({ rule, order });
  };

  const onExport = async (model_id: string) => {
    try {
      const postData = { model_id };
      const result = await serviceModelLibrary.modelOsDownload(postData);
      if (!result.res) return;
      const { url } = result.res || {};
      const link = document.createElement('a');
      link.style.display = 'none';
      if (HELPER.getBrowserType() === 'Firefox') {
        link.setAttribute('target', '_blank');
      }
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      const { type, response, data } = error;
      if (type === 'message') return message.error(response?.Description || '');
      message.error(data?.Description || 'Error');
    }
  };

  const columns: any = [
    {
      dataIndex: 'name',
      title: intl.get('modelLibrary.modelName'),
      width: 264,
      fixed: 'left',
      sorter: true,
      ellipsis: true,
      sortOrder: getSortOrder('name'),
      sortDirections: ['ascend', 'descend', 'ascend'],
      render: (value: string, data: any) => {
        return (
          <div>
            <div className="kw-ellipsis" title={value}>
              {value}
            </div>
            {data?.description ? (
              <div className="model-desc kw-ellipsis kw-c-subtext" title={data?.description}>
                {data?.description}
              </div>
            ) : (
              <div className="model-desc kw-c-watermark">{intl.get('modelLibrary.notDes')}</div>
            )}
          </div>
        );
      }
    },
    {
      dataIndex: 'operation',
      key: 'action',
      title: intl.get('modelLibrary.operation'),
      width: COLUMN_WIDTH?.[language].operation,
      fixed: 'left',
      render: (value: any, data: any) => {
        const MENU = (
          <div className="modelOperation kw-table-operate">
            <Button
              className="operationButton"
              type="link"
              disabled={
                data.id === coverId || !HELPER.getAuthorByUserInfo({ roleType: PERMISSION_CODES.ADF_KN_MODEL_EDIT })
              }
              onClick={() => onOpenCreateModel(TYPE_EDIT, data)}
            >
              {intl.get('modelLibrary.edit')}
            </Button>
            <Button className="operationButton" type="link" onClick={() => onExport(data.id)}>
              {intl.get('modelLibrary.export')}
            </Button>
            <Button
              className="operationButton"
              type="link"
              disabled={
                data.id === coverId || !HELPER.getAuthorByUserInfo({ roleType: PERMISSION_CODES.ADF_KN_MODEL_DELETE })
              }
              onClick={() => onDelete([Number(data.id)])}
            >
              {intl.get('modelLibrary.delete')}
            </Button>
          </div>
        );
        return (
          <Dropdown overlay={MENU} trigger={['click']} placement="bottomLeft">
            <Format.Button className="kw-table-operate" type="icon">
              <EllipsisOutlined style={{ color: 'rgba(0, 0, 0, 0.85)', fontSize: '16px' }} />
            </Format.Button>
          </Dropdown>
        );
      }
    },
    {
      dataIndex: 'tags',
      title: intl.get('modelLibrary.tag'),
      width: 264,
      ellipsis: true,
      render: (value: string[]) => {
        if (_.isEmpty(value)) return <div className="kw-c-watermark">{intl.get('modelLibrary.notTag')}</div>;
        let length = 0;
        let limitNumber = -1;
        let hasMore = false;
        _.forEach(value, (item, index) => {
          length += Math.min(80, HELPER.getLengthFromString(item) + 16);
          if (index !== 0) length += 8;
          if (length + 42 > 232) {
            hasMore = true;
            if (limitNumber === -1) limitNumber = index;
          }
        });

        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {_.map(value.slice(0, limitNumber === -1 ? value.length : limitNumber), (item, index) => {
              return (
                <div key={index} className="tags kw-ellipsis" title={item}>
                  {item}
                </div>
              );
            })}
            {hasMore && (
              <Popover
                overlayClassName="tagPopover"
                trigger="hover"
                placement="bottomLeft"
                content={() => {
                  return (
                    <div className="tagPopoverContent">
                      {_.map(value, (item, index) => {
                        return (
                          <div key={index} className="tags" title={item}>
                            {item}
                          </div>
                        );
                      })}
                    </div>
                  );
                }}
              >
                <div className="moreTag">
                  <EllipsisOutlined />
                </div>
              </Popover>
            )}
          </div>
        );
      }
    },
    {
      dataIndex: 'create_user',
      title: intl.get('modelLibrary.creator'),
      width: 220,
      ellipsis: true,
      render: (value: string, data: any) => {
        return (
          <div>
            <div className="kw-ellipsis" title={value}>
              {value}
            </div>
          </div>
        );
      }
    },
    {
      dataIndex: 'create_time',
      title: intl.get('modelLibrary.createdTime'),
      width: 220,
      sorter: true,
      sortOrder: getSortOrder('create_time'),
      sortDirections: ['ascend', 'descend', 'ascend']
    },
    {
      dataIndex: 'update_user',
      title: intl.get('modelLibrary.finalOperator'),
      width: 220,
      ellipsis: true,
      render: (value: string, data: any) => {
        return (
          <div>
            <div className="kw-ellipsis" title={value}>
              {value}
            </div>
          </div>
        );
      }
    },
    {
      dataIndex: 'update_time',
      title: intl.get('modelLibrary.finalOperatedTime'),
      width: 220,
      sorter: true,
      sortOrder: getSortOrder('update_time'),
      sortDirections: ['ascend', 'descend', 'ascend']
    }
  ];

  return (
    <div style={{ maxHeight: 'calc(100% - 48px - 32px)', display: 'flex' }}>
      <div className="kw-mt-2" style={{ width: '100%' }}>
        <ITable
          className="modelTable"
          rowKey="id"
          columns={columns}
          dataSource={items}
          pagination={false}
          scroll={items?.length > 7 ? { x: '100%', y: 'calc(100% - 60px)' } : { x: '100%' }}
          onChange={onChangeTable}
          rowSelection={{
            fixed: true,
            type: 'checkbox',
            selectedRowKeys,
            onChange: (rowKeys: any) => onChangeSelected(rowKeys),
            preserveSelectedRowKeys: true
          }}
          lastColWidth={150}
          emptyImage={!_.isEmpty(filter.name) ? null : createSvg}
          emptyText={
            !_.isEmpty(filter.name) ? null : (
              <div className="kw-center">
                <div className="kw-c-text">{intl.get('modelLibrary.clickCreateImportModel').split('|')[0]}</div>
                <div style={{ height: 22 }} className="kw-center">
                  <Button
                    type="link"
                    style={{ margin: language === 'en-US' ? '0px 4px' : 0, minWidth: 0, padding: 0 }}
                    disabled={disabledImport}
                    onClick={() => onOpenCreateModel(TYPE_CREATE)}
                  >
                    {intl.get('modelLibrary.clickCreateImportModel').split('|')[1]}
                  </Button>
                </div>
                <div className="kw-c-text">{intl.get('modelLibrary.clickCreateImportModel').split('|')[2]}</div>
              </div>
            )
          }
        />
        <PaginationCommon
          hide={count < pageSize}
          className="kw-pt-4"
          paginationData={pagination}
          onChange={onChangePagination}
        />
      </div>
    </div>
  );
};

export default ModelTable;
