import React from 'react';
import { Table, Popconfirm } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import { ParamItem } from '@/components/ParamCodeEditor/type';

const ParamTable = (props: any) => {
  const { data = [], disabled, readonly, onEdit, onDelete } = props;

  const columns = (
    [
      {
        title: intl.get('function.paramName'),
        dataIndex: 'name',
        ellipsis: true,
        width: 175
      },
      {
        title: intl.get('function.showName'),
        dataIndex: 'alias',
        ellipsis: true,
        width: 175
      },
      {
        title: intl.get('function.paramType'),
        dataIndex: 'param_type',
        ellipsis: true,
        width: 150,
        render: type => type
      },
      {
        title: intl.get('function.example'),
        dataIndex: 'example',
        ellipsis: true,
        width: 175
      },
      {
        title: intl.get('global.desc'),
        dataIndex: 'description',
        ellipsis: true,
        width: 175,
        render: desc => <div className="kw-c-subtext kw-ellipsis">{desc || intl.get('global.notDes')}</div>
      },
      readonly
        ? false
        : {
            title: intl.get('global.operation'),
            width: 150,
            fixed: 'right',
            render: (_: any, record) => {
              const btnColor = disabled ? 'disabledColor' : 'kw-c-primary';
              return (
                <div style={{ userSelect: 'none' }}>
                  <span className={classNames(`kw-pointer ${btnColor}`)} onClick={() => onEdit(record)}>
                    {intl.get('exploreAnalysis.edit')}
                  </span>
                  <Popconfirm
                    placement="topRight"
                    title={intl.get('function.deleteParamTitle')}
                    onConfirm={() => onDelete(record)}
                    okText={intl.get('global.ok')}
                    cancelText={intl.get('global.cancel')}
                    disabled={disabled}
                  >
                    <span className={classNames(`kw-pointer kw-ml-8 ${btnColor}`)}>
                      {intl.get('exploreAnalysis.delete')}
                    </span>
                  </Popconfirm>
                </div>
              );
            }
          }
    ] as ColumnsType<ParamItem>
  ).filter(Boolean);

  return (
    <Table
      columns={columns}
      dataSource={data}
      pagination={false}
      rowKey={'name'}
      scroll={{ x: '100%' }}
      locale={{
        emptyText: <div className="kw-mt-9 kw-mb-9">{intl.get('global.noContent')}</div>
      }}
    />
  );
};

export default ParamTable;
