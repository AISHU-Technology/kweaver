/* eslint-disable max-lines */
import React, { useState, useEffect, useImperativeHandle, useCallback, useMemo, useRef } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Table, Button, Modal, message, Checkbox, Dropdown, Menu, Tooltip } from 'antd';
import { ExclamationCircleFilled, LoadingOutlined, EllipsisOutlined, QuestionCircleOutlined } from '@ant-design/icons';

import { PERMISSION_CODES, PERMISSION_KEYS } from '@/enums';
import HELPER from '@/utils/helper';
import apiService from '@/utils/axios-http/oldIndex';
import servicesDataSource from '@/services/dataSource';
import servicesPermission from '@/services/rbacPermission';

import IconFont from '@/components/IconFont';
import SearchInput from '@/components/SearchInput';
import { localStore, formatDataSource } from '@/utils/handleFunction';
import ContainerIsVisible from '@/components/ContainerIsVisible';

import SourceModal from './SourceModal';

import noResult from '@/assets/images/noResult.svg';
import addContentImg from '@/assets/images/create.svg';
import './style.less';
import ADTable from '@/components/ADTable';
import Format from '@/components/Format';
import { useLocation } from 'react-router-dom';

const antIcon = <LoadingOutlined className="icon" style={{ fontSize: 14 }} spin />;
const antIconBig = <LoadingOutlined className="icon" style={{ fontSize: 24, top: '200px' }} spin />;

const ALL = 'all'; // 列表类型 所有数据
const SEARCH = 'search'; // 列表类型 搜索数据
const pageSize = 10;
const WORKFLOW_URL = '/home/workflow';
const MQ = 'rabbitmq';

