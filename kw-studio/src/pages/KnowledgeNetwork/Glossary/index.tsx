import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import _ from 'lodash';
import TipModal from '@/components/TipModal';
import Format from '@/components/Format';
import Header from './Header';
import GlossaryTable from './GlossaryTable';
import CreateModal from './CreateModal';
import GlossaryContent from './GlossaryContent';
import BatchDeleteModalTips from './BatchDeleteModalTips/BatchDeleteModalTips';

import './style.less';
import intl from 'react-intl-universal';
import HOOKS from '@/hooks';
import { deleteGlossary, getGlossaryList } from '@/services/glossaryServices';
import { getParam } from '@/utils/handleFunction';
import { message } from 'antd';
import { GlossaryDataType } from '@/pages/KnowledgeNetwork/Glossary/types';
import GlossaryContext from '@/pages/KnowledgeNetwork/Glossary/GlossaryContext';

const { useUpdateEffect, useLatestState, useRouteCache, useAdHistory } = HOOKS;

const GlossaryManage = forwardRef<any, any>(({ knData, onChangePageSign, handleChangeSelectKn }, ref) => {
  const [routeCache, setRouteCache] = useRouteCache<any>();
  const prefixLocale = 'glossary';
  const history = useAdHistory();
  const [createModalProps, setCreateModalProps] = useState({
    visible: false,
    editData: null as GlossaryDataType | null
  });
  const [deleteModalProps, setDeleteModalProps] = useState({
    visible: false,
    deleteIds: [] as number[],
    deleteData: [] as GlossaryDataType[]
  });
  const [detailPageProps, setDetailPageProps] = useState({
    visible: false
  });
  const [batchDeleteModalTips, setBatchDeleteModalTips] = useState({
    visible: false,
    successCount: 0,
    failDataSource: []
  });

  const [tableProps, setTableProps, getTableProps] = useLatestState({
    dataSource: [] as GlossaryDataType[],
    selectedRowKeys: routeCache.tableSelectedKey ?? ([] as number[]),
    selectedRows: [] as GlossaryDataType[],
    orderField: routeCache.filterRule ?? 'create_time',
    order: routeCache.filterOrder ?? 'desc',
    searchValue: routeCache.searchValue ?? '',
    loading: false
  });
  const { pagination, onUpdatePagination, getPagination } = HOOKS.PaginationConfig({
    page: routeCache.page ?? 1
  }); // 分页信息
  const kwId = Number(getParam('id'));
  const glossaryContentRef = useRef<any>();
  const language = HOOKS.useLanguage();
  const operateBtnDisabled = useRef<boolean>(false);

  useImperativeHandle(ref, () => ({
    openExitModalVisible: glossaryContentRef.current?.openExitModalVisible
  }));

  useUpdateEffect(() => {
    refreshTableData();
  }, [kwId]);

  useEffect(() => {
    getTableData({
      page: pagination.page,
      pageSize: pagination.pageSize,
      order: tableProps.order,
      orderField: tableProps.orderField,
      searchValue: tableProps.searchValue,
      kwId
    });
  }, [pagination.page, pagination.pageSize, tableProps.order, tableProps.orderField, tableProps.searchValue]);

  const getTableData = async ({ page, pageSize, order, orderField, searchValue, kwId }: any) => {
    let tableData: GlossaryDataType[] = [];
    let total = 0;
    setTableProps(prevState => ({
      ...prevState,
      loading: true
    }));
    try {
      const data = await getGlossaryList({
        knw_id: kwId,
        page,
        size: pageSize,
        rule: orderField,
        order,
        name: searchValue
      });
      total = data.res.count;
      tableData = data.res.taxonomies;
    } catch (error) {
      const errorTip = error.type === 'message' ? error.response.ErrorDetails : error.data.ErrorDetails;
      message.error(errorTip);
    }
    setTableProps(prevState => ({
      ...prevState,
      loading: false,
      dataSource: tableData
    }));
    onUpdatePagination({ count: total });
  };

  /**
   *  刷新表格数据源
   * @param reset 是否重置到第一页  默认 true
   */
  const refreshTableData = (reset = true) => {
    if (reset) {
      if (pagination.page !== 1) {
        onUpdatePagination({ page: 1 });
        setTableProps(prevState => ({
          ...prevState,
          orderField: 'update_time',
          order: 'desc',
          searchValue: ''
        }));
      } else {
        getTableData({
          page: 1,
          pageSize: 10,
          order: 'desc',
          orderField: 'update_time',
          searchValue: '',
          kwId
        });
      }
    } else {
      getTableData({
        page: pagination.page,
        pageSize: pagination.pageSize,
        order: tableProps.order,
        orderField: tableProps.orderField,
        searchValue: tableProps.searchValue,
        kwId
      });
    }
  };

  /**
   * 排序值变化事件
   * @param data
   */
  const onSortChange = (data: any) => {
    setTableProps(prevState => ({
      ...prevState,
      ...data
    }));
    onUpdatePagination({ page: 1 });
  };

  /**
   * 表格行选中的值变化事件
   */
  const onRowChecked = (rowKeys: number[], rowData: GlossaryDataType[]) => {
    setTableProps(prevState => ({
      ...prevState,
      selectedRowKeys: rowKeys,
      selectedRows: rowData
    }));
  };

  const closeCreateModal = () => {
    setCreateModalProps(prevState => ({
      ...prevState,
      visible: false,
      editData: null
    }));
  };

  const openCreateModal = (data?: any) => {
    setCreateModalProps(prevState => ({
      ...prevState,
      visible: true,
      editData: data
    }));
  };

  const closeDeleteModal = () => {
    setDeleteModalProps(prevState => ({
      ...prevState,
      visible: false,
      deleteIds: []
    }));
  };

  const openDeleteModal = (deleteRows?: GlossaryDataType[]) => {
    const deleteData = deleteRows ?? tableProps.selectedRows;
    const ids = deleteData.map(item => item.id);
    setDeleteModalProps(prevState => ({
      ...prevState,
      visible: true,
      deleteIds: ids,
      deleteData
    }));
  };

  const handleDelete = async () => {
    if (operateBtnDisabled.current) {
      return;
    }
    try {
      operateBtnDisabled.current = true;
      const data = await deleteGlossary({
        taxonomy_ids: deleteModalProps.deleteIds,
        knw_id: kwId
      });
      if (data.res.error.length === 0) {
        message.success(intl.get('global.deleteSuccess'));
        refreshTableData(false);
      } else {
        const getErrorText = (code: string) => {
          if (code.includes('ParamError')) {
            return intl.get('glossary.paramError');
          }
          if (code.includes('UnknownError')) {
            return intl.get('glossary.unknownError');
          }
          if (code.includes('TaxonomyIdNotExist')) {
            return intl.get('glossary.taxonomyIdNotExist');
          }
          if (code.includes('NoPermissionError')) {
            return intl.get('glossary.noPermissionError');
          }
        };
        const errors: any = [];
        data.res.error.forEach((item: any) => {
          const ids = item.ErrorDetails.includes(',') ? item.ErrorDetails.split(',') : [item.ErrorDetails];
          ids.forEach((id: any) => {
            const target = deleteModalProps.deleteData.find(item => item.id === Number(id))!;
            if (target) {
              errors.push({
                name: target.name,
                reason: getErrorText(item.ErrorCode),
                key: id
              });
            }
          });
        });
        let success = [];
        if (data.res.res) {
          success = data.res.res?.split(',');
        }
        openBatchDeleteModalTips({
          successCount: success.length,
          failDataSource: errors
        });
      }
      refreshTableData();
      closeDeleteModal();
      // eslint-disable-next-line require-atomic-updates
      operateBtnDisabled.current = false;
    } catch (error) {
      refreshTableData();
      closeDeleteModal();
      const errorTip = error.type === 'message' ? error.response.ErrorDetails : error.data.ErrorDetails;
      message.error(errorTip);
      // eslint-disable-next-line require-atomic-updates
      operateBtnDisabled.current = false;
    }
  };

  const openDetailPage = () => {
    setDetailPageProps(prevState => ({
      ...prevState,
      visible: true
    }));
  };

  const closeDetailPage = () => {
    setDetailPageProps(prevState => ({
      ...prevState,
      visible: false
    }));
    refreshTableData(false);
  };

  const openAuthPage = (data: any) => {
    setRouteCache({
      tableSelectedKey: getTableProps().selectedRowKeys,
      page: getPagination().page,
      filterRule: getTableProps().orderField,
      filterOrder: getTableProps().order,
      searchValue: getTableProps().searchValue
    });
    const url = `/knowledge/glossary-auth?glossaryId=${data.id}&create_user=${data.create_user}&glossaryName=${data.name}`;
    history.push(url);
  };

  const openBatchDeleteModalTips = (data: any) => {
    setBatchDeleteModalTips(prevState => ({
      ...prevState,
      visible: true,
      ...data
    }));
  };

  const closeBatchDeleteModalTips = () => {
    setBatchDeleteModalTips(prevState => ({
      ...prevState,
      visible: false,
      successCount: 0,
      failDataSource: []
    }));
  };

  return (
    <GlossaryContext>
      <div className="glossaryRoot kw-w-100 kw-h-100">
        <Format.Title className="kw-c-header" style={{ marginBottom: 18 }}>
          {intl.get(`${prefixLocale}.glossaryTitle`)}
        </Format.Title>
        <Header
          knData={knData}
          orderField={tableProps.orderField}
          searchValue={tableProps.searchValue}
          order={tableProps.order}
          delDisabled={_.isEmpty(tableProps.selectedRowKeys)}
          onSortChange={onSortChange}
          openCreateModal={openCreateModal}
          openDeleteModal={openDeleteModal}
          refreshTableData={refreshTableData}
        />
        <GlossaryTable
          knData={knData}
          tableProps={tableProps}
          onSortChange={onSortChange}
          openCreateModal={openCreateModal}
          openDeleteModal={openDeleteModal}
          openDetailPage={openDetailPage}
          openAuthPage={openAuthPage}
          onRowChecked={onRowChecked}
          pagination={pagination}
          onChangePagination={onUpdatePagination}
        />
        {createModalProps.visible && (
          <CreateModal
            editData={createModalProps.editData}
            refreshTableData={refreshTableData}
            onClose={closeCreateModal}
            kwId={kwId}
            openDetailPage={openDetailPage}
          />
        )}
        <TipModal
          title={intl.get(`${prefixLocale}.deleteGlossaryTipTitle`)}
          content={intl.get(`${prefixLocale}.deleteGlossaryTipContent`)}
          open={deleteModalProps.visible}
          onCancel={closeDeleteModal}
          onOk={_.debounce(handleDelete, 300)}
          closable={false}
        />
        {detailPageProps.visible && (
          <GlossaryContent
            closeDetailPage={closeDetailPage}
            openCreateModal={openCreateModal}
            closeCreateModal={closeCreateModal}
            onChangePageSign={onChangePageSign}
            ref={glossaryContentRef}
            handleChangeSelectKn={handleChangeSelectKn}
          />
        )}

        {batchDeleteModalTips.visible && (
          <BatchDeleteModalTips
            columns={[
              {
                title: intl.get(`${prefixLocale}.glossaryName`),
                dataIndex: 'name',
                // width: 296,
                ellipsis: true
              },
              {
                title: intl.get(`${prefixLocale}.failsReason`),
                dataIndex: 'reason',
                width: language === 'en-US' ? 240 : 140,
                ellipsis: true
              }
            ]}
            successDataCount={batchDeleteModalTips.successCount}
            failDataSource={batchDeleteModalTips.failDataSource}
            closeBatchDeleteModalTips={closeBatchDeleteModalTips}
          />
        )}
      </div>
    </GlossaryContext>
  );
});
export default GlossaryManage;
