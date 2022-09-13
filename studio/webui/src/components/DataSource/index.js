/* eslint-disable max-lines */
/**
 * 数据源管理
 * 构建工作流2
 * 兼容as7
 */

import React, { useState, useEffect, useImperativeHandle, useCallback, useMemo, useRef } from 'react';
import { Table, Button, Modal, message, Checkbox, Dropdown, Menu, Tooltip } from 'antd';
import { ExclamationCircleFilled, LoadingOutlined, EllipsisOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import apiService from '@/utils/axios-http';
import servicesDataSource from '@/services/dataSource';
import intl from 'react-intl-universal';
import Format from '@/components/Format';
import IconFont from '@/components/IconFont';
import SourceModal from './SourceModal';
import SearchInput from '@/components/SearchInput';
import addContentImg from '@/assets/images/create.svg';
import asImg from '@/assets/images/as.svg';
import hiveImg from '@/assets/images/hive.svg';
import mysqlImg from '@/assets/images/mysql.svg';
import mqImg from '@/assets/images/rabbitmq.svg';
import noResult from '@/assets/images/noResult.svg';
import './style.less';

const ALL = 'all'; // 列表类型 所有数据
const SEARCH = 'search'; // 列表类型 搜索数据
const pageSize = 10;
const WORKFLOW_URL = '/home/workflow';
const MQ = 'rabbitmq';
const DATA_SOURCES = {
  mysql: { icon: mysqlImg, text: 'MySQL' },
  hive: { icon: hiveImg, text: 'Hive' },
  rabbitmq: { icon: mqImg, text: 'RabbitMQ' },
  'as7-structured': { icon: asImg, text: `AnyShare 7-${intl.get('datamanagement.structured')}` },
  'as7-unstructured': { icon: asImg, text: `AnyShare 7-${intl.get('datamanagement.unstructured')}` }
};
const DELETE_ERROR_CODE = {
  500001: 'datamanagement.deleteError',
  500005: 'datamanagement.noDelete'
};
const TEST_ERROR_CODES = {
  500001: 'datamanagement.testError',
  500002: 'datamanagement.incorrectChange',
  500012: 'datamanagement.as7.needAuth',
  500013: 'datamanagement.as7.authTimeOut'
};

const DataSource = props => {
  const { dataSourceData, setDataSourceData, useDs = [], dataSourceRef, graphId, selectedKnowledge } = props;
  const triggerSelectAll = useRef(false); // 标记触发全选
  const [sourceVisible, setSourceVisible] = useState(false); // 数据源弹窗
  const [deleteVisible, setDeleteVisible] = useState(false); // 删除弹框
  const [operation, setOperation] = useState('create'); // 弹框操作类型
  const [formInfo, setFormInfo] = useState({}); // 编辑数据源时表单回填信息
  const [listType, setListType] = useState(ALL); // 列表类型
  const [searchName, setSearchName] = useState(''); // 模糊搜索
  const [selectedRowKeys, setSelectedRowKeys] = useState([]); // 多选框选中的数据的key
  const [selectedRowsList, setSelectedRowsList] = useState([]); // 多选框选中的数据
  const [deleteData, setDeleteData] = useState([]); // 要删除的数据
  const [total, setTotal] = useState(0); // 数据总数
  const [current, setCurrent] = useState(1); // 当前页码
  const [tableData, setTableData] = useState([]); // 表格数据
  const [sortOrder, setSortOrder] = useState('ascend'); // 表格排序
  const [listSearch, setListSearch] = useState('');
  const [selectKey, setSelectKey] = useState('');
  const [checked, setChecked] = useState(false);
  const [currentSelected, setCurrentSelected] = useState(1);
  const [checkedSort, setCheckedSort] = useState('ascend'); // 选中数据排序
  const [testLoading, setTestLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [operationVisible, setOperationVisible] = useState(false); // 操作下拉卡片
  const [lockMqId, setLockMqId] = useState(0); // 锁定的rabbitMQ数据源id, 0正常, > 0 禁用其他, -1禁用MQ
  const usedID = useMemo(() => useDs.map(d => d.id), [useDs]); // 已使用的数据源id
  const isWorkflow = useMemo(() => window.location.pathname.includes(WORKFLOW_URL), []); // 是否是在构建流程中
  // 含有rabbitMQ数据源时禁用全选
  const isUnCheckAll = useMemo(() => {
    if (!isWorkflow) return false;

    return [...tableData, ...selectedRowsList].some(d => d.data_source === MQ);
  }, [tableData, selectedRowsList]);

  useImperativeHandle(dataSourceRef, () => ({
    closeModal: () => {
      setFormInfo({});
      setSelectKey('');
      setSourceVisible(false);
      setDeleteVisible(false);
      setTestLoading(false);
    }
  }));

  // 数据管理界面调用
  useEffect(() => {
    if (isWorkflow || !selectedKnowledge?.id) return;

    getData(1, 'ascend');
  }, [selectedKnowledge]);

  // 图谱构建流程中调用
  useEffect(() => {
    if (!graphId) return;

    getData(1, 'ascend');
  }, [graphId]);

  useEffect(() => {
    if (dataSourceData && dataSourceData.length > 0) {
      const mqSource = dataSourceData.find(d => d.data_source === MQ);
      const keys = dataSourceData.map(d => d.id);
      const mergeKeys = [...new Set([...keys, ...usedID])];

      setLockMqId(mqSource ? mqSource.id : -1);
      setSelectedRowsList(dataSourceData);
      setSelectedRowKeys(mergeKeys);
    }
  }, [dataSourceData, usedID]);

  // 获取初始数据
  const getData = async (page, order) => {
    try {
      let res;
      setLoading(true);

      if (graphId) {
        res = await servicesDataSource.dataSourceGetByGraph(graphId, page, pageSize, order);
      } else {
        res = await servicesDataSource.dataSourceGet(
          page,
          pageSize,
          order,
          window.sessionStorage.getItem('selectedKnowledgeId')
        );
      }
      setLoading(false);

      if (res?.res) {
        setTotal(res.res.count);
        setTableData(res.res.df);
        setCurrent(page);
        setListType(ALL);
      }
    } catch (err) {
      setLoading(false);
    }
  };

  /**
   * 新建后刷新
   */
  const refreshData = useCallback(() => {
    getData(1, sortOrder);
  }, [sortOrder, graphId]);

  // 获取模糊搜索数据
  const getDataByName = async (page, order, search) => {
    try {
      setCurrent(page);
      setLoading(true);
      const res = await servicesDataSource.getDsByName(
        search,
        page,
        pageSize,
        order,
        window.sessionStorage.getItem('selectedKnowledgeId')
      );
      setLoading(false);

      if (res?.res) {
        setTotal(res.res.count);
        setTableData(res.res.df);
        setListType(SEARCH);
      }
    } catch {
      setLoading(false);
    }
  };

  /**
   * 关闭弹框
   */
  const handleCancel = useCallback(() => {
    Object.keys(apiService.sources).forEach(key => {
      apiService.sources[key]('取消请求');
    });
    setFormInfo({});
    setSelectKey('');
    setSourceVisible(false);
    setDeleteVisible(false);
  }, []);

  /**
   * 新建按钮， 打开弹框并设置默认项
   */
  const onCreate = () => {
    setOperation('create');
    setSourceVisible(true);
  };

  /**
   * 删除按钮，将选择的项加入待删除list 打开弹框
   */
  const onDelete = () => {
    setDeleteVisible(true);
    setDeleteData(selectedRowKeys);
  };

  /**
   * 确认删除，提交删除请求
   */
  const submitDelete = async () => {
    try {
      const res = await servicesDataSource.dataSourceDelete(deleteData);
      res?.res
        ? message.success(intl.get('datamanagement.deleteSuccessDs'))
        : res?.Code in DELETE_ERROR_CODE && message.error(intl.get(DELETE_ERROR_CODE[res.Code]));
      const newKey = [];
      const newRow = [];
      selectedRowsList.forEach(value => {
        if (deleteData.includes(value.id)) return;
        newRow.push(value);
        newKey.push(value.id);
      });
      setSelectedRowKeys(newKey);
      setSelectedRowsList(newRow);
      getData(1, sortOrder);
      setSelectKey('');
      setDeleteVisible(false);
    } catch {
      return 0;
    }
  };

  /**
   * 模糊查询
   */
  const onSearch = async (isClear = false) => {
    setChecked(false);

    if (!searchName || isClear) {
      getData(1, sortOrder);
      return;
    }

    setListSearch(searchName);
    getDataByName(1, sortOrder, searchName);
  };

  /**
   * 页码切换
   */
  const onPageChange = async page => {
    listType === ALL ? getData(page, sortOrder) : getDataByName(page, sortOrder, listSearch);
  };

  // 表格排序
  const sortOrderChange = (_, __, sorter) => {
    if (checked) {
      setCheckedSort(sorter.order);
      setSelectedRowsList(selectedRowsList.reverse());
    }

    if (sorter.order !== sortOrder) {
      setSortOrder(sorter.order);
      listType === ALL && getData(current, sorter.order);
      listType === SEARCH && getDataByName(current, sorter.order, listSearch);
    }
  };

  /**
   * 流程中需要对MQ数据源特殊限制, Table组件内部全选优于先于onChange事件且冒泡
   * 这里增加标记, 事件冒泡到onChange时中断(css已添加pointer-events: none)
   */
  const onSelectAll = () => {
    if (!isUnCheckAll) return;
    triggerSelectAll.current = true;
  };

  /**
   * 多选框
   */
  const selectedRowKeysChange = (rowKeys, rowsData) => {
    if (isUnCheckAll && triggerSelectAll.current) {
      triggerSelectAll.current = false;

      return;
    }

    const selectKeys = [...new Set([...rowKeys, ...usedID])];
    const selectedRows = rowsData.filter(Boolean);
    setSelectedRowsList(selectedRows);
    setSelectedRowKeys(selectKeys);
    setDataSourceData && setDataSourceData(selectedRows);

    // 流程中MQ数据源与其他数据源互斥
    if (isWorkflow) {
      const mqSource = selectedRows.find(d => d.data_source === MQ);
      setLockMqId(selectedRows.length ? (mqSource ? mqSource.id : -1) : 0);
    }
  };

  /**
   * @description 查看已选项
   */
  const checkedChange = e => {
    setChecked(e.target.checked);

    if (e.target.checked) {
      // 过滤可能重复存在的已使用数据
      const repData = selectedRowsList.filter(d => !usedID.includes(d.id));
      setCurrentSelected(1);
      setCheckedSort(sortOrder);
      setSelectedRowsList(
        [...repData, ...useDs].sort((a, b) => {
          if (sortOrder === 'ascend') {
            return a.update_time < b.update_time ? 1 : -1;
          }

          return a.update_time > b.update_time ? 1 : -1;
        })
      );
    }
  };

  /**
   * 编辑数据源
   * @param {Object} record 行数据
   * @returns
   */
  const onEdit = record => {
    setFormInfo({ ...record });
    setOperation('edit');
    setSourceVisible(true);
  };

  /**
   * 复制数据源
   * @param {Object} record 行数据
   */
  const onCopy = record => {
    const { data_source, dsname } = record;
    const reset = !data_source.includes('as') ? { ds_password: '' } : {};

    setFormInfo({
      ...record,
      ...reset,
      id: -1, // id = -1 标识为复制数据源
      dsname: dsname + intl.get('datamanagement.endCopy'),
      ds_auth: ''
    });
    setOperation('copy');
    setSourceVisible(true);
  };

  /**
   * 点击下拉操作中的删除
   * @param {Object} record 行数据
   */
  const onOperationDel = record => {
    setOperation('delete');
    setDeleteData([record.id]);
    setDeleteVisible(true);
  };

  /**
   * 点击下拉操作中的测试
   * @param {Object} record 行数据
   */
  const onOperationTest = async record => {
    if (testLoading) return;

    const {
      id,
      data_source,
      dsname,
      ds_address,
      ds_port,
      ds_auth,
      ds_path,
      ds_user,
      ds_password,
      queue = '',
      vhost = ''
    } = record;
    const otherKeys = data_source === 'as7' ? { ds_auth } : { ds_user, ds_password };
    const body = {
      ds_id: id || 0,
      data_source,
      ds_address,
      ds_port: parseInt(ds_port),
      ds_path,
      queue,
      vhost,
      ...otherKeys
    };

    try {
      setTestLoading(true);
      const res = await servicesDataSource.sourceConnectTest(body);
      setTestLoading(false);
      res?.res && message.success(`${dsname} ${intl.get('datamanagement.testSuccessfullow')}`);
      res?.Code in TEST_ERROR_CODES && message.error(`${dsname} ${intl.get(TEST_ERROR_CODES[res.Code])}`);
    } catch {
      setTestLoading(false);
    }
  };

  // 定义列表
  const columns = [
    {
      title: intl.get('datamanagement.dataName'),
      dataIndex: 'dsname',
      ellipsis: true,
      width: 190
    },
    {
      title: intl.get('datamanagement.dataSource'),
      dataIndex: 'data_source',
      ellipsis: true,
      width: 230,
      render: (source, record) => {
        const { dataType } = record;
        const renderInfo = DATA_SOURCES[source] || DATA_SOURCES[`${source}-${dataType}`];
        return renderInfo ? (
          <span>
            <img className="source-icon" src={renderInfo.icon} alt="nodata" />
            {renderInfo.text}
          </span>
        ) : null;
      }
    },
    {
      title: intl.get('datamanagement.sourceName'),
      dataIndex: 'ds_user',
      ellipsis: true,
      width: 180,
      render: user => user || '--'
    },
    {
      title: `${intl.get('datamanagement.database')}/${intl.get('datamanagement.path')}`,
      dataIndex: 'ds_path',
      ellipsis: true,
      width: 192
    },
    {
      title: intl.get('datamanagement.updated'),
      dataIndex: 'update_time',
      ellipsis: true,
      width: 192,
      sorter: true,
      defaultSortOrder: 'ascend',
      sortDirections: ['ascend', 'descend', 'ascend'],
      sortOrder: checked ? checkedSort : sortOrder,
      showSorterTooltip: false
    },
    {
      title: intl.get('datamanagement.operation'),
      fixed: 'right',
      width: 180,
      render: (_, record) => {
        return (
          <div className="ad-center columnOp" style={{ justifyContent: 'flex-start' }}>
            <Button type="link" onClick={() => onEdit(record)}>
              {intl.get('datamanagement.edit')}
            </Button>
            <Button type="link" onClick={() => onCopy(record)}>
              {intl.get('datamanagement.copy')}
            </Button>
            <Button type="link" onClick={() => onOperationDel(record)}>
              {intl.get('datamanagement.delete')}
            </Button>
          </div>
        );
      }
    }
  ];

  // 表格复选框配置
  const rowSelection = {
    fixed: true,
    type: 'checkbox',
    selectedRowKeys,
    onSelectAll,
    onChange: selectedRowKeysChange,
    preserveSelectedRowKeys: true,
    getCheckboxProps: record => {
      const { id, data_source } = record;

      if (usedID.includes(id)) {
        return { disabled: true };
      }

      // MQ数据源与其他数据源互斥
      if (lockMqId) {
        const disabled = lockMqId > 0 ? lockMqId !== id : data_source === MQ;
        return { disabled };
      }

      return {};
    }
  };

  const pagination = {
    current,
    total,
    pageSize,
    onChange: onPageChange,
    className: 'data-table-pagination',
    showTotal: total => intl.get('datamanagement.dataTotal', { total }),
    showTitle: false,
    showSizeChanger: false
  };

  const paginationBySelected = {
    current: currentSelected,
    total: selectedRowsList.length,
    pageSize,
    onChange: page => setCurrentSelected(page),
    className: 'data-table-pagination',
    showTotal: total => intl.get('datamanagement.dataTotal', { total: selectedRowsList.length }),
    showTitle: false,
    showSizeChanger: false
  };

  return (
    <div className="dataSource">
      {!isWorkflow && (
        <Format.Title className="ad-mt-5 ad-mb-5">{intl.get('datamanagement.datamanagement')}</Format.Title>
      )}

      <div className="dataSource-toolbox">
        <Button type="primary" className="ad-mr-3" onClick={onCreate}>
          <IconFont type="icon-Add" />
          {intl.get('datamanagement.add')}
        </Button>

        {!isWorkflow ? (
          <Button type="default" onClick={onDelete} disabled={selectedRowKeys.length <= 0}>
            <IconFont type="icon-lajitong" />
            {intl.get('datamanagement.delete')}
          </Button>
        ) : (
          <>
            <span className="workflow-select-length">
              {intl.get('workflow.datasource.checkedNumH')}
              <span className="select-number">{selectedRowsList.length}</span>
              {intl.get('workflow.datasource.checkedNumF')}
            </span>

            <span className="quest-icon">
              <Tooltip
                placement="bottomLeft"
                zIndex={199}
                arrowPointAtCenter
                getPopupContainer={triggerNode => triggerNode.parentNode}
                title={intl.get('datamanagement.sourceTip')}
              >
                <QuestionCircleOutlined />
              </Tooltip>
            </span>

            <span className="workflow-selected">
              <Checkbox checked={checked} onChange={checkedChange} className="workflow-ds-checkbox" />
              {intl.get('workflow.datasource.onlyChecked')}
            </span>
          </>
        )}

        <SearchInput
          className="search-input"
          onChange={e => setSearchName(e.target.value)}
          onPressEnter={() => onSearch()}
          onClear={() => onSearch(true)}
          placeholder={intl.get('datamanagement.search')}
        />
      </div>

      <Table
        dataSource={checked ? selectedRowsList : tableData}
        columns={columns}
        rowSelection={rowSelection}
        pagination={checked ? paginationBySelected : pagination}
        className={`dataSource-table ${isUnCheckAll && 'uncheck-all'}`}
        rowKey={record => record.id}
        rowClassName={record => (record.id === selectKey && operationVisible ? 'selectRow' : '')}
        tableLayout="fixed"
        loading={
          loading && {
            indicator: <LoadingOutlined className="table-loading" />
          }
        }
        locale={{
          emptyText:
            listType === 'all' ? (
              <div className="no-data-box">
                <img src={addContentImg} alt="nodata"></img>
                <div className="nodata-text">
                  <p>
                    {intl.get('datamanagement.noDataF').split('|')[0]}
                    <span className="create-span" onClick={onCreate}>
                      {intl.get('datamanagement.noDataF').split('|')[1]}
                    </span>
                    {intl.get('datamanagement.noDataF').split('|')[2]}
                  </p>
                </div>
              </div>
            ) : (
              <div className="no-data-box">
                <img src={noResult} alt="nodata" className="nodata-img"></img>
                <div className="nodata-text">{intl.get('memberManage.searchNull')}</div>
              </div>
            )
        }}
        onChange={sortOrderChange}
        scroll={{ x: '100%' }}
        onRow={() => {
          return {
            onClick: e => {
              e.currentTarget.getElementsByClassName('ant-checkbox-wrapper')[0].click();
            }
          };
        }}
      />

      {/* 新建/编辑弹窗 */}
      <SourceModal
        visible={sourceVisible}
        operation={operation}
        formInfo={formInfo}
        selectKey={selectKey}
        handleCancel={handleCancel}
        onSuccess={refreshData}
      />

      {/* 删除弹窗 */}
      <Modal
        visible={deleteVisible}
        onCancel={handleCancel}
        wrapClassName="dataSource-delete-modal"
        focusTriggerAfterClose={false}
        getContainer={false}
        closable={false}
        maskClosable={false}
        width="470px"
        footer={null}
      >
        <div className="delete-modal-title">
          <ExclamationCircleFilled className="title-icon" />
          <span className="title-text">{intl.get('datamanagement.sureDelete')}</span>
        </div>
        <div className="delete-modal-body">
          {intl.get('datamanagement.deletetotalh')}
          <span className="total-text">{deleteData.length}</span>
          {intl.get('datamanagement.deletetotalf')}
        </div>

        <div className="delete-modal-footer">
          <Button className="ant-btn-default delete-cancel" onClick={handleCancel}>
            {intl.get('datamanagement.cancel')}
          </Button>
          <Button type="primary" className="delete-ok" onClick={submitDelete}>
            {intl.get('datamanagement.ok')}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default DataSource;
