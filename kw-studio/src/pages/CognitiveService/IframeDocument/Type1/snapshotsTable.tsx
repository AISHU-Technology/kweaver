import React, { useState } from 'react';
import { Table } from 'antd';
import intl from 'react-intl-universal';
import _ from 'lodash';
const pageSize = 4;
const SnapshotsTable = (props: any) => {
  const { dataSource, pagedata, snapshotsId, setSnapshotsId, getSnapshots } = props;
  const initData = [
    { s_id: -1, snapshot_name: '--', snapshot_info: intl.get('cognitiveService.iframeDocument.theUniqueID') }
  ];
  const snapshotsColumns = [
    {
      title: 'ID',
      dataIndex: 's_id',
      width: 120,
      ellipsis: true
    },
    {
      title: intl.get('cognitiveService.iframeDocument.thName'),
      dataIndex: 'snapshot_name',
      width: 220,
      ellipsis: true
    },
    {
      title: intl.get('cognitiveService.iframeDocument.thDesc'),
      dataIndex: 'snapshot_info',
      ellipsis: true,
      render: (desc: string) => desc || intl.get('global.notDes'),
      with: 320
    },
    {
      title: intl.get('global.operation'),
      dataIndex: '',
      width: 220,
      render: (text: any, record: any) => {
        return (
          <span
            className="kw-c-primary kw-pointer"
            onClick={() => {
              if (record?.s_id === snapshotsId) return;
              setSnapshotsId(record?.s_id);
            }}
          >
            {intl.get('cognitiveService.iframeDocument.apply')}
          </span>
        );
      }
    }
  ];

  return (
    <div>
      <Table
        rowKey="name"
        columns={snapshotsColumns}
        dataSource={_.concat(initData, dataSource)}
        pagination={{
          pageSize,
          total: pagedata?.total,
          current: pagedata.page,
          showTitle: false,
          showSizeChanger: false,
          onChange: (page: number) => {
            getSnapshots(page);
          }
        }}
      />
    </div>
  );
};
export default SnapshotsTable;
