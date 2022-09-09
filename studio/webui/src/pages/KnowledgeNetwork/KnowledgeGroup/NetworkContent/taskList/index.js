/* eslint-disable */
import React, { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import { Button, Select, Table, Tooltip, Menu, Dropdown, message, Modal, ConfigProvider, Radio } from 'antd';
import { EllipsisOutlined, LoadingOutlined, ExclamationCircleFilled } from '@ant-design/icons';

import HOOKS from '@/hooks';
import serviceTaskManagement from '@/services/taskManagement';
import IconFont from '@/components/IconFont';
import ErrorModal from './errorModal';
import DeleteModal from './deleteModal';
import ScheduleModal from './scheduleModal';

import kong from '@/assets/images/kong.svg';
import full from '@/assets/images/quanliang.svg';
import noResult from '@/assets/images/noResult.svg';
import increment from '@/assets/images/zengliang.svg';

import './style.less';

const { Option } = Select;
const pageSize = 20;
let runSingal = false;
const antIconBig = <LoadingOutlined className="table-loading-icon" style={{ fontSize: 24, top: '200px' }} spin />;

const TaskList = props => {
  const { selectedGraph, tabsKey, onUpdateGraphStatus } = props;

  const [taskType, setTaskType] = useState('all'); // 构建类型
  const [triggerType, setTriggerType] = useState('all'); // 触发类型
  const [status, setStatus] = useState('all'); // 状态
  const [loading, setLoading] = useState(false); // 加载状态
  const [selectKey, setSelectKey] = useState(0); // 选择的行
  const [tableData, setTableData] = useState([]); // 表格数据
  const [current, setCurrent] = useState(1); // 页码
  const [total, setTotal] = useState(0); // 数据总数
  const [sortOrder, setSortOrder] = useState('descend');
  const [searchName, setSearchName] = useState(''); // 模糊搜索字段
  const [operationId, setOperationId] = useState(null); // 弹框对应的表格ID
  const [errorReport, setErrorReport] = useState(null); // 错误报告弹框数据
  const [scheduleData, setScheduleData] = useState(3); // 进度数据
  const [errorModal, setErrorModal] = useState(false); // 错误报告弹框
  const [scheduleModal, setScheduleModal] = useState(false); // 进度弹框
  const [stopModal, setStopModal] = useState(false); // 停止弹框
  const [deleteModal, setDeleteModal] = useState(false); // 删除弹框
  const [updateVisible, setUpdateVisible] = useState(false); // 更新弹窗
  const [selectUpdateId, setSelectUpdateId] = useState(''); // 选择的任务id
  const [updateType, setUpdateType] = useState('increment'); // 更新方式
  const [deleteIds, setDeleteIds] = useState([]);
  const [isSearch, setIsSearch] = useState(false); // 是否是搜索

  useEffect(() => {
    setStatus('all');
    setTaskType('all');
    setTriggerType('all');
    if (!selectedGraph?.kg_conf_id) return;
    getTableData(selectedGraph.kg_conf_id, 1, pageSize, '', 'descend', status, taskType, triggerType);
  }, [selectedGraph]);

  useEffect(() => {
    if (tabsKey === '3') {
      if (!selectedGraph?.kg_conf_id) return;
      getTableData(selectedGraph.kg_conf_id, 1, pageSize, '', 'descend', status, taskType, triggerType);
    }
  }, [tabsKey]);

  // 获取表格数据
  const getTableData = async (id, page, size, search, sort, status, taskType, triggerType) => {
    setLoading(true);
    try {
      const getData = {
        page,
        size,
        status,
        order: sort,
        graph_name: search,
        task_type: taskType,
        trigger_type: triggerType
      };
      const response = await serviceTaskManagement.taskGet(id, getData);
      const { res, Code, Cause } = response || {};

      if (response.res && !Code) {
        setTableData(response.res.df);
        setTotal(response.res.count);
        setSearchName(search);
        onUpdateGraphStatus(response.res.df[0]?.task_status);
      }

      if (Code && Code === 500001) message.error(Cause);
      setLoading(false);
    } catch (error) {}
  };

  /**
   * 定时器
   * 列表定时刷新   和  进度弹框
   * 同步时间  用一个定时器
   */
  HOOKS.useInterval(async () => {
    if (['1', '3'].includes(tabsKey)) {
      const getData = {
        page: current,
        size: pageSize,
        order: sortOrder,
        status: status,
        graph_name: searchName,
        task_type: taskType,
        trigger_type: triggerType
      };
      const response = await serviceTaskManagement.taskGet(selectedGraph.kg_conf_id, getData, true);
      const { res, Code, Cause } = response || {};

      if (res && !Code) {
        setTableData(res.df);
        setTotal(res.count);
        onUpdateGraphStatus(response.res.df[0]?.task_status);
      }

      if (Code && Code === 500001) message.error(Cause);
    }

    if (scheduleModal) {
      const response = await serviceTaskManagement.taskGetProgress(operationId, true);

      const { res, Code, Cause } = response || {};

      if (res || !Code) setScheduleData(res.df[0]);
      if (Code && Code === 500021) {
        message.error(Cause || '');
        refresh();
      }

      if (Code && Code === 500001) {
        message.error(Cause || '');
      }
    }
  }, 1000 * 30);

  /**
   * 手动刷新进度列表
   */
  const scheduleRefresh = async () => {
    const response = await serviceTaskManagement.taskGetProgress(operationId);

    const { res, Code, Cause } = response || {};

    if (res || !Code) setScheduleData(res.df[0]);

    if (Code && Code === 500021) {
      message.error(Cause || '');
      // message.error('任务不存在');
      refresh();
    }

    if (Code && Code === 500001) message.error(Cause || '');
    // 500403
    if (Code === 500403 || Code === 'Manager.SoftAuth.UnknownServiceRecordError') {
      message.error(intl.get('graphList.authErr'));
      refresh();
      handleCancel();
    }
    // 500357
    if (Code === 'Manager.Graph.KnowledgeNetworkNotFoundError') {
      message.error(intl.get('graphList.hasBeenDel'));
      refresh();
      handleCancel();
    }
  };

  /**
   * 确认删除任务
   */
  const handleDeleteOk = async () => {
    const response = await serviceTaskManagement.taskDelete(operationId, deleteIds);

    const { res, Code, Cause } = response || {};

    handleCancel();
    refresh();

    if (res && !Code) message.success(intl.get('task.deleteSucc'));
    if (Code) {
      switch (true) {
        case Code === 500403 || Code === 'Manager.SoftAuth.UnknownServiceRecordError':
          message.error(intl.get('graphList.authErr'));
          break;
        case Code === 'Manager.Graph.KnowledgeNetworkNotFoundError':
          message.error(intl.get('graphList.hasBeenDel'));
          break;
        default:
          Cause && message.error(Cause);
      }
    }
  };

  /**
   * 关闭弹框统一方法
   */
  const handleCancel = () => {
    setErrorModal(false);
    setScheduleModal(false);
    setStopModal(false);
    setDeleteModal(false);
    setErrorReport(null);
  };

  /**
   * 手动刷新
   */
  const refresh = () => {
    getTableData(selectedGraph.kg_conf_id, current, pageSize, searchName, sortOrder, status, taskType, triggerType);
  };

  /**
   * 确认停止任务
   */
  const handleStopOk = async () => {
    const response = await serviceTaskManagement.taskStop(operationId);

    const { res, Code, Cause } = response || {};

    handleCancel();
    refresh();

    if (res && !Code) message.success(intl.get('task.stopSuccess'));
    if (Code) {
      switch (true) {
        case Code === 500403 || Code === 'Manager.SoftAuth.UnknownServiceRecordError':
          message.error(intl.get('graphList.authErr'));
          break;
        case Code === 'Manager.Graph.KnowledgeNetworkNotFoundError':
          message.error(intl.get('graphList.hasBeenDel'));
          break;
        default:
          Cause && message.error(Cause);
      }
    }
  };

  /**
   * 运行按钮
   * @param id 图谱id
   * @param type rabbitmq 不弹弹窗直接传入 full 全量更新
   */
  const handleRun = async (id, type) => {
    if (runSingal) return;
    // 存储管理新加判断
    tableData.forEach(item => {
      if (item.id === id) {
        if (item.effective_storage) return;
        message.error(intl.get('task.runError'));
      }
    });

    runSingal = true;
    const response = await serviceTaskManagement.taskCreate(id, { tasktype: type || updateType });
    const { res, Code, Cause } = response || {};

    setUpdateVisible(false);
    setSelectKey(0);

    if (res && !Code) message.success(intl.get('task.startRun'));
    if (Code) {
      switch (true) {
        case Code === 500403 || Code === 'Manager.SoftAuth.UnknownServiceRecordError':
          message.error(intl.get('graphList.authErr'));
          break;
        case Code === 'Manager.Graph.KnowledgeNetworkNotFoundError':
          message.error(intl.get('graphList.hasBeenDel'));
          break;
        case Code === 500055:
          message.error(intl.get('graphList.errorByCapacity'));
          break; // 知识量已超过量级限制
        default:
          Cause && message.error(Cause);
      }
    }

    refresh();
    setTimeout(() => {
      runSingal = false;
    }, 100);
  };

  /**
   * 页码切换
   */
  const currentChange = page => {
    setCurrent(page);
    getTableData(selectedGraph.kg_conf_id, page, pageSize, '', sortOrder, status, taskType, triggerType);
  };

  /**
   * 分页
   */
  const pagination = {
    current,
    total,
    pageSize,
    onChange: currentChange,
    className: 'task-management-table-pagination ',
    showTotal: total => intl.get('userManagement.total', { total }),
    showTitle: false,
    showSizeChanger: false
  };

  // 停止按钮id
  const handleStop = id => {
    setOperationId(id);
    setStopModal(true);
    setSelectKey(0);
  };

  // 状态值改变
  const statusChange = e => {
    setStatus(e);
    setIsSearch(true);
    getTableData(selectedGraph.kg_conf_id, current, pageSize, '', sortOrder, e, taskType, triggerType);
  };

  // 切换触发方式
  const triggerChange = e => {
    setTriggerType(e);
    setIsSearch(true);
    getTableData(selectedGraph.kg_conf_id, current, pageSize, '', sortOrder, status, taskType, e);
  };

  // 切换任务类型
  const taskChange = e => {
    setTaskType(e);
    setIsSearch(true);
    getTableData(selectedGraph.kg_conf_id, current, pageSize, '', sortOrder, status, e, triggerType);
  };
  /**
   * 删除按钮
   */
  const handleDelete = item => {
    setDeleteIds([item.task_id]);
    setOperationId(item.graph_id);
    setDeleteModal(true);
    setSelectKey(0);
  };

  /**
   * 状态按钮
   */
  const statusClick = async (status, id, report) => {
    if (status === 'failed') {
      setOperationId(id);
      setErrorReport(report);
      setErrorModal(true);
    }

    if (status === 'running') {
      setOperationId(id);

      const response = await serviceTaskManagement.taskGetProgress(id);
      const { res, Code, Cause } = response || {};
      if (res || !Code) {
        setScheduleData(res.df[0]);
        setScheduleModal(true);
      }

      if (Code && Code === 500021) {
        message.error(Cause || '');
        refresh();
      }

      if (Code && Code === 500001) message.error(Cause || '');
      if (Code === 500403 || Code === 'Manager.SoftAuth.UnknownServiceRecordError') {
        message.error(intl.get('graphList.authErr'));
        refresh();
      }
      if (Code === 'Manager.Graph.KnowledgeNetworkNotFoundError') {
        message.error(intl.get('graphList.hasBeenDel'));
        refresh();
      }
    }
  };

  // 运行按钮
  const runTask = () => {
    // 取消按钮focus样式
    const runBtn = document.getElementsByClassName('run')[0];
    runBtn && (runBtn.focus = false);

    if (tableData.length === 0) {
      setSelectUpdateId(selectedGraph.kg_conf_id);
      setUpdateVisible(true);
      return 0;
    }

    const { task_status, effective_storage, graph_id } = tableData[0];
    if (!effective_storage) return message.error('图谱存储地址无效,您可以重新配置再运行');
    if (task_status === 'running' || task_status === 'waiting') {
      message.warning(intl.get('task.runing'));
      return;
    }

    setSelectUpdateId(graph_id);
    setUpdateVisible(true);
  };

  const columns = [
    {
      title: intl.get('task.buildType'),
      width: 150,
      key: 'task_type',
      dataIndex: 'task_type',
      render: text => {
        const word = text === 'full' ? intl.get('task.fu') : intl.get('task.iu');
        return word;
      }
    },
    {
      title: intl.get('task.triggerM'),
      width: 150,
      key: 'trigger_type',
      dataIndex: 'trigger_type',
      render: text => {
        switch (text) {
          case 0:
            return intl.get('task.manualB');
          case 1:
            return intl.get('task.automaticB');
          case 2:
            return intl.get('task.realTime');
          default:
            return intl.get('task.manualB');
        }
      }
    },
    {
      title: intl.get('task.status'),
      width: 156,
      key: 'task_status',
      dataIndex: 'task_status',
      render: (text, record) => {
        if (text === 'normal') {
          return (
            <span>
              <span className="status-vertex normal" />
              <span className="status-text">{intl.get('task.complete')}</span>
            </span>
          );
        }

        if (text === 'stop') {
          return (
            <span>
              <span className="status-vertex stop" />
              <span className="status-text">{intl.get('task.termination')}</span>
            </span>
          );
        }

        if (text === 'running') {
          return (
            <span>
              <span className="status-vertex running" />
              <span className="status-text">{intl.get('task.running')}</span>
              <span className="status-button" onClick={e => statusClick(text, record.graph_id)}>
                {intl.get('task.report')}
              </span>
            </span>
          );
        }

        if (text === 'waiting') {
          return (
            <span>
              <span className="status-vertex waiting" />
              <span className="status-text">{intl.get('task.waiting')}</span>
            </span>
          );
        }

        if (text === 'failed') {
          return (
            <span>
              <span className="status-vertex failed" />
              <span className="status-text">{intl.get('task.failed')}</span>
              <span className="status-button" onClick={e => statusClick(text, record.graph_id, record.error_report)}>
                {intl.get('task.report')}
              </span>
            </span>
          );
        }
      }
    },
    {
      title: intl.get('task.operation'),
      width: 122,
      render: (text, record, index) => {
        const menu = (
          <Menu>
            {record.task_status === 'running' || record.task_status === 'waiting' ? (
              <Menu.Item key="op" onClick={() => handleStop(record.graph_id)}>
                <span>{intl.get('task.termination')}</span>
              </Menu.Item>
            ) : null}

            {record.task_status === 'stop' || record.task_status === 'failed' ? (
              <Menu.Item
                key="o"
                onClick={() => {
                  setSelectUpdateId(record.graph_id);
                  if (record.trigger_type === 2) return handleRun(record.graph_id, 'full');
                  if (!record.effective_storage) return message.error(intl.get('task.runError'));
                  setUpdateVisible(true);
                }}
              >
                <span>{intl.get('task.run')}</span>
              </Menu.Item>
            ) : null}

            {record.task_status === 'normal' ? (
              <Menu.Item
                key="n"
                onClick={() => {
                  setSelectUpdateId(record.graph_id);
                  if (record.trigger_type === 2) return handleRun(record.graph_id, 'full');
                  if (!record.effective_storage) return message.error(intl.get('task.runError'));
                  setUpdateVisible(true);
                }}
              >
                <span>{intl.get('task.run')}</span>
              </Menu.Item>
            ) : null}

            <Menu.Item key="del" onClick={() => handleDelete(record)}>
              <span>{intl.get('graphList.delete')}</span>
            </Menu.Item>
          </Menu>
        );

        const menu1 = (
          <Menu>
            <Menu.Item key="del" onClick={() => handleDelete(record)}>
              <span>{intl.get('graphList.delete')}</span>
            </Menu.Item>
          </Menu>
        );

        return (
          <Dropdown
            overlay={index === 0 ? menu : menu1}
            trigger={['click']}
            overlayClassName="network-table-overlay"
            onVisibleChange={visible => (visible ? setSelectKey(record.id) : setSelectKey(0))}
          >
            <span className="icon-wrap">
              <EllipsisOutlined className="ellipsis-icon" />
            </span>
          </Dropdown>
        );
      }
    },
    {
      title: intl.get('task.number'),
      width: 136,
      key: 'info',
      dataIndex: 'info',
      render: (text, record, index) => {
        return (
          <span key={index}>
            <Tooltip
              title={
                <div className="tooltip-body">
                  <div className="tooltip-item">
                    <div className="item-title">{intl.get('task.category')}</div>
                    <div className="item-text">
                      {intl.get('task.vertexNumber')}：
                      {record.entity_num ? parseInt(record.entity_num).toLocaleString() : '--'}
                    </div>
                    <div className="item-text">
                      {intl.get('task.edgesNumber')}：
                      {record.edge_num ? parseInt(record.edge_num).toLocaleString() : '--'}
                    </div>
                  </div>
                  <div className="item-line"></div>
                  <div className="tooltip-item">
                    <div className="item-title">{intl.get('task.attr')}</div>
                    <div className="item-text">
                      {intl.get('task.vertexAttr')}：
                      {record.entity_pro_num ? parseInt(record.entity_pro_num).toLocaleString() : '--'}
                    </div>
                    <div className="item-text">
                      {intl.get('task.edgeAttr')}：
                      {record.edge_pro_num ? parseInt(record.edge_pro_num).toLocaleString() : '--'}
                    </div>
                  </div>
                  <div className="item-line"></div>
                  <div className="tooltip-item">
                    <div className="item-title">{intl.get('task.kc')}</div>
                    <div className="item-text">
                      {intl.get('task.entityNumber')}：
                      {record.graph_entity ? parseInt(record.graph_entity).toLocaleString() : '--'}
                    </div>
                    <div className="item-text">
                      {intl.get('task.relationNumber')}：
                      {record.graph_edge ? parseInt(record.graph_edge).toLocaleString() : '--'}
                    </div>
                  </div>
                </div>
              }
              placement="right"
              overlayClassName="number-tooltip"
              getPopupContainer={() => document.getElementsByClassName('new-task-list-box')[0]}
              autoAdjustOverflow={false}
              trigger={['click']}
            >
              <span className="showNumber">{intl.get('task.details')}</span>
            </Tooltip>
          </span>
        );
      }
    },
    {
      title: intl.get('task.allTime'),
      width: 128,
      key: 'all_time',
      dataIndex: 'all_time',
      render: text => text || '--'
    },
    {
      title: intl.get('task.startTime'),
      width: 206,
      key: 'start_time',
      dataIndex: 'start_time'
    },
    {
      title: intl.get('task.endTime'),
      width: 206,
      key: 'end_time',
      dataIndex: 'end_time',
      render: text => text || '--'
    }
  ];

  return (
    <div className="new-task-list-box">
      <div className="head-box">
        <div className="button-box">
          <Button type="primary" className="run" onClick={runTask}>
            <IconFont type="icon-qidong" />
            {intl.get('task.run')}
          </Button>
        </div>

        <div className="select-box">
          <div className="select-word">{intl.get('task.buildType')}</div>
          <Select className="select-search" value={taskType} onSelect={e => taskChange(e)}>
            <Option value="all" key="all">
              {intl.get('task.all')}
            </Option>
            <Option value="increment" key="increment">
              {intl.get('task.iu')}
            </Option>
            <Option value="full" key="full">
              {intl.get('task.fu')}
            </Option>
          </Select>
          <div className="select-word">{intl.get('task.triggerM')}</div>
          <Select className="select-search" value={triggerType} onSelect={e => triggerChange(e)}>
            <Option value="all" key="all">
              {intl.get('task.all')}
            </Option>
            <Option value="0" key="0">
              {intl.get('task.manualB')}
            </Option>
            <Option value="2" key="2">
              {intl.get('task.realTime')}
            </Option>
            <Option value="1" key="1">
              {intl.get('task.automaticB')}
            </Option>
          </Select>
          <div className="select-word">{intl.get('task.status')}</div>
          <Select className="status-search" value={status} onSelect={e => statusChange(e)}>
            <Option value={'all'} title="">
              {intl.get('task.all')}
            </Option>
            <Option value={'normal'} title="">
              {intl.get('task.complete')}
            </Option>
            <Option value={'stop'} title="">
              {intl.get('task.termination')}
            </Option>
            <Option value={'running'} title="">
              {intl.get('task.running')}
            </Option>
            <Option value={'waiting'} title="">
              {intl.get('task.waiting')}
            </Option>
            <Option value={'failed'} title="">
              {intl.get('task.failed')}
            </Option>
          </Select>
        </div>
      </div>
      <div className="table-box">
        <Table
          columns={columns}
          pagination={pagination}
          dataSource={tableData}
          rowKey={record => record.id}
          rowClassName={record => (record.id === selectKey ? 'selectRow' : record.task_status === 'running' && 'runBg')}
          locale={{
            emptyText:
              !isSearch && status === 'all' ? (
                <div className="nodata-box">
                  <img src={kong} alt="nodata" className="nodata-img"></img>
                  <div className="nodata-text">
                    <p>{intl.get('task.noContent')}</p>
                  </div>
                </div>
              ) : (
                <div className="nodata-box">
                  <img src={noResult} alt="nodata" className="nodata-img"></img>
                  <div className="nodata-text">{intl.get('memberManage.searchNull')}</div>
                </div>
              )
          }}
          loading={
            loading
              ? {
                  indicator: antIconBig,
                  wrapperClassName: 'onto-Loading'
                }
              : false
          }
          scroll={{ x: 350 }}
        />
      </div>
      {/* 删除弹框 */}
      <DeleteModal
        deleteModal={deleteModal}
        handleCancel={handleCancel}
        setOperationId={setOperationId}
        handleDeleteOk={handleDeleteOk}
      />
      {/* 进度弹框 */}
      <ScheduleModal
        scheduleModal={scheduleModal}
        handleCancel={handleCancel}
        setOperationId={setOperationId}
        scheduleRefresh={scheduleRefresh}
        scheduleData={scheduleData}
      />

      {/* 停止 */}
      <Modal
        visible={stopModal}
        onCancel={handleCancel}
        wrapClassName="task-stop-modal"
        focusTriggerAfterClose={false}
        // getContainer={false}
        closable={false}
        destroyOnClose={true}
        afterClose={() => setOperationId(null)}
        maskClosable={false}
        width="432px"
        style={{ top: '20vh' }}
        footer={null}
      >
        <div className="stop-modal-title">
          <ExclamationCircleFilled className="title-icon" />
          <span className="title-text">{intl.get('task.stopTask')}</span>
        </div>

        <div className="stop-modal-body">{intl.get('task.stoTaskText')}</div>

        <div className="stop-modal-footer">
          <Button className="ant-btn-default stop-modal-cannal-button" onClick={handleCancel}>
            {intl.get('task.cancel')}
          </Button>
          <Button type="primary" className="stop-modal-ok-button" onClick={handleStopOk}>
            {intl.get('task.ok')}
          </Button>
        </div>
      </Modal>

      <Modal
        className="mix-modal select"
        title={intl.get('task.mt')}
        width={480}
        footer={null}
        maskClosable={false}
        keyboard={false}
        visible={updateVisible}
        onCancel={() => {
          setUpdateVisible(false);
        }}
      >
        <div className="mix-select-content">
          <div className="select-box">
            <div className="box">
              <div
                className={updateType === 'increment' ? 'update-type update-type-seleted' : 'update-type'}
                onClick={() => {
                  setUpdateType('increment');
                }}
              >
                <div className="radio-select">
                  <Radio checked={updateType === 'increment'}></Radio>
                </div>
                <div>
                  <img src={increment} className="image"></img>
                </div>
                <div className="word">
                  <div className="title">{intl.get('task.iu')}</div>
                  <div className="des">{intl.get('task.am')}</div>
                </div>
              </div>

              <div
                className={updateType === 'full' ? 'update-type update-type-seleted' : 'update-type'}
                onClick={() => {
                  setUpdateType('full');
                }}
              >
                <div className="radio-select">
                  <Radio checked={updateType === 'full'}></Radio>
                </div>
                <div>
                  <img src={full} className="image"></img>
                </div>
                <div className="word">
                  <div className="title">{intl.get('task.fu')}</div>
                  <div className="des">{intl.get('task.fm')}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bottom">
            <ConfigProvider autoInsertSpaceInButton={false}>
              <Button
                className="ant-btn-default cancel"
                onClick={() => {
                  setUpdateVisible(false);
                }}
              >
                {[intl.get('createEntity.cancel')]}
              </Button>

              <Button
                type="primary"
                className="save"
                onClick={() => {
                  handleRun(selectUpdateId);
                }}
              >
                {[intl.get('createEntity.ok')]}
              </Button>
            </ConfigProvider>
          </div>
        </div>
      </Modal>

      {/* 错误报告弹框 */}
      <ErrorModal
        errorModal={errorModal}
        handleCancel={handleCancel}
        errorReport={errorReport}
        setOperationId={setOperationId}
      />
    </div>
  );
};

export default TaskList;
