/* eslint-disable max-lines */
import React, { useState, useEffect, useImperativeHandle, useCallback, useMemo, useRef } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Button, Modal, message, Checkbox, Tooltip, Dropdown, Menu } from 'antd';
import { EllipsisOutlined, ExclamationCircleFilled, LoadingOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import apiService from '@/utils/axios-http/oldIndex';
import { localStore, formatDataSource } from '@/utils/handleFunction';
import servicesDataSource from '@/services/dataSource';
import Format from '@/components/Format';
import IconFont from '@/components/IconFont';
import SearchInput from '@/components/SearchInput';
import ContainerIsVisible from '@/components/ContainerIsVisible';
import SourceModal from './SourceModal';

import noResult from '@/assets/images/noResult.svg';
import createImg from '@/assets/images/create.svg';

import './style.less';
import KwTable from '@/components/KwTable';
import useLatestState from '@/hooks/useLatestState';

const antIcon = <LoadingOutlined style={{ fontSize: 14 }} spin />;
const antIconBig = <LoadingOutlined style={{ fontSize: 24, top: '200px' }} spin />;

const ALL = 'all';
const SEARCH = 'search';
const pageSize = 10;
const WORKFLOW_URL = '/home/workflow';
const MQ = 'rabbitmq';

const DataSource = props => {
  const { dataSourceData, setDataSourceData, useDs = [], dataSourceRef, graphId, selectedKnowledge } = props;
  const triggerSelectAll = useRef(false);
  const [sourceVisible, setSourceVisible] = useState(false);
  const [deleteVisible, setdeleteVisible] = useState(false);
  const [operation, setOperation] = useState('create');
  const [formInfo, setFormInfo] = useState({});
  const [listType, setListType] = useState(ALL);
  const [searchName, setSearchName] = useState('');
  // eslint-disable-next-line max-len
  const [selectedRowKeys, setSelectedRowKeys] = useLatestState([]);
  const [selectedRowsList, setSelectedRowsList] = useState([]);
  const [deleteData, setDeleteData] = useState([]);
  const [total, setTotal] = useState(0);
  const [current, setCurrent] = useLatestState(1);
  const [tableData, setTableData] = useState([]);
  const [sortOrder, setSortOrder] = useState('descend');
  const [listSearch, setListSearch] = useState('');
  const [selectKey, setSelectKey] = useState('');
  const [checked, setChecked] = useState(false);
  const [checkedSort, setCheckedSort] = useState('descend');
  const [tableTest, setTableTest] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteOperate, setDeleteOperate] = useState('');
  const [lockMqId, setLockMqId] = useState(0);
  const usedID = useMemo(() => useDs.map(d => d.id), [useDs]);
  const isWorkflow = useMemo(() => window.location.pathname.includes(WORKFLOW_URL), []);

  const isUnCheckAll = useMemo(() => {
    if (!isWorkflow) return false;
    return [...tableData, ...selectedRowsList].some(d => d.data_source === MQ);
  }, [tableData, selectedRowsList]);

  useImperativeHandle(dataSourceRef, () => ({
    closeModal: () => {
      setFormInfo({});
      setSelectKey('');
      setSourceVisible(false);
      setdeleteVisible(false);
      setTableTest(false);
    }
  }));

  useEffect(() => {
    if (isWorkflow) return;

    if (searchName) {
      getDatabyName(current, sortOrder, searchName);
    } else {
      getData(current, sortOrder);
    }
  }, [selectedKnowledge]);

  useEffect(() => {
    if (!graphId) return;

    getData(1, 'descend');
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

  useEffect(() => {
    if (_.isEmpty(tableData)) return;
    setTableData(tableData);
  }, [JSON.stringify(tableData)]);

  const getData = async (page, order) => {
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
    if (res?.res) {
      setTotal(res?.res?.count);
      setTableData(res?.res?.df || []);
      setCurrent(page);
      setListType(ALL);
    }

    setLoading(false);
  };

  const refreshData = useCallback(() => {
    setTimeout(() => {
      if (getData) getData(1, sortOrder);
    }, 100);
  }, [sortOrder, graphId]);

  const getDatabyName = async (page, order, seach) => {
    setCurrent(page);
    setLoading(true);
    const res = await servicesDataSource.getDsByName(
      seach,
      page,
      pageSize,
      order,
      window.sessionStorage.getItem('selectedKnowledgeId')
    );

    if (res?.res) {
      setTotal(res?.res?.count);
      setTableData(res?.res?.df || []);
      setListType(SEARCH);
    }

    setLoading(false);
  };

  const handleCancel = useCallback(() => {
    Object.keys(apiService.sources).forEach(key => {
      apiService.sources[key]('取消请求');
    });
    setFormInfo({});
    setSelectKey('');
    setSourceVisible(false);
    setdeleteVisible(false);
  }, []);

  const onCreate = () => {
    setOperation('create');
    setSourceVisible(true);
  };

  const onDelete = () => {
    setDeleteOperate('btn');
    setdeleteVisible(true);
    setDeleteData(selectedRowKeys);
  };

  const submitDelete = async () => {
    const res = await servicesDataSource.dataSourceDelete(deleteData);

    if (res?.res) {
      getData(1, sortOrder);

      const newKey = [];
      const newRow = [];

      selectedRowsList.forEach(value => {
        if (deleteData.indexOf(value.id) < 0) {
          newRow.push(value);
          newKey.push(value.id);
        }
      });
      setSelectedRowKeys(newKey);
      setSelectedRowsList(newRow);
      message.success(intl.get('datamanagement.deleteSuccessDs'));
    }

    if (res && res.Code === 500005) {
      getData(1, sortOrder);
      message.error(intl.get('datamanagement.noDelete'));

      const newKey = [];
      const newRow = [];

      selectedRowsList.forEach(value => {
        if (deleteData.indexOf(value.id) < 0) {
          newRow.push(value);
          newKey.push(value.id);
        }
      });
      setSelectedRowKeys(newKey);
      setSelectedRowsList(newRow);
    }

    if (res && res.Code === 500001) {
      message.error(intl.get('datamanagement.deleteError'));
    }

    setSelectKey('');
    setdeleteVisible(false);
  };

  const searchChange = e => {
    setSearchName(e.target.value);
  };

  const onSeach = async (isClear = false) => {
    setChecked(false);
    setSelectedRowKeys([]);
    setSelectedRowsList([]);

    if (listType === ALL) {
      if (searchName && !isClear) {
        setListSearch(searchName);
        getDatabyName(1, sortOrder, searchName);
      } else {
        getData(1, sortOrder);
      }
    }

    if (listType === SEARCH) {
      if (!searchName || isClear) {
        getData(1, sortOrder);
      } else {
        setListSearch(searchName);
        getDatabyName(1, sortOrder, searchName);
      }
    }
  };

  const currentChange = async page => {
    if (listType === ALL) {
      getData(page, sortOrder);
    } else {
      getDatabyName(page, sortOrder, listSearch);
    }
  };

  const sortOrderChange = (pagination, filters, sorter) => {
    if (checked) {
      setCheckedSort(sorter.order);
      setSelectedRowsList(selectedRowsList.reverse());
    } else if (sorter.order !== sortOrder) {
      setSortOrder(sorter.order);

      if (listType === ALL) {
        getData(current, sorter.order);
      }

      if (listType === SEARCH) {
        getDatabyName(current, sorter.order, listSearch);
      }
    }
  };

  const onSelectAll = () => {
    if (!isUnCheckAll) return;

    triggerSelectAll.current = true;
  };

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

    if (isWorkflow) {
      const mqSource = selectedRows.find(d => d.data_source === MQ);

      setLockMqId(selectedRows.length ? (mqSource ? mqSource.id : -1) : 0);
    }
  };

  const checkedChange = e => {
    setChecked(e.target.checked);

    if (e.target.checked) {
      const repData = selectedRowsList.filter(d => !usedID.includes(d.id));

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

    const doResize = () => {
      if (document.createEvent) {
        const event = document.createEvent('HTMLEvents');

        event.initEvent('resize', true, true);
        window.dispatchEvent(event);
      } else if (document.createEventObject) {
        window.fireEvent('onresize');
      }
    };

    setTimeout(() => {
      doResize();
    }, 100);
  };

  /**
   * 编辑数据源
   * @param {Object} record 行数据
   * @returns
   */
  const onEdit = record => {
    setSelectKey(record?.id);
    setFormInfo({ ...record });
    setOperation('edit');
    setSourceVisible(true);
  };

  /**
   * 复制数据源
   * @param {Object} record 行数据
   */
  const onCopy = record => {
    setSelectKey(record?.id);
    const { propertyId, data_source, dsname } = record;
    let newRecord = { ...record };

    if (!data_source.includes('as7')) {
      const cover = propertyId === 1 ? { ds_password: '' } : { ds_user: '', ds_password: '' };
      newRecord = Object.assign(newRecord, cover);
    }

    // id = -1 标识为复制数据源
    setFormInfo({ ...newRecord, id: -1, dsname: dsname + intl.get('datamanagement.endCopy'), ds_auth: '' });
    setOperation('copy');
    setSourceVisible(true);
  };

  /**
   * 点击下拉操作中的删除
   * @param {Object} record 行数据
   */
  const onOperationDel = record => {
    setSelectKey(record?.id);
    setOperation('delete');
    setDeleteData([record.id]);
    setDeleteOperate('dropdown');
    setdeleteVisible(true);
  };

  /**
   * 点击下拉操作中的测试
   * @param {Object} record 行数据
   */
  const onOperationTest = async record => {
    setSelectKey(record?.id);
    if (tableTest) return;

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
      vhost = '',
      connect_type = ''
    } = record;
    let body = {};

    if (data_source === 'as7') {
      body = {
        ds_id: id || 0,
        data_source,
        ds_address,
        ds_port: parseInt(ds_port),
        ds_auth,
        ds_path,
        queue,
        vhost,
        connect_type
      };
    } else {
      body = {
        ds_id: id || 0,
        data_source,
        ds_address,
        ds_port: parseInt(ds_port),
        ds_user,
        ds_password,
        ds_path,
        queue,
        vhost,
        connect_type
      };
    }

    setTableTest(id);

    const { res, ErrorDetails } = (await servicesDataSource.sourceConnectTest(body)) || {};

    setTableTest(false);

    if (res) {
      message.success(`${dsname} ${intl.get('datamanagement.testSuccessfullow')}`);
      return;
    }

    if (ErrorDetails) message.error(ErrorDetails);
  };

  /** 获取数据源关键字 */
  const getSourceKey = ({ connect_type, source, dataType }) => {
    const isODBC = connect_type === 'odbc';
    const isAs7 = source === 'as7';

    if (isODBC) {
      return `${source}-${connect_type}`;
    }
    if (isAs7) {
      return `${source}-${dataType}`;
    }
    return source;
  };

  const columns = [
    {
      title: intl.get('datamanagement.dataName'),
      dataIndex: 'dsname',
      ellipsis: true,
      fixed: true,
      width: 190
    },
    {
      title: intl.get('datamanagement.operation'),
      dataIndex: 'operation',
      fixed: true,
      width: 76,
      render: (_, record) => {
        return (
          <Dropdown
            trigger={['click']}
            overlay={
              <Menu>
                <Menu.Item
                  key="datamanagement.edit"
                  onClick={({ domEvent }) => {
                    domEvent.stopPropagation();
                    onEdit(record);
                  }}
                >
                  {intl.get('datamanagement.edit')}
                </Menu.Item>
                <Menu.Item
                  key="datamanagement.copy"
                  onClick={({ domEvent }) => {
                    domEvent.stopPropagation();
                    onCopy(record);
                  }}
                >
                  {intl.get('datamanagement.copy')}
                </Menu.Item>
                <Menu.Item
                  key="datamanagement.delete"
                  onClick={({ domEvent }) => {
                    domEvent.stopPropagation();
                    onOperationDel(record);
                  }}
                >
                  {intl.get('datamanagement.delete')}
                </Menu.Item>

                {isWorkflow && (
                  <Menu.Item
                    key="datamanagement.test"
                    onClick={({ domEvent }) => {
                      domEvent.stopPropagation();
                      onOperationTest(record);
                    }}
                  >
                    {tableTest ? `${antIcon} ${intl.get('datamanagement.testing')}` : intl.get('datamanagement.test')}
                  </Menu.Item>
                )}
              </Menu>
            }
          >
            <Format.Button onClick={event => event.stopPropagation()} className="kw-table-operate" type="icon">
              <EllipsisOutlined style={{ fontSize: 20 }} />
            </Format.Button>
          </Dropdown>
        );
      }
    },
    {
      title: intl.get('datamanagement.dataSource'),
      dataIndex: 'data_source',
      ellipsis: true,
      // width: 230,
      render: (source, record) => {
        const { dataType, connect_type } = record;
        const key = getSourceKey({ dataType, connect_type, source });
        const renderInfo = formatDataSource(key);

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
      // width: 180,
      render: user => user || '--'
    },
    {
      title: `${intl.get('datamanagement.database')}/${intl.get('datamanagement.path')}`,
      dataIndex: 'ds_path',
      ellipsis: true,
      render: text => text || '--'
      // width: 192
    },
    {
      title: intl.get('datamanagement.Operator'),
      dataIndex: 'update_user_name',
      ellipsis: true,
      onCell: () => ({ title: null }),
      // width: 192,
      render: (text, record) => {
        return (
          <div className="people-info">
            <div className="one">
              <div className="people" title={record?.update_user_name}>
                {record?.update_user_name}
              </div>
              {localStore.get('userInfo')?.username === record?.update_user_name ? (
                <div>【{intl.get('datamanagement.me')}】</div>
              ) : null}
            </div>
            {/* <div className="two" title={record?.update_user_email || '--'}>
              {record?.update_user_email || '--'}
            </div> */}
          </div>
        );
      }
    },
    {
      title: intl.get('datamanagement.updated'),
      dataIndex: 'update_time',
      ellipsis: true,
      // width: 192,
      sorter: true,
      defaultSortOrder: 'descend',
      sortDirections: ['ascend', 'descend', 'ascend'],
      sortOrder: checked ? checkedSort : sortOrder,
      showSorterTooltip: false
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

      if (lockMqId) {
        const disabled = lockMqId > 0 ? lockMqId !== id : data_source === MQ;
        return { disabled };
      }

      return {};
    }
  };

  // 表格分页器配置
  const pagination = {
    current,
    total,
    pageSize,
    onChange: currentChange,
    className: 'data-table-pagination',
    showTotal: total => intl.get('datamanagement.dataTotal', { total }),
    showTitle: false,
    showSizeChanger: false
  };

  return (
    <div className="dataSource">
      <Format.Title className="kw-c-header" style={{ marginBottom: 18 }}>
        {intl.get('datamanagement.datamanagement')}
      </Format.Title>
      <div className="dataSource-toolbox kw-mb-4 kw-align-center">
        <ContainerIsVisible placeholder={<span style={{ height: 32, display: 'inline-block' }} />}>
          <Button type="primary" style={{ marginRight: 12 }} onClick={onCreate}>
            <IconFont type="icon-Add" style={{ color: '#fff' }} />
            {intl.get('datamanagement.create')}
          </Button>
        </ContainerIsVisible>
        <Button
          className="ant-btn-default delete-botton"
          onClick={onDelete}
          disabled={selectedRowKeys.length <= 0}
          style={isWorkflow ? { display: 'none' } : null}
        >
          <IconFont type="icon-lajitong" />
          {intl.get('datamanagement.delete')}
        </Button>

        <span className="kw-ml-5" style={isWorkflow ? null : { display: 'none' }}>
          {intl.get('workflow.datasource.checkedNumH')}
          <span className="kw-c-primary">{selectedRowsList.length}</span>
          {intl.get('workflow.datasource.checkedNumF')}
        </span>

        <span className="quest-icon" style={isWorkflow ? null : { display: 'none' }}>
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

        <span className="workflow-selected" style={isWorkflow ? null : { display: 'none' }}>
          <Checkbox className="workflow-ds-checkbox" checked={checked} onChange={checkedChange} />
          {intl.get('workflow.datasource.onlyChecked')}
        </span>

        <span className="search-input kw-align-center">
          <SearchInput
            value={searchName}
            onChange={searchChange}
            onPressEnter={() => onSeach()}
            onClear={() => onSeach(true)}
            placeholder={intl.get('datamanagement.search')}
          />

          <Format.Button className="kw-ml-3" type="icon" tip={intl.get('global.refresh')} onClick={refreshData}>
            <IconFont type="icon-tongyishuaxin" />
          </Format.Button>
        </span>
      </div>

      <KwTable
        showHeader={false}
        lastColWidth={170}
        dataSource={tableData}
        columns={columns}
        tableLayout="fixed"
        rowSelection={rowSelection}
        rowKey={record => record.id}
        pagination={pagination}
        className={`dataSource-table ${isUnCheckAll && 'uncheck-all'}`}
        rowClassName={record => (record.id === selectKey ? 'selectRow' : '')}
        loading={loading ? { indicator: antIconBig, wrapperClassName: 'dataSource-Loading' } : false}
        emptyImage={listType === 'all' ? createImg : noResult}
        emptyText={
          listType === 'all' ? (
            <ContainerIsVisible placeholder={intl.get('datamanagement.noContent')}>
              <span>
                {intl.get('datamanagement.noDataF').split('|')[0]}
                <span className="create-span" onClick={onCreate}>
                  {intl.get('datamanagement.noDataF').split('|')[1]}
                </span>
                {intl.get('datamanagement.noDataF').split('|')[2]}
              </span>
            </ContainerIsVisible>
          ) : (
            intl.get('global.noResult2')
          )
        }
        onChange={sortOrderChange}
        scroll={{ x: '100%' }}
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
        open={deleteVisible}
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
          <span className="title-text">{intl.get('workflow.datasource.deleteTip')}</span>
        </div>
        <div className="delete-modal-body">
          {deleteOperate === 'btn' ? (
            <>
              {intl.get('datamanagement.deletetotalh')}
              <span className="total-text">{deleteData.length}</span>
              {intl.get('datamanagement.deletetotalf')}
            </>
          ) : (
            intl.get('workflow.datasource.deleteContent')
          )}
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
