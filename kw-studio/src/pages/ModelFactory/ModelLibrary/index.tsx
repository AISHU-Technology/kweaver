import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import { connect } from 'react-redux';
import intl from 'react-intl-universal';
import { Modal, message } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';

import HOOKS from '@/hooks';
import { onChangeModelData } from '@/reduxConfig/action/uploadFile';
import { SUCCESS, UPLOADING, FAIL } from '@/reduxConfig/reducers/uploadFile';
import serviceModelLibrary from '@/services/modelLibrary';
import Format from '@/components/Format';

import { TYPE_EDIT } from './enums';
import Header from './Header';
import ModelTable from './ModelTable';
import ImportModel from './ImportModel';

import './style.less';

interface SortType {
  rule: string;
  order: string;
}

const ModelLibrary = (props: any) => {
  const { status: uploadStatus, onChangeModelData } = props; // redux 注入属性

  const [filter, setFilter] = useState<any>({ name: '' }); // 筛选条件
  const [sort, setSort] = useState<SortType>({ rule: 'update_time', order: 'desc' }); // 排序
  const [items, setItems] = useState<any>([]); // table 数据
  const [modelData, setModelData] = useState<{ type: string; data?: any } | null>(null); // 打开弹窗
  const [coverId, setCoverId] = useState<number | null>(null);
  const [authData, setAuthData] = useState<any>(null); // 权限数据
  const [selectedRowKeys, setSelectedRowKeys] = useState<any>([]); // table 选中的列
  const { pagination, onUpdatePagination } = HOOKS.PaginationConfig({ page: 1 }); // 分页信息
  const { page, pageSize } = pagination;

  useEffect(() => {
    getItems();
  }, [page, filter?.name, sort?.rule, sort?.order]);
  useEffect(() => {
    if (uploadStatus !== SUCCESS) return;
    if (uploadStatus !== UPLOADING) setCoverId(null);
    getItems();
  }, [uploadStatus]);

  /** 获取模型仓库列表 */
  const getItems = async () => {
    try {
      const postData = {
        page: String(page),
        size: String(pageSize),
        rule: sort.rule,
        order: sort.order,
        perm: 'display', // 模型权限
        name_key_word: filter.name || '',
        tag_key_word: filter.name || ''
      };
      const result = await serviceModelLibrary.modelGet(postData);
      if (result === null) {
        setItems([]);
        onChangeSelected([]);
        onUpdatePagination({ count: 0 });
        return;
      }

      if (!result?.res) return;
      const { count = 0, model_infos = [] } = result.res || {};
      setItems(model_infos);
      onChangeSelected([]);
      onUpdatePagination({ count });
    } catch (error) {
      const { type, response, data } = error;
      if (type === 'message') return message.error(response?.Description || '');
      message.error(data?.Description || 'Error');
    }
  };

  /** 筛选条件变更 */
  const onChangeFilter = (data: { name: string }) => {
    setFilter(data);
  };

  /** 翻页 */
  const onChangePagination = (newPagination: any) => {
    onUpdatePagination(newPagination);
  };

  /** 排序 */
  const onChangeSort = (data: SortType) => {
    onUpdatePagination({ page: 1 });
    setSort(data);
  };

  /** 打开模型仓库弹窗 */
  const onOpenCreateModel = (type: string, data?: any) => {
    const modelData: { type: string; data?: any } = { type };
    if (data) modelData.data = data;
    setModelData(modelData);
  };
  /** 关闭模型仓库弹窗 */
  const onCloseCreateModel = () => setModelData(null);
  const onOk = (type: string) => {
    if (type === TYPE_EDIT) getItems();
    onCloseCreateModel();
  };

  /** 删除模型仓库 */
  const onDelete = (model_ids: number[]) => {
    const deleteError = Modal.confirm({
      icon: <ExclamationCircleFilled style={{ color: '#F5222D' }} />,
      title: intl.get('modelLibrary.areYouSureToDelete'),
      okText: intl.get('global.ok'),
      cancelText: intl.get('global.cancel'),
      content: <div style={{ color: '#666666' }}>{intl.get('modelLibrary.onceTheModelDeleted')}</div>,
      onOk: async () => {
        try {
          const postData = { model_ids };
          const result = await serviceModelLibrary.modelDelete(postData);
          if (!result?.res) return;
          message.success(intl.get('global.delSuccess'));
          getItems();
        } catch (error) {
          const { type, response, data } = error;
          if (type === 'message') return message.error(response?.Description || '');
          message.error(data?.Description || 'Error');
        }
        deleteError.destroy();
      }
    });
  };

  /** table选中变更 */
  const onChangeSelected = (rowKeys: string[]) => {
    setSelectedRowKeys(rowKeys);
  };

  /** 上传任务所需要的数据 */
  const _onChangeModelData = (data: any) => {
    if (data?.modelData?.model_id) {
      setCoverId(data.modelData.model_id);
    }
    onChangeModelData(data);
  };

  return (
    <div className="modelLibraryRoot">
      {/* <Format.Title>{intl.get('modelFactory.customModel')}</Format.Title> */}
      <Header
        sort={sort}
        disabledImport={uploadStatus === UPLOADING}
        disabledOver={_.isEmpty(items)}
        disabledDelete={selectedRowKeys?.length <= 0}
        onChangeSort={onChangeSort}
        onDeleteBatch={() => onDelete(selectedRowKeys)}
        onChangeFilter={onChangeFilter}
        onOpenCreateModel={onOpenCreateModel}
      />
      <ModelTable
        sort={sort}
        items={items}
        filter={filter}
        coverId={uploadStatus === UPLOADING && coverId}
        pagination={pagination}
        disabledImport={uploadStatus === UPLOADING}
        selectedRowKeys={selectedRowKeys}
        onDelete={onDelete}
        onChangeSort={onChangeSort}
        onChangeSelected={onChangeSelected}
        onOpenCreateModel={onOpenCreateModel}
        onChangePagination={onChangePagination}
      />
      <ImportModel
        visible={!!modelData}
        modelData={modelData}
        onOk={onOk}
        onCancel={onCloseCreateModel}
        onChangeModelData={_onChangeModelData}
      />
    </div>
  );
};

const mapStateToProps = (state: any) => {
  return {
    /** 上传任务的状态 */
    status: state.getIn(['uploadFile', 'status'])
  };
};
const mapDispatchToProps = (dispatch: any) => ({
  /** 上传任务所需要的数据 */
  onChangeModelData: (data: { file: Blob; [key: string]: any }) => dispatch(onChangeModelData(data))
});

export default connect(mapStateToProps, mapDispatchToProps)(ModelLibrary);
