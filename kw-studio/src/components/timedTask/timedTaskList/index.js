/**
 * 定时任务列表
 *
 * @author Eden
 * @date 2021/12/211
 *
 */

import React, { Component, useRef, forwardRef, useImperativeHandle } from 'react';
import { Table, Switch, Button, Modal, message } from 'antd';
import UniversalModal from '@/components/UniversalModal';
import { ExclamationCircleFilled, LoadingOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import serviceTimedTask from '@/services/timedTask';
import { setFrequency, setDetail, setType } from './assistFunction';
import IconFont from '@/components/IconFont';
import serviceLicense from '@/services/license';
import AddContent from '@/assets/images/create.svg';
import './style.less';
import ADTable from '@/components/ADTable';
import Format from '@/components/Format';

const PAGESIZE = 10;

class TimedTaskList extends Component {
  state = {
    deleteModal: false, // 删除弹窗
    current: 1, // 当前页数
    dataSource: [], // 定时任务列表数据
    selectedRowKeys: [], // 选择的任务
    total: 0, // 数据总数
    deleteOneKey: '', // 删除单个定时任务的task_id
    loadingData: false // 获取数据加载状态
  };

  columns = [
    {
      title: intl.get('graphList.frequency'),
      dataIndex: 'cycle',
      key: 'cycle',
      width: 100,
      fixed: 'left',
      render: text => {
        return setFrequency(text);
      }
    },
    {
      title: intl.get('graphList.detail'),
      dataIndex: 'detail',
      key: 'detail',
      // fixed: 'left',
      width: 500,
      render: (text, record) => {
        return setDetail(record);
      }
    },
    {
      title: intl.get('task.buildType'),
      dataIndex: 'task_type',
      key: 'task_type',
      width: 100,
      render: text => {
        return setType(text);
      }
    },
    {
      title: intl.get('graphList.status'),
      dataIndex: 'enabled',
      key: 'enabled',
      width: 75,
      render: (text, record) => {
        return (
          <Switch
            checked={text}
            onChange={() => {
              this.switchTaskStatus(record);
            }}
          />
        );
      }
    },
    {
      title: intl.get('global.operation'),
      dataIndex: 'operate',
      fixed: 'right',
      key: 'operate',
      width: 100,
      render: (_text, record) => {
        return (
          <div style={{ minWidth: 120 }}>
            <Format.Button
              type="link"
              onClick={() => {
                this.getEditTaskData(record);
              }}
            >
              {intl.get('graphList.edit')}
            </Format.Button>
            <Format.Button
              type="link"
              onClick={() => {
                this.setState({
                  deleteModal: true,
                  deleteOneKey: record.task_id
                });
              }}
              className="kw-ml-5"
            >
              {intl.get('graphList.delete')}
            </Format.Button>
          </div>
        );
      }
    }
    // {
    //   title: intl.get('datamanagement.Operator'),
    //   dataIndex: 'update_user',
    //   key: 'update_user',
    //   width: 180,
    //   render: (_text, record) => {
    //     return (
    //       <div className="time-task-user">
    //         <div className="name" title={record.update_user || '--'}>
    //           {record.update_user || '--'}
    //         </div>
    //         {/* <div className="email" title={record.update_user_email || '--'}>
    //           {record.update_user_email || '--'}
    //         </div> */}
    //       </div>
    //     );
    //   }
    // },
    // {
    //   title: intl.get('datamanagement.updated'),
    //   dataIndex: 'modify_time',
    //   key: 'modify_time',
    //   width: 140
    // }
  ];

  componentDidMount() {
    this.getTask({});
  }

  /**
   * @description 获取任务列表
   */
  getTask = async ({ page = this.state.current }) => {
    const { graphId, setAllTaskNumber } = this.props;

    const data = {
      graph_id: graphId,
      page,
      size: PAGESIZE,
      order: 'descend'
    };

    this.setState({
      loadingData: true
    });

    const res = await serviceTimedTask.timerGet(data);

    if (res && res.search) {
      const dataSource = res.search.map(item => {
        item.key = item.task_id;

        return item;
      });

      this.setState({
        total: res.count,
        dataSource
      });

      setAllTaskNumber(res.count);
    }

    this.setState({
      loadingData: false,
      current: page
    });
  };

  /**
   * @description 获取编辑的定时任务的数据
   */
  getEditTaskData = async record => {
    const { graphId } = this.props;

    const res = await serviceTimedTask.timerGetInfo({ graph_id: graphId, task_id: record.task_id });

    if (res && res.task_id) {
      this.props.setEditData(res);
      this.props.changeViewType('editConfig');
    }
  };

  /**
   * @description 批量删除定时任务
   */
  deleteTask = async () => {
    const { selectedRowKeys } = this.state;
    const { graphId } = this.props;

    this.setState({
      deleteModal: false,
      loadingData: true
    });

    const res = await serviceTimedTask.timerDelete(graphId, { task_id: selectedRowKeys });

    if (res && res.state === 'success') {
      await this.getTask({ page: 1 });
    }

    if (res && res.ErrorCode === '500021') {
      message.error(intl.get('graphList.hasBeenDel'));
    }

    this.setState({
      loadingData: false,
      selectedRowKeys: []
    });
  };

  /**
   * @description 删除单个任务
   */
  deleteOneTask = async () => {
    const { deleteOneKey, total, current } = this.state;
    const { graphId } = this.props;

    this.setState({
      deleteModal: false,
      loadingData: true
    });

    const res = await serviceTimedTask.timerDelete(graphId, { task_id: [deleteOneKey] });

    if (res && res.state === 'success') {
      if (Math.ceil((total - 1) / 10) >= current || current === 1) {
        await this.getTask({});
      } else {
        // 如果删除的项为最后一页的最后一条数据，则页面减一
        await this.getTask({ page: Math.ceil((total - 1) / 10) });
      }
    }

    if (res && res.ErrorCode === '500021') {
      message.error(intl.get('graphList.hasBeenDel'));

      setTimeout(() => {
        window.location.replace('/home');
      }, 2000);
    }
    // 500403
    if (res && res.ErrorCode === 'Manager.SoftAuth.UnknownServiceRecordError') {
      message.error(intl.get('graphList.noP'));

      setTimeout(() => {
        window.location.replace('/home');
      }, 2000);
    }

    this.setState({
      loadingData: false
    });
  };

  /**
   * @description 改变分页
   */
  onChange = current => {
    this.getTask({ page: current });
  };

  /**
   * @description 勾选任务，用于批量删除
   */
  setSelectKey = (currentSelectedRowKeys, selectedRows) => {
    const { dataSource } = this.state;
    let { selectedRowKeys } = this.state;
    let deleteKeys = [];

    const allCurrentKey = dataSource.map(item => {
      return item.key;
    });

    currentSelectedRowKeys.forEach(item => {
      if (!selectedRowKeys.includes(item)) {
        selectedRowKeys = [...selectedRowKeys, item];
      }
    });

    allCurrentKey.forEach(item => {
      if (!currentSelectedRowKeys.includes(item)) {
        deleteKeys = [...deleteKeys, item];
      }
    });

    selectedRowKeys = selectedRowKeys.filter(item => {
      return !deleteKeys.includes(item);
    });

    this.setState({
      selectedRowKeys
    });
  };

  /**
   * @description 切换任务状态
   */
  switchTaskStatus = async record => {
    const { graphId } = this.props;
    const { enabled, task_id } = record;

    const data = {
      task_id,
      enabled: enabled ? 0 : 1
    };

    this.setState({
      loadingData: true
    });

    const res = await serviceTimedTask.timerSwitch(graphId, data);

    if (res && res.state === 'success') {
      await this.getTask({});
    }

    if (res && res.ErrorCode === '500051') {
      message.error(intl.get('graphList.timeNoE'));
    }

    if (res && res.ErrorCode === '500054') {
      message.error(intl.get('graphList.DtimeOut'));
    }

    if (res && res.ErrorCode === '500021') {
      message.error(intl.get('graphList.hasBeenDel'));

      setTimeout(() => {
        window.location.replace('/home');
      }, 2000);
    }
    // 500403
    if (res && res.ErrorCode === 'anager.SoftAuth.UnknownServiceRecordError') {
      message.error(intl.get('graphList.noP'));

      setTimeout(() => {
        window.location.replace('/home');
      }, 2000);
    }

    this.setState({
      loadingData: false
    });
  };

  /**
   * 获取知识量
   */
  onCalculate = async () => {
    try {
      const res = await serviceLicense.graphCountAll();
      if (res && res !== undefined) {
        const { all_knowledge, knowledge_limit } = res;
        if (knowledge_limit === -1) return; // 无限制
        if (knowledge_limit - all_knowledge >= 0 && knowledge_limit - all_knowledge < knowledge_limit * 0.1) {
          message.warning(intl.get('license.remaining'));
        }
        if (knowledge_limit - all_knowledge < 0) {
          message.error(intl.get('license.operationFailed'));
        }
      }
    } catch (error) {
      if (!error.type) return;
      const { Description } = error.response || {};
      Description && message.error(Description);
    }
  };

  /**
   * @description 点击确定
   */
  submit = () => {
    this.onCalculate();
    const { total } = this.state;

    if (!total) {
      message.error(intl.get('graphList.needOneTask'));

      return;
    }

    this.props.onOk();
  };

  render() {
    const { onCancel, changeViewType } = this.props;
    const { deleteModal, current, dataSource, selectedRowKeys, deleteOneKey, total, loadingData } = this.state;

    return (
      <div className="time-task-list">
        <div className="m-content">
          <div className="head-button">
            <Button
              type="primary"
              onClick={() => {
                changeViewType('crateConfig');
              }}
            >
              <IconFont type="icon-Add" style={{ color: '#fff' }} />
              {intl.get('graphList.create')}
            </Button>
            <Button
              className="ant-btn-default delete-button"
              disabled={!selectedRowKeys.length}
              onClick={() => {
                this.setState({
                  deleteModal: true
                });
              }}
            >
              <IconFont type="icon-lajitong" />
              {intl.get('graphList.delete')}
            </Button>
          </div>
          <ADTable
            showHeader={false}
            rowSelection={{
              selectedRowKeys,
              onChange: this.setSelectKey
            }}
            // scroll={{ y: 480 }}
            columns={this.columns}
            dataSource={dataSource}
            pagination={{
              current,
              pageSize: PAGESIZE,
              total,
              onChange: this.onChange
            }}
            loading={loadingData}
            emptyText={
              <div className="empty-des">
                {intl.get('graphList.noTaskOne')}
                <span
                  className="create-span"
                  onClick={() => {
                    changeViewType('crateConfig');
                  }}
                >
                  {intl.get('global.emptyTableCreate')}
                </span>
                {intl.get('graphList.noTaskTwo')}
              </div>
            }
            emptyImage={AddContent}
          />
        </div>

        {/* <UniversalModal.Footer
          source={
            <>
              <Button className="ant-btn-default cancel button-style" onClick={onCancel}>
                {intl.get('graphList.cancel')}
                {''}
              </Button>
              <Button className="button-style" type="primary" onClick={this.submit}>
                {intl.get('graphList.ok')}
                {''}
              </Button>
            </>
          }
        /> */}

        <Modal
          className="delete-modal"
          width={432}
          visible={deleteModal}
          footer={null}
          closable={false}
          maskClosable={false}
          getContainer={false}
        >
          <div style={{ padding: '24px' }}>
            <div className="title-delete">
              <ExclamationCircleFilled className="tip-icon" />
              <span className="title-delete-word">{intl.get('datamanagement.sureDelete')}</span>
            </div>
            <div className="des">
              {intl.get('datamanagement.total', { data: deleteOneKey ? 1 : selectedRowKeys.length })}
            </div>
            <div className="delete-modal-bottom-button">
              <Button
                className="ant-btn-default cancel button-style"
                style={{ marginRight: 10 }}
                onClick={() => {
                  this.setState({
                    deleteModal: false,
                    deleteOneKey: ''
                  });
                }}
              >
                {intl.get('datamanagement.cancel')}
              </Button>
              <Button
                className="button-style"
                type="primary"
                onClick={() => {
                  if (deleteOneKey) {
                    this.deleteOneTask();

                    return;
                  }

                  this.deleteTask();
                }}
              >
                {intl.get('createEntity.ok')}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }
}

export default TimedTaskList;
