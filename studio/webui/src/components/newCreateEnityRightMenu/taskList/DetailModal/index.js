import React, { Component } from 'react';
import intl from 'react-intl-universal';
import { Button, Modal, ConfigProvider } from 'antd';
import { ExclamationCircleOutlined, CheckCircleOutlined, LoadingOutlined, InfoCircleFilled } from '@ant-design/icons';

import servicesCreateEntity from '@/services/createEntity';

import IconFont from '@/components/IconFont';
import BottomPagination from '@/components/Pagination';
import { localStore, wrapperTitle } from '@/utils/handleFunction';

import { getFileType, analyUrl } from '../assistFunction';

import errorTip from '@/assets/images/error-tip.svg';
import './style.less';

const PAGESIZE = 20;
const TASKINFOPAGESIZE = 10;

class DetailModal extends Component {
  state = {
    taskList: [], // 任务列表
    selectedTask: this.props.selectedTaskData, // 选中任务
    fileContent: [],
    fileCount: 0, // 文件个数
    errorCode: '', // 任务状态错误码
    page: this.props.page,
    taskInfoPage: 1,
    taskInfo: '',
    loadingTask: false,
    loadingContent: false,
    modalVisible: false
  };

  componentDidMount() {
    this.getTaskList();
    this.getTaskInfo();
  }

  /**
   * @description 获取任务列表
   */
  getTaskList = async () => {
    const { page } = this.state;

    const data = {
      page,
      size: PAGESIZE,
      ontology_id: this.props.ontology_id,
      used_task: []
    };

    this.setState({
      loadingTask: true
    });

    const res = await servicesCreateEntity.getEntityTasks(data);

    if (res && res.res && res.res.task_info) {
      this.setState({
        taskList: res.res.task_info.tasks,
        fileCount: res.res.task_info.task_count
      });
    }

    this.setState({
      loadingTask: false
    });
  };

  /**
   * @description 获取任务信息
   */
  getTaskInfo = async () => {
    const { selectedTask, taskInfoPage } = this.state;

    const requestData = {
      task_id: selectedTask.task_id,
      page: taskInfoPage,
      size: TASKINFOPAGESIZE
    };

    this.setState({
      loadingContent: true
    });

    const res = await servicesCreateEntity.getTaskFiles(requestData);

    if (res && res.res && res.res.result) {
      this.setState({
        taskInfo: res.res.result
      });
    }

    this.setState({
      loadingContent: false
    });
  };

  /**
   * @description 获取文件状态
   */
  getFileStatus = fileStatus => {
    if (fileStatus === 'running') {
      return <span className="running">{intl.get('createEntity.Predicting')}</span>;
    }

    if (fileStatus === 'failed') {
      return <span className="failed">{intl.get('createEntity.Failure')}</span>;
    }
    if (fileStatus === 'finished') {
      return <span className="finished">{intl.get('createEntity.Completed')}</span>;
    }

    return <span>{fileStatus}</span>;
  };

