import React, { useRef } from 'react';
import type { TableProps } from 'antd';
import type { ColumnsType } from 'antd/es/table/interface';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import _ from 'lodash';

import HOOKS from '@/hooks';
import { DESCEND, ASCEND } from '@/enums';
import { formatTime } from '@/utils/handleFunction';
import IconFont from '@/components/IconFont';

import ModelIcon from '../components/ModelIcon';
import OperateBar from '../components/OperateBar';
import { ITable } from '@/components/KwTable';
import { TableState, DataItem } from '../types';
import { OPERATE_ITEMS, MODEL_SUPPLIER } from '../enums';
import './style.less';

export interface DataTableProps {
  className?: string;
  disabledStatus?: Record<string, boolean>;
  tableState: TableState;
  tableData: DataItem[];
  modelConfig: any;
  onStateChange: (state: Partial<TableState>) => void;
  onOperate?: (key: string, data: DataItem) => void;
}

const DataTable = (props: DataTableProps) => {
  const { className, disabledStatus = {}, tableState, tableData, modelConfig, onStateChange, onOperate } = props;
  const containerDOM = useRef<HTMLDivElement>(null);
  HOOKS.useSize(containerDOM.current?.parentElement); // 取值无意义，只是为了触发组件刷新

  /**
   * 表格变化回调
   * @param sorter 排序
   * @param extra 变化信息
   */
  const onTableChange: TableProps<any>['onChange'] = (_: any, __: any, sorter: any, extra: any) => {
    if (extra.action !== 'sort') return;
    const { order, field } = sorter as any;
    onStateChange({ page: 1, order, rule: field });
  };

  const getOrderByRule = (column: string) => {
    return tableState.rule === column ? (tableState.order as any) : undefined;
  };

  const columns: ColumnsType<DataItem> = [
    {
      title: intl.get('llmModel.colName'),
      dataIndex: 'model_name',
      key: 'model_name',
      fixed: 'left',
      width: 240,
      ellipsis: true,
      sorter: true,
      sortDirections: [ASCEND, DESCEND, ASCEND],
      sortOrder: getOrderByRule('model_name'),
      showSorterTooltip: false,
      render: (name, record) => {
        const { model_series } = record;
        return (
          <div className="kw-align-center">
            <ModelIcon type={model_series} modelConfig={modelConfig} />
            <div className="kw-flex-item-full-width kw-pl-3 kw-c-header kw-ellipsis" title={name}>
              {name}
            </div>
          </div>
        );
      }
    },
    {
      title: intl.get('global.operation'),
      dataIndex: 'operation',
      key: 'action',
      fixed: 'left',
      width: 76,
      render: (status, record) => {
        return (
          <OperateBar
            className="kw-table-operate"
            items={OPERATE_ITEMS}
            testLoading={tableState.testLoadingId === record.model_id}
            disabledKeys={disabledStatus}
            onItemClick={key => onOperate?.(key, record)}
            getPopupContainer={() => containerDOM.current!}
          />
        );
      }
    },
    {
      title: intl.get('llmModel.colSupplier'),
      dataIndex: 'model_series',
      ellipsis: true,
      width: 180,
      render: series => MODEL_SUPPLIER[series] || series
    },
    {
      title: intl.get('llmModel.colModel'),
      dataIndex: 'model',
      ellipsis: true,
      width: 240
    },
    {
      title: intl.get('llmModel.colDoc'),
      dataIndex: 'model_api',
      ellipsis: true,
      width: 140,
      render: (model_api, record) => {
        return (
          <div
            className="kw-c-primary kw-pointer"
            onClick={() => {
              onOperate?.('api', record);
            }}
          >
            RESTful API
            <IconFont type="icon-zhuanfa_xiantiao" className="kw-ml-1" />
          </div>
        );
      }
    },
    {
      title: intl.get('global.creator'),
      dataIndex: 'create_by',
      width: 140,
      ellipsis: true,
      render: user => user || '- -'
    },
    {
      title: intl.get('global.creationTime'),
      dataIndex: 'create_time',
      key: 'create_time',
      width: 175,
      ellipsis: true,
      sorter: true,
      sortDirections: [ASCEND, DESCEND, ASCEND],
      sortOrder: getOrderByRule('create_time'),
      showSorterTooltip: false,
      render: time => formatTime(time)
    },
    {
      title: intl.get('global.finalOperator'),
      dataIndex: 'update_by',
      width: 140,
      ellipsis: true,
      render: user => user || '- -'
    },
    {
      title: intl.get('global.finalOperatorTime'),
      dataIndex: 'update_time',
      key: 'update_time',
      width: 175,
      ellipsis: true,
      sorter: true,
      sortDirections: [ASCEND, DESCEND, ASCEND],
      sortOrder: getOrderByRule('update_time'),
      showSorterTooltip: false,
      render: time => formatTime(time)
    }
  ];

  const getScrollY = () => {
    if (!containerDOM.current) return '100%';
    const containerHeight = containerDOM.current.parentElement!.clientHeight;
    return containerHeight - 60; // 60 = 表头高度 + 底部边距
  };

  return (
    <div ref={containerDOM} className={classNames(className, 'llm-model-list-root')}>
      <ITable
        dataSource={tableData}
        columns={columns}
        rowKey="model_id"
        onChange={onTableChange}
        scroll={tableData.length > 0 ? { x: '100%', y: getScrollY() } : { x: '100%' }}
        pagination={false}
        lastColWidth={150}
      />
    </div>
  );
};

export default DataTable;
