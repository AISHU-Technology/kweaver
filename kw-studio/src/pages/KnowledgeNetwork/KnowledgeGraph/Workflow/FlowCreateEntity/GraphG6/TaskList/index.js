import React, { Component } from 'react';
import { Modal, Tooltip } from 'antd';
import { LoadingOutlined, ExclamationCircleOutlined, CloseOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import _ from 'lodash';

import servicesCreateEntity from '@/services/createEntity';

import IconFont from '@/components/IconFont';
import BottomPagination from '@/components/Pagination';
import { tipModalFunc } from '@/components/TipModal';

import DetailModal from './DetailModal';
import { getFileType, handleTaskData } from './assistFunction';

import emptyImg from '@/assets/images/empty.svg';
import './style.less';

const PAGESIZE = 20;

class TaskList extends Component {
  state = {
    taskCount: 0, // 任务总数
    taskListData: [], // 任务列表
    page: 1,
    loading: false,
    selectedTaskData: '', // 选中的任务
    modalVisible: false // 详情弹框
  };
  timer = null;
  requestId = 0; // 标记网络请求

  componentDidUpdate(preProps) {
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
  getTaskList = async cancelLoading => {
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
            const addGraph = taskListData.filter(
              graph => ![...graph.nodes, ...graph.edges].some(d => used_task.includes(d.task_id))
            );
            const userIds = _.uniq([...used_task, ...addUsedTask]);
            setUsedTask(userIds);
            addGraph.length && taskListAddData(addGraph);
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
   * @description 由定时器导致的数据列表更新
   */
  intervalUpdateData = (taskCount, taskListData) => {
    this.setState({ taskCount, taskListData });
  };

  /**
   * @description 切换分页
   */
  changePage = page => {
    this.setState({ page }, () => {
      this.getTaskList();
    });
  };

  /**
   * @description 删除任务
   */
  deleteTask = async (selectedTaskData, modal = true) => {
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
    if (res && res.res) {
      this.deleteHandle(selectedTaskData);
    }
    this.getTaskList(true);
  };

  /**
   * @description 删除处理
   */
  deleteHandle = selectedTaskData => {
    const { task_id } = selectedTaskData;
    const { nodes, edges, used_task, taskListDeleteData, setUsedTask } = this.props;
    const callBack = (res, item) => (item.task_id === task_id ? [...res, item.uid] : res);
    const deleteNodesId = _.reduce(nodes, callBack, []);
    const deleteEdgesId = _.reduce(edges, callBack, []);

    this.setState({ selectedTaskData: '' });
    setUsedTask(used_task.filter(id => id !== task_id));
    taskListDeleteData({ nodes: deleteNodesId, edges: deleteEdgesId });
  };

  onRowClick = item => {
    this.setState({ selectedTaskData: item });
    this.props.onSelect(item);
  };

  render() {
    const { taskListData, loading, selectedTaskData, modalVisible, taskCount, page } = this.state;

    return (
      <div className="task-list-info">
        <div className="title">
          <div className="word">{intl.get('createEntity.taskList')}</div>
          <div className="number">
            <span>{taskCount}</span>
          </div>
          <div className="icon" onClick={() => this.props.onClose()}>
            <CloseOutlined className="closed-icon" />
          </div>
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
                  className={selectedTaskData.task_id === item.task_id ? 'task task-selected' : 'task'}
                  key={index.toString()}
                  onClick={() => this.onRowClick(item)}
                >
                  <div className="icon">
                    <img className="file-image" src={getFileType(item.task_type)} alt="folder" />
                  </div>

                  <div
                    className="content"
                    title={item.task_name.includes('/') ? item.task_name.split('/')[1] : item.task_name}
                  >
                    <span>{item.task_name.includes('/') ? item.task_name.split('/')[1] : item.task_name}</span>
                  </div>

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

                  <div className="detail">
                    <IconFont
                      type="icon-lajitong"
                      className="icon"
                      title={intl.get('createEntity.tdelete')}
                      onClick={e => {
                        e.stopPropagation();
                        this.deleteTask(item);
                      }}
                    />
                  </div>

                  <div className="detail">
                    <span className="set">|</span>

                    <IconFont
                      type="icon-wendang-xianxing"
                      className="icon"
                      title={intl.get('createEntity.td')}
                      onClick={e => {
                        e.stopPropagation();
                        this.setState({
                          modalVisible: true,
                          selectedTaskData: item
                        });
                      }}
                    />
                  </div>
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
            onChange={page => this.changePage(page)}
            hideOnSinglePage={true}
          />
        </div>

        <Modal
          className="task-modal-detail-signal-mark-new"
          title=""
          visible={modalVisible}
          footer={null}
          width={'atuo'}
          height={'calc(100% - 40px)'}
          maskClosable={false}
          destroyOnClose={true}
          onCancel={() => this.setState({ modalVisible: false })}
        >
          <DetailModal
            ontologyId={this.props.ontologyId}
            page={page}
            selectedTaskData={selectedTaskData}
            deleteTask={data => this.deleteTask(data, false)}
          />
        </Modal>
      </div>
    );
  }
}

TaskList.defaultProps = {
  nodes: [], // 点集合
  edges: [], // 边集合
  ontologyId: undefined, // 本体id
  used_task: [], // 已生成图元素的任务id
  taskPollingFlag: 0, // 外部任务触发轮询标志
  taskListAddData: () => {}, // 添加图数据回调
  taskListDeleteData: () => {}, // 删除图数据回调
  onClose: () => {}, // 关闭回调
  setUsedTask: () => {} // 设置used_task回调
};

export default TaskList;
