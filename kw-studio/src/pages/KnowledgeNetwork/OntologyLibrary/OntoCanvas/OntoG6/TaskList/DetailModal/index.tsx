import React, { Component } from 'react';
import intl from 'react-intl-universal';
import { Button, Modal, ConfigProvider } from 'antd';
import { ExclamationCircleOutlined, CheckCircleOutlined, LoadingOutlined, InfoCircleFilled } from '@ant-design/icons';

import servicesCreateEntity from '@/services/createEntity';

import IconFont from '@/components/IconFont';
import BottomPagination from '@/components/Pagination';
import { tipModalFunc } from '@/components/TipModal';
import { wrapperTitle } from '@/utils/handleFunction';

import { getFileType } from '../assistFunction';

import errorTip from '@/assets/images/kong.svg';
import './style.less';
import KwTable from '@/components/KwTable';

const PAGESIZE = 20;
const TASKINFOPAGESIZE = 10;

type OntoDetailModalState = {
  taskList: any[]; // 任务列表
  selectedTask: any; // 选中任务
  fileContent: any[];
  fileCount: number; // 文件个数
  errorCode: string; // 任务状态错误码
  page: number;
  taskInfoPage: number;
  taskInfo: any;
  loadingTask: boolean;
  loadingContent: boolean;
};

interface Props<T> {
  [key: string]: T | any;
}

class OntoDetailModal<T> extends Component<Props<T>, OntoDetailModalState> {
  state: OntoDetailModalState = {
    taskList: [], // 任务列表
    selectedTask: this.props.selectedTaskData, // 选中任务
    fileContent: [],
    fileCount: 0, // 文件个数
    errorCode: '', // 任务状态错误码
    page: this.props.page,
    taskInfoPage: 1,
    taskInfo: '',
    loadingTask: false,
    loadingContent: false
  };

  componentDidMount() {
    this.getTaskList();
    this.getTaskInfo();
  }

  /**
   * @description 获取任务列表
   */
  getTaskList = async () => {
    const { ontologyId } = this.props;
    const { page } = this.state;

    const data = {
      page,
      size: PAGESIZE,
      ontology_id: ontologyId,
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
  getFileStatus = (fileStatus: string) => {
    if (fileStatus === 'running') {
      return (
        <span className="kw-align-center">
          <span className="running" />
          {intl.get('createEntity.Predicting')}
        </span>
      );
    }

    if (fileStatus === 'failed') {
      return (
        <span className="kw-align-center">
          <span className="failed" />
          {intl.get('createEntity.Failure')}
        </span>
      );
    }
    if (fileStatus === 'finished') {
      return (
        <span className="kw-align-center">
          <span className="finished" />
          {intl.get('createEntity.Completed')}
        </span>
      );
    }

    return <span>{fileStatus}</span>;
  };

  /**
   * @description 切换任务分页
   */
  changeTaskPage = (page: number) => {
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
  changeTaskInfoPage = (taskInfoPage: any) => {
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
    const isOk = await tipModalFunc({
      title: intl.get('createEntity.dt'),
      content: intl.get('createEntity.dtt')
    });

    if (!isOk) return;

    const { selectedTask } = this.state;

    await this.props.deleteTask(selectedTask);

    this.getTaskList();

    this.setState({ selectedTask: '' });
  };

  getEmptyInfo = () => {
    const { taskInfo, taskInfoPage } = this.state;
    const { error_code, files, task_status, file_numbers } = taskInfo;
    let text = '';
    if (error_code === 500013) {
      text = intl.get('createEntity.tokenError');
    }
    if (error_code === 500002) {
      text = intl.get('createEntity.error500002');
    }
    if (error_code === 500006) {
      text = intl.get('createEntity.error500006');
    }
    if (error_code === 500009) {
      text = intl.get('createEntity.error500009');
    }
    if (error_code === 500001) {
      text = intl.get('createEntity.error500001');
    }
    return {
      img: errorTip,
      text
    };
  };

  getTableDataSource = () => {
    const { taskInfo, taskInfoPage } = this.state;
    const { error_code, files, task_status, file_numbers } = taskInfo;
    if (task_status === 'finished') {
      return files.map((item: any) => {
        return {
          fileName: item?.length === 9 ? item[1] : item[0],
          dsName: item?.length === 9 ? item[6] : item[2],
          dsPath: item?.length === 9 ? item[2] : item[1],
          dsType: item?.length === 9 ? item[8] : item[4],
          fileStatus: item?.length === 9 ? item[7] : item[3]
        };
      });
    }
    return [];
  };

  render() {
    const { taskList, selectedTask, fileCount, page, loadingTask, taskInfo, loadingContent } = this.state;
    const { viewMode } = this.props;
    const { error_code, files, task_status, file_numbers } = taskInfo;
    const columns = [
      {
        title: intl.get('createEntity.fileName'),
        dataIndex: 'fileName',
        ellipsis: true,
        render: (value: any, record: any) => {
          return (
            <div className="kw-align-center">
              <img style={{ width: 16, height: 16 }} src={getFileType(record.dsType)} alt="folder" />
              <span className="kw-ml-1" title={value}>
                {value}
              </span>
            </div>
          );
        }
      },
      {
        title: intl.get('createEntity.nameAndPath'),
        dataIndex: 'nameAndPath',
        ellipsis: true,
        render: (value: any, record: any) => {
          return (
            <>
              <div>{record.dsName}</div>
              <div>{record.dsPath}</div>
            </>
          );
        }
      },
      {
        title: intl.get('createEntity.fileStatus'),
        dataIndex: 'fileStatus',
        ellipsis: true,
        render: (value: any, record: any) => {
          return (
            <div className="kw-align-center">
              {value === 'success' ? (
                <>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  <span className="kw-ml-2">{intl.get('createEntity.Normal')}</span>
                </>
              ) : (
                <>
                  <ExclamationCircleOutlined style={{ color: '#faad14' }} />
                  <span className="kw-ml-2">{intl.get('createEntity.Failed')}</span>
                </>
              )}
            </div>
          );
        }
      }
    ];

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
              onChange={(page: number) => {
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
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div className="icon">
                        <img className="file-image" src={getFileType(selectedTask.task_type)} alt="folder" />
                      </div>
                      <div className="name kw-align-center">
                        <div className="name-word" title={wrapperTitle(selectedTask.task_name)}>
                          <span>{selectedTask.task_name}</span>
                        </div>

                        <div className="status">{this.getFileStatus(taskInfo.task_status)}</div>
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
                    </div>

                    <div className="word">
                      <div className="tool-botton">
                        <Button type="primary" className="refresh" onClick={this.getTaskInfo}>
                          <IconFont type="icon-tongyishuaxin" />
                          <span>{intl.get('createEntity.refresh')}</span>
                        </Button>
                        {!viewMode && (
                          <Button className="ant-btn-default delete" onClick={this.delete}>
                            <IconFont type="icon-lajitong" />
                            <span>{intl.get('userManagement.delete')}</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <KwTable
                className="kw-mt-4"
                loading={task_status === 'running' || loadingContent}
                showHeader={false}
                dataSource={this.getTableDataSource()}
                columns={columns}
                emptyImage={this.getEmptyInfo().img}
                emptyText={this.getEmptyInfo().text}
              />
            </>
          ) : null}
        </div>
      </div>
    );
  }
}

export default OntoDetailModal;
