import React, { Component } from 'react';
import intl from 'react-intl-universal';
import { Modal, Tooltip, Button, ConfigProvider } from 'antd';
import { LoadingOutlined, ExclamationCircleOutlined, InfoCircleFilled, CloseOutlined } from '@ant-design/icons';

import servicesCreateEntity from '@/services/createEntity';

import IconFont from '@/components/IconFont';
import BottomPagination from '@/components/Pagination';

import DetailModal from './DetailModal';
import { getFileType, analyUrl, isFlow } from './assistFunction';

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
    modalVisible: false, // 详情弹框
    deleteModalVsible: false // 删除弹框
  };

  componentDidMount() {
    this.props.onTaskListRef(this);

    this.getTaskList();

    this.props.setTouch(true);
  }

  componentDidUpdate(preProps, preStates) {
    if (preStates.selectedTaskData !== this.state.selectedTaskData) {
      this.props.freeGraphRef.addFive(this.state.selectedTaskData);
    }
  }

  componentWillUnmount() {
    this.props.freeGraphRef.addFive('');
    this.props.onTaskListRef('');
  }

  /**
   * @description 获取任务数据
   * @param {boolean} cancelLoading 是否取消加载动画
   */
  getTaskList = async cancelLoading => {
    const { ontology_id, ontologyId } = this.props;
    const { page } = this.state;

    const data = {
      page,
      size: PAGESIZE,
      ontology_id: ontology_id || ontologyId,
      used_task: []
    };

    if (!cancelLoading) {
      this.setState({
        loading: true
      });
    }

    const res = await servicesCreateEntity.getEntityTasks(data);
    if (res && res.res && res.res.task_info) {
      this.setState({
        taskListData: res.res.task_info.tasks,
        taskCount: res.res.task_info.task_count
      });
    }
    this.setState({
      loading: false
    });
  };

  /**
   * @description 由定时器导致的数据列表更新
   */
  intervalUpdateData = (taskCount, taskListData) => {
    this.setState({
      taskCount,
      taskListData
    });
  };

  /**
   * @description 切换分页
   */
  changePage = page => {
    this.setState(
      {
        page
      },
      () => {
        this.getTaskList();
      }
    );
  };

  /**
   * @description 删除任务
   */
  deleteTask = async selectedTaskData => {
    const deleteData = {
      task_list: [selectedTaskData.task_id]
    };

    const res = await servicesCreateEntity.deleteEntityTask(deleteData);

    // 删除任务同时删除相应的点和边
    if (res && res.res) {
      this.deleteHandle(selectedTaskData);
    }

    this.setState({
      deleteModalVsible: false
    });

    this.getTaskList(true);
  };

  /**
   * @description 删除处理
   */
  deleteHandle = selectedTaskData => {
    // eslint-disable-next-line prefer-const
    let { nodes, edges, selectedElement, used_task } = this.props;
    let deleteNodesId = [];
    let deleteEdgesId = [];

    nodes.forEach((item, index) => {
      if (item.task_id === selectedTaskData.task_id) {
        deleteNodesId = [...deleteNodesId, item.entity_id];
      }
    });

    edges.forEach((item, index) => {
      if (item.task_id === selectedTaskData.task_id) {
        deleteEdgesId = [...deleteEdgesId, item.edge_id];
      }
    });

    // 如果选中的点在任务中，将图状态恢复成未选中的状态
    if (
      selectedElement &&
      typeof selectedElement.entity_id === 'number' &&
      deleteNodesId.includes(selectedElement.entity_id)
    ) {
      this.props.setSelectedElement('');
    }

    if (
      selectedElement &&
      typeof selectedElement.edge_id === 'number' &&
      deleteEdgesId.includes(selectedElement.edge_id)
    ) {
      this.props.setSelectedElement('');
    }

    // 如果使用的过的任务里有删除的任务，则在使用过的任务中删除该任务
    if (used_task.includes(selectedTaskData.task_id)) {
      used_task = used_task.filter((item, index) => {
        return item !== selectedElement.task_id;
      });

      this.props.setUsedTask(used_task);
    }

    this.setState({
      selectedTaskData: ''
    });

    this.props.freeGraphRef && this.props.freeGraphRef.deleteNodesNoTask(deleteNodesId);
    this.props.freeGraphRef && this.props.freeGraphRef.deleteEdgesNoTask(deleteEdgesId);
  };

  render() {
    const { taskListData, loading, selectedTaskData, modalVisible, taskCount, page, deleteModalVsible } = this.state;
    const TYPE = window?.location?.pathname?.includes('knowledge') ? 'view' : analyUrl(window.location.search).type; // 进入图谱的类型 // 进入图谱的类型

    return (
      <div className="task-list-info">
        <div className="title">
          <div className="word">{intl.get('createEntity.taskList')}</div>
          <div className="number">
            <span>{taskCount}</span>
          </div>
          <div
            className="icon"
            onClick={() => {
              this.props.selectRightTool();
            }}
          >
            <CloseOutlined className="closed-icon" />
          </div>
        </div>

        {loading ? (
          <div className="loading-task">
            <LoadingOutlined className="icon" />
          </div>
        ) : null}

        <div className={isFlow() ? 'task-list-content-flow' : 'task-list-content'}>
          {taskListData.length > 0 ? (
            taskListData.map((item, index) => {
              return (
                <div
                  className={selectedTaskData.task_id === item.task_id ? 'task task-selected' : 'task'}
                  key={index.toString()}
                  onClick={() => {
                    this.setState({
                      selectedTaskData: item
                    });
                  }}
                >
                  <div className="icon">
                    <img className="file-image" src={getFileType(item.task_type)} alt="folder" />
                  </div>

                  <div className="content" title={item.task_name}>
                    <span>{item.task_name}</span>
                  </div>

                  <div className="icon-loading">
                    {item.task_status === 'running' ? <LoadingOutlined className="file-loading" /> : null}
                  </div>

                  <div className="file-status">
                    {item.task_status === 'failed' ? (
                      <Tooltip placement="bottom" title={intl.get('createEntity.failTip')}>
                        <ExclamationCircleOutlined className="icon" />
                      </Tooltip>
                    ) : null}
                  </div>

                  {TYPE === 'view' ? null : (
                    <div className="detail">
                      <IconFont
                        type="icon-lajitong"
                        className="icon"
                        title={intl.get('createEntity.tdelete')}
                        onClick={e => {
                          // 删除
                          e.stopPropagation();

                          this.setState({
                            deleteModalVsible: true,
                            selectedTaskData: item
                          });
                        }}
                      />
                    </div>
                  )}

                  <div className="detail">
                    {TYPE === 'view' ? null : <span className="set">|</span>}

                    <IconFont
                      type="icon-wendang-xianxing"
                      className="icon"
                      title={intl.get('createEntity.td')}
                      onClick={e => {
                        // 开启弹层
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
            onChange={page => {
              this.changePage(page);
            }}
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
          onCancel={() => {
            this.setState({
              modalVisible: false
            });
          }}
        >
          <DetailModal
            ontology_id={this.props.ontology_id}
            ontologyId={this.props.ontologyId}
            page={page}
            selectedTaskData={selectedTaskData}
            deleteTask={this.deleteTask}
          />
        </Modal>

        <Modal
          className="delete-create-info-456791178"
          visible={deleteModalVsible}
          bodyStyle={{ height: 92 }}
          footer={[
            <ConfigProvider key="deleteCreateInfo" autoInsertSpaceInButton={false}>
              <Button
                className="ant-btn-default add-modal-cancel"
                key="cancel"
                onClick={() => {
                  this.setState({
                    deleteModalVsible: false
                  });
                }}
              >
                {[intl.get('createEntity.cancel')]}
              </Button>
              <Button
                type="primary"
                className="add-modal-save"
                key="ok"
                onClick={() => {
                  this.deleteTask(selectedTaskData);
                }}
              >
                {[intl.get('createEntity.ok')]}
              </Button>
            </ConfigProvider>
          ]}
          closable={false}
        >
          <div className="title-content">
            <InfoCircleFilled className="icon" />
            <span className="title-word">{[intl.get('createEntity.dt')]}</span>
          </div>
          <div className="content-word">{[intl.get('createEntity.dtt')]}</div>
        </Modal>
      </div>
    );
  }
}

TaskList.defaultProps = {
  onTaskListRef: () => {},
  setTouch: () => {},
  setUsedTask: () => {}
};

export default TaskList;
