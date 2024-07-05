/* eslint-disable */
import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import intl from 'react-intl-universal';
import _ from 'lodash';
import classNames from 'classnames';
import { Button, Select, Table, Tooltip, message, Menu, Dropdown } from 'antd';
import { EllipsisOutlined, LoadingOutlined, PauseOutlined } from '@ant-design/icons';
import { connect } from 'react-redux';

import HOOKS from '@/hooks';
import serviceTaskManagement from '@/services/taskManagement';
import TipModal from '@/components/TipModal';
import IconFont from '@/components/IconFont';
import HELPER from '@/utils/helper';
import { GRAPH_DB_TYPE } from '@/enums';
import { getParam } from '@/utils/handleFunction';
import KwTable from '@/components/KwTable';
import ErrorModal from './errorModal';
import DeleteModal from './deleteModal';
import ScheduleModal from './scheduleModal';
import RunButton from './RunButton';
import CheckTaskGraph from './CheckTaskGraph';
import kong from '@/assets/images/kong.svg';
import noResult from '@/assets/images/noResult.svg';

import { TASK_STATUS, TRIGGER_TYPE, BUILD_TYPE } from './type';
import './style.less';
import Format from '@/components/Format';
import { ad_onChangeGraphStatus } from '@/reduxConfig/action/knowledgeGraph';
import TaskDetailModal from './TaskDetailModal/TaskDetailModal';
import KwResizeObserver from '@/components/KwResizeObserver';

