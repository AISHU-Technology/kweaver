import React, { useState, useReducer, useEffect } from 'react';
import { Dropdown, Button, Table, Menu, Tooltip, Switch, message } from 'antd';
import { ArrowDownOutlined, LoadingOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import _ from 'lodash';

import { getParam } from '@/utils/handleFunction';
import SearchInput from '@/components/SearchInput';
import IconFont from '@/components/IconFont';
import TipModal from '@/components/TipModal';
import uploadService from '@/services/uploadKnowledge';
import serverKnowledgeNetwork from '@/services/knowledgeNetwork';
import kongImg from '@/assets/images/kong.svg';
import noResultImg from '@/assets/images/noResult.svg';
import ErrorModel from './UploadErrorModal';
import './style.less';

const SORTER_MENU = [
  { key: 'create', text: intl.get('knowledge.byCreate') },
  { key: 'update', text: intl.get('knowledge.byUpdate') }
];
type TableState = {
  loading: boolean;
  name: string;
  page: number;
  total: number;
  order: string;
  rule: string;
  upload_graph?: boolean;
};
const initState: TableState = {
  loading: false,
  name: '',
  page: 1,
  total: 0,
  rule: 'create',
  order: 'desc'
};

const reducer = (state: TableState, action: Partial<TableState>) => ({ ...state, ...action });
const reverse2Sort = (reverse: string) => (reverse === 'desc' ? 'descend' : 'ascend');
const PAGE_SIZE = 10;

const UploadSetting = (props: { tabsKey: string }) => {
  const { tabsKey } = props;
  const [tableState, dispatchTableState] = useReducer(reducer, initState);
  const [selectedRowKeys, setSelectedRowKeys] = useState<any>();
  const [selectedRows, setSelectedRows] = useState<any>();
  const [tableData, setTableData] = useState<any>([]);
  const [modalVisible, setModelVisible] = useState<any>({});
  const [errorModel, setErrorModel] = useState<any>({ visible: false, successids: [], errors: [] });
  useEffect(() => {
    if (tabsKey === 'setting') {
      getTableData({});
    }
  }, [tabsKey]);

  const getPromiss = (list: any) => {
    if (_.isEmpty(list)) return setTableData([]);
    setTableData(list);
  };

  /**
   * 获取表格数据
   */
  const getTableData = async ({ name = '', page = 1, rule = 'create', order = 'desc' }) => {
    dispatchTableState({ loading: true, page, name, order, rule });
    const knw_id = getParam('id');
    if (!knw_id) return;

    const data = { page, name, order, size: PAGE_SIZE, rule, knw_id };
    try {
      const response = await serverKnowledgeNetwork.graphGetByKnw(data);
      dispatchTableState({ loading: false });
      if (response?.res) {
        getPromiss(response?.res?.df);
        dispatchTableState({ total: response?.res?.count });
      }
    } catch (err) {
      //
    }
  };

  /**
   * 表格状态变更重新请求
   * @param state 新的状态
   */
  const onTableChange = (state?: Partial<TableState>) => {
    getTableData({ ...tableState, ...(state || {}) });
  };

  const sortOrderChange = (_: any, __: any, sorter: any, extra: any) => {
    if (extra.action !== 'sort') return;
    const rules: Record<string, string> = { updateTime: 'update', create_time: 'create' };
    const order = sorter.order === 'ascend' ? 'asc' : 'desc';
    const rule = rules[sorter.field];
    onTableChange({ page: 1, rule, order });
  };

  /**
   * 换页
   */
  const onPageChange = (page: any) => {
    onTableChange({ page });
  };

  /**
   * 图谱上传开启或关闭
   */
  const onChangeStatus = async (type: 1 | 0, opId?: any) => {
    let ids: any[] = [];
    if (opId) {
      ids = [opId];
    } else {
      ids = selectedRowKeys;
    }
    try {
      const data = { graph_ids: ids, to_be_uploaded: type };
      oncancelClose();
      const response = await uploadService.graphToUpload(data);
      if (response?.res) {
        getTableData({ ...tableState });

        if (!response?.error) {
          message.success(type === 1 ? intl.get('uploadService.openSuccess') : intl.get('uploadService.closeSuccess'));
        }
      }
      if (response?.error) {
        let errorIds: any = [];
        const successIds = getIdArray(response?.res || '');
        _.forEach(response?.error, item => {
          const { Description } = item;
          const ids = getIdArray(Description);
          errorIds = [...ids, ...errorIds];
        });

        let graphDetail = _.filter(_.concat(selectedRows, tableData), data => _.includes(errorIds, data?.id));
        graphDetail = _.unionBy(graphDetail, item => item?.id);

        setErrorModel({ visible: true, successIds, errors: graphDetail, type });
      }
      if (response?.ErrorCode) {
        message.error(response?.Description);
      }
    } catch (err) {
      //
    }
  };
  /**
   * 从报错语句中提取id
   */
  const getIdArray = (str: string) => {
    const match = /\[(.*?)\]/.exec(str);
    if (match) {
      const arrayStr = match[1];
      const array = arrayStr.split(',').map(x => parseInt(x.trim()));
      return array;
    }
    return [];
  };

  /**
   * 单个开关
   */
  const onChangeOneStatus = (e: any, id: any) => {
    const status = e ? 1 : 0;
    onChangeStatus(status, id);
  };

  /**
   * 取消
   */
  const oncancelClose = () => {
    setModelVisible({ type: '' });
  };

  /**
   * 排序
   */
  const onChangeRule = (key: string) => {
    const { order, rule } = tableState;
    if (key === rule) {
      const or = order === 'desc' ? 'asc' : 'desc';
      onTableChange({ page: 1, rule, order: or });
      return;
    }
    onTableChange({ page: 1, rule: key });
  };

  /**
   * 搜索
   */
  const onSearch = (e: any) => {
    onTableChange({ name: e?.target?.value, page: 1 });
  };

  const columns: any = [
    {
      title: intl.get('uploadService.graphName'),
      dataIndex: 'name',
      ellipsis: true,
      fixed: 'left',
      width: 400,
      render: (name: string, record: any) => {
        return (
          <div className="kw-align-center kw-w-100">
            <div className="graphImg kw-center kw-border">
              <IconFont type="icon-zhishiwangluo" className="icon" />
            </div>
            <div className="kw-ml-3 kw-w-80">
              <div className="kw-ellipsis kw-c-header kw-w-100" title={name}>
                {name}
              </div>
              <div className="kw-ellipsis kw-c-text" title={record?.id}>
                ID: {record?.id}
              </div>
            </div>
          </div>
        );
      }
    },
    {
      title: intl.get('global.desc'),
      dataIndex: 'kgDesc',
      ellipsis: true,
      width: 180,
      render: (des: string) => des || '- -'
    },
    {
      title: intl.get('global.creator'),
      dataIndex: 'createUser',
      ellipsis: true,
      width: 120
    },
    {
      title: intl.get('global.creationTime'),
      dataIndex: 'create_time',
      sorter: true,
      sortDirections: ['ascend', 'descend', 'ascend'],
      sortOrder: tableState.rule === 'create' && reverse2Sort(tableState.order),
      ellipsis: true,
      width: 200
    },
    {
      title: intl.get('global.finalOperator'),
      dataIndex: 'updateUser',
      ellipsis: true,
      width: 120
    },
    {
      title: intl.get('global.finalOperatorTime'),
      dataIndex: 'updateTime',
      sorter: true,
      sortDirections: ['ascend', 'descend', 'ascend'],
      sortOrder: tableState.rule === 'update' && reverse2Sort(tableState.order),
      width: 200
    },
    {
      title: intl.get('uploadService.uploadRadio'),
      width: 120,
      fixed: 'right',
      render: (_: string, record: any) => {
        return (
          <Switch
            checked={record?.to_be_uploaded === 1}
            onChange={e => {
              onChangeOneStatus(e, record?.kgconfid);
            }}
          />
        );
      }
    }
  ];

  /**
   * 定义复选框
   */
  const rowSelection: any = {
    fixed: true,
    type: 'checkbox',
    selectedRowKeys,
    onChange: (rowKeys: any, selectedRows: any) => {
      setSelectedRows(selectedRows);
      setSelectedRowKeys(rowKeys);
    },

    preserveSelectedRowKeys: true
  };

  return (
    <div className="uploadingSetRoot">
      <div className="kw-space-between kw-mb-6">
        <div>
          <Button
            type="primary"
            className="openBtn"
            disabled={_.isEmpty(selectedRowKeys)}
            onClick={() => onChangeStatus(1)}
          >
            <IconFont type="icon-duigou" className="check-icon" style={{ fontSize: 22 }} />
            {intl.get('uploadService.openBtn')}
          </Button>
          <Button
            className="kw-ml-2"
            disabled={_.isEmpty(selectedRowKeys)}
            onClick={() => {
              setModelVisible({ type: 'close' });
            }}
          >
            <IconFont type="icon-guanbiquxiao" />
            {intl.get('uploadService.closeBtn')}
          </Button>
        </div>
        <div>
          <SearchInput placeholder={intl.get('knowledge.search')} onChange={onSearch} debounce />
          <Dropdown
            placement="bottomLeft"
            overlay={
              <Menu selectedKeys={[tableState?.rule]} onClick={({ key }) => onChangeRule(key)}>
                {SORTER_MENU.map(({ key, text }) => (
                  <Menu.Item key={key}>
                    <ArrowDownOutlined
                      className="kw-mr-2"
                      rotate={tableState?.order === 'desc' ? 0 : 180}
                      style={{
                        opacity: tableState?.rule === key ? 0.8 : 0,
                        fontSize: 16,
                        transform: 'translateY(1px)'
                      }}
                    />
                    {text}
                  </Menu.Item>
                ))}
              </Menu>
            }
          >
            <Button className="kw-ml-3 sortDataBtn">
              <IconFont type="icon-paixu11" className="sort-icon" />
            </Button>
          </Dropdown>
          <Tooltip placement="topLeft" title={intl.get('uploadService.refresh')}>
            <Button
              className="kw-ml-3 refreshBtn"
              style={{ minWidth: 32 }}
              onClick={() => onTableChange({ loading: true })}
            >
              <IconFont type="icon-tongyishuaxin" />
            </Button>
          </Tooltip>
        </div>
      </div>
      <div>
        <Table
          columns={columns}
          dataSource={tableData}
          rowKey={record => record?.kgconfid}
          scroll={{ x: '100%' }}
          loading={tableState?.loading && { indicator: <LoadingOutlined className="loading-icon" /> }}
          onChange={sortOrderChange}
          rowSelection={rowSelection}
          pagination={{
            className: 'kw-mt-6',
            showTitle: false,
            pageSize: PAGE_SIZE,
            total: tableState?.total,
            onChange: onPageChange,
            showSizeChanger: false,
            current: tableState?.page
          }}
          locale={{
            emptyText: (
              <div className="empty-box">
                <img src={tableState?.name ? noResultImg : kongImg} alt="no data" className="kw-tip-img" />
                <div className="kw-c-text">
                  {tableState?.name ? intl.get('global.noResult2') : intl.get('uploadService.uploadSetEmpty')}
                </div>
              </div>
            )
          }}
        />
      </div>
      {/* 关闭二次确认弹窗 */}
      <TipModal
        open={modalVisible?.type === 'close'}
        closable={false}
        title={intl.get('uploadService.closeTitle')}
        content={
          <div>
            {intl.get('uploadService.closeModelDes').split('|')[0]}
            <span className="kw-c-error"> {selectedRowKeys?.length}</span>
            {intl.get('uploadService.closeModelDes').split('|')[1]}
          </div>
        }
        onCancel={() => oncancelClose()}
        onOk={() => onChangeStatus(0)}
      />
      {/* 部分失败的弹窗 */}
      <ErrorModel
        visible={errorModel.visible}
        successLength={errorModel?.successIds?.length}
        errorData={errorModel}
        onCancel={() => setErrorModel({ visible: false, successIds: [], errors: [] })}
      />
    </div>
  );
};
export default (props: any) => {
  if (props?.tabsKey === 'setting') return <UploadSetting {...props} />;
  return null;
};
