import React, { memo, useState, useEffect } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Modal, message, Table } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

import timeFormat from '@/utils/timeFormat/index.js';
import serviceStorageManagement from '@/services/storageManagement';

import Pagination from '@/components/Pagination';

import emptyImg from '@/assets/images/empty.svg';
import './style.less';

const pageSize = 20;
const antIconBig = <LoadingOutlined className="icon" style={{ fontSize: 24, top: '200px' }} spin />;

const GraphListModal = props => {
  const { visible, setVisible, id } = props;

  const [total, setTotal] = useState(0);
  const [current, setCurrent] = useState(1);
  const [loading, setLoading] = useState(false);
  const [tableData, setTableData] = useState([]);

  useEffect(() => {
    if (!id) return;
    getData();
  }, [id]);

  const getData = async page => {
    const data = { id, page: page || current, size: pageSize };
    setLoading(true);

    try {
      const { res = {}, ErrorCode = '', Description = '' } = await serviceStorageManagement.graphDBGetGraphById(data);

      if (!_.isEmpty(res)) {
        setTotal(res?.total);
        setTableData(res?.data);
      }

      if (ErrorCode === 'Manager.Common.ServerError') message.error(Description);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const currentChange = page => {
    setCurrent(page);
    getData(page);
  };

  const columns = [
    {
      title: intl.get('configSys.graphName'),
      dataIndex: 'name',
      ellipsis: true,
      width: 350
    },
    {
      title: intl.get('configSys.graphTime'),
      dataIndex: 'created',
      ellipsis: true,
      width: 220,
      render: text => timeFormat.timeFormat(text)
    }
  ];

  return (
    <Modal
      visible={visible}
      className="storage-graph-modal"
      title={intl.get('configSys.detail')}
      width={640}
      footer={null}
      maskClosable={false}
      destroyOnClose={true}
      focusTriggerAfterClose={false}
      onCancel={e => {
        e.stopPropagation();
        setVisible();
      }}
    >
      <div className="modal-body">
        <Table
          columns={columns}
          dataSource={tableData}
          pagination={false}
          rowKey={(record, index) => id + index}
          scroll={tableData.length > 6 ? { y: 399 } : false}
          loading={loading ? { indicator: antIconBig } : false}
          locale={{
            emptyText: (
              <div className="noData-box">
                <img src={emptyImg} alt="nodata" />
                <div className="noData-text">{intl.get('configSys.noGraph')}</div>
              </div>
            )
          }}
        />
      </div>

      <div className="modal-footer">
        <Pagination current={current} total={total} pageSize={pageSize} onChange={currentChange} showTotal={true} />
      </div>
    </Modal>
  );
};

export default memo(GraphListModal);
