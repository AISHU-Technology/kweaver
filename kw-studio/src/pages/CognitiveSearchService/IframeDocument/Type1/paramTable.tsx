import React from 'react';
import { Table } from 'antd';
import intl from 'react-intl-universal';

const ParamTable = (props: any) => {
  const { tableData } = props;
  const columns = [
    {
      title: intl.get('cognitiveService.iframeDocument.thName'),
      dataIndex: 'name',
      width: 220,
      ellipsis: true
    },
    {
      title: intl.get('cognitiveService.iframeDocument.thType'),
      dataIndex: 'type',
      width: 220,
      ellipsis: true
    },
    {
      title: intl.get('cognitiveService.iframeDocument.thRequired'),
      dataIndex: 'required',
      width: 220,
      render: (required: boolean) => String(required)
    },
    {
      title: intl.get('cognitiveService.iframeDocument.thDesc'),
      dataIndex: 'description',
      ellipsis: true,
      render: (desc: string) => desc || intl.get('global.notDes')
    }
  ];
  return (
    <div>
      <Table rowKey="name" columns={columns} dataSource={tableData} pagination={false} />
    </div>
  );
};
export default ParamTable;
