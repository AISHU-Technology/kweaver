import React, { Component } from 'react';
import { Modal, Tooltip } from 'antd';
import { LoadingOutlined, ExclamationCircleOutlined, CloseOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import _ from 'lodash';
import { withRouter } from 'react-router-dom';
import servicesCreateEntity from '@/services/createEntity';

import IconFont from '@/components/IconFont';
import BottomPagination from '@/components/Pagination';
import { tipModalFunc } from '@/components/TipModal';
import UniversalModal from '@/components/UniversalModal';

import OntoDetailModal from './DetailModal';
import { getFileType, handleTaskData } from './assistFunction';

import emptyImg from '@/assets/images/empty.svg';
import './style.less';
import { convertToRules } from '@/pages/KnowledgeNetwork/KnowledgeGraph/Workflow/KnowledgeMap/assistant';
import Format from '@/components/Format';

const PAGESIZE = 20;

interface Props<T> {
  [key: string]: T | any;
}

type OntoTaskListState = {
  taskCount: number; // 任务总数
  taskListData: any[]; // 任务列表
  page: number;
  loading: boolean;
  selectedTaskData: any; // 选中的任务
  modalVisible: boolean; // 详情弹框
};

class OntoTaskList<T> extends Component<Props<T>, OntoTaskListState> {
  state: OntoTaskListState = {
    taskCount: 0, // 任务总数
    taskListData: [], // 任务列表
    page: 1,
    loading: false,
    selectedTaskData: '', // 选中的任务
    modalVisible: false // 详情弹框
  };
  timer: any = undefined;
  requestId = 0; // 标记网络请求

  componentDidUpdate(preProps: any) {
    const { visible, ontologyId, taskPollingFlag } = this.props;
    if (
      ontologyId !== preProps.ontologyId ||
      taskPollingFlag !== preProps.taskPollingFlag ||
      // 仅visible变化
      (visible !== preProps.visible && visible && taskPollingFlag === preProps.taskPollingFlag)
    ) {
      if (!ontologyId) return;
      this.getTaskList();
    }
  }

  componentWillUnmount() {
    clearTimeout(this.timer);
  }

  /**
   * @description 获取任务数据
   * @param {boolean} cancelLoading 是否取消加载动画
   */
  getTaskList = async (cancelLoading = false) => {
    const { ontologyId } = this.props;
    const { page, selectedTaskData } = this.state;

    const data = { page, size: PAGESIZE, ontology_id: ontologyId, used_task: [] };

    if (!cancelLoading) this.setState({ loading: true });

    const getStatus = async () => {
      const { used_task, setUsedTask, taskListAddData } = this.props;
      const signId = ++this.requestId;
      const result = await servicesCreateEntity.getEntityTasks(data);
      if (signId < this.requestId) return;
      this.setState({ loading: false });
      if (result?.res?.task_info) {
        const selected = _.find(result?.res?.task_info.tasks, t => t.task_id === selectedTaskData?.task_id) || '';
        this.setState({
          selectedTaskData: selected,
          taskListData: result?.res?.task_info.tasks,
          taskCount: result?.res?.task_info?.task_count
        });
        if (result?.res?.all_task_status === 'finished') {
          if (result?.res?.result_info?.results?.length > 0) {
            const { taskListData, addUsedTask } = handleTaskData(result?.res?.result_info?.results);
            this.onHandleParsing(taskListData);
            const addGraph = taskListData.filter(
              graph => ![...graph.nodes, ...graph.edges].some(d => used_task.includes(d.task_id))
            );
            const userIds = _.uniq([...used_task, ...addUsedTask]);
            setUsedTask(userIds);
            addGraph.length && taskListAddData(addGraph);
            // 过滤掉已经添加过的数据文件
            const newResults = result?.res?.result_info?.results.filter(
              (item: any) => !used_task.includes(item.task_id)
            );
            this.props.onTaskFinish(newResults); // 任务完成的回调事件
          }
          return;
        }
        this.timer = setTimeout(() => {
          clearTimeout(this.timer);
          this.timer = null;
          getStatus();
        }, 5000);
      }
    };
    getStatus();
  };

  /**
   * 实体删除后删除对应的解析规则
   */
  onHandleParsing = (data: any) => {
    const cloneData = _.cloneDeep(data);
    const cloneParsingData = _.cloneDeep(this.props.parsingFileSet);
    const gnsAll: any = []; // 没被删除的gns
    const nodesAll = _.map(cloneData, (item: any) => item?.nodes);
    const sourceTableArr: any = [];
    _.map(nodesAll, (item: any) => {
      _.map(item, (i: any) => {
        sourceTableArr.push(i?.source_table);
      });
    });
    _.map(sourceTableArr, (item: any) => {
      _.map(item, (i: any) => gnsAll.push(i?.[0]));
    });

    const newParsing = _.filter(cloneParsingData, (item: any) => gnsAll.includes(item?.key));
    this?.props?.setParsingFileSet(newParsing);
  };

  /**
   * @description 由定时器导致的数据列表更新
   */
  intervalUpdateData = (taskCount: number, taskListData: any) => {
    this.setState({ taskCount, taskListData });
  };

  /**
   * @description 切换分页
   */
  changePage = (page: number) => {
    this.setState({ page }, () => {
      this.getTaskList();
    });
  };

  /**
   * @description 删除任务
   */
  deleteTask = async (selectedTaskData: any, modal = true) => {
    if (modal) {
      const isOk = await tipModalFunc({
        title: intl.get('createEntity.dt'),
        content: intl.get('createEntity.dtt')
      });

      if (!isOk) return;
    }

    const deleteData = { task_list: [selectedTaskData.task_id] };
    const res = await servicesCreateEntity.deleteEntityTask(deleteData);

    // 删除任务同时删除相应的点和边
    if (res && res.res) this.deleteHandle(selectedTaskData);
    this.getTaskList(true);
  };

  /**
   * @description 删除处理
   */
  deleteHandle = (selectedTaskData: any) => {
    const { task_id } = selectedTaskData;
    const { nodes, edges, used_task, taskListDeleteData, setUsedTask } = this.props;
    const callBack = (res: any, item: any) => (item.task_id === task_id ? [...res, item.uid] : res);
    const deleteNodesId = _.reduce(nodes, callBack, []);
    const deleteEdgesId = _.reduce(edges, callBack, []);

    this.setState({ selectedTaskData: '' });
    setUsedTask(used_task.filter((id: string) => id !== task_id));
    taskListDeleteData({ nodes: deleteNodesId, edges: deleteEdgesId });
  };

  onRowClick = (item: any) => {
    this.setState({ selectedTaskData: item });
    this.props.onSelect(item);
  };

  render() {
    const { taskListData, loading, selectedTaskData, modalVisible, taskCount, page } = this.state;
    const { viewMode } = this.props;
    return (
      <div className="task-list-info" style={{ width: 400 }}>
        <div className="title kw-space-between">
          <div className="word">{intl.get('createEntity.taskList')}</div>
          <div className="number">
            <span>{taskCount}</span>
          </div>
          <Format.Button type="icon" tip={intl.get('global.close')} onClick={() => this.props.onClose()}>
            <CloseOutlined className="closed-icon" />
          </Format.Button>
        </div>

        {loading ? (
          <div className="loading-task">
            <LoadingOutlined className="icon" />
          </div>
        ) : null}

        <div className="task-list-content-flow">
          {taskListData.length > 0 ? (
            taskListData.map((item, index) => {
              return (
                <div
                  className={
                    selectedTaskData.task_id === item.task_id
                      ? 'task task-selected kw-space-between'
                      : 'task kw-space-between'
                  }
                  key={index.toString()}
                  onClick={() => this.onRowClick(item)}
                >
                  <div className="kw-flex-item-full-width kw-align-center">
                    <img
                      style={{ width: 22, height: 22 }}
                      className="file-image"
                      src={getFileType(item.task_type)}
                      alt="folder"
                    />

                    <span className="content kw-flex-item-full-width kw-ellipsis kw-ml-1" title={item.task_name}>
                      {item.task_name}
                    </span>

                    <div className="loading-box">
                      {item.task_status === 'running' ? <LoadingOutlined className="file-loading" /> : null}
                    </div>

                    <div className="file-status">
                      {item.task_status === 'failed' ? (
                        <Tooltip placement="bottom" title={intl.get('createEntity.failTip')}>
                          <ExclamationCircleOutlined className="icon" />
                        </Tooltip>
                      ) : null}
                    </div>
                  </div>

                  <span className="task-operate-btn">
                    {!viewMode && (
                      <Format.Button
                        type="icon"
                        tip={intl.get('createEntity.tdelete')}
                        onClick={e => {
                          e.stopPropagation();
                          this.deleteTask(item);
                        }}
                      >
                        <IconFont type="icon-lajitong" />
                      </Format.Button>
                    )}

                    <Format.Button
                      type="icon"
                      tip={intl.get('createEntity.td')}
                      onClick={e => {
                        e.stopPropagation();
                        this.setState({
                          modalVisible: true,
                          selectedTaskData: item
                        });
                      }}
                    >
                      <IconFont type="icon-wendang-xianxing" />
                    </Format.Button>
                  </span>
                </div>
              );
            })
          ) : (
            <div className="no-task">
              <div className="picture">
                <img className="img" src={emptyImg} alt="no-task" />
              </div>
              <div className="word-one">{intl.get('createEntity.noTask')}</div>
            </div>
          )}
        </div>

        <div className="task-page-outside">
          <BottomPagination
            current={page}
            total={taskCount}
            pageSize={PAGESIZE}
            onChange={(page: number) => this.changePage(page)}
            hideOnSinglePage={true}
          />
        </div>

        <UniversalModal
          className="task-modal-detail-signal-mark-new"
          title={intl.get('ontoLib.clickI')}
          open={modalVisible}
          footer={null}
          maskClosable={false}
          destroyOnClose={true}
          onCancel={() => this.setState({ modalVisible: false })}
          fullScreen
        >
          <OntoDetailModal
            ontologyId={this.props.ontologyId}
            page={page}
            selectedTaskData={selectedTaskData}
            deleteTask={(data: any) => this.deleteTask(data, false)}
            viewMode={viewMode}
          />
        </UniversalModal>
      </div>
    );
  }
}

// OntoTaskList.defaultProps = {
//   nodes: [], // 点集合
//   edges: [], // 边集合
//   ontologyId: undefined, // 本体id
//   used_task: [], // 已生成图元素的任务id
//   taskPollingFlag: 0, // 外部任务触发轮询标志
//   taskListAddData: () => {}, // 添加图数据回调
//   taskListDeleteData: () => {}, // 删除图数据回调
//   onClose: () => {}, // 关闭回调
//   setUsedTask: () => {} // 设置used_task回调
// };

export default OntoTaskList;
