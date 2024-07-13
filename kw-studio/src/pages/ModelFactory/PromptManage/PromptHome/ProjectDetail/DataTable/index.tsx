import React, { useRef } from 'react';
import { message, Tooltip } from 'antd';
import type { TableProps } from 'antd';
import type { ColumnsType } from 'antd/es/table/interface';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import _ from 'lodash';

import HOOKS from '@/hooks';
import { copyToBoard, formatTime } from '@/utils/handleFunction';
import { DESCEND, ASCEND } from '@/enums';
import IconFont from '@/components/IconFont';
import { ITable } from '@/components/KwTable';

import PromptIcon from '../../components/PromptIcon';
import OperateBar from '@/pages/ModelFactory/LLMModel/components/OperateBar';
import { PromptState, PromptItem } from '../../types';
import { getOperateMenu, getPromptTypeText } from '../../enums';
import './style.less';

export interface DataTableProps {
  className?: string;
  tableState: PromptState;
  tableData: PromptItem[];
  onStateChange: (state: Partial<PromptState>) => void;
  onOperate?: (key: string, data: any) => void;
}

const DataTable = (props: DataTableProps) => {
  const { className, tableState, tableData, onStateChange, onOperate } = props;
  const containerDOM = useRef<HTMLDivElement>(null);
  HOOKS.useSize(containerDOM.current?.parentElement);

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

  const copyId = async (id: string) => {
    const isSuccess = await copyToBoard(id);
    isSuccess && message.success(intl.get('exploreAnalysis.copySuccess'));
  };

  const columns: ColumnsType<PromptItem> = [
    {
      title: intl.get('prompt.promptName'),
      dataIndex: 'prompt_name',
      width: 200,
      fixed: 'left',
      ellipsis: true,
      sorter: true,
      sortDirections: [ASCEND, DESCEND, ASCEND],
      sortOrder: getOrderByRule('prompt_name'),
      showSorterTooltip: false,
      render: (name, record) => {
        const desc = record.prompt_desc || intl.get('global.notDes');
        return (
          <div className="kw-align-center kw-pointer" onClick={() => onOperate?.('check', record)}>
            <PromptIcon icon={record.icon} type={record.prompt_type} className="kw-mr-2" />
            <div className="kw-flex-item-full-width">
              <div className="kw-ellipsis kw-c-header" title={name}>
                {name}
              </div>
              <div className="kw-ellipsis kw-c-watermark" style={{ fontSize: 12 }} title={desc}>
                {desc || intl.get('global.notDes')}
              </div>
            </div>
          </div>
        );
      }
    },
    {
      title: intl.get('global.operation'),
      dataIndex: 'operation',
      width: 80,
      fixed: 'left',
      render: (__, record) => {
        return (
          <OperateBar
            items={getOperateMenu(record.prompt_deploy)}
            onItemClick={key => onOperate?.(key, record)}
            getPopupContainer={() => containerDOM.current!}
          />
        );
      }
    },
    {
      title: intl.get('prompt.type'),
      dataIndex: 'prompt_type',
      ellipsis: true,
      width: 120,
      render: type => getPromptTypeText(type)
    },
    {
      title: `${intl.get('prompt.prompt')}ID`,
      dataIndex: 'prompt_id',
      width: 200,
      render: id => {
        return (
          <div className="kw-align-center prompt-id">
            <div className="kw-pr-2 kw-ellipsis" style={{ maxWidth: 'calc(100% - 24px)' }} title={id}>
              {id}
            </div>
            <Tooltip title={intl.get('global.copy') + 'ID'}>
              <IconFont type="icon-copy" className="td-copy-icon" onClick={() => copyId(id)} />
            </Tooltip>
          </div>
        );
      }
    },
    {
      title: intl.get('cognitiveService.analysis.creator'),
      dataIndex: 'create_by',
      width: 190,
      ellipsis: true,
      render: user => user || '- -'
    },
    {
      title: intl.get('cognitiveService.analysis.createdTime'),
      dataIndex: 'create_time',
      key: 'create_time',
      width: 165,
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
      width: 190,
      ellipsis: true,
      render: user => user || '- -'
    },
    {
      title: intl.get('global.finalOperatorTime'),
      dataIndex: 'update_time',
      key: 'update_time',
      width: 165,
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
    return containerHeight - 60;
  };

  return (
    <div ref={containerDOM} className={classNames(className, 'manage-prompt-home-table-root')}>
      <ITable
        dataSource={tableData}
        columns={columns}
        rowKey="prompt_id"
        onChange={onTableChange}
        scroll={tableData.length > 0 ? { x: '100%', y: getScrollY() } : { x: '100%' }}
        pagination={false}
        lastColWidth={150}
      />
    </div>
  );
};

export default DataTable;
