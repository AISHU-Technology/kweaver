import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Modal, Spin, Table, Input, Button } from 'antd';
import UniversalModal from '@/components/UniversalModal';
import { LoadingOutlined, ExclamationCircleFilled } from '@ant-design/icons';

import HOOKS from '@/hooks';
import HELPER from '@/utils/helper';
import servicesPermission from '@/services/rbacPermission';
import serverKnowledgeNetwork from '@/services/knowledgeNetwork';
import IconFont from '@/components/IconFont';
import PaginationCommon from '@/components/PaginationCommon';

import { ModalExportType, PaginationType, ItemType } from './type';

import knowledgeNoResult from '@/assets/images/noResult.svg';
import knowledgeEmpty from '@/assets/images/empty.svg';

import './index.less';

const NoDataBox = (props: { isShowEmpty: boolean }) => {
  return (
    <React.Fragment>
      {props.isShowEmpty ? (
        <div className="noDataBox">
          <img src={knowledgeEmpty} alt="nodata" />
          <span className="emptyText">{intl.get('knowledge.empty')}</span>
        </div>
      ) : (
        <div className="noDataBox">
          <img src={knowledgeNoResult} alt="nodata" />
          <span className="emptyText">{intl.get('global.noResult2')}</span>
        </div>
      )}
    </React.Fragment>
  );
};

/**
 * 导出弹窗
 */
const ModalExport = (props: ModalExportType) => {
  const { isVisible, knowledge, onClose } = props;

  const [items, setItems] = useState<any>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isShowEmpty, setIsShowEmpty] = useState(true);
  const { pagination, onUpdatePagination } = HOOKS.PaginationConfig({ count: 0 });

  useEffect(() => {
    if (!isVisible) return setIsShowEmpty(true);
    getGraphs({});
  }, [isVisible]);

  const getGraphs = async ({ page = 1, size = 5, name = '', order = 'desc', rule = 'update' }) => {
    try {
      setIsFetching(true);
      const postData = { knw_id: knowledge.id, page, size, name, order, rule, filter: 'export' };
      const result = await serverKnowledgeNetwork.graphGetByKnw(postData);
      setIsFetching(false);

      const { count, df } = result?.res;
      setItems(df);
      onUpdatePagination({ page, count, pageSize: size });
      if (_.isEmpty(df)) return;
      // DATA-354277 dataPermission 入参dataIds kg_conf_id -> id
      const dataIds = _.map(df, item => String(item?.id));
      // servicesPermission.dataPermission({ dataType: PERMISSION_KEYS.TYPE_KG, dataIds }).then(result => {
      //   const resKV = _.keyBy(result?.res, 'dataId');
      //   const newItems = _.map(df, item => ({ ...item, __codes: resKV?.[item?.id]?.codes }));
      //   setItems(newItems);
      // });
      setItems(df);
    } catch (e) {
      setIsFetching(false);
    }
  };

  /**
   * 按名称查询
   */
  const onChangeInput = _.debounce(e => {
    const value = e?.target?.value;
    if (isShowEmpty) {
      setIsShowEmpty(false);
    }
    const { page, pageSize } = pagination;
    getGraphs({ page, size: pageSize, name: value });
  }, 300);

  /**
   * 切换分页
   */
  const onChangePagination = (newPagination: PaginationType) => {
    const { page, pageSize } = newPagination;
    onUpdatePagination(newPagination);
    getGraphs({ page, size: pageSize });
  };

  /**
   * 导出
   */
  const onClickExport = (data: ItemType) => {
    const postData = { id: data?.id };
    const fileName = data?.name || '图谱';
    serverKnowledgeNetwork.graphOutput(postData, fileName).then(result => {
      if (result?.isSuccess) return null;
      onChangePagination({ page: 1 });
    });
  };

  const onCancel = () => {
    onClose();
  };

  const columns: any = [
    {
      key: 'name',
      title: intl.get('knowledge.knowledgeGraphName'),
      ellipsis: true,
      dataIndex: 'name'
    },
    {
      key: 'operate',
      width: 120,
      title: intl.get('knowledge.operate'),
      align: 'center',
      dataIndex: 'operate',
      render: (val: any, data: any) => {
        return (
          <Button type="link" onClick={() => onClickExport(data)}>
            {intl.get('knowledge.export')}
          </Button>
        );
      }
    }
  ];

  return (
    <UniversalModal
      open={isVisible}
      width={480}
      footer={null}
      keyboard={false}
      maskClosable={false}
      destroyOnClose={true}
      wrapClassName="modalExportRoot"
      title={intl.get('knowledge.exportKnowledgeNetwork')}
      onCancel={onCancel}
    >
      <Input
        className="searchInput"
        allowClear={true}
        placeholder={intl.get('knowledge.search')}
        prefix={<IconFont type="icon-sousuo" className="prefix" />}
        onChange={e => {
          e.persist();
          onChangeInput(e);
        }}
      />
      <div className="alertMessage">
        <ExclamationCircleFilled className="alertIcon" />
        <div className="alertText">{intl.get('knowledge.exportWarning')}</div>
      </div>
      <Spin spinning={isFetching} indicator={<LoadingOutlined style={{ fontSize: 30 }} />}>
        <div className="graphContent">
          {_.isEmpty(items) ? (
            <NoDataBox isShowEmpty={isShowEmpty} />
          ) : (
            <div className="tableContainer">
              <Table rowKey="id" size="small" pagination={false} columns={columns} dataSource={items} />
              {/* <PaginationCommon className="kw-pt-4" paginationData={pagination} onChange={onChangePagination} /> */}
            </div>
          )}
        </div>
      </Spin>
    </UniversalModal>
  );
};

export default ModalExport;
