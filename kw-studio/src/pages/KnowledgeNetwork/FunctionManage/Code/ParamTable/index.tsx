import React from 'react';
import type { ColumnsType } from 'antd/es/table';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import { ParamItem } from '@/components/ParamCodeEditor/type';
import ADTable from '@/components/ADTable';

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
        render: type => (type === 'string' ? intl.get('function.string') : intl.get('function.entity'))
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
        render: desc => <div className="kw-c-subtext">{desc || intl.get('global.notDes')}</div>
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

                  <span
                    className={classNames(`kw-pointer kw-ml-8 ${btnColor}`, { 'kw-c-watermark': disabled })}
                    onClick={() => {
                      if (disabled) return;
                      onDelete(record);
                    }}
                  >
                    {intl.get('exploreAnalysis.delete')}
                  </span>
                </div>
              );
            }
          }
    ] as ColumnsType<ParamItem>
  ).filter(Boolean);

  return (
    <ADTable
      showHeader={false}
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
