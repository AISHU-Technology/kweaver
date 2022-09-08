import React, { Component } from 'react';
import { Table, Switch, Button, Modal, message } from 'antd';
import { ExclamationCircleFilled, LoadingOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import serviceTimedTask from '@/services/timedTask';
import { setFrequency, setDetail, setType } from './assistFunction';
import IconFont from '@/components/IconFont';
import AddContent from '@/assets/images/create.svg';
import './style.less';

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
      width: 105,
      fixed: 'left',
      render: text => {
        return setFrequency(text);
      }
    },
    {
      title: intl.get('graphList.detail'),
      dataIndex: 'detail',
      key: 'detail',
      fixed: 'left',
      width: 300,
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
      width: 90,
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
      title: intl.get('graphList.operation'),
      dataIndex: 'operate',
      key: 'operate',
      width: 110,
      render: (_text, record) => {
        return (
          <div className="operate">
            <span
              className="word"
              onClick={() => {
                this.getEditTaskData(record);
              }}
            >
              {intl.get('graphList.edit')}
            </span>
            <span className="cut">|</span>
            <span
              className="word"
              onClick={() => {
                this.setState({
                  deleteModal: true,
                  deleteOneKey: record.task_id
                });
              }}
            >
              {intl.get('graphList.delete')}
            </span>
          </div>
        );
      }
    },
    {
      title: intl.get('datamanagement.updated'),
      dataIndex: 'modify_time',
      key: 'modify_time',
      width: 140
    }
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
      loadingData: false
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
        window.location.replace('/home/graph-list');
      }, 2000);
    }
    // 500403
    if (res && res.ErrorCode === 'Manager.SoftAuth.UnknownServiceRecordError') {
      message.error(intl.get('graphList.noP'));

      setTimeout(() => {
        window.location.replace('/home/graph-list');
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
        window.location.replace('/home/graph-list');
      }, 2000);
    }
    // 500403
    if (res && res.ErrorCode === 'anager.SoftAuth.UnknownServiceRecordError') {
      message.error(intl.get('graphList.noP'));

      setTimeout(() => {
        window.location.replace('/home/graph-list');
      }, 2000);
    }

    this.setState({
      loadingData: false
    });
  };

  /**
   * @description 点击确定
   */
  submit = () => {
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

        <Table
          rowSelection={{
            selectedRowKeys,
            onChange: this.setSelectKey
          }}
          scroll={{ x: 1000, y: 380 }}
          columns={this.columns}
          dataSource={dataSource}
          pagination={{
            current,
            pageSize: PAGESIZE,
            total,
            onChange: this.onChange,
            position: ['bottomCenter']
          }}
          loading={{
            spinning: loadingData,
            indicator: <LoadingOutlined style={{ fontSize: 24 }} spin />
          }}
          locale={{
            emptyText: (
              <div className="empty-box">
                <div>
                  <img src={AddContent} alt="nodata" className="nodata-img"></img>
                </div>
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
              </div>
            )
          }}
        />

        <div className="bottom-button">
          <Button className="ant-btn-default cancel button-style" onClick={onCancel}>
            {intl.get('graphList.cancel')}
            {''}
          </Button>
          <Button className="button-style" type="primary" onClick={this.submit}>
            {intl.get('graphList.ok')}
            {''}
          </Button>
        </div>

        <Modal
          className="delete-modal"
          width={432}
          visible={deleteModal}
          footer={null}
          closable={false}
          maskClosable={false}
          getContainer={false}
        >
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
        </Modal>
      </div>
    );
  }
}

export default TimedTaskList;