const DataSource = props => {
  const location = useLocation();
  const viewMode = location.state?.mode === 'view'; // 是否处于查看模式
  const {
    flowCurrent,
    dataSourceData,
    setDataSourceData,
    useDs = [],
    getNewData,
    dataSourceRef,
    graphId,
    dataNext
  } = props;
  const triggerSelectAll = useRef(false); // 标记触发全选
  const [sourceVisible, setSourceVisible] = useState(false); // 数据源弹窗
  const [deleteVisible, setdeleteVisible] = useState(false); // 删除弹框
  const [operation, setOperation] = useState('create'); // 弹框操作类型。
  const [formInfo, setFormInfo] = useState({}); // 编辑数据源时表单回填信息
  const [listType, setListType] = useState(ALL); // 列表类型。
  const [searchName, setSearchName] = useState(''); // 模糊搜索
  const [selectedRowKeys, setSelectedRowKeys] = useState([]); // 多选框选中的数据的key
  const [selectedRowsList, setSelectedRowsList] = useState([]); // 多选框选中的数据
  const [deleteData, setDeleteData] = useState([]); // 要删除的数据
  const [total, setTotal] = useState(0); // 数据总数
  const [current, setCurrent] = useState(1); // 当前页码
  const [tableData, setTableData] = useState([]); // 表格数据
  const [sortOrder, setSortOrder] = useState('descend'); // 表格排序
  const [listSearch, setListSearch] = useState('');
  const [selectKey, setSelectKey] = useState('');
  const [checked, setChecked] = useState(false);
  const [currentSelected, setCurrentSelected] = useState(1);
  const [checkedSort, setCheckedSort] = useState('descend'); // 选中数据排序
  const [tableTest, setTableTest] = useState(false);
  const [loading, setLoading] = useState(false);
  const [operationVisible, setOperationVisible] = useState(false); // 操作下拉卡片
  const [lockMqId, setLockMqId] = useState(0); // 锁定的rabbitMQ数据源id, 0正常, >0禁用其他, -1禁用MQ
  const usedID = useMemo(() => useDs.map(d => d.id), [JSON.stringify(useDs)]); // 已使用的数据源id
  const isWorkflow = useMemo(() => window.location.pathname.includes(WORKFLOW_URL), []); // 是否是在构建流程中
  const [codes, setCodes] = useState([]); // 权限

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
      setdeleteVisible(false);
      setTableTest(false);
    },
    next: dataNext
  }));

  useEffect(() => {
    if (!graphId) return;
    const knId = location?.search
      ?.slice(1)
      ?.split('&')
      ?.filter(item => item?.includes('knId'))?.[0]
      ?.split('=')[1];
    const postData = { dataType: PERMISSION_KEYS.TYPE_KN, dataIds: [String(knId)] };
    // servicesPermission.dataPermission(postData).then(result => {
    //   setCodes(result?.res?.[0]?.codes || []);
    // });
  }, [graphId]);
  useEffect(() => {
    if (_.isEmpty(tableData)) return;
    const dataIds = _.map(tableData, item => String(item.id));
    const postData = { dataType: PERMISSION_KEYS.TYPE_DS, dataIds };
    // servicesPermission.dataPermission(postData).then(result => {
    //   const codesData = _.keyBy(result?.res, 'dataId');
    //   const newTableData = _.map(tableData, item => {
    //     item.__codes = codesData?.[item.id]?.codes;
    //     return item;
    //   });
    //   setTableData(newTableData);
    // });
    setTableData(tableData);
  }, [JSON.stringify(tableData)]);

  // 数据管理界面调用
  useEffect(() => {
    if (isWorkflow) return;

    getData(1, 'descend');
  }, [getNewData]);

  // 图谱构建流程中调用
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
    if (dataSourceData?.length === 0 && tableData?.length > 0 && usedID?.length > 0) {
      const sedIdKV = {};
      _.forEach(usedID, key => {
        sedIdKV[key] = true;
      });
      const selectKeys = [...new Set([...usedID])];
      setSelectedRowKeys(selectKeys);
      const sourceData = _.filter(tableData, item => sedIdKV[item.id]);
      setDataSourceData(sourceData);
    }
  }, [tableData, usedID.toString()]);

  // 获取初始数据
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

  useEffect(() => {
    if (flowCurrent === 1 && !viewMode) {
      getData(1, sortOrder);
    }
  }, [flowCurrent]);
  /**
   * 新建后刷新
   */
  const refreshData = useCallback(() => {
    setTimeout(() => {
      if (getData) getData(1, sortOrder); // 因为是异步任务，所以需要延迟查询
    }, 100);
  }, [sortOrder, graphId]);

  // 获取模糊搜索数据
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
    setdeleteVisible(false);
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
    setdeleteVisible(true);
    setDeleteData(selectedRowKeys);
  };

  /**
   * 确认删除，提交删除请求
   */
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

  /**
   * 模糊查询输入框
   */
  const searchChange = e => {
    setSearchName(e.target.value);
  };

  /**
   * 模糊查询
   */
  const onSeach = async (isClear = false) => {
    setChecked(false);

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

  /**
   * 页码切换
   */
  const currentChange = async page => {
    if (listType === ALL) {
      getData(page, sortOrder);
    } else {
      getDatabyName(page, sortOrder, listSearch);
    }
  };

  // 表格排序
  const sortOrderChange = (pagination, filters, sorter) => {
    if (viewMode) {
      setSortOrder(sorter.order);
      setDataSourceData(dataSourceData.reverse());
      return;
    }
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
    const selectedRows = [];
    rowKeys.forEach(rowKey => {
      const rowData = [...dataSourceData, ...tableData].find(item => item.id === rowKey);
      if (rowData) {
        selectedRows.push(rowData);
      }
    });

    if (isUnCheckAll && triggerSelectAll.current) {
      triggerSelectAll.current = false;

      return;
    }

    // const selectKeys = [...new Set([...rowKeys, ...usedID])];
    // const selectedRows = rowsData.filter(Boolean);

    // 去除id
    const newData = selectedRows.map(item => {
      return item?.id;
    });
    const newSelectData = _.filter(dataSourceData, item =>
      rowKeys.length < selectedRowKeys.length
        ? selectKeys?.includes(item?.id)
        : selectedRowKeys?.includes(item?.id) && !newData?.includes(item?.id)
    );

    const newAdd = [...newSelectData, ...selectedRows];
    const selectKeys = _.map(newAdd, item => item?.id);

    setSelectedRowsList(newAdd);
    setSelectedRowKeys([]);
    setDataSourceData(newAdd);

    // 流程中MQ数据源与其他数据源互斥
    if (isWorkflow) {
      const mqSource = newAdd.find(d => d.data_source === MQ);
      setLockMqId(newAdd.length ? (mqSource ? mqSource.id : -1) : 0);
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

    // 模拟屏幕缩放事件
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
    const { propertyId } = record;

    setFormInfo({ ...record });
    setOperation('edit');
    setSourceVisible(true);
  };

  /**
   * 复制数据源
   * @param {Object} record 行数据
   */
  const onCopy = record => {
    const { propertyId, data_source, dsname } = record;
    let newRecord = { ...record };

    if (!data_source.includes('as7')) {
      const cover = propertyId === 1 ? { ds_password: '' } : { ds_user: '', ds_password: '' };

      newRecord = Object.assign(newRecord, cover);
    }

    setFormInfo({
      ...newRecord,
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
    setdeleteVisible(true);
  };

  /**
   * 点击下拉操作中的测试
   * @param {Object} record 行数据
   */
  const onOperationTest = async record => {
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

    ErrorDetails && message.error(ErrorDetails);
  };

  // 定义列表
  const columns = [
    {
      title: (
        <div>
          <span className="table-th-title">{intl.get('datamanagement.dataName')}</span>
        </div>
      ),
      dataIndex: 'dsname',
      fixed: 'left',
      ellipsis: true,
      width: 190
    },
    {
      title: (
        <div>
          <span className="table-th-title">{intl.get('datamanagement.operation')}</span>
        </div>
      ),
      ellipsis: true,
      dataIndex: 'operation',
      fixed: 'left',
      width: 76,
      render: (text, record, index) => {
        const { id } = record;
        const memu = (
          <Menu
            onClick={({ key, domEvent }) => {
              domEvent.stopPropagation();
              key === 'edit' && onEdit(record);
              key === 'copy' && onCopy(record);
              key === 'delete' && onOperationDel(record);
              key === 'test' && onOperationTest(record);
              key !== 'test' && setOperationVisible(false); // 测试不关闭下拉
            }}
          >
            {/* 编辑 */}

            <Menu.Item
              key="edit"
              disabled={
                !HELPER.getAuthorByUserInfo({
                  roleType: PERMISSION_CODES.ADF_KN_DS_EDIT,
                  userType: PERMISSION_KEYS.DS_EDIT,
                  userTypeDepend: record.__codes
                })
              }
            >
              {intl.get('datamanagement.edit')}
            </Menu.Item>

            {/* 复制 */}

            <Menu.Item
              key="copy"
              disabled={
                !HELPER.getAuthorByUserInfo({
                  roleType: PERMISSION_CODES.ADF_KN_DS_CREATE,
                  userType: PERMISSION_KEYS.DS_EDIT,
                  userTypeDepend: record.__codes
                })
              }
            >
              {intl.get('datamanagement.copy')}
            </Menu.Item>

            {/* 删除 */}
            {!isWorkflow && (
              <Menu.Item
                key="delete"
                disabled={
                  !HELPER.getAuthorByUserInfo({
                    roleType: PERMISSION_CODES.ADF_KN_DS_DELETE,
                    userType: PERMISSION_KEYS.DS_DELETE,
                    userTypeDepend: record.__codes
                  })
                }
              >
                {intl.get('datamanagement.delete')}
              </Menu.Item>
            )}

            {/* 测试链接 */}
            {isWorkflow && (
              <Menu.Item key="test">
                {tableTest ? (
                  <>
                    {antIcon}&nbsp;&nbsp;{intl.get('datamanagement.testing')}
                  </>
                ) : (
                  <>{intl.get('datamanagement.test')}</>
                )}
              </Menu.Item>
            )}
          </Menu>
        );

        return (
          <Dropdown
            visible={operationVisible && selectKey === id}
            overlay={memu}
            trigger={['click']}
            destroyPopupOnHide
            overlayClassName="data-source-operation-down min-w"
            getPopupContainer={() => document.querySelector('.dataSource')}
            onVisibleChange={isOpen => setOperationVisible(isOpen)}
          >
            {/* <span*/}
            {/*  className="icon-wrap"*/}
            {/*  onClick={e => {*/}
            {/*    e.stopPropagation();*/}
            {/*    setSelectKey(id);*/}
            {/*  }}*/}
            {/* >*/}
            {/*  <EllipsisOutlined className="ellipsis-icon" />*/}
            {/* </span>*/}
            <Format.Button
              onClick={event => {
                event.stopPropagation();
                setSelectKey(id);
              }}
              className="kw-table-operate"
              type="icon"
            >
              <EllipsisOutlined style={{ fontSize: 20 }} />
            </Format.Button>
          </Dropdown>
        );
      }
    },
    {
      title: (
        <div>
          <span className="table-th-title">{intl.get('datamanagement.dataSource')}</span>
        </div>
      ),
      dataIndex: 'data_source',
      ellipsis: true,
      onCell: () => {
        return {
          title: null
        };
      },
      // width: 230,
      render: (source, record) => {
        const { dataType, connect_type } = record;
        const key =
          connect_type === 'odbc' ? `${source}-${connect_type}` : source === 'as7' ? `${source}-${dataType}` : source;
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
      title: (
        <div>
          <span className="table-th-title">{intl.get('datamanagement.sourceName')}</span>
        </div>
      ),
      dataIndex: 'ds_user',
      ellipsis: true,
      onCell: () => {
        return {
          title: null
        };
      },
      // width: 180,
      render: (test, record, index) => {
        if (!test) return '--';
        return test;
      }
    },
    {
      title: (
        <div>
          <span className="table-th-title">
            {intl.get('datamanagement.database')}/{intl.get('datamanagement.path')}
          </span>
        </div>
      ),
      dataIndex: 'ds_path',
      ellipsis: true,
      render: text => <>{text || '--'}</>
      // width: 192
    },
    {
      title: (
        <div>
          <span className="table-th-title">{intl.get('datamanagement.Operator')}</span>
        </div>
      ),
      ellipsis: true,
      onCell: () => {
        return { title: null };
      },
      // width: 192,
      render: (text, record, index) => {
        return (
          <div className="people-info" key={index}>
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
      title: <span className="table-th-title">{intl.get('datamanagement.updated')}</span>,
      dataIndex: 'update_time',
      ellipsis: true,
      onCell: () => {
        return { title: null };
      },
      // width: 192,
      sorter: true,
      defaultSortOrder: 'descend',
      sortDirections: ['ascend', 'descend', 'ascend'],
      sortOrder: checked ? checkedSort : sortOrder,
      showSorterTooltip: false
    }
  ];

  const getColumns = () => {
    if (viewMode) {
      return columns.filter(item => item.dataIndex !== 'operation');
    }
    return columns;
  };

  // 表格复选框配置
  const rowSelection = {
    fixed: true,
    type: 'checkbox',
    selectedRowKeys,
    onSelectAll,
    onChange: selectedRowKeysChange,
    preserveSelectedRowKeys: true,
    getCheckboxProps: record => {
      const { id, propertyId, data_source } = record;

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

  const getTableData = () => {
    if (viewMode) {
      if (searchName) {
        return dataSourceData.filter(item => item.dsname.includes(searchName.trim()));
      }
      return dataSourceData;
    }
    return checked ? selectedRowsList : tableData;
  };

  // 表格分页器配置
  const pagination = {
    current,
    total: viewMode ? getTableData().length : total,
    pageSize,
    onChange: currentChange,
    className: 'data-table-pagination',
    showTotal: total => intl.get('datamanagement.dataTotal', { total }),
    showTitle: false,
    showSizeChanger: false
  };

  const paginationSelected = {
    current: currentSelected,
    total: selectedRowsList.length,
    pageSize,
    onChange: page => {
      setCurrentSelected(page);
    },
    className: 'data-table-pagination',
    showTotal: total => intl.get('datamanagement.dataTotal', { total: selectedRowsList.length }),
    showTitle: false,
    showSizeChanger: false
  };

  return (
    <div className="dataSource">
      <div className="dataSource-toolbox">
        <ContainerIsVisible
          isVisible={
            HELPER.getAuthorByUserInfo({
              roleType: PERMISSION_CODES.ADF_KN_DS_CREATE,
              userType: PERMISSION_KEYS.KN_ADD_DS,
              userTypeDepend: codes
            }) && !viewMode
          }
        >
          <Button type="primary" className="new-botton" onClick={onCreate}>
            <IconFont type="icon-Add" style={{ color: '#fff' }} />
            {intl.get('datamanagement.create')}
          </Button>
        </ContainerIsVisible>
        <ContainerIsVisible
          isVisible={HELPER.getAuthorByUserInfo({
            roleType: PERMISSION_CODES.ADF_KN_DS_DELETE,
            userType: PERMISSION_KEYS.DS_DELETE,
            userTypeDepend: codes
          })}
        >
          <Button
            className="ant-btn-default delete-botton"
            onClick={onDelete}
            disabled={selectedRowKeys.length <= 0}
            style={isWorkflow ? { display: 'none' } : null}
          >
            <IconFont type="icon-lajitong" />
            {intl.get('datamanagement.delete')}
          </Button>
        </ContainerIsVisible>
        <span style={isWorkflow ? null : { display: 'none' }} className="workflow-select-length">
          {intl.get('workflow.datasource.checkedNumH')}
          <span className="select-number">{selectedRowsList.length}</span>
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

        <span style={isWorkflow ? null : { display: 'none' }} className="workflow-selected">
          <Checkbox checked={checked} onChange={checkedChange} className="workflow-ds-checkbox" />
          {intl.get('workflow.datasource.onlyChecked')}
        </span>

        <SearchInput
          className="search-input"
          onChange={searchChange}
          onPressEnter={() => onSeach()}
          onClear={() => onSeach(true)}
          placeholder={intl.get('datamanagement.search')}
        />
      </div>

      <ADTable
        showHeader={false}
        dataSource={getTableData()}
        columns={getColumns()}
        rowSelection={!viewMode && rowSelection}
        pagination={checked ? paginationSelected : pagination}
        className={`dataSource-table ${isUnCheckAll && 'uncheck-all'}`}
        rowKey={record => record.id}
        rowClassName={record => (record.id === selectKey && operationVisible ? 'selectRow' : '')}
        tableLayout="fixed"
        loading={
          loading
            ? {
                indicator: antIconBig,
                wrapperClassName: 'dataSource-Loading'
              }
            : false
        }
        emptyImage={
          viewMode ? require('@/assets/images/empty.svg') : listType === 'all' && !searchName ? addContentImg : noResult
        }
        emptyText={
          viewMode ? (
            intl.get('datamanagement.noDataSource')
          ) : listType === 'all' && !searchName ? (
            <ContainerIsVisible
              placeholder={<p>{intl.get('datamanagement.noContent')}</p>}
              isVisible={HELPER.getAuthorByUserInfo({
                roleType: PERMISSION_CODES.ADF_KN_DS_CREATE,
                userType: PERMISSION_KEYS.KN_ADD_DS,
                userTypeDepend: codes
              })}
            >
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
        onRow={record => {
          return {
            onClick: e => {
              if (!viewMode) {
                e.currentTarget.getElementsByClassName('ant-checkbox-wrapper')[0].click();
              }
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
          <span className="title-text">{intl.get('workflow.datasource.deleteTip')}</span>
        </div>
        <div className="delete-modal-body">{intl.get('workflow.datasource.deleteContent')}</div>

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
