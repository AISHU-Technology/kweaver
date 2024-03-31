import React, { useMemo } from 'react';
import { Table } from 'antd';
import intl from 'react-intl-universal';
import _ from 'lodash';
import { isDef } from '@/utils/handleFunction';

export interface ParamTableProps {
  tableData: any[];
  type: 'custom-search' | 'neighbors';
}

const ParamTable = (props: ParamTableProps) => {
  const { tableData, type } = props;
  const columns = useMemo(() => {
    const width = 640 / (type === 'neighbors' ? 5 : 4);
    return [
      {
        title: intl.get('cognitiveService.iframeDocument.thName'),
        dataIndex: 'name',
        width,
        ellipsis: true
      },
      {
        title: intl.get('cognitiveService.iframeDocument.thType'),
        dataIndex: 'type',
        width,
        ellipsis: true
      },
      type === 'neighbors'
        ? {
            title: _.upperFirst(intl.get('analysisService.defaultValue')),
            dataIndex: 'defaultValue',
            width,
            ellipsis: true,
            render: (value: any) => {
              return isDef(value) ? String(value) : '--';
            }
          }
        : false,
      {
        title: intl.get('cognitiveService.iframeDocument.thRequired'),
        dataIndex: 'required',
        width,
        render: (required: boolean) => String(required)
      },
      {
        title: intl.get('cognitiveService.iframeDocument.thDesc'),
        dataIndex: 'description',
        render: (desc: string) => desc || intl.get('global.notDes')
      }
    ].filter(Boolean) as any[];
  }, [type]);

  return (
    <div>
      <Table rowKey="name" columns={columns} dataSource={tableData} pagination={false} />
    </div>
  );
};
export default ParamTable;
