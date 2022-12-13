/* eslint-disable */
import React, { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import _ from 'lodash';
import classNames from 'classnames';
import { Button, Select, Table, Tooltip, message } from 'antd';
import { LoadingOutlined, PauseOutlined } from '@ant-design/icons';
import { connect } from 'react-redux';

import HOOKS from '@/hooks';
import serviceTaskManagement from '@/services/taskManagement';
import TipModal from '@/components/TipModal';
import IconFont from '@/components/IconFont';

import ErrorModal from './errorModal';
import DeleteModal from './deleteModal';
import ScheduleModal from './scheduleModal';
import RunButton from './RunButton';
import CheckTaskGraph from './CheckTaskGraph';
import kong from '@/assets/images/kong.svg';
import noResult from '@/assets/images/noResult.svg';

import { TASK_STATUS, TRIGGER_TYPE, BUILD_TYPE } from './type';
import './style.less';

const { Option } = Select;
const pageSize = 20;
let runSingal = false;
const indicator = <LoadingOutlined style={{ fontSize: 24, color: '#54639c', top: '200px' }} spin />;

const TaskList = (props: any) => {
  const { selectedGraph, tabsKey, onUpdateGraphStatus } = props;
  const [taskType, setTaskType] = useState('all'); // 构建类型
  const [triggerType, setTriggerType] = useState('all'); // 触发类型
  const [status, setStatus] = useState('all'); // 状态
  const [loading, setLoading] = useState(false); // 加载状态
  const [selectKey, setSelectKey] = useState(0); // 选择的行
  const [tableData, setTableData] = useState<Array<any>>([]); // 表格数据
  const [current, setCurrent] = useState(1); // 页码
  const [total, setTotal] = useState(0); // 数据总数
  const [sortOrder, setSortOrder] = useState('desc');
  const [operationId, setOperationId] = useState(null); // 弹框对应的表格ID
  const [errorReport, setErrorReport] = useState(null); // 错误报告弹框数据
  const [scheduleData, setScheduleData] = useState(3); // 进度数据
  const [errorModal, setErrorModal] = useState(false); // 错误报告弹框
  const [scheduleModal, setScheduleModal] = useState(false); // 进度弹框
  const [stopModal, setStopModal] = useState(false); // 停止弹框
  const [deleteModal, setDeleteModal] = useState(false); // 删除弹框
  const [isSearch, setIsSearch] = useState(false); // 是否是搜索
  const [stopNum, setStopNum] = useState('one'); // 终止一个或多个
  const [checkVisible, setCheckVisible] = useState(false); // 查看
  const [ontoId, setOntoId] = useState(0); // 图谱本体

  useEffect(() => {
    if (tabsKey === '3') {
      setStatus('all');
      setTaskType('all');
      setTriggerType('all');
      getTableData({});
    }
  }, [tabsKey, selectedGraph]);

  useEffect(() => {
    setIsSearch(true);

    getTableData({ taskType, triggerType, status, current, sortOrder });
  }, [taskType, triggerType, status, current, sortOrder]);

  // 获取表格数据
  const getTableData = async ({
    current = 1,
    sortOrder = 'desc',
    status = 'all',
    taskType = 'all',
    triggerType = 'all'
  }) => {
    if (!selectedGraph?.kg_conf_id) return;
    setLoading(true);

    try {
      const id = selectedGraph?.kg_conf_id;
      const getData = {
        page: current,
        size: pageSize,
        status,
        order: sortOrder,
        graph_name: '',
        task_type: taskType,
        trigger_type: triggerType
      };
      const response = await serviceTaskManagement.taskGet(id, getData);
      const { ErrorCode, Description } = response || {};

      if (response?.res) {
        setTableData(response.res.df);
        setTotal(response.res.count);
        onUpdateGraphStatus(response?.res?.graph_status);
      }

      ErrorCode && message.error(Description);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
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
        status,
        graph_name: '',
        task_type: taskType,
        trigger_type: triggerType
      };
      const response = await serviceTaskManagement.taskGet(selectedGraph.kg_conf_id, getData, true);
      const { res, ErrorCode, Description } = response || {};

      if (res && !ErrorCode) {
        setTableData(res?.df);
        setTotal(res?.count);
        onUpdateGraphStatus(res?.graph_status); // 图谱的任务状态 待接口改了使用
      }

      ErrorCode && message.error(Description);
    }

    if (scheduleModal) {
      const response = await serviceTaskManagement.taskGetProgress(operationId, true);

      const { res, ErrorCode, Description } = response || {};

      if (res || !ErrorCode) return setScheduleData(res);
      ErrorCode && message.error(Description);
      refresh();
    }
  }, 1000 * 30);

  /**
   * 手动刷新
   */
  const refresh = () => {
    getTableData({ current, sortOrder, status, taskType, triggerType });
  };

  /**
   * 手动刷新进度列表
   */
  const scheduleRefresh = async () => {
    const response = await serviceTaskManagement.taskGetProgress(operationId);

    if (response?.res) return setScheduleData(response?.res);

    response?.ErrorCode && message.error(intl.get('graphList.hasBeenDel'));
    refresh();
    setScheduleModal(false);
  };

  /**
   * 状态按钮
   */
  const statusClick = async (status: any, id: any, report?: any) => {
    setOperationId(id);

    if (status === 'failed') {
      setErrorReport(report);
      setErrorModal(true);
    }

    if (status === 'running') {
      const response = await serviceTaskManagement.taskGetProgress(id);
      const { res, ErrorCode, Description } = response || {};
      if (res || !ErrorCode) {
        setScheduleData(res);
        setScheduleModal(true);
        return;
      }
      Description && message.error(Description);
      refresh();
    }
  };

  /**
   * 确认删除任务
   */
  const handleDeleteOk = async () => {
    const response = await serviceTaskManagement.taskDelete(selectedGraph?.kg_conf_id, [operationId]);

    const { res, ErrorCode, Description } = response || {};

    setDeleteModal(false);
    refresh();
    setSelectKey(0);

    if (res && !ErrorCode) message.success(intl.get('task.deleteSucc'));
    ErrorCode && message.error(Description);
  };

  /**
   * 删除按钮
   */
  const clickDelete = (item: any) => {
    setOperationId(item.task_id);
    setDeleteModal(true);
  };

  // 终止按钮
  const handleStop = (type = 'one', id?: any) => {
    setOperationId(id);
    setStopNum(type);
    setStopModal(true);
  };

  /**
   * 确认停止任务
   */
  const handleStopOk = async () => {
    console.log('selectedGraph:', stopNum, selectedGraph);

    const data = stopNum === 'all' ? { graph_id: parseInt(selectedGraph?.kg_conf_id) } : { task_id: operationId };

    const response = await serviceTaskManagement.taskStop(data);
    const { res, ErrorCode, Description } = response || {};
    setStopModal(false);
    refresh();
    setSelectKey(0);
    if (res && !ErrorCode) return message.success(intl.get('task.stopSuccess'));
    ErrorCode && message.error(Description);
  };

  /**
   * 立即运行
   * @param id 图谱id
   * @param type rabbitmq 不弹弹窗直接传入 full 全量更新
   */
  const handleRunNow = async (id: any, type: string) => {
    if (runSingal) return;
    const runBtn = document.getElementsByClassName('runBg')?.[0] as any;
    runBtn && (runBtn.focus = false);

    const { effective_storage, trigger_type } = tableData?.[0] || {};
    if (!effective_storage) return message.error('图谱存储地址无效,您可以重新配置再运行');
    const tasktype = trigger_type === '2' ? 'full' : type;

    runSingal = true;
    const response = await serviceTaskManagement.taskCreate(id, { tasktype });
    const { res, Code, Cause } = response || {};

    setSelectKey(0);

    if (res && !Code) message.success(intl.get('task.startRun'));
    if (Code) {
      switch (true) {
        case Code === 500403 || Code === 'Studio.SoftAuth.UnknownServiceRecordError':
          message.error(intl.get('graphList.authErr'));
          break;
        case Code === 'Studio.Graph.KnowledgeNetworkNotFoundError':
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

  const subgraphData = async (item: any) => {
    if (item?.subgraph_id === 0) {
      const id = selectedGraph?.otl.replace(/[^0-9]/gi, '');
      setOntoId(id);
    }
    setOperationId(item?.task_id);
    setCheckVisible(true);
  };

  const columns: Array<any> = [
    {
      title: intl.get('task.taskName'),
      width: 200,
      key: 'name',
      dataIndex: 'task_name',
      ellipsis: true,
      render: (text: any) => {
        return <div className="ad-ellipsis"> {text === 'ungrouped' ? '未分组' : text}</div>;
      }
    },
    {
      title: intl.get('task.buildType'),
      width: 150,
      key: 'task_type',
      dataIndex: 'task_type',
      render: (text: any) => {
        return text === 'full' ? intl.get('task.fu') : intl.get('task.iu');
      }
    },
    {
      title: intl.get('task.triggerM'),
      width: 150,
      key: 'trigger_type',
      dataIndex: 'trigger_type',
      render: (text: any) => {
        return TRIGGER_TYPE[text] ? intl.get(TRIGGER_TYPE[text]) : intl.get('task.manualB');
      }
    },
    {
      title: intl.get('task.status'),
      width: 164,
      key: 'task_status',
      dataIndex: 'task_status',
      render: (text: any, record: any) => {
        // waiting normal stop running failed
        if (text === 'running' || text === 'failed') {
          return (
            <span>
              <span className={classNames('status-vertex', `${text}`)} />
              <span className="status-text">
                {text === 'running' ? intl.get('task.running') : intl.get('task.failed')}
              </span>
              <span className="status-button" onClick={() => statusClick(text, record?.task_id, record?.error_report)}>
                {intl.get('task.report')}
              </span>
            </span>
          );
        }

        return (
          <span>
            <span className={classNames('status-vertex', `${text}`)} />
            <span className="status-text">{intl.get(`task.${text}`)}</span>
          </span>
        );
      }
    },
    {
      title: intl.get('task.allTime'),
      width: 128,
      key: 'all_time',
      dataIndex: 'all_time',
      render: (text: any) => text || '--'
    },
    {
      title: intl.get('task.pulseOnTime'),
      width: 206,
      key: 'start_time',
      dataIndex: 'start_time',
      sorter: true,
      defaultSortOrder: 'descend',
      sortDirections: ['ascend', 'descend', 'ascend'],
      render: (text: any) => text || '--'
    },
    {
      title: intl.get('task.endTime'),
      width: 206,
      key: 'end_time',
      dataIndex: 'end_time',
      render: (text: any) => text || '--'
    },
    {
      title: intl.get('task.operation'),
      fixed: 'right',
      width: 280,
      render: (text: any, record: any, index: number) => {
        return (
          <div className="ad-center columnOp" style={{ justifyContent: 'flex-start' }}>
            {(record.task_status === 'running' || record.task_status === 'waiting') && (
              <Button type="link" className="task-btn" onClick={() => handleStop('one', record?.task_id)}>
                {intl.get('task.termination')}
              </Button>
            )}

            {(record.task_status === 'stop' || record.task_status === 'failed' || record.task_status === 'normal') && (
              <Button type="link" className="task-btn" disabled>
                {intl.get('task.termination')}
              </Button>
            )}

            <Button type="link" className="task-btn" onClick={() => subgraphData(record)}>
              {intl.get('task.showNumber')}
            </Button>

            <Tooltip
              title={
                <div className="tooltip-body">
                  <ToolTipItem
                    entity={record.entity_num}
                    edge={record.edge_num}
                    text={['task.category', 'task.vertexNumber', 'task.edgesNumber']}
                  />
                  <ToolTipItem
                    entity={record.entity_pro_num}
                    edge={record.edge_pro_num}
                    text={['task.attr', 'task.vertexAttr', 'task.edgeAttr']}
                  />
                  <ToolTipItem
                    entity={record.graph_entity}
                    edge={record.graph_edge}
                    text={['task.kc', 'task.entityNumber', 'task.relationNumber']}
                  />
                </div>
              }
              placement="left"
              overlayClassName="number-tooltip"
              getPopupContainer={() => document.getElementById('table-box') || document.body}
              autoAdjustOverflow={false}
              trigger={['click']}
            >
              <Button type="link" className="task-btn">
                {intl.get('task.details')}
              </Button>
            </Tooltip>

            <Button type="link" className="task-btn" onClick={() => clickDelete(record)}>
              {intl.get('task.delete')}
            </Button>
          </div>
        );
      }
    }
  ];

  const ToolTipItem = (props: any) => {
    return (
      <div className="tooltip-item">
        <div className="item-title">{intl.get(props.text[0])}</div>
        <div className="item-text">
          {intl.get(props.text[1])}：{props.entity ? parseInt(props.entity).toLocaleString() : '--'}
        </div>
        <div className="item-text">
          {intl.get(props.text[2])}：{props.edge ? parseInt(props.edge).toLocaleString() : '--'}
        </div>
      </div>
    );
  };

  const pagination = {
    current,
    total,
    pageSize,
    onChange: (page: number) => setCurrent(page),
    className: 'task-management-table-pagination',
    showTotal: (total: number) => intl.get('userManagement.total', { total }),
    showTitle: false,
    showSizeChanger: false
  };

  const isRunning = () => {
    const { ad_graphStatus } = props;
    return ad_graphStatus === 'running' || ad_graphStatus === 'waiting';
  };

  return (
    <div className="new-task-list-box">
      <div className="head-box">
        <div className="button-box">
          <RunButton handleRunNow={handleRunNow} selectedGraph={selectedGraph} isRunning={isRunning()} Ok={refresh} />
          <Button type="default" className="ad-ml-2" onClick={() => handleStop('all')} disabled={!isRunning()}>
            <PauseOutlined />
            {intl.get('task.stopAll')}
          </Button>
        </div>

        <div className="ad-align-center">
          <div className="ad-mr-3">{intl.get('task.buildType')}</div>
          <Select className="select-search" value={taskType} onSelect={(e: string) => setTaskType(e)}>
            {_.map(BUILD_TYPE, item => {
              return (
                <Option value={item.value} key={item.value}>
                  {intl.get(item.intl)}
                </Option>
              );
            })}
          </Select>
          <div className="ad-mr-3">{intl.get('task.triggerM')}</div>
          <Select className="select-search" value={triggerType} onSelect={(e: string) => setTriggerType(e)}>
            {_.map(_.keys(TRIGGER_TYPE), (item: string) => {
              return (
                <Option value={item} key={item}>
                  {intl.get(TRIGGER_TYPE[item])}
                </Option>
              );
            })}
          </Select>
          <div className="ad-mr-3">{intl.get('task.status')}</div>
          <Select className="select-search" value={status} onSelect={(e: string) => setStatus(e)}>
            {_.map(TASK_STATUS, (item: any) => {
              return (
                <Option value={item.value} key={item.value}>
                  {intl.get(item.intl)}
                </Option>
              );
            })}
          </Select>
          <div className="btn-height" onClick={() => getTableData({})}>
            <IconFont type="icon-tongyishuaxin" />
          </div>
        </div>
      </div>

      <div className="table-box" id="table-box">
        <Table
          columns={columns}
          pagination={pagination}
          dataSource={tableData}
          rowKey={record => record?.task_id}
          rowClassName={record =>
            classNames({ runBg: record?.task_status === 'running' }, { selectRow: record?.task_id === selectKey })
          }
          onChange={(pagination, filters, sorter: any) => {
            const order = sorter.order === 'descend' ? 'desc' : 'asc';
            setSortOrder(order);
          }}
          onRow={record => {
            return { onClick: () => setSelectKey(record?.task_id) };
          }}
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
                  <div className="nodata-text">{intl.get('global.noResult')}</div>
                </div>
              )
          }}
          loading={loading ? { indicator } : false}
          scroll={{ x: 350 }}
        />
      </div>
      <CheckTaskGraph
        visible={checkVisible}
        handleCancel={() => {
          setOntoId(0);
          setCheckVisible(false);
        }}
        taskId={operationId}
        ontoId={ontoId}
      />
      {/* 进度弹框 */}
      <ScheduleModal
        scheduleModal={scheduleModal}
        handleCancel={() => setScheduleModal(false)}
        setOperationId={setOperationId}
        scheduleRefresh={scheduleRefresh}
        scheduleData={scheduleData}
      />
      {/* 错误报告弹框 */}
      <ErrorModal
        errorModal={errorModal}
        handleCancel={() => setErrorModal(false)}
        errorReport={errorReport}
        setOperationId={setOperationId}
      />
      {/* 删除弹框 */}
      <DeleteModal
        deleteModal={deleteModal}
        handleCancel={() => setDeleteModal(false)}
        setOperationId={setOperationId}
        handleDeleteOk={handleDeleteOk}
      />
      {/* 终止任务弹窗 */}
      <TipModal
        visible={stopModal}
        closable={false}
        title={stopNum === 'one' ? intl.get('task.stopTask') : intl.get('task.stopAllTask')}
        content={intl.get('task.stoTaskText')}
        onCancel={() => setStopModal(false)}
        onOk={handleStopOk}
      />
    </div>
  );
};

const mapStateToProps = (state: any) => {
  return {
    ad_graphStatus: state?.getIn(['knowledgeGraph'])?.toJS()?.ad_graphStatus || ''
  };
};
export default connect(mapStateToProps)(TaskList);