const { Option } = Select;
const pageSize = 20;
let runSingal = false;
const indicator = <LoadingOutlined style={{ fontSize: 24, color: '#54639c', top: '200px' }} spin />;
const ORDER_MENU = [
  { id: 'start_time', title: intl.get('task.pulseOnTime') },
  { id: 'end_time', title: intl.get('task.endTime') }
];
const TaskList = forwardRef((props: any, ref: any) => {
  const { selectedGraph, tabsKey, onUpdateGraphStatus, ad_graphStatus } = props;
  const [taskType, setTaskType] = useState('all'); // 构建类型
  const [triggerType, setTriggerType] = useState('all'); // 触发类型
  const [status, setStatus] = useState('all'); // 状态
  const [loading, setLoading] = useState(false); // 加载状态
  const [selectKey, setSelectKey] = useState(0); // 选择的行
  const [tableData, setTableData] = useState<Array<any>>([]); // 表格数据
  const [current, setCurrent] = useState(1); // 页码
  const [total, setTotal] = useState(0); // 数据总数
  const [sortOrder, setSortOrder] = useState('desc');
  const [orderField, setOrderField] = useState('start_time');
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
  const [taskDetailModalProps, setTaskDetailModalProps] = useState({
    visible: false,
    taskData: null as any,
    data: null
  });
  const [statisticsCountModal, setStatisticsCountModal] = useState({
    visible: false,
    data: null
  });
  const [scrollY, setScrollY] = useState(200); // 图谱本体
  const graphId = useMemo(() => getParam('graphId'), []);
  useImperativeHandle(ref, () => ({
    openErrorModal
  }));
  // useEffect(() => {
  //   if (tabsKey === 'task') {
  //     setStatus('all');
  //     setTaskType('all');
  //     setTriggerType('all');
  //     getTableData({});
  //   }
  // }, [tabsKey, selectedGraph]);

  useEffect(() => {
    setIsSearch(true);

    getTableData({ taskType, triggerType, status, current, sortOrder, orderField });
  }, [taskType, triggerType, status, current, sortOrder, orderField]);

  // 获取表格数据
  const getTableData = async (param: any) => {
    const {
      current = 1,
      sortOrder = 'desc',
      status = 'all',
      taskType = 'all',
      triggerType = 'all',
      orderField = 'start_time'
    } = param;
    if (!selectedGraph?.id) return;
    setLoading(true);

    try {
      const id = selectedGraph?.id;
      const getData = {
        page: current,
        size: pageSize,
        status,
        order: sortOrder,
        graph_name: '',
        task_type: taskType,
        trigger_type: triggerType,
        rule: orderField
      };
      const response = await serviceTaskManagement.taskGet(id, getData);
      const { ErrorCode, Description } = response || {};

      if (response?.res) {
        setTableData(response.res.df);
        setTotal(response.res.count);
        onUpdateGraphStatus?.(response?.res?.graph_status);
      }

      ErrorCode && message.error(Description);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  /**
   * 打开错误弹框
   */
  const openErrorModal = (error: any) => {
    setErrorReport(error);
    setErrorModal(true);
  };

  /**
   * 定时器
   * 列表定时刷新   和  进度弹框
   * 同步时间  用一个定时器
   */
  HOOKS.useInterval(async () => {
    if (['detail', 'task'].includes(tabsKey)) {
      const getData = {
        page: current,
        size: pageSize,
        order: sortOrder,
        status,
        graph_name: '',
        task_type: taskType,
        trigger_type: triggerType,
        rule: orderField
      };
      const response = await serviceTaskManagement.taskGet(selectedGraph.id, getData, true);
      const { res, ErrorCode, Description } = response || {};

      if (res && !ErrorCode) {
        setTableData(res?.df);
        setTotal(res?.count);
        onUpdateGraphStatus?.(res?.graph_status); // 图谱的任务状态 待接口改了使用
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
    getTableData({ current, sortOrder, status, taskType, triggerType, orderField });
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
      openErrorModal(report);
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
    const response = await serviceTaskManagement.taskDelete(selectedGraph?.id, [operationId]);

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
    const data = stopNum === 'all' ? { graph_id: parseInt(selectedGraph?.id) } : { task_id: operationId };

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
    // if (!effective_storage) return message.error('图谱存储地址无效,您可以重新配置再运行');
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
        case Code === 500065:
          message.error(intl.get('uploadService.runfailed'));
          break;
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
      // const id = selectedGraph?.otl.replace(/[^0-9]/gi, '');
      const id = selectedGraph?.otl;
      // setGraphId(getParam('gcid'));
      setOntoId(id);
    }
    setOperationId(item?.task_id);
    // setCheckVisible(true);
    setStatisticsCountModal(prevState => ({
      ...prevState,
      data: item,
      visible: true
    }));
  };

  /** 获取排序规则 */
  const getSortOrder = (field: string) => {
    if (orderField !== field) return null;
    return sortOrder === 'asc' ? 'ascend' : 'descend';
  };

  const columns: Array<any> = [
    {
      title: intl.get('task.taskName'),
      width: 260,
      key: 'name',
      dataIndex: 'task_name',
      ellipsis: true,
      fixed: true,
      render: (text: any, record: any) => {
        const str = text === 'ungrouped' ? '未分组' : text;
        return (
          <div
            title={str}
            className="kw-ellipsis kw-c-text-link"
            onClick={() => {
              openTaskDetailModal(record);
            }}
          >
            {str}
          </div>
        );
      }
    },
    {
      title: intl.get('task.operation'),
      width: 80,
      fixed: true,
      render: (text: any, record: any, index: number) => {
        return (
          <Dropdown
            trigger={['click']}
            overlay={
              <Menu>
                {(record.task_status === 'running' || record.task_status === 'waiting') && (
                  <Menu.Item
                    key="termination"
                    onClick={({ domEvent }) => {
                      domEvent.stopPropagation();
                      handleStop('one', record?.task_id);
                    }}
                  >
                    {intl.get('task.termination')}
                  </Menu.Item>
                )}

                {(record.task_status === 'stop' ||
                  record.task_status === 'failed' ||
                  record.task_status === 'normal') && (
                  <Menu.Item key="termination1" disabled>
                    {intl.get('task.termination')}
                  </Menu.Item>
                )}
                <Menu.Item
                  key="details"
                  onClick={({ domEvent }) => {
                    domEvent.stopPropagation();
                    openTaskDetailModal(record);
                  }}
                >
                  {intl.get('task.details')}
                </Menu.Item>

                <Menu.Item
                  key="delete"
                  onClick={({ domEvent }) => {
                    domEvent.stopPropagation();
                    clickDelete(record);
                  }}
                >
                  {intl.get('task.delete')}
                </Menu.Item>
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
      title: intl.get('task.buildType'),
      // width: 150,
      key: 'task_type',
      dataIndex: 'task_type',
      render: (text: any) => {
        return text === 'full' ? intl.get('task.fu') : intl.get('task.iu');
      }
    },
    {
      title: intl.get('task.triggerM'),
      // width: 150,
      key: 'trigger_type',
      dataIndex: 'trigger_type',
      render: (text: any) => {
        return TRIGGER_TYPE[text] ? intl.get(TRIGGER_TYPE[text]) : intl.get('task.manualB');
      }
    },
    {
      title: intl.get('task.status'),
      // width: 164,
      key: 'task_status',
      dataIndex: 'task_status',
      render: (text: any, record: any) => {
        // waiting normal stop running failed
        if (text === 'running' || text === 'failed') {
          return (
            <span className="kw-align-center">
              <span className={classNames('status-vertex', `${text}`)} />
              <span className="status-text">
                {text === 'running' ? intl.get('task.running') : intl.get('task.failed')}
              </span>
              {text === 'failed' && (
                <Format.Button
                  type="icon"
                  onClick={() => statusClick(text, record?.task_id, record?.error_report)}
                  title={intl.get('global.detail')}
                >
                  <IconFont type="icon-wendang-xianxing" />
                </Format.Button>
              )}
            </span>
          );
        }

        return (
          <span className="kw-align-center">
            <span className={classNames('status-vertex', `${text}`)} />
            <span className="status-text">{intl.get(`task.${text}`)}</span>
          </span>
        );
      }
    },

    {
      title: intl.get('task.create_user'),
      // width: 128,
      ellipsis: true,
      key: 'create_user',
      dataIndex: 'create_user',
      render: (text: any) => <span title={text}>{text}</span> || '--'
    },
    {
      title: (
        <span className="kw-align-center">
          <span>{intl.get('task.allTime')}</span>
          <Tooltip title={intl.get('task.allTimeTip')}>
            <IconFont className="kw-c-subtext kw-ml-2" type="icon-wenhao" />
          </Tooltip>
        </span>
      ),
      // width: 128,
      key: 'all_time',
      dataIndex: 'all_time',
      render: (text: any) => text || '--'
    },
    {
      title: intl.get('task.pulseOnTime'),
      dataIndex: 'start_time',
      ellipsis: true,
      sorter: true,
      sortOrder: getSortOrder('start_time'),
      sortDirections: ['ascend', 'descend', 'ascend'],
      render: (text: any) => text || '--'
    },
    {
      title: intl.get('task.endTime'),
      dataIndex: 'end_time',
      ellipsis: true,
      sorter: true,
      sortOrder: getSortOrder('end_time'),
      sortDirections: ['ascend', 'descend', 'ascend'],
      render: (text: any) => text || '--'
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
    showSizeChanger: false,
    hideOnSinglePage: true
  };

  const isRunning = () => {
    const { ad_graphStatus } = props;
    return ad_graphStatus === 'running' || ad_graphStatus === 'waiting';
  };

  const openTaskDetailModal = (record: any) => {
    setTaskDetailModalProps(prevState => ({
      ...prevState,
      visible: true,
      taskData: record
    }));
  };
  const closeTaskDetailModal = () => {
    setTaskDetailModalProps(prevState => ({
      ...prevState,
      visible: false,
      taskData: null
    }));
  };

  const onSelectOrderMenu = ({ key }: any) => {
    if (orderField === key) {
      const targetOrder = sortOrder === 'asc' ? 'desc' : 'asc';
      setSortOrder(targetOrder);
    } else {
      setOrderField(key);
    }
  };

  /** 排序下拉选项 */
  const orderMenu = (
    <Menu className="menus" onClick={onSelectOrderMenu}>
      {_.map(ORDER_MENU, item => {
        const { id, title } = item;
        const isSelected = id === orderField;
        const iconDirection = sortOrder === 'asc' ? '' : 'direction';

        return (
          <Menu.Item key={id} className={classNames('menusItem', { selected: isSelected })}>
            <div className="icon">{isSelected && <IconFont type="icon-fanhuishangji" className={iconDirection} />}</div>
            <div>{title}</div>
          </Menu.Item>
        );
      })}
    </Menu>
  );

  const tableOrderMenu = useMemo(() => {
    return ORDER_MENU.map(item => {
      const { id, title } = item;
      return {
        id,
        intlText: title
      };
    });
  }, []);

  const onResize = _.debounce(({ height }: any) => {
    setScrollY(height - 200);
  }, 300);

  return (
    <KwResizeObserver onResize={onResize}>
      <div className="new-task-list-box kw-flex-item-full-height">
        <KwTable
          showFilter={true}
          showSearch={false}
          filterToolsOptions={[
            {
              id: 'buildType',
              label: intl.get('task.buildType'),
              optionList: BUILD_TYPE.map(item => ({
                text: intl.get(item.intl),
                value: item.value,
                key: item.value
              })),
              onHandle: (e: string) => setTaskType(e),
              value: taskType
            },
            {
              id: 'triggerType',
              label: intl.get('task.triggerM'),
              optionList: [
                {
                  text: intl.get('task.all'),
                  value: 'all',
                  key: 'all'
                },
                {
                  text: intl.get('task.manualB'),
                  value: 0,
                  key: 0
                },
                {
                  text: intl.get('task.automaticB'),
                  value: 1,
                  key: 1
                },
                {
                  text: intl.get('task.realTime'),
                  value: 2,
                  key: 2
                }
              ],
              onHandle: (e: string) => setTriggerType(e),
              value: triggerType
            },
            {
              id: 'status',
              label: intl.get('task.status'),
              optionList: TASK_STATUS.map(item => ({
                text: intl.get(item.intl),
                value: item.value,
                key: item.value
              })),
              onHandle: (e: string) => setStatus(e),
              value: status
            }
          ]}
          renderButtonConfig={[
            {
              key: '1',
              position: 'left',
              itemDom: (
                <RunButton
                  handleRunNow={handleRunNow}
                  selectedGraph={selectedGraph}
                  isRunning={isRunning()}
                  Ok={refresh}
                />
              )
            },
            {
              key: '2',
              position: 'left',
              itemDom: (
                <Button type="default" className="kw-ml-2" onClick={() => handleStop('all')} disabled={!isRunning()}>
                  <PauseOutlined />
                  {intl.get('task.stopAll')}
                </Button>
              )
            },
            {
              key: 'order',
              type: 'order',
              position: 'right',
              orderMenu: tableOrderMenu,
              orderField: orderField,
              order: sortOrder,
              onOrderMenuClick: onSelectOrderMenu
            },
            {
              key: 'reFresh',
              position: 'right',
              type: 'fresh',
              onHandle: refresh
            }
          ]}
          lastColWidth={170}
          // showHeader={false}
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
            setOrderField(sorter.field);
          }}
          emptyText={!isSearch && status === 'all' ? intl.get('task.noContent') : intl.get('global.noResult')}
          emptyImage={!isSearch && status === 'all' ? kong : noResult}
          loading={loading ? { indicator } : false}
          scroll={{ y: tableData.length ? scrollY : undefined }}
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
          open={stopModal}
          closable={false}
          title={stopNum === 'one' ? intl.get('task.stopTask') : intl.get('task.stopAllTask')}
          content={intl.get('task.stoTaskText')}
          onCancel={() => setStopModal(false)}
          onOk={handleStopOk}
        />
        {taskDetailModalProps.visible && (
          <TaskDetailModal taskData={taskDetailModalProps.taskData} closeTaskDetailModal={closeTaskDetailModal} />
        )}
      </div>
    </KwResizeObserver>
  );
});

const mapStateToProps = (state: any) => {
  return {
    ad_graphStatus: state?.getIn(['knowledgeGraph'])?.toJS()?.ad_graphStatus || ''
  };
};
export default connect(mapStateToProps, null, null, { forwardRef: true })(TaskList);