  /**
   * @description 配置显示类型
   */
  setShowType = () => {
    const { taskInfo, taskInfoPage } = this.state;
    const { error_code, files, task_status, file_numbers } = taskInfo;

    if (error_code === 500013) {
      return (
        <div className="content-box content-box-error">
          <div className="error-image">
            <img src={errorTip} alt="KWeaver" className="error-i" />
          </div>
          <div className="error-word">{intl.get('createEntity.tokenError')}</div>
        </div>
      );
    }

    if (error_code === 500002) {
      return (
        <div className="content-box content-box-error">
          <div className="error-image">
            <img src={errorTip} alt="KWeaver" className="error-i" />
          </div>
          <div className="error-word">{intl.get('createEntity.error500002')}</div>
        </div>
      );
    }

    if (error_code === 500006) {
      return (
        <div className="content-box content-box-error">
          <div className="error-image">
            <img src={errorTip} alt="KWeaver" className="error-i" />
          </div>
          <div className="error-word">{intl.get('createEntity.error500006')}</div>
        </div>
      );
    }

    if (error_code === 500009) {
      return (
        <div className="content-box content-box-error">
          <div className="error-image">
            <img src={errorTip} alt="KWeaver" className="error-i" />
          </div>
          <div className="error-word">{intl.get('createEntity.error500009')}</div>
        </div>
      );
    }

    if (error_code === 500001) {
      return (
        <div className="content-box content-box-error">
          <div className="error-image">
            <img src={errorTip} alt="KWeaver" className="error-i" />
          </div>
          <div className="error-word">{intl.get('createEntity.error500001')}</div>
        </div>
      );
    }

    if (task_status === 'finished') {
      return (
        <div className="content-box">
          <div className="table-data">
            {files.map((item, index) => {
              return (
                <div className="table-content" key={index.toString()}>
                  <div className="content-file">
                    <div className="content-file-name">
                      <div className="icon">
                        <img className="file-image" src={getFileType(item[4])} alt="folder" />
                      </div>

                      <div className="word" title={wrapperTitle(item[0])}>
                        {item[0]}
                      </div>
                    </div>
                  </div>

                  <div className="content-double">
                    <div className="name" title={wrapperTitle(item[2])}>
                      {item[2]}
                    </div>
                    <div className="name distand" title={wrapperTitle(item[1])}>
                      {item[1]}
                    </div>
                  </div>

                  <div className="content-status">
                    <div className="icon">
                      {item[3] === 'success' ? (
                        <CheckCircleOutlined className="font-right" />
                      ) : (
                        <ExclamationCircleOutlined className="font-error" />
                      )}
                    </div>

                    <div className="word">
                      {item[3] === 'success' ? intl.get('createEntity.Normal') : intl.get('createEntity.Failed')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bottom-pagination">
            <BottomPagination
              total={file_numbers}
              current={taskInfoPage}
              pageSize={TASKINFOPAGESIZE}
              onChange={page => {
                this.changeTaskInfoPage(page);
              }}
              hideOnSinglePage={true}
            />
          </div>
        </div>
      );
    }

    if (task_status === 'running') {
      return (
        <div className="content-box">
          <div className="loading-box">
            <LoadingOutlined className="loading-icon" />
          </div>
        </div>
      );
    }
  };

  /**
   * @description 切换任务分页
   */
  changeTaskPage = page => {
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
   * @description 切换任务内容分页
   */
  changeTaskInfoPage = taskInfoPage => {
    this.setState(
      {
        taskInfoPage
      },
      () => {
        this.getTaskInfo();
      }
    );
  };

  /**
   * @description 删除任务
   */
  delete = async () => {
    const { selectedTask } = this.state;

    await this.props.deleteTask(selectedTask);

    this.getTaskList();

    this.setState({
      modalVisible: false,
      selectedTask: ''
    });
  };

  render() {
    const { taskList, selectedTask, fileCount, page, loadingTask, taskInfo, loadingContent, modalVisible } = this.state;
    const TYPE = window?.location?.pathname?.includes('knowledge') ? 'view' : analyUrl(window.location.search).type; // 进入图谱的类型 // 进入图谱的类型

    return (
      <div className="detail-modal-new">
        <div className="task">
          {loadingTask ? (
            <div className="loading-task-in">
              <LoadingOutlined className="icon" />
            </div>
          ) : null}

          <div className="title">
            <div className="word">
              <span>{intl.get('createEntity.taskList')}</span>
            </div>
            <div className="number">
              <span>{fileCount}</span>
            </div>
          </div>

          <div className="task-list-show">
            {taskList &&
              taskList.length > 0 &&
              taskList.map((item, index) => {
                return (
                  <div
                    className={
                      selectedTask && selectedTask.task_id && selectedTask.task_id === item.task_id
                        ? 'line line-selected'
                        : 'line'
                    }
                    key={index.toString()}
                    onClick={() => {
                      this.setState(
                        {
                          selectedTask: item
                        },
                        () => {
                          this.getTaskInfo();
                        }
                      );
                    }}
                  >
                    <div className="icon">
                      <img className="file-image" src={getFileType(item.task_type)} alt="folder" />
                    </div>

                    <div className="word" title={wrapperTitle(item.task_name)}>
                      {item.task_name}
                    </div>
                  </div>
                );
              })}
          </div>

          <div className="task-page">
            <BottomPagination
              current={page}
              total={fileCount}
              pageSize={PAGESIZE}
              onChange={page => {
                this.changeTaskPage(page);
              }}
              hideOnSinglePage={true}
            />
          </div>
        </div>

        <div className="detail">
          {selectedTask && taskInfo ? (
            <>
              <div className="head">
                <div className="file-info">
                  <div className="title">
                    <div className="icon">
                      <img className="file-image" src={getFileType(selectedTask.task_type)} alt="folder" />
                    </div>

                    <div className="word">
                      <div className="name">
                        <div className="name-word" title={wrapperTitle(selectedTask.task_name)}>
                          <span>{selectedTask.task_name}</span>
                        </div>

                        <div className="status">{this.getFileStatus(taskInfo.task_status)}</div>
                      </div>

                      <div className="person">
                        <span>{intl.get('createEntity.cp')}</span>
                        <span>{taskInfo.create_user_name}</span>
                        <span className="email">({taskInfo.create_user_email})</span>
                      </div>

                      <div className="file-count">
                        {/* 文件总数 */}
                        <span>{intl.get('createEntity.fileCount')}</span>
                        <span>
                          {taskInfo.file_numbers}
                          {taskInfo.task_status === 'finished' ? intl.get('createEntity.ge') : null}
                        </span>

                        <span className="start-time">{intl.get('createEntity.createTime')}</span>
                        <span>{taskInfo.create_time}</span>

                        <span className="end-time">{intl.get('createEntity.ft')}</span>
                        <span>{taskInfo.finished_time}</span>
                      </div>

                      <div className="tool-botton">
                        <Button type="primary" className="refresh" onClick={this.getTaskInfo}>
                          <IconFont type="icon-tongyishuaxin" />
                          <span>{intl.get('createEntity.refresh')}</span>
                        </Button>

                        {TYPE === 'view' ? null : (
                          <Button
                            className="ant-btn-default delete"
                            onClick={() => {
                              this.setState({
                                modalVisible: true
                              });
                            }}
                          >
                            <IconFont type="icon-lajitong" />
                            <span>{intl.get('userManagement.delete')}</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="file-table">
                <div className="table-header">
                  {/* 文件名称 */}
                  <div className="content">{intl.get('createEntity.fileName')}</div>
                  {/* 数据源名/路径 */}
                  <div className="content">{intl.get('createEntity.nameAndPath')}</div>
                  {/* 文件状态 */}
                  <div className="content-status">{intl.get('createEntity.fileStatus')}</div>
                </div>

                {this.setShowType()}
              </div>

              {loadingContent ? (
                <div className="loading-cotent-in">
                  <LoadingOutlined className="icon" />
                </div>
              ) : null}
            </>
          ) : null}
        </div>

        <Modal
          className="delete-create-info-456791178"
          visible={modalVisible}
          bodyStyle={{ height: 92 }}
          footer={[
            <ConfigProvider key="deleteCreateInfo" autoInsertSpaceInButton={false}>
              <Button
                className="ant-btn-default add-modal-cancel"
                key="cancel"
                onClick={() => {
                  this.setState({
                    modalVisible: false
                  });
                }}
              >
                {[intl.get('createEntity.cancel')]}
              </Button>
              <Button type="primary" className="add-modal-save" key="ok" onClick={this.delete}>
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

export default DetailModal;
